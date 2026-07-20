import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Grab token from URL (after Google OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");

    if (callbackToken) {
      // Save token for future API calls
      localStorage.setItem("token", callbackToken);

      // Clean URL (remove ?token=...)
      navigate("/dashboard", { replace: true });
    }

    // 2. Fetch user details from backend using stored token
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          console.log("Fetched user:", data);
          setUser(data);
        })
        .catch((err) => console.error("Error fetching user:", err));
    }
  }, [navigate]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <Sidebar active="Dashboard" />
      <main className="main-content">
        <header className="header">
          <h1>
            {user
              ? `Welcome to CreatorIQ, ${user.full_name}!`
              : "Welcome to CreatorIQ!"}
          </h1>
          <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">
              🔔
            </span>
            <span onClick={() => navigate("/messages")} className="icon">
              ✉️
            </span>
            <span onClick={() => navigate("/settings")} className="icon">
              ⚙️
            </span>
          </div>
        </header>

        <section className="cards">
          <div className="card">
            <h3>Followers</h3>
            <p>145.2K</p>
          </div>
          <div className="card">
            <h3>Reach</h3>
            <p>8.5M</p>
          </div>
          <div className="card">
            <h3>Engagement Rate</h3>
            <p>7.8%</p>
          </div>
          <div className="card">
            <h3>Monthly Earnings</h3>
            <p>₹14,500</p>
          </div>
        </section>

        <section className="charts">
          <div className="chart">
            <h3>Growth & Trends</h3>
            <p>Follower Growth (Last 30 Days)</p>
            {/* Chart.js or Recharts line chart can be added here */}
          </div>
          <div className="summary">
            <h3>Earnings Summary</h3>
            <p>This Month: ₹14,500 (+15%)</p>
            <p>Last Month: ₹12,200</p>
            <p>Campaigns: ₹8,000</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
