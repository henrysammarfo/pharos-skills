// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title DarkPay — ERC-5564-inspired stealth payments for Pharos AI agents
contract DarkPay is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    uint256 public constant SCHEME_ID = 1;

    mapping(address => bytes) public stealthMetaAddresses;

    struct Announcement {
        address stealthAddress;
        bytes ephemeralPubKey;
        bytes viewTag;
        address token;
        uint256 amount;
        uint256 blockNumber;
    }

    Announcement[] public announcements;
    uint256 public announcementCount;

    event MetaAddressRegistered(address indexed agent, bytes spendingPubKey, bytes viewingPubKey);
    event StealthPaymentAnnounced(
        uint256 indexed id,
        uint256 indexed schemeId,
        address indexed stealthAddress,
        bytes ephemeralPubKey,
        bytes viewTag,
        address token,
        uint256 amount
    );

    error InvalidKeyLength();
    error InvalidViewTag();
    error ZeroValue();
    error ZeroAddress();
    error NotRegistered();

    function registerStealthMetaAddress(bytes calldata spendingPubKey, bytes calldata viewingPubKey) external {
        if (spendingPubKey.length != 33 || viewingPubKey.length != 33) revert InvalidKeyLength();
        stealthMetaAddresses[msg.sender] = abi.encodePacked(spendingPubKey, viewingPubKey);
        emit MetaAddressRegistered(msg.sender, spendingPubKey, viewingPubKey);
    }

    function sendNativeStealth(
        address payable stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata viewTag
    ) external payable nonReentrant {
        if (msg.value == 0) revert ZeroValue();
        if (stealthAddress == address(0)) revert ZeroAddress();
        if (ephemeralPubKey.length != 33) revert InvalidKeyLength();
        if (viewTag.length != 1) revert InvalidViewTag();

        stealthAddress.sendValue(msg.value);
        uint256 id = announcementCount++;
        announcements.push(Announcement({
            stealthAddress: stealthAddress,
            ephemeralPubKey: ephemeralPubKey,
            viewTag: viewTag,
            token: address(0),
            amount: msg.value,
            blockNumber: block.number
        }));
        emit StealthPaymentAnnounced(id, SCHEME_ID, stealthAddress, ephemeralPubKey, viewTag, address(0), msg.value);
    }

    function sendTokenStealth(
        address stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata viewTag,
        address token,
        uint256 amount
    ) external nonReentrant {
        if (amount == 0) revert ZeroValue();
        if (stealthAddress == address(0) || token == address(0)) revert ZeroAddress();
        if (ephemeralPubKey.length != 33) revert InvalidKeyLength();
        if (viewTag.length != 1) revert InvalidViewTag();

        IERC20(token).safeTransferFrom(msg.sender, stealthAddress, amount);
        uint256 id = announcementCount++;
        announcements.push(Announcement({
            stealthAddress: stealthAddress,
            ephemeralPubKey: ephemeralPubKey,
            viewTag: viewTag,
            token: token,
            amount: amount,
            blockNumber: block.number
        }));
        emit StealthPaymentAnnounced(id, SCHEME_ID, stealthAddress, ephemeralPubKey, viewTag, token, amount);
    }

    function getAnnouncements(uint256 fromBlock) external view returns (Announcement[] memory) {
        uint256 count;
        for (uint256 i = 0; i < announcements.length; i++) {
            if (announcements[i].blockNumber >= fromBlock) count++;
        }
        Announcement[] memory results = new Announcement[](count);
        uint256 j;
        for (uint256 i = 0; i < announcements.length; i++) {
            if (announcements[i].blockNumber >= fromBlock) {
                results[j++] = announcements[i];
            }
        }
        return results;
    }

    function getMetaAddressComponents(address agent) external view returns (bytes memory spendKey, bytes memory viewKey) {
        bytes memory meta = stealthMetaAddresses[agent];
        if (meta.length != 66) revert NotRegistered();
        spendKey = new bytes(33);
        viewKey = new bytes(33);
        for (uint256 i = 0; i < 33; i++) {
            spendKey[i] = meta[i];
            viewKey[i] = meta[i + 33];
        }
    }
}
