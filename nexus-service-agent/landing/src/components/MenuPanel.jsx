import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { MENU_LINKS } from "../data/skills.js";

const ease = [0.16, 1, 0.3, 1];

export default function MenuPanel({ open, onClose, onOpenSkills }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="panel-backdrop"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            onClick={onClose}
          />
          <motion.aside
            className="panel menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">NEXUS Trust Agent</p>
                <h2 className="panel-title">Menu</h2>
              </div>
              <button
                type="button"
                className="panel-close"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <nav className="menu-links">
              {MENU_LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="menu-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.35, ease }}
                  onClick={onClose}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.button
                type="button"
                className="menu-link menu-link-button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * MENU_LINKS.length, duration: 0.35, ease }}
                onClick={() => {
                  onClose();
                  onOpenSkills();
                }}
              >
                Five Skills
              </motion.button>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
