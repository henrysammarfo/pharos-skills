import { motion } from "motion/react";
import { NETWORK } from "../data/skills.js";

const ease = [0.16, 1, 0.3, 1];

const GITHUB = "https://github.com/henrysammarfo/pharos-skills";
const ARCHITECTURE =
  "https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md";

export default function Footer() {
  const price = NETWORK?.unitPriceUsd ?? 0.02;
  const networkLabel = NETWORK?.name ?? "Pharos Pacific Mainnet";

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
            {networkLabel} · ${price.toFixed(2)} / call
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

          <motion.div
            className="button-row"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8, ease }}
          >
            <a
              href={GITHUB}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Check Trust
            </a>
            <a
              href={ARCHITECTURE}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              How It Works
            </a>
          </motion.div>
        </div>

        <div className="footer-right">
          <span className="tag-pill">Credit</span>
          <span className="tag-pill">SpendSafe</span>
          <span className="tag-pill">Stealth</span>
        </div>
      </div>
    </motion.footer>
  );
}
