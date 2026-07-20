import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./RevenueAnalytics.css";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RevenueAnalytics = () => {
  const navigate = useNavigate();
  const revenueData = {
    labels: ["Ads", "Sponsorships", "Merch", "Courses"],
    datasets: [
      {
        label: "Revenue Sources",
        data: [5000, 8000, 3000, 4000],
        backgroundColor: ["#6b46c1", "#a78bfa", "#d6bcfa", "#f6ad55"],
      },
    ],
  };

  return (
    <div className="revenue-analytics-container">
      <Sidebar active="Revenue" />
      <main className="main-content">
        <header className="header">
          <h1>Revenue Analytics</h1>
          <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        <section className="chart-card">
          <h3>Revenue Sources</h3>
          <Bar data={revenueData} />
        </section>
      </main>
    </div>
  );
};

export default RevenueAnalytics;
