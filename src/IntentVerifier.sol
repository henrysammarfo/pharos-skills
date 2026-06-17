// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAgentCreditScore.sol";

/// @title IntentVerifier — Pre-commitment accountability for AI agents
contract IntentVerifier {
    IAgentCreditScore public immutable creditScore;
    uint256 public constant REVEAL_WINDOW = 50;

    struct Intent {
        bytes32 commitHash;
        uint256 commitBlock;
        uint256 revealDeadline;
        bool revealed;
        bool verified;
        bool penalized;
        string actionType;
        string reasoning;
        bytes32 expectedOutcome;
        uint256 nonce;
    }

    mapping(address => Intent[]) public intents;

    event IntentCommitted(address indexed agent, uint256 indexed id, bytes32 hash);
    event IntentVerified(address indexed agent, uint256 indexed id, string actionType, string reasoning);
    event IntentPenalized(address indexed agent, uint256 indexed id);

    error AlreadyRevealed();
    error WindowExpired();
    error HashMismatch();
    error StillInWindow();
    error WasRevealed();
    error AlreadyPenalized();
    error InvalidIntentId();

    constructor(address _creditScore) {
        creditScore = IAgentCreditScore(_creditScore);
    }

    function commitIntent(bytes32 hash) external returns (uint256 intentId) {
        intentId = intents[msg.sender].length;
        intents[msg.sender].push(Intent({
            commitHash: hash,
            commitBlock: block.number,
            revealDeadline: block.number + REVEAL_WINDOW,
            revealed: false,
            verified: false,
            penalized: false,
            actionType: "",
            reasoning: "",
            expectedOutcome: bytes32(0),
            nonce: 0
        }));
        emit IntentCommitted(msg.sender, intentId, hash);
    }

    function revealIntent(
        uint256 intentId,
        string calldata actionType,
        string calldata reasoning,
        bytes32 expectedOutcome,
        uint256 nonce
    ) external {
        Intent storage intent = _getIntent(msg.sender, intentId);
        if (intent.revealed) revert AlreadyRevealed();
        if (block.number > intent.revealDeadline) revert WindowExpired();

        bytes32 recomputed = keccak256(abi.encodePacked(actionType, reasoning, expectedOutcome, nonce));
        if (recomputed != intent.commitHash) revert HashMismatch();

        intent.revealed = true;
        intent.verified = true;
        intent.actionType = actionType;
        intent.reasoning = reasoning;
        intent.expectedOutcome = expectedOutcome;
        intent.nonce = nonce;

        creditScore.recordVerifiedIntent(msg.sender);
        emit IntentVerified(msg.sender, intentId, actionType, reasoning);
    }

    function penalizeUnrevealedIntent(address agent, uint256 intentId) external {
        Intent storage intent = _getIntent(agent, intentId);
        if (block.number <= intent.revealDeadline) revert StillInWindow();
        if (intent.revealed) revert WasRevealed();
        if (intent.penalized) revert AlreadyPenalized();

        intent.penalized = true;
        creditScore.recordFailedAction(agent);
        emit IntentPenalized(agent, intentId);
    }

    function computeHash(
        string calldata actionType,
        string calldata reasoning,
        bytes32 expectedOutcome,
        uint256 nonce
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(actionType, reasoning, expectedOutcome, nonce));
    }

    function getIntentHistory(address agent) external view returns (Intent[] memory) {
        return intents[agent];
    }

    function intentCount(address agent) external view returns (uint256) {
        return intents[agent].length;
    }

    function _getIntent(address agent, uint256 intentId) internal view returns (Intent storage) {
        if (intentId >= intents[agent].length) revert InvalidIntentId();
        return intents[agent][intentId];
    }
}
