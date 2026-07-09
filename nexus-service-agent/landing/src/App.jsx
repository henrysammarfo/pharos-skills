import { useCallback, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import BackgroundVideo from "./components/BackgroundVideo.jsx";
import Footer from "./components/Footer.jsx";
import MenuPanel from "./components/MenuPanel.jsx";
import SkillsPanel from "./components/SkillsPanel.jsx";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setSkillsOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      if (!open) setSkillsOpen(false);
      return !open;
    });
  }, []);

  const toggleSkills = useCallback(() => {
    setSkillsOpen((open) => {
      if (!open) setMenuOpen(false);
      return !open;
    });
  }, []);

  return (
    <div className="hero">
      <BackgroundVideo />
      <Navbar
        menuOpen={menuOpen}
        skillsOpen={skillsOpen}
        onToggleMenu={toggleMenu}
        onToggleSkills={toggleSkills}
      />
      <MenuPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSkills={() => setSkillsOpen(true)}
      />
      <SkillsPanel open={skillsOpen} onClose={() => setSkillsOpen(false)} />
      <Footer />
      {(menuOpen || skillsOpen) && (
        <button
          type="button"
          className="sr-only-focusable"
          onClick={closeAll}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
