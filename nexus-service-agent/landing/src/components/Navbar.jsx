import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Logo, GridIcon } from "./Icons.jsx";

const ease = [0.16, 1, 0.3, 1];

export default function Navbar() {
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

        <button type="button" className="menu-pill">
          <span className="menu-icon-circle">
            <Plus size={12} strokeWidth={3} color="black" />
          </span>
          <span className="menu-label">Menu</span>
        </button>

        <div className="tags-pill desktop-only">
          <span>Trust Infrastructure</span>
          <span>Cognitive Agents</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="adaptive-pill desktop-only">
          <button type="button" className="grid-button" aria-label="Skills">
            <GridIcon />
          </button>
          <span className="adaptive-label">Five Skills</span>
        </div>
      </div>
    </motion.nav>
  );
}
