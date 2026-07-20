// utils/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  // If you support Google OAuth callback with ?token= in URL
  const callbackToken = new URLSearchParams(window.location.search).get("token");
  const token = localStorage.getItem("token") || callbackToken;

  if (callbackToken) {
    localStorage.setItem("token", callbackToken);
  }

  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
