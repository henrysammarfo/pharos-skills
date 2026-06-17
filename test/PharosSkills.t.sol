// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "../src/AgentCreditScore.sol";
import "../src/IntentVerifier.sol";
import "../src/x402PaymentChannel.sol";
import "../src/DarkPay.sol";

contract PharosSkillsTest is Test {
    AgentCreditScore internal acs;
    IntentVerifier internal iv;
    x402PaymentChannel internal x402;
    DarkPay internal dp;

    uint256 internal agentKey = 0xA11CE;
    uint256 internal providerKey = 0xB0B;
    address internal agent;
    address internal provider;
    address internal attacker = makeAddr("attacker");

    function _scoreValue(address who) internal view returns (uint256) {
        (uint256 value,,,,,,,) = acs.scores(who);
        return value;
    }

    function _signAgent(bytes32 digest) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _pubKey33(uint8 prefix) internal pure returns (bytes memory key) {
        key = new bytes(33);
        key[0] = bytes1(prefix);
        for (uint256 i = 1; i < 33; i++) {
            key[i] = bytes1(uint8(i & 0xff));
        }
    }

    function setUp() public {
        agent = vm.addr(agentKey);
        provider = vm.addr(providerKey);
        vm.deal(agent, 100 ether);
        vm.deal(provider, 100 ether);
        acs = new AgentCreditScore();
        iv = new IntentVerifier(address(acs));
        x402 = new x402PaymentChannel(address(acs));
        dp = new DarkPay();
        acs.addSkill(address(iv));
        acs.addSkill(address(x402));
    }

    // ─── Smoke tests ───────────────────────────────────────────────

    function test_smoke_deployAll() public view {
        assertTrue(address(acs) != address(0));
        assertEq(address(iv.creditScore()), address(acs));
        assertEq(address(x402.creditScore()), address(acs));
    }

    function test_smoke_fullStackFlow() public {
        vm.startPrank(agent);
        acs.registerAgent();

        bytes32 hash = iv.computeHash("SWAP", "momentum", bytes32(uint256(1)), 42);
        iv.commitIntent(hash);
        iv.revealIntent(0, "SWAP", "momentum", bytes32(uint256(1)), 42);
        vm.stopPrank();

        acs.computeScore(agent);
        assertGt(_scoreValue(agent), 0);
    }

    // ─── AgentCreditScore ──────────────────────────────────────────

    function test_registerAgent_mintsSoulbound() public {
        vm.prank(agent);
        acs.registerAgent();
        assertTrue(acs.isRegistered(agent));
        vm.prank(agent);
        vm.expectRevert(AgentCreditScore.AlreadyRegistered.selector);
        acs.registerAgent();
    }

    function test_soulbound_transferBlocked() public {
        vm.prank(agent);
        acs.registerAgent();
        vm.prank(agent);
        vm.expectRevert(AgentCreditScore.SoulboundNonTransferable.selector);
        acs.transferFrom(agent, provider, 1);
    }

    function test_onlySkill_canRecord() public {
        vm.prank(agent);
        acs.registerAgent();
        vm.prank(attacker);
        vm.expectRevert(AgentCreditScore.NotRegisteredSkill.selector);
        acs.recordSuccessfulAction(agent, 1 ether);
    }

    function test_onlyRegisteredAgent_canRecord() public {
        vm.prank(address(iv));
        vm.expectRevert(AgentCreditScore.NotRegistered.selector);
        acs.recordVerifiedIntent(attacker);
    }

    function testFuzz_score_neverExceedsMax(uint8 successes, uint8 failures) public {
        vm.assume(successes > 0 || failures > 0);
        vm.startPrank(agent);
        acs.registerAgent();
        vm.stopPrank();

        for (uint256 i; i < successes; i++) {
            vm.prank(address(iv));
            acs.recordVerifiedIntent(agent);
        }
        for (uint256 i; i < failures; i++) {
            vm.prank(address(iv));
            acs.recordFailedAction(agent);
        }
        acs.computeScore(agent);
        assertLe(_scoreValue(agent), acs.MAX_SCORE());
    }

    function test_creditTiers() public {
        vm.startPrank(agent);
        acs.registerAgent();
        vm.stopPrank();
        assertEq(acs.getCreditLimit(agent), 0);

        for (uint256 i; i < 20; i++) {
            vm.prank(address(iv));
            acs.recordVerifiedIntent(agent);
        }
        acs.computeScore(agent);
        assertGt(acs.getCreditLimit(agent), 0);
    }

    // ─── IntentVerifier ────────────────────────────────────────────

    function test_intent_commitReveal() public {
        vm.startPrank(agent);
        acs.registerAgent();
        bytes32 hash = iv.computeHash("A", "reason", bytes32(uint256(7)), 1);
        iv.commitIntent(hash);
        iv.revealIntent(0, "A", "reason", bytes32(uint256(7)), 1);
        vm.stopPrank();
        IntentVerifier.Intent[] memory history = iv.getIntentHistory(agent);
        assertTrue(history[0].verified);
    }

    function test_intent_hashMismatchReverts() public {
        vm.startPrank(agent);
        acs.registerAgent();
        bytes32 hash = iv.computeHash("A", "reason", bytes32(uint256(7)), 1);
        iv.commitIntent(hash);
        vm.expectRevert(IntentVerifier.HashMismatch.selector);
        iv.revealIntent(0, "B", "wrong", bytes32(uint256(7)), 1);
        vm.stopPrank();
    }

    function test_intent_penalizeOnceOnly() public {
        vm.startPrank(agent);
        acs.registerAgent();
        iv.commitIntent(keccak256("x"));
        vm.stopPrank();

        vm.roll(block.number + 51);
        iv.penalizeUnrevealedIntent(agent, 0);
        vm.expectRevert(IntentVerifier.AlreadyPenalized.selector);
        iv.penalizeUnrevealedIntent(agent, 0);
    }

    function test_intent_cannotPenalizeBeforeDeadline() public {
        vm.prank(agent);
        acs.registerAgent();
        vm.prank(agent);
        iv.commitIntent(keccak256("x"));
        vm.expectRevert(IntentVerifier.StillInWindow.selector);
        iv.penalizeUnrevealedIntent(agent, 0);
    }

    // ─── x402PaymentChannel ────────────────────────────────────────

    function test_x402_openSettleClose() public {
        vm.deal(agent, 1 ether);
        vm.startPrank(agent);
        acs.registerAgent();
        bytes32 channelId = x402.openChannel{value: 0.1 ether}(provider, 1000);
        vm.stopPrank();

        uint256 amount = 0.001 ether;
        uint256 nonce = 1;
        bytes32 msgHash = x402.getPaymentMessage(channelId, amount, nonce);
        bytes memory sig = _signAgent(MessageHashUtils.toEthSignedMessageHash(msgHash));

        uint256 balBefore = provider.balance;
        vm.prank(provider);
        x402.settlePayment(channelId, amount, nonce, sig);
        assertEq(provider.balance, balBefore + amount);

        vm.prank(agent);
        x402.closeChannel(channelId);
    }

    function test_x402_replayRejected() public {
        vm.deal(agent, 1 ether);
        vm.startPrank(agent);
        acs.registerAgent();
        bytes32 channelId = x402.openChannel{value: 0.1 ether}(provider, 1000);
        vm.stopPrank();

        uint256 amount = 0.001 ether;
        bytes32 msgHash = x402.getPaymentMessage(channelId, amount, 1);
        bytes memory sig = _signAgent(MessageHashUtils.toEthSignedMessageHash(msgHash));

        vm.startPrank(provider);
        x402.settlePayment(channelId, amount, 1, sig);
        vm.expectRevert(x402PaymentChannel.ReplayDetected.selector);
        x402.settlePayment(channelId, amount, 1, sig);
        vm.stopPrank();
    }

    function test_x402_selfChannelReverts() public {
        vm.deal(agent, 1 ether);
        vm.prank(agent);
        vm.expectRevert(x402PaymentChannel.SelfChannel.selector);
        x402.openChannel{value: 1 ether}(agent, 100);
    }

    function testFuzz_x402_collateralNeverExceeded(uint96 collateral, uint96 amount) public {
        collateral = uint96(bound(collateral, 0.01 ether, 10 ether));
        amount = uint96(bound(amount, 1, collateral));
        vm.deal(agent, collateral);

        vm.startPrank(agent);
        acs.registerAgent();
        bytes32 channelId = x402.openChannel{value: collateral}(provider, 1000);
        vm.stopPrank();

        bytes32 msgHash = x402.getPaymentMessage(channelId, amount, 1);
        bytes memory sig = _signAgent(MessageHashUtils.toEthSignedMessageHash(msgHash));
        vm.prank(provider);
        x402.settlePayment(channelId, amount, 1, sig);
    }

    // ─── DarkPay ───────────────────────────────────────────────────

    function test_darkpay_registerAndAnnounce() public {
        bytes memory spendKey = _pubKey33(0x02);
        bytes memory viewKey = _pubKey33(0x03);

        vm.prank(agent);
        dp.registerStealthMetaAddress(spendKey, viewKey);

        address stealth = makeAddr("stealth");
        bytes memory eph = _pubKey33(0x04);
        bytes memory tag = hex"05";

        vm.prank(provider);
        dp.sendNativeStealth{value: 0.01 ether}(payable(stealth), eph, tag);
        assertEq(stealth.balance, 0.01 ether);
        assertEq(dp.announcementCount(), 1);
    }

    function test_darkpay_zeroAddressReverts() public {
        bytes memory eph = _pubKey33(0x04);
        vm.prank(provider);
        vm.expectRevert(DarkPay.ZeroAddress.selector);
        dp.sendNativeStealth{value: 1 ether}(payable(address(0)), eph, hex"05");
    }

    // ─── Integration stress ────────────────────────────────────────

    function test_stress_manyIntents() public {
        vm.startPrank(agent);
        acs.registerAgent();
        for (uint256 i; i < 50; i++) {
            bytes32 hash = iv.computeHash("A", "r", bytes32(i), i);
            iv.commitIntent(hash);
            iv.revealIntent(i, "A", "r", bytes32(i), i);
        }
        vm.stopPrank();
        acs.computeScore(agent);
        assertGt(_scoreValue(agent), 400);
    }
}
