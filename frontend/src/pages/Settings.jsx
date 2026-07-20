import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    language: "English", // default
  });

  // Fetch user details on mount
  useEffect(() => {
    const token = localStorage.getItem("token"); // ✅ consistent key
    if (!token) return;

    fetch("http://localhost:8000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setFormData({
          username: data.username || "",
          email: data.email,
          role: data.role,
          language: data.language || "English",
        });
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // ✅ consistent key

    // Ensure username starts with @
    let formattedUsername = formData.username;
    if (!formattedUsername.startsWith("@")) {
      formattedUsername = "@" + formattedUsername;
    }

    fetch("http://localhost:8000/auth/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: formattedUsername,
        email: formData.email,
        role: formData.role,
        language: formData.language,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update failed");
        return res.json();
      })
      .then((data) => {
        alert("Settings saved successfully!");
        setFormData({
          username: data.username,
          email: data.email,
          role: data.role,
          language: data.language || "English",
        });
      })
      .catch((err) => {
        console.error("Error updating settings:", err);
        alert(err.message || "Unable to save settings.");
      });
  };

  return (
    <div className="settings-container">
      <Sidebar active="Settings" />
      <main className="main-content">
        <header className="header">
          <h1>Settings</h1>
          <div className="icons">
            <span onClick={() => navigate("/notifications")} className="icon">🔔</span>
            <span onClick={() => navigate("/messages")} className="icon">✉️</span>
            <span onClick={() => navigate("/settings")} className="icon">⚙️</span>
          </div>
        </header>

        <section className="settings-section">
          <h3>Profile Settings</h3>
          <form className="settings-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Creator">Creator</option>
                <option value="Agency">Agency</option>
                <option value="Marketing Team">Marketing Team</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>

            <div>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Telugu">Telugu</option>
                <option value="Spanish">Spanish</option>
                <option value="Mandarin Chinese">Mandarin Chinese</option>
                <option value="Hindi">Hindi</option>
                <option value="Arabic">Arabic</option>
                <option value="French">French</option>
                <option value="Bengali">Bengali</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Russian">Russian</option>
                <option value="Urdu">Urdu</option>
              </select>
            </div>

            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Settings;
