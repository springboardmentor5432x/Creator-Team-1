import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AutoContext = createContext(null);

export const AutoProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agencyProfile, setAgencyProfile] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('creatoriq_token');
      if (token) {
        try {
          const userData = await api.auth.me();
          setUser(userData);
          // Fetch initial settings & profile
          const profile = await api.agency.get();
          setAgencyProfile(profile);
          const config = await api.settings.get();
          setSettings(config);
        } catch (error) {
          console.error('Failed to restore authentication session:', error);
          localStorage.removeItem('creatoriq_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      localStorage.setItem('creatoriq_token', response.access_token);
      setUser(response.user);
      
      // Fetch agency profile and settings upon login
      try {
        const profile = await api.agency.get();
        setAgencyProfile(profile);
        const config = await api.settings.get();
        setSettings(config);
      } catch (err) {
        console.error('Failed to load agency profile/settings:', err);
      }
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, agencyName) => {
    setLoading(true);
    try {
      const response = await api.auth.register(name, email, password, agencyName);
      localStorage.setItem('creatoriq_token', response.access_token);
      setUser(response.user);
      
      // Fetch agency profile and settings upon register
      try {
        const profile = await api.agency.get();
        setAgencyProfile(profile);
        const config = await api.settings.get();
        setSettings(config);
      } catch (err) {
        console.error('Failed to load agency profile/settings:', err);
      }
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('creatoriq_token');
    setUser(null);
    setAgencyProfile(null);
    setSettings(null);
  };

  const refreshAgencyProfile = async () => {
    try {
      const profile = await api.agency.get();
      setAgencyProfile(profile);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshSettings = async () => {
    try {
      const config = await api.settings.get();
      setSettings(config);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AutoContext.Provider value={{
      user,
      loading,
      agencyProfile,
      settings,
      login,
      register,
      logout,
      setAgencyProfile,
      setSettings,
      refreshAgencyProfile,
      refreshSettings
    }}>
      {children}
    </AutoContext.Provider>
  );
};

export const useAuto = () => {
  const context = useContext(AutoContext);
  if (!context) {
    throw new Error('useAuto must be used within an AutoProvider');
  }
  return context;
};
