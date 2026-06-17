import * as secp256k1 from "@noble/secp256k1";
import { keccak256, hexlify, getBytes, getAddress, toBeHex } from "ethers";

function pubKeyToAddress(pubKeyBytes) {
  const bytes = pubKeyBytes instanceof Uint8Array ? pubKeyBytes : getBytes(pubKeyBytes);
  const payload = bytes.length === 65 && bytes[0] === 0x04 ? bytes.slice(1) : bytes;
  const hash = keccak256(payload);
  return getAddress("0x" + hash.slice(-40));
}

function hashSharedSecret(shared) {
  return getBytes(keccak256(shared));
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
}

export { pubKeyToAddress };
