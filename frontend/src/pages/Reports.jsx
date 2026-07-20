import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Reports.css";

const Reports = () => {
  const navigate = useNavigate();
  return (
    <div className="reports-container">
      <Sidebar active="Reports" />
      <main className="main-content">
        <header className="header">
          <h1>Reports</h1>
           <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        <section className="reports-section">
          <button className="report-btn">Generate Performance Report</button>
          <button className="report-btn">Generate Audience Report</button>
          <button className="report-btn">Generate Revenue Report</button>
        </section>
      </main>
    </div>
  );
};

export default Reports;
