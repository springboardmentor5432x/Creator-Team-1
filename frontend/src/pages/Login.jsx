import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting login:", formData);

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();

      // ✅ Save token under "token" so api.js can find it
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);

        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };

  return (
    <div className="login-page">
      <div className="logo-section">CreatorIQ</div>
      <div className="login-card">
        <h1>Log in to your account</h1>
        <p className="subtitle">Welcome back! Please enter your details to continue.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="janedoe@example.com"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <button type="submit" className="submit-btn">Log In</button>
        </form>

        <button type="button" onClick={handleGoogleLogin} className="google-btn">
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png"
            alt="Google logo"
            className="google-icon"
          />
          Sign in with Google
        </button>

        <p className="signup-link">
          Don’t have an account? <a href="/register">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
