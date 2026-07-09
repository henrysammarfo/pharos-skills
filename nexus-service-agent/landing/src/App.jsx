import Navbar from "./components/Navbar.jsx";
import BackgroundVideo from "./components/BackgroundVideo.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <div className="hero">
      <BackgroundVideo />
      <Navbar />
      <Footer />
    </div>
  );
}
