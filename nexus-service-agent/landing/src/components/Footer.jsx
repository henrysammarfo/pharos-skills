import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1];

const GITHUB = "https://github.com/henrysammarfo/pharos-skills";
const ARCHITECTURE =
  "https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md";

export default function Footer() {
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
            Pharos Phase 2 Service Agent · Atlantic Testnet
          </motion.p>

          <motion.h1
            className="heading"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease }}
          >
            One Agent, Full
            <br />
            Trust Stack.
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
              See Skills
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
          <span className="tag-pill">x402</span>
          <span className="tag-pill">Stealth</span>
        </div>
      </div>
    </motion.footer>
  );
}
