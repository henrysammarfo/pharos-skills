// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IAgentCreditScore.sol";
import "./interfaces/IIntentVerifier.sol";

/// @title SpendGuard — Credit-gated spending limits and custody for AI agents on Pharos
/// @notice Agents deposit PHRS; spends enforce per-tx/daily limits, whitelist, min ACS score, and optional intent gate
contract SpendGuard is Ownable, ReentrancyGuard {
    using Address for address payable;

    uint256 public constant SECONDS_PER_DAY = 86_400;

    IAgentCreditScore public immutable creditScore;
    IIntentVerifier public intentVerifier;

    struct Policy {
        address controller;
        uint256 dailyLimit;
        uint256 perTxLimit;
        uint256 minScore;
        uint256 largeSpendThreshold;
        bool requireIntentForLarge;
        bool active;
        uint256 spentToday;
        uint256 lastDay;
    }

    mapping(address => Policy) public policies;
    mapping(address => mapping(address => bool)) public whitelist;
    mapping(address => uint256) public balances;
    mapping(address => bool) public executors;

    event PolicyCreated(
        address indexed agent,
        address indexed controller,
        uint256 dailyLimit,
        uint256 perTxLimit,
        uint256 minScore
    );
    event PolicyUpdated(address indexed agent);
    event PolicyDeactivated(address indexed agent);
    event WhitelistUpdated(address indexed agent, address indexed recipient, bool allowed);
    event Deposited(address indexed agent, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed agent, address indexed to, uint256 amount);
    event SpendExecuted(address indexed agent, address indexed to, uint256 amount, uint256 intentId);
    event SpendBlocked(address indexed agent, address indexed to, uint256 amount, bytes32 reason);
    event ExecutorSet(address indexed executor, bool enabled);
    event IntentVerifierSet(address indexed intentVerifier);

    error ZeroAddress();
    error ZeroAmount();
    error NotController();
    error PolicyInactive();
    error NotRegistered();
    error ScoreTooLow();
    error PerTxLimitExceeded();
    error DailyLimitExceeded();
    error NotWhitelisted();
    error InsufficientBalance();
    error IntentNotVerified();
    error NotExecutor();
    error SpendCheckFailed(bytes32 reason);

    constructor(address _creditScore) Ownable(msg.sender) {
        if (_creditScore == address(0)) revert ZeroAddress();
        creditScore = IAgentCreditScore(_creditScore);
    }

    function setIntentVerifier(address _intentVerifier) external onlyOwner {
        intentVerifier = IIntentVerifier(_intentVerifier);
        emit IntentVerifierSet(_intentVerifier);
    }

    function setExecutor(address executor, bool enabled) external onlyOwner {
        if (executor == address(0)) revert ZeroAddress();
        executors[executor] = enabled;
        emit ExecutorSet(executor, enabled);
    }

    function createPolicy(
        address agent,
        uint256 dailyLimit,
        uint256 perTxLimit,
        uint256 minScore,
        uint256 largeSpendThreshold,
        bool requireIntentForLarge
    ) external {
        if (agent == address(0)) revert ZeroAddress();
        Policy storage p = policies[agent];
        if (p.controller == address(0)) {
            p.controller = msg.sender;
        } else if (msg.sender != p.controller && msg.sender != owner()) {
            revert NotController();
        }
        p.dailyLimit = dailyLimit;
        p.perTxLimit = perTxLimit;
        p.minScore = minScore;
        p.largeSpendThreshold = largeSpendThreshold;
        p.requireIntentForLarge = requireIntentForLarge;
        p.active = true;
        emit PolicyCreated(agent, p.controller, dailyLimit, perTxLimit, minScore);
    }

    function setWhitelist(address agent, address recipient, bool allowed) external {
        _onlyController(agent);
        if (recipient == address(0)) revert ZeroAddress();
        whitelist[agent][recipient] = allowed;
        emit WhitelistUpdated(agent, recipient, allowed);
    }

    function deactivatePolicy(address agent) external {
        _onlyController(agent);
        policies[agent].active = false;
        emit PolicyDeactivated(agent);
    }

    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, balances[msg.sender]);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        balances[msg.sender] -= amount;
        payable(msg.sender).sendValue(amount);
        emit Withdrawn(msg.sender, msg.sender, amount);
    }

    /// @notice Agent-initiated guarded spend from custodial balance
    function guardedSpend(address to, uint256 amount, uint256 intentId) external nonReentrant {
        _enforceSpend(msg.sender, to, amount, intentId);
        balances[msg.sender] -= amount;
        payable(to).sendValue(amount);
        emit SpendExecuted(msg.sender, to, amount, intentId);
    }

    /// @notice Registered skill executors (e.g. x402) record spends on behalf of agents
    function executorSpend(address agent, address to, uint256 amount, uint256 intentId) external nonReentrant {
        if (!executors[msg.sender]) revert NotExecutor();
        _enforceSpend(agent, to, amount, intentId);
        balances[agent] -= amount;
        payable(to).sendValue(amount);
        emit SpendExecuted(agent, to, amount, intentId);
    }

    function canSpend(address agent, address to, uint256 amount, uint256 intentId)
        external
        view
        returns (bool ok, bytes32 reason)
    {
        return _checkSpend(agent, to, amount, intentId);
    }

    function getPolicy(address agent)
        external
        view
        returns (
            address controller,
            uint256 dailyLimit,
            uint256 perTxLimit,
            uint256 minScore,
            uint256 largeSpendThreshold,
            bool requireIntentForLarge,
            bool active,
            uint256 spentToday,
            uint256 remainingDaily
        )
    {
        Policy storage p = policies[agent];
        uint256 day = block.timestamp / SECONDS_PER_DAY;
        uint256 spent = p.lastDay == day ? p.spentToday : 0;
        uint256 remaining = p.dailyLimit > spent ? p.dailyLimit - spent : 0;
        return (
            p.controller,
            p.dailyLimit,
            p.perTxLimit,
            p.minScore,
            p.largeSpendThreshold,
            p.requireIntentForLarge,
            p.active,
            spent,
            remaining
        );
    }

    function _enforceSpend(address agent, address to, uint256 amount, uint256 intentId) internal {
        (bool ok, bytes32 reason) = _checkSpend(agent, to, amount, intentId);
        if (!ok) {
            emit SpendBlocked(agent, to, amount, reason);
            revert SpendCheckFailed(reason);
        }
        Policy storage p = policies[agent];
        uint256 day = block.timestamp / SECONDS_PER_DAY;
        if (p.lastDay != day) {
            p.lastDay = day;
            p.spentToday = 0;
        }
        p.spentToday += amount;
    }

    function _checkSpend(address agent, address to, uint256 amount, uint256 intentId)
        internal
        view
        returns (bool ok, bytes32 reason)
    {
        if (amount == 0) return (false, bytes32("ZERO_AMOUNT"));
        if (!creditScore.isRegistered(agent)) return (false, bytes32("NOT_REGISTERED"));
        Policy storage p = policies[agent];
        if (!p.active) return (false, bytes32("POLICY_INACTIVE"));
        if (balances[agent] < amount) return (false, bytes32("INSUFFICIENT_BAL"));

        (uint256 score,,,,,,,) = creditScore.scores(agent);
        if (score < p.minScore) return (false, bytes32("SCORE_TOO_LOW"));
        if (amount > p.perTxLimit) return (false, bytes32("PER_TX_LIMIT"));
        if (!whitelist[agent][to]) return (false, bytes32("NOT_WHITELISTED"));

        uint256 day = block.timestamp / SECONDS_PER_DAY;
        uint256 spent = p.lastDay == day ? p.spentToday : 0;
        if (spent + amount > p.dailyLimit) return (false, bytes32("DAILY_LIMIT"));

        if (p.requireIntentForLarge && amount >= p.largeSpendThreshold) {
            if (address(intentVerifier) == address(0)) return (false, bytes32("NO_INTENT_VER"));
            if (!intentVerifier.isVerifiedIntent(agent, intentId)) return (false, bytes32("INTENT_REQUIRED"));
        }
        return (true, bytes32(0));
    }

    function _onlyController(address agent) internal view {
        Policy storage p = policies[agent];
        if (p.controller == address(0)) revert PolicyInactive();
        if (msg.sender != p.controller && msg.sender != owner()) revert NotController();
    }
}
