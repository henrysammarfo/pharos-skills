// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ACS surface for Pharos skill contracts
interface IAgentCreditScore {
    function recordSuccessfulAction(address agent, uint256 volume) external;
    function recordFailedAction(address agent) external;
    function recordRepayment(address agent, bool onTime) external;
    function recordVerifiedIntent(address agent) external;
}
