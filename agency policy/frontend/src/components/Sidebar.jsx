import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuto } from '../contexts/AutoContext';
import { 
  Home, 
  Users, 
  BarChart3, 
  Share2, 
  Building, 
  Settings, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const { user, logout, agencyProfile } = useAuto();

  const navItems = [
    { name: 'Overview', path: '/', icon: Home },
    { name: 'Creators', path: '/creators', icon: Users },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Social Media', path: '/social-media', icon: Share2 },
    { name: 'Agency Profile', path: '/profile', icon: Building },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Admin Panel', path: '/admin', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[#0A0A0A] py-6 px-4">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
          <span className="font-heading text-black text-xs font-bold">IQ</span>
        </div>
        <span className="font-heading text-lg font-bold tracking-tight text-white">
          Creator<span className="text-neutral-400 font-normal">IQ</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200
                ${isActive 
                  ? 'bg-[#121212] border border-[#27272A] text-white' 
                  : 'text-neutral-400 hover:text-white hover:bg-[#1A1A1A] border border-transparent'
                }
              `}
            >
              <Icon className="h-5 w-5 stroke-[1.5]" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info / Logout */}
      <div className="border-t border-[#27272A] pt-4 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#121212] border border-[#27272A] shrink-0">
            <span className="font-heading text-sm font-bold text-white uppercase">
              {user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-neutral-400 truncate">{agencyProfile?.name || user?.agency_name}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          data-testid="logout-btn"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent transition-colors duration-200"
        >
          <LogOut className="h-5 w-5 stroke-[1.5]" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
