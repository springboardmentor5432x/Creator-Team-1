import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",   // frontend only
    role: "Creator"
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const payload = {
      full_name: formData.fullName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        console.log("User registered:", data);

        // ✅ Save token under "token" so api.js can find it
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);

        navigate("/dashboard");
      } else {
        console.error("Validation error:", data);
        alert(JSON.stringify(data.detail));
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };

  return (
    <div className="register-page">
      <div className="logo-section">CreatorIQ</div>
      <div className="register-card">
        <h1>Create your account</h1> 
        <p className="subtitle">
          Join CreatorIQ to discover, manage, and grow meaningful creator partnerships.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="fullName" placeholder="Jane Doe" onChange={handleChange} className="input-field" />
          </div>
           
          <div className="form-group">
            <label>Username</label>
            <div className="username-wrapper">
              <input name="username" placeholder="@janedoe" onChange={handleChange} className="input-field username-input" />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input name="email" type="email" placeholder="example@email.com" onChange={handleChange} className="input-field" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="enter a password" onChange={handleChange} className="input-field" />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input name="confirmPassword" type="password" placeholder="Re-enter a password" onChange={handleChange} className="input-field" />
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <select name="role" onChange={handleChange} className="input-field">
              <option value="">Select Role</option>
              <option value="Creator">Creator</option>
              <option value="Agency">Agency</option>
              <option value="Marketing Team">Marketing Team</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">Create Account</button>

          <button type="button" onClick={handleGoogleLogin} className="google-btn">
            <img
              src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png"
              alt="Google logo"
              className="google-icon"
            />
            Sign up with Google
          </button>

          <p className="signup-link">
            Have an account? <a href="/login">Sign In</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
