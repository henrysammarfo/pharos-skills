// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ACS surface for Pharos skill contracts
interface IAgentCreditScore {
    function scores(address agent)
        external
        view
        returns (
            uint256 value,
            uint256 successfulTxns,
            uint256 failedTxns,
            uint256 totalVolumePHRS,
            uint256 repaymentCount,
            uint256 lateRepaymentCount,
            uint256 firstActiveBlock,
            uint256 lastUpdated
        );

    function isRegistered(address agent) external view returns (bool);
    function recordSuccessfulAction(address agent, uint256 volume) external;
    function recordFailedAction(address agent) external;
    function recordRepayment(address agent, bool onTime) external;
    function recordVerifiedIntent(address agent) external;
}
