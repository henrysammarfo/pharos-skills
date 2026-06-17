// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IAgentCreditScore.sol";

/// @title x402PaymentChannel — Off-chain signed micropayment channels for AI agents on Pharos
contract x402PaymentChannel is ReentrancyGuard {
    using ECDSA for bytes32;
    using Address for address payable;

    IAgentCreditScore public immutable creditScore;

    struct Channel {
        address agent;
        address serviceProvider;
        uint256 collateral;
        uint256 usedAmount;
        uint256 expiryBlock;
        uint256 nonce;
        bool open;
    }

    mapping(bytes32 => Channel) public channels;

    event ChannelOpened(bytes32 indexed id, address agent, address provider, uint256 collateral);
    event PaymentSettled(bytes32 indexed id, uint256 amount, uint256 totalUsed);
    event ChannelClosed(bytes32 indexed id, uint256 totalPaid, uint256 refunded);

    error ZeroCollateral();
    error ZeroAddress();
    error SelfChannel();
    error ChannelNotOpen();
    error NotProvider();
    error ReplayDetected();
    error ExceedsCollateral();
    error BadSignature();
    error AlreadyClosed();
    error CannotCloseYet();

    constructor(address _creditScore) {
        if (_creditScore == address(0)) revert ZeroAddress();
        creditScore = IAgentCreditScore(_creditScore);
    }

    function openChannel(address serviceProvider, uint256 durationBlocks)
        external
        payable
        nonReentrant
        returns (bytes32 channelId)
    {
        if (msg.value == 0) revert ZeroCollateral();
        if (serviceProvider == address(0)) revert ZeroAddress();
        if (serviceProvider == msg.sender) revert SelfChannel();

        channelId = keccak256(abi.encodePacked(msg.sender, serviceProvider, block.number, msg.value));
        channels[channelId] = Channel({
            agent: msg.sender,
            serviceProvider: serviceProvider,
            collateral: msg.value,
            usedAmount: 0,
            expiryBlock: block.number + durationBlocks,
            nonce: 0,
            open: true
        });
        emit ChannelOpened(channelId, msg.sender, serviceProvider, msg.value);
    }

    function settlePayment(
        bytes32 channelId,
        uint256 amount,
        uint256 nonce,
        bytes calldata agentSignature
    ) external nonReentrant {
        Channel storage ch = channels[channelId];
        if (!ch.open) revert ChannelNotOpen();
        if (msg.sender != ch.serviceProvider) revert NotProvider();
        if (nonce <= ch.nonce) revert ReplayDetected();
        if (ch.usedAmount + amount > ch.collateral) revert ExceedsCollateral();

        bytes32 msgHash = keccak256(abi.encodePacked(channelId, amount, nonce));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        if (ethHash.recover(agentSignature) != ch.agent) revert BadSignature();

        ch.usedAmount += amount;
        ch.nonce = nonce;
        payable(ch.serviceProvider).sendValue(amount);

        creditScore.recordSuccessfulAction(ch.agent, amount);
        creditScore.recordRepayment(ch.agent, true);
        emit PaymentSettled(channelId, amount, ch.usedAmount);
    }

    function closeChannel(bytes32 channelId) external nonReentrant {
        Channel storage ch = channels[channelId];
        if (!ch.open) revert AlreadyClosed();
        if (block.number <= ch.expiryBlock && msg.sender != ch.agent) revert CannotCloseYet();

        uint256 refund = ch.collateral - ch.usedAmount;
        ch.open = false;
        if (refund > 0) payable(ch.agent).sendValue(refund);
        emit ChannelClosed(channelId, ch.usedAmount, refund);
    }

    function getPaymentMessage(bytes32 channelId, uint256 amount, uint256 nonce)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(channelId, amount, nonce));
    }
}
