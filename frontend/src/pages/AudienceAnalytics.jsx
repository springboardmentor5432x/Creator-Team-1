import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./AudienceAnalytics.css";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AudienceAnalytics = () => {
  const navigate = useNavigate();
  const [audience, setAudience] = useState({
    ageDistribution: [],
    genderDistribution: {},
    locations: [],
    devices: {},
    activeHours: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:8000/analytics/audience", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch audience analytics");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched audience analytics:", data);
        setAudience(data);
      })
      .catch((err) => console.error("Error fetching audience analytics:", err));
  }, []);

  // Chart configs using backend data
  const genderData = {
    labels: Object.keys(audience.genderDistribution),
    datasets: [
      {
        data: Object.values(audience.genderDistribution),
        backgroundColor: ["#4c6ef5", "#f783ac", "#94d82d"],
      },
    ],
  };

  const ageData = {
    labels: audience.ageDistribution.map((item) => item.group),
    datasets: [
      {
        label: "Age Distribution",
        data: audience.ageDistribution.map((item) => item.count),
        backgroundColor: ["#6b46c1", "#a78bfa", "#d6bcfa", "#f6ad55"],
      },
    ],
  };

  const deviceData = {
    labels: Object.keys(audience.devices),
    datasets: [
      {
        label: "Device Usage",
        data: Object.values(audience.devices),
        backgroundColor: ["#38b2ac", "#63b3ed", "#f6ad55"],
      },
    ],
  };

  const locationData = {
    labels: audience.locations.map((loc) => loc.name),
    datasets: [
      {
        label: "Top Locations",
        data: audience.locations.map((loc) => loc.count),
        backgroundColor: "#63b3ed",
      },
    ],
  };

  const activeTimeData = {
    labels: audience.activeHours.map((time) => `${time.hour}:00`),
    datasets: [
      {
        label: "Active Hours",
        data: audience.activeHours.map((time) => time.count),
        backgroundColor: "#f6ad55",
      },
    ],
  };

  return (
    <div className="audience-analytics-container">
      <Sidebar active="Audience Analytics" />
      <main className="main-content">
        <header className="header">
          <h1>Audience Analytics</h1>
          <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        <section className="charts-grid">
          <div className="chart-card">
            <h3>Gender Distribution</h3>
            <Pie data={genderData} />
          </div>
          <div className="chart-card">
            <h3>Age Distribution</h3>
            <Bar data={ageData} />
          </div>
          <div className="chart-card">
            <h3>Device Usage</h3>
            <Bar data={deviceData} />
          </div>
          <div className="chart-card">
            <h3>Top Locations</h3>
            <Bar data={locationData} />
          </div>
          <div className="chart-card">
            <h3>Active Hours</h3>
            <Bar data={activeTimeData} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AudienceAnalytics;
