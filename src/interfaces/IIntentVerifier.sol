// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIntentVerifier {
    function isVerifiedIntent(address agent, uint256 intentId) external view returns (bool);
}
