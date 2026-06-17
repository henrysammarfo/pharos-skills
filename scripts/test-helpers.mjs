export function createChecker() {
  let ok = 0;
  let total = 0;
  return {
    async check(name, fn) {
      total++;
      try {
        const result = await fn();
        console.log(`PASS  ${name}`);
        if (result !== undefined) {
          const preview = typeof result === "object"
            ? JSON.stringify(result, (_, v) => (typeof v === "bigint" ? v.toString() : v)).slice(0, 160)
            : String(result).slice(0, 120);
          if (preview) console.log(`       → ${preview}`);
        }
        ok++;
        return result;
      } catch (e) {
        console.error(`FAIL  ${name}:`, e.shortMessage || e.message);
        return null;
      }
    },
    summary(label) {
      console.log(`\n${ok}/${total} ${label}`);
      return { ok, total };
    },
  };
}

export function wantsWallet(argv) {
  return argv.includes("--wallet") || process.env.REQUIRE_WALLET === "1";
}

export function walletRequiredMessage() {
  return "wallet.json or PRIVATE_KEY required. Fund from https://stakely.io/faucet/pharos-atlantic-testnet-phrs";
}
