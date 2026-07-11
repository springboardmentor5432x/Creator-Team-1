import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Overview from './pages/Overview';
import Creators from './pages/Creators';
import Analytics from './pages/Analytics';
import SocialMedia from './pages/SocialMedia';
import AgencyProfile from './pages/AgencyProfile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/creators" element={<Creators />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/social-media" element={<SocialMedia />} />
                <Route path="/profile" element={<AgencyProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
