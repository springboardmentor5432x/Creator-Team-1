import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";


const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <h2>CreatorIQ</h2>
      <ul>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/contentanalytics" className={({ isActive }) => (isActive ? "active" : "")}>
            Content Analytics
          </NavLink>
        </li>
        <li>
          <NavLink to="/audienceanalytics" className={({ isActive }) => (isActive ? "active" : "")}>
            Audience Analytics
          </NavLink>
        </li>
        <li>
          <NavLink to="/growthtrends" className={({ isActive }) => (isActive ? "active" : "")}>
            Growth Trends
          </NavLink>
        </li>
        <li>
          <NavLink to="/revenue" className={({ isActive }) => (isActive ? "active" : "")}>
            Revenue
          </NavLink>
        </li>
        <li>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
            Reports
          </NavLink>
        </li>
        <li>
          <NavLink to="/socialmedia" className={({ isActive }) => (isActive ? "active" : "")}>
            Social Media
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            Settings
          </NavLink>
        </li>
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
