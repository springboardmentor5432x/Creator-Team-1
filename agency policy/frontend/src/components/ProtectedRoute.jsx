import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuto } from '../contexts/AutoContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuto();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
          <span className="text-sm font-medium tracking-wide text-neutral-400">Loading Agency Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
