import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../servises/api.js"; // axios helper with JWT interceptor
import "./ContentAnalytics.css";

const ContentAnalytics = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    watch_time: 0,
    reach: 0,
    engagement_rate: 0,
  });

  useEffect(() => {
    API.get("/analytics/content")
      .then((res) => {
        console.log("Fetched content analytics:", res.data);

        // If backend returns an array of posts, aggregate totals
        const totals = res.data.reduce(
          (acc, item) => {
            acc.views += item.views || 0;
            acc.likes += item.likes || 0;
            acc.comments += item.comments || 0;
            acc.shares += item.shares || 0;
            acc.saves += item.saves || 0;
            acc.watch_time += item.watch_time || 0;
            acc.reach += item.reach || 0;
            acc.engagement_rate += item.engagement_rate || 0;
            return acc;
          },
          { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, watch_time: 0, reach: 0, engagement_rate: 0 }
        );

        // Average engagement rate instead of sum
        if (res.data.length > 0) {
          totals.engagement_rate = (totals.engagement_rate / res.data.length).toFixed(2);
        }

        setMetrics(totals);
      })
      .catch((err) => console.error("Error fetching analytics:", err));
  }, []);

  return (
    <div className="content-analytics-container">
      <Sidebar active="Content Analytics" />
      <main className="main-content">
        <header className="header">
          <h1>Content Analytics</h1>
          <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        {/* Metrics Summary */}
        <section className="metrics-grid">
          <div className="metric-card"><h3>Views</h3><p>{metrics.views}</p></div>
          <div className="metric-card"><h3>Likes</h3><p>{metrics.likes}</p></div>
          <div className="metric-card"><h3>Comments</h3><p>{metrics.comments}</p></div>
          <div className="metric-card"><h3>Shares</h3><p>{metrics.shares}</p></div>
          <div className="metric-card"><h3>Saves</h3><p>{metrics.saves}</p></div>
          <div className="metric-card"><h3>Watch Time</h3><p>{metrics.watch_time} hrs</p></div>
          <div className="metric-card"><h3>Reach</h3><p>{metrics.reach}</p></div>
          <div className="metric-card"><h3>Engagement Rate</h3><p>{metrics.engagement_rate}%</p></div>
        </section>
      </main>
    </div>
  );
};

export default ContentAnalytics;
