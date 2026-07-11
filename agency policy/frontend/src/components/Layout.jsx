import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, Database } from 'lucide-react';
import { useAuto } from '../contexts/AutoContext';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, agencyProfile } = useAuto();

  const isMongoConnected = settings?.database_mode === 'MongoDB Server' || settings?.database_mode?.includes('Connected');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex md:w-64 md:shrink-0 border-r border-[#27272A]">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar (animates in/out) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-[#27272A] bg-[#0A0A0A] transition-transform duration-300 md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button Inside Mobile Sidebar */}
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setMobileOpen(false)}
            data-testid="close-mobile-menu-btn"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-[#1A1A1A] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header (Glassmorphic) */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#27272A] bg-[#0A0A0A]/80 px-4 md:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              data-testid="open-mobile-menu-btn"
              className="rounded-lg p-2 text-neutral-400 hover:bg-[#1A1A1A] hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="hidden md:block font-heading text-xl font-bold tracking-tight text-white">
              {agencyProfile?.name || 'Aura Premium Agency'}
            </h1>
            <h1 className="md:hidden font-heading text-lg font-bold tracking-tight text-white">
              CreatorIQ
            </h1>
          </div>

          {/* Database & Profile Indicator */}
          <div className="flex items-center gap-4">
            {/* Database indicator */}
            <div 
              title={`Database: ${settings?.database_mode || 'Checking...'}`}
              className="flex items-center gap-2 rounded-full border border-[#27272A] bg-[#121212] px-3 py-1 text-xs font-semibold text-neutral-400"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">DB:</span>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isMongoConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="hidden sm:inline font-mono">{isMongoConnected ? 'MONGO' : 'JSON'}</span>
            </div>
            
            <div className="h-4 w-px bg-[#27272A]"></div>

            {/* Profile headshot */}
            <div className="flex items-center gap-2">
              <img 
                src={agencyProfile?.logo || 'https://images.unsplash.com/photo-1699899657680-421c2c2d5064?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzcwMTA4OXww&ixlib=rb-4.1.0&q=85'} 
                alt="Agency Logo" 
                className="h-8 w-8 rounded-lg object-cover border border-[#27272A]"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Page Component Container */}
        <main className="flex-1 overflow-y-auto bg-[#0A0A0A] p-4 md:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
