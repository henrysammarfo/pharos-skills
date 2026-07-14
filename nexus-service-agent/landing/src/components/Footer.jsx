import { motion } from "motion/react";
import { NETWORK } from "../data/skills.js";

const ease = [0.16, 1, 0.3, 1];

const GITHUB = "https://github.com/henrysammarfo/pharos-skills";

export default function Footer() {
  const networkLabel = NETWORK?.name ?? "Pharos Pacific Mainnet";
  const anvita = NETWORK?.anvitaChat ?? "https://flow.anvita.xyz/agent/chat";
  const free = NETWORK?.free !== false;

  return (
    <motion.footer
      className="footer"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 1, ease }}
    >
      <div className="footer-inner">
        <div className="footer-left">
          <motion.p
            className="subtitle"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease }}
          >
            <span className="subtitle-dot" />
            {networkLabel}
            {" · "}
            {free ? "Free on Anvita" : `$${(NETWORK.unitPriceUsd ?? 0.02).toFixed(2)} / call`}
          </motion.p>

          <motion.h1
            className="heading"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease }}
          >
            Is this spend
            <br />
            safe today?
          </motion.h1>

          <motion.p
            className="hero-support"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8, ease }}
          >
            Ask Anvita for NEXUS Trust Agent — credit, spend safety, intent, stealth.
          </motion.p>

          <motion.div
            className="button-row"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8, ease }}
          >
            <a
              href={anvita}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Call Free on Anvita
            </a>
            <a
              href={GITHUB}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </motion.div>
        </div>

        <div className="footer-right">
          <span className="tag-pill">Free</span>
          <span className="tag-pill">Credit</span>
          <span className="tag-pill">SpendSafe</span>
        </div>
      </div>
    </motion.footer>
  );
}
