import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import YouTube from "./pages/YouTube";
import Instagram from "./pages/Instagram";
import Facebook from "./pages/Facebook";
import LinkedIn from "./pages/LinkedIn";
import XPlatform from "./pages/XPlatform";

import Analytics from "./pages/Analytics";
import Revenue from "./pages/Revenue";
import Content from "./pages/Content";

import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Dashboard />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Platforms */}
        <Route path="/youtube" element={<YouTube />} />
        <Route path="/instagram" element={<Instagram />} />
        <Route path="/facebook" element={<Facebook />} />
        <Route path="/linkedin" element={<LinkedIn />} />
        <Route path="/x" element={<XPlatform />} />

        {/* Dashboard Pages */}
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/content" element={<Content />} />
        <Route path="/revenue" element={<Revenue />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;