import { Routes, Route, Navigate } from "react-router-dom";


import Login from "./pages/Login";
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ContentAnalytics from "./pages/ContentAnalytics";
import PrivateRoute from "./utils/PrivateRoute";

import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";

// Newly added pages
import AudienceAnalytics from "./pages/AudienceAnalytics";
import GrowthTrends from "./pages/GrowthTrends";
import SocialMedia from "./pages/SocialMedia";
import RevenueAnalytics from "./pages/RevenueAnalytics";
import Reports from "./pages/Reports";

// servises  
import API from "./servises/api.js";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/register" replace />} />

      {/* Auth pages */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Core pages */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />

      {/* Analytics pages */}
      <Route path="/contentanalytics" element={<PrivateRoute><ContentAnalytics /></PrivateRoute>} />
      <Route path="/audienceanalytics" element={<PrivateRoute><AudienceAnalytics /></PrivateRoute>} />
      <Route path="/socialmedia" element={<PrivateRoute><SocialMedia /></PrivateRoute>} />
      <Route path="/growthtrends" element={<PrivateRoute><GrowthTrends /></PrivateRoute>} />
      <Route path="/revenue" element={<PrivateRoute><RevenueAnalytics /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<h2>404 - Page Not Found</h2>} />
    </Routes>
  );
}

export default App;
