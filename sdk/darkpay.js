import * as secp256k1 from "@noble/secp256k1";
import { Contract, keccak256, hexlify, getBytes, getAddress, toBeHex, parseEther } from "ethers";
import { loadDeploymentsFile, loadAbi } from "./config.js";

function pubKeyToAddress(pubKeyBytes) {
  const bytes = pubKeyBytes instanceof Uint8Array ? pubKeyBytes : getBytes(pubKeyBytes);
  const payload = bytes.length === 65 && bytes[0] === 0x04 ? bytes.slice(1) : bytes;
  const hash = keccak256(payload);
  return getAddress("0x" + hash.slice(-40));
}

function hashSharedSecret(shared) {
  return getBytes(keccak256(shared));
}

function toBytes33(hexOrBytes) {
  const b = typeof hexOrBytes === "string" ? getBytes(hexOrBytes) : hexOrBytes;
  if (b.length !== 33) throw new Error("Expected 33-byte compressed pubkey");
  return b;
}

function toBytes1(hexOrBytes) {
  const b = typeof hexOrBytes === "string" ? getBytes(hexOrBytes) : hexOrBytes;
  if (b.length !== 1) throw new Error("Expected 1-byte view tag");
  return b;
}

export class DarkPaySDK {
  static generateMetaAddress() {
    const spendingPrivKey = secp256k1.utils.randomPrivateKey();
    const viewingPrivKey = secp256k1.utils.randomPrivateKey();
    return {
      spendingPrivKey,
      viewingPrivKey,
      spendingPubKey: secp256k1.getPublicKey(spendingPrivKey, true),
      viewingPubKey: secp256k1.getPublicKey(viewingPrivKey, true),
    };
  }

  static computeStealthAddress(recipientViewPub, recipientSpendPub) {
    const ephPriv = secp256k1.utils.randomPrivateKey();
    const ephPub = secp256k1.getPublicKey(ephPriv, true);
    const shared = secp256k1.getSharedSecret(ephPriv, recipientViewPub, true);
    const hash = hashSharedSecret(shared);
    const viewTag = hash.slice(0, 1);
    const scalar = BigInt(hexlify(hash)) % secp256k1.CURVE.n;
    const stealthPub = secp256k1.ProjectivePoint.fromHex(recipientSpendPub)
      .add(secp256k1.ProjectivePoint.BASE.multiply(scalar));
    const stealthAddress = pubKeyToAddress(stealthPub.toRawBytes(false));
    return { stealthAddress, ephemeralPubKey: ephPub, viewTag, ephemeralPrivKey: ephPriv };
  }

  static checkAnnouncement(announcement, myViewPriv, mySpendPub) {
    const shared = secp256k1.getSharedSecret(myViewPriv, announcement.ephemeralPubKey, true);
    const hash = hashSharedSecret(shared);
    if (hash[0] !== announcement.viewTag[0]) return { isForMe: false };
    const scalar = BigInt(hexlify(hash)) % secp256k1.CURVE.n;
    const expected = secp256k1.ProjectivePoint.fromHex(mySpendPub)
      .add(secp256k1.ProjectivePoint.BASE.multiply(scalar));
    const expectedAddr = pubKeyToAddress(expected.toRawBytes(false));
    return {
      isForMe: expectedAddr.toLowerCase() === announcement.stealthAddress.toLowerCase(),
    };
  }

  static deriveStealthPrivKey(myViewPriv, mySpendPriv, ephPub) {
    const shared = secp256k1.getSharedSecret(myViewPriv, ephPub, true);
    const hash = hashSharedSecret(shared);
    const hScalar = BigInt(hexlify(hash)) % secp256k1.CURVE.n;
    const sScalar = BigInt(hexlify(mySpendPriv));
    const stealth = (sScalar + hScalar) % secp256k1.CURVE.n;
    return getBytes(toBeHex(stealth, 32));
  }

  static keysToHex(keys) {
    return {
      spendingPrivKey: hexlify(keys.spendingPrivKey),
      viewingPrivKey: hexlify(keys.viewingPrivKey),
      spendingPubKey: hexlify(keys.spendingPubKey),
      viewingPubKey: hexlify(keys.viewingPubKey),
    };
  }

  static keysFromHex({ spendingPrivKey, viewingPrivKey, spendingPubKey, viewingPubKey }) {
    if (spendingPrivKey && viewingPrivKey) {
      const sPriv = getBytes(spendingPrivKey);
      const vPriv = getBytes(viewingPrivKey);
      return {
        spendingPrivKey: sPriv,
        viewingPrivKey: vPriv,
        spendingPubKey: secp256k1.getPublicKey(sPriv, true),
        viewingPubKey: secp256k1.getPublicKey(vPriv, true),
      };
    }
    return {
      spendingPubKey: toBytes33(spendingPubKey),
      viewingPubKey: toBytes33(viewingPubKey),
    };
  }
}

export class DarkPayChainSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeploymentsFile();
    this.contract = new Contract(
      address || dep.contracts.DarkPay,
      loadAbi("DarkPay"),
      signerOrProvider
    );
  }

  async announcementCount() {
    return this.contract.announcementCount();
  }

  async getAnnouncements(fromBlock) {
    return this.contract.getAnnouncements(fromBlock);
  }

  async getMetaAddressComponents(agent) {
    return this.contract.getMetaAddressComponents(agent);
  }

  async registerStealthMetaAddress(spendingPubKeyHex, viewingPubKeyHex, opts = {}) {
    return this.contract.registerStealthMetaAddress(
      toBytes33(spendingPubKeyHex),
      toBytes33(viewingPubKeyHex),
      opts
    );
  }

  async sendNativeStealth(stealthAddress, ephemeralPubKeyHex, viewTagHex, amountEth, opts = {}) {
    return this.contract.sendNativeStealth(
      stealthAddress,
      toBytes33(ephemeralPubKeyHex),
      toBytes1(viewTagHex),
      { value: parseEther(amountEth), ...opts }
    );
  }

  async scanAnnouncements(fromBlock, viewingPrivKeyHex, spendingPubKeyHex, spendingPrivKeyHex) {
    const viewingPrivKey = getBytes(viewingPrivKeyHex);
    const spendingPubKey = toBytes33(spendingPubKeyHex);
    const spendingPrivKey = spendingPrivKeyHex ? getBytes(spendingPrivKeyHex) : null;
    const announcements = await this.getAnnouncements(fromBlock);
    const matches = [];
    for (const a of announcements) {
      const ann = {
        stealthAddress: a.stealthAddress,
        ephemeralPubKey: getBytes(a.ephemeralPubKey),
        viewTag: getBytes(a.viewTag),
        token: a.token,
        amount: a.amount,
        blockNumber: a.blockNumber,
      };
      const check = DarkPaySDK.checkAnnouncement(ann, viewingPrivKey, spendingPubKey);
      if (check.isForMe) {
        const row = {
          stealthAddress: ann.stealthAddress,
          ephemeralPubKey: hexlify(ann.ephemeralPubKey),
          viewTag: hexlify(ann.viewTag),
          token: ann.token,
          amount: ann.amount.toString(),
          blockNumber: Number(ann.blockNumber),
        };
        if (spendingPrivKey) {
          row.stealthPrivKey = hexlify(
            DarkPaySDK.deriveStealthPrivKey(viewingPrivKey, spendingPrivKey, ann.ephemeralPubKey)
          );
        }
        matches.push(row);
      }
    }
    return matches;
  }
}

export { pubKeyToAddress };
