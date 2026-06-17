// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentCreditScore — On-chain credit scoring for AI agents on Pharos
/// @notice Soulbound ERC721 identity with weighted score formula (0-1000)
contract AgentCreditScore is ERC721, Ownable {
    struct Score {
        uint256 value;
        uint256 successfulTxns;
        uint256 failedTxns;
        uint256 totalVolumePHRS;
        uint256 repaymentCount;
        uint256 lateRepaymentCount;
        uint256 firstActiveBlock;
        uint256 lastUpdated;
    }

    mapping(address => Score) public scores;
    mapping(address => bool) public registeredSkills;
    mapping(address => uint256) private _tokenIds;
    uint256 private _nextTokenId;

    uint256 public constant MAX_VOLUME = 1_000_000 ether;
    uint256 public constant BLOCKS_PER_90_DAYS = 7_776_000;
    uint256 public constant MAX_SCORE = 1000;

    event ScoreComputed(address indexed agent, uint256 score);
    event AgentRegistered(address indexed agent, uint256 tokenId);
    event SkillRegistered(address indexed skill);
    event SkillRemoved(address indexed skill);

    error AlreadyRegistered();
    error NotRegistered();
    error NotRegisteredSkill();
    error ZeroAddress();

    constructor() ERC721("AgentCreditScore", "ACS") Ownable(msg.sender) {}

    /// @inheritdoc ERC721
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert SoulboundNonTransferable();
        return super._update(to, tokenId, auth);
    }

    error SoulboundNonTransferable();

    function registerAgent() external {
        if (_tokenIds[msg.sender] != 0) revert AlreadyRegistered();
        uint256 tokenId = ++_nextTokenId;
        _tokenIds[msg.sender] = tokenId;
        _mint(msg.sender, tokenId);
        scores[msg.sender].firstActiveBlock = block.number;
        emit AgentRegistered(msg.sender, tokenId);
    }

    function isRegistered(address agent) public view returns (bool) {
        return _tokenIds[agent] != 0;
    }

    function computeScore(address agent) public returns (uint256) {
        Score storage s = scores[agent];
        uint256 total = s.successfulTxns + s.failedTxns;
        if (total == 0) {
            s.value = 0;
            return 0;
        }

        uint256 successRate = (s.successfulTxns * 400) / total;
        uint256 vol = s.totalVolumePHRS > MAX_VOLUME ? MAX_VOLUME : s.totalVolumePHRS;
        uint256 volumeScore = vol == 0 ? 0 : (_log2(vol + 1) * 250) / _log2(MAX_VOLUME + 1);
        uint256 age = block.number - s.firstActiveBlock;
        uint256 ageCapped = age > BLOCKS_PER_90_DAYS ? BLOCKS_PER_90_DAYS : age;
        uint256 ageScore = (ageCapped * 150) / BLOCKS_PER_90_DAYS;
        uint256 repayTotal = s.repaymentCount + s.lateRepaymentCount;
        uint256 repayScore = repayTotal == 0 ? 100 : (s.repaymentCount * 200) / repayTotal;

        uint256 score = successRate + volumeScore + ageScore + repayScore;
        s.value = score > MAX_SCORE ? MAX_SCORE : score;
        s.lastUpdated = block.number;
        emit ScoreComputed(agent, s.value);
        return s.value;
    }

    function getCreditLimit(address agent) external view returns (uint256) {
        uint256 score = scores[agent].value;
        if (score < 300) return 0;
        if (score < 500) return 50 ether;
        if (score < 700) return 200 ether;
        if (score < 900) return 1000 ether;
        return 5000 ether;
    }

    function getScoreBreakdown(address agent)
        external
        view
        returns (uint256 score, uint256 success, uint256 failed, uint256 volume, uint256 ageBlocks)
    {
        Score storage s = scores[agent];
        return (s.value, s.successfulTxns, s.failedTxns, s.totalVolumePHRS, block.number - s.firstActiveBlock);
    }

    modifier onlySkill() {
        if (!registeredSkills[msg.sender]) revert NotRegisteredSkill();
        _;
    }

    modifier onlyRegisteredAgent(address agent) {
        if (!isRegistered(agent)) revert NotRegistered();
        _;
    }

    function addSkill(address skill) external onlyOwner {
        if (skill == address(0)) revert ZeroAddress();
        registeredSkills[skill] = true;
        emit SkillRegistered(skill);
    }

    function removeSkill(address skill) external onlyOwner {
        registeredSkills[skill] = false;
        emit SkillRemoved(skill);
    }

    function recordSuccessfulAction(address agent, uint256 volume) external onlySkill onlyRegisteredAgent(agent) {
        scores[agent].successfulTxns++;
        scores[agent].totalVolumePHRS += volume;
        computeScore(agent);
    }

    function recordFailedAction(address agent) external onlySkill onlyRegisteredAgent(agent) {
        scores[agent].failedTxns++;
        computeScore(agent);
    }

    function recordRepayment(address agent, bool onTime) external onlySkill onlyRegisteredAgent(agent) {
        if (onTime) scores[agent].repaymentCount++;
        else scores[agent].lateRepaymentCount++;
        computeScore(agent);
    }

    function recordVerifiedIntent(address agent) external onlySkill onlyRegisteredAgent(agent) {
        scores[agent].successfulTxns++;
        computeScore(agent);
    }

    function _log2(uint256 x) internal pure returns (uint256) {
        uint256 result = 0;
        while (x > 1) {
            x >>= 1;
            result++;
        }
        return result;
    }
}
