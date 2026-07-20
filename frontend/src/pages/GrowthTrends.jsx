import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./GrowthTrends.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const GrowthTrends = () => {
  const navigate = useNavigate();
  const growthData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Followers",
        data: [150000, 160000, 170000, 185000, 200000, 220000],
        borderColor: "#6b46c1",
        tension: 0.3,
        fill: false,
      },
    ],
  };

  return (
    <div className="growth-trends-container">
      <Sidebar active="Growth Trends" />
      <main className="main-content">
        <header className="header">
          <h1>Growth & Trends</h1>
          <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        <section className="chart-card">
          <h3>Follower Growth</h3>
          <Line data={growthData} />
        </section>
      </main>
    </div>
  );
};

export default GrowthTrends;
