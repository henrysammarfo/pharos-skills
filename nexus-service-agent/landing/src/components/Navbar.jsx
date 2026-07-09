import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { Logo, GridIcon } from "./Icons.jsx";

const ease = [0.16, 1, 0.3, 1];

export default function Navbar({
  menuOpen,
  skillsOpen,
  onToggleMenu,
  onToggleSkills,
}) {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="navbar-left">
        <div className="logo-group">
          <Logo />
          <span className="brand-text">NEXUS</span>
        </div>

        <button
          type="button"
          className={`menu-pill${menuOpen ? " is-active" : ""}`}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={onToggleMenu}
        >
          <span className="menu-icon-circle">
            {menuOpen ? (
              <X size={12} strokeWidth={3} color="black" />
            ) : (
              <Plus size={12} strokeWidth={3} color="black" />
            )}
          </span>
          <span className="menu-label">{menuOpen ? "Close" : "Menu"}</span>
        </button>

        <div className="tags-pill desktop-only">
          <span>Trust Infrastructure</span>
          <span>Cognitive Agents</span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className={`adaptive-pill skills-trigger${skillsOpen ? " is-active" : ""}`}
          aria-expanded={skillsOpen}
          aria-label={skillsOpen ? "Close five skills" : "Open five skills"}
          onClick={onToggleSkills}
        >
          <span className="grid-button">
            <GridIcon />
          </span>
          <span className="adaptive-label desktop-only">Five Skills</span>
          <span className="adaptive-label mobile-only">Skills</span>
        </button>
      </div>
    </motion.nav>
  );
}
