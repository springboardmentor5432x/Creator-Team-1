import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./SocialMedia.css";

const platforms = [
  {name: "YouTube",icon: <img src="/images.png" alt="YouTube logo" className="social-icon" />,description: "Connect your YouTube channel" },
  { name: "Instagram", icon: <img src="/images1.jpg" alt="YouTube logo" className="social-icon" />, description: "Connect your Instagram account" },
  { name: "Facebook", icon: <img src="/images3.png" alt="YouTube logo" className="social-icon" />, description: "Connect your Facebook page" },
  { name: "X (Twitter)", icon: <img src="/images2.png" alt="YouTube logo" className="social-icon" />, description: "Connect your X (Twitter) account" },
  { name: "LinkedIn", icon: <img src="/images4.png" alt="YouTube logo" className="social-icon" />, description: "Connect your LinkedIn profile" },
];

const SocialMedia = () => {
  const navigate = useNavigate();
  return (
    <div className="socialmedia-container">
      <Sidebar active="Social Media" />
      <main className="main-content">
        <header className="header">
          <h1>Connect Your Social Media Accounts</h1>
           <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        <section className="platforms-grid">
          {platforms.map((platform, idx) => (
            <div key={idx} className="platform-card">
              <div className="platform-icon">{platform.icon}</div>
              <h3>{platform.name}</h3>
              <p>{platform.description}</p>
              <button className="connect-btn">Connect</button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default SocialMedia;
