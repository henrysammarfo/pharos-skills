import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { SKILLS } from "../data/skills.js";

const ease = [0.16, 1, 0.3, 1];

export default function SkillsPanel({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="panel-backdrop"
            aria-label="Close skills panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            onClick={onClose}
          />
          <motion.aside
            className="panel skills-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Five Pharos Skills"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">Pharos Trust Stack</p>
                <h2 className="panel-title">Five Skills</h2>
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

            <ul className="skills-list">
              {SKILLS.map((skill, index) => (
                <motion.li
                  key={skill.id}
                  className="skill-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.4, ease }}
                >
                  <div className="skill-card-top">
                    <span className="skill-index">0{index + 1}</span>
                    <div>
                      <h3 className="skill-name">{skill.name}</h3>
                      <p className="skill-role">{skill.role}</p>
                    </div>
                  </div>
                  <p className="skill-address">{skill.address}</p>
                  <a
                    href={skill.explorer}
                    className="skill-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Pharosscan
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
