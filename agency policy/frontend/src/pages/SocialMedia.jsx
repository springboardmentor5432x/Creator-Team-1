import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Instagram, Youtube, Video, Tv, Link2, Link2Off } from 'lucide-react';
import confetti from 'canvas-confetti';

const SocialMedia = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchChannels = async () => {
    try {
      const res = await api.social.list();
      setChannels(res);
    } catch (err) {
      console.error('Error fetching social media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      await api.social.toggle(id, !currentStatus);
      await fetchChannels();
      if (!currentStatus) {
        // Trigger a tiny success confetti
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }
    } catch (err) {
      console.error('Error toggling channel connection:', err);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
      </div>
    );
  }

  // Icons map
  const getIcon = (id) => {
    switch (id) {
      case 'instagram': return Instagram;
      case 'youtube': return Youtube;
      case 'tiktok': return Video;
      case 'twitch': return Tv;
      default: return Link2;
    }
  };

  // Color configurations for indicators
  const getColors = (id) => {
    switch (id) {
      case 'instagram': return { dot: 'bg-[#E1306C]', hover: 'hover:border-[#E1306C]/50' };
      case 'youtube': return { dot: 'bg-[#FF0000]', hover: 'hover:border-[#FF0000]/50' };
      case 'tiktok': return { dot: 'bg-[#00F2FE]', hover: 'hover:border-[#00F2FE]/50' };
      case 'twitch': return { dot: 'bg-[#9146FF]', hover: 'hover:border-[#9146FF]/50' };
      default: return { dot: 'bg-white', hover: 'hover:border-white/50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white">Social Integrations</h2>
        <p className="text-sm text-neutral-400">Connect networks to automate metrics import pipelines.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {channels.map((ch, index) => {
          const Icon = getIcon(ch.id);
          const colors = getColors(ch.id);
          return (
            <div
              key={ch.id}
              className={`bg-[#121212] border border-[#27272A] rounded-xl p-6 transition-all duration-300 flex flex-col justify-between ${colors.hover} animate-fade-in-up`}
              style={{ animationDelay: `${(index + 1) * 75}ms` }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1A1A1A] border border-[#27272A] rounded-xl relative">
                    <Icon className="h-6 w-6 text-white stroke-[1.5]" />
                    {/* Brand indicator dot */}
                    <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${colors.dot}`} />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-white">{ch.name}</h3>
                    <p className="text-xs text-neutral-500">API Version v4.1</p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  ch.connected 
                    ? 'bg-emerald-500/10 text-[#10B981]' 
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${ch.connected ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                  {ch.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Connected Details */}
              {ch.connected ? (
                <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-[#27272A] bg-[#0A0A0A]/40 rounded-lg px-4">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Followers</span>
                    <p className="text-sm font-semibold text-white mt-1 font-mono">
                      {ch.followers >= 1000000 
                        ? `${(ch.followers / 1000000).toFixed(1)}M` 
                        : ch.followers.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      {ch.id === 'instagram' ? 'Posts' : ch.id === 'twitch' ? 'Stream Hrs' : 'Videos'}
                    </span>
                    <p className="text-sm font-semibold text-white mt-1 font-mono">
                      {ch.id === 'instagram' ? ch.posts : ch.id === 'twitch' ? ch.stream_hours : ch.videos}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Engagement</span>
                    <p className="text-sm font-semibold text-white mt-1 font-mono">
                      {ch.engagement}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 mb-6 text-center">
                  <p className="text-xs text-neutral-500 max-w-[200px]">
                    Link your agency's {ch.name} profile to fetch insights.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleToggle(ch.id, ch.connected)}
                disabled={togglingId === ch.id}
                data-testid={`toggle-${ch.id}-btn`}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold border transition-all duration-200 ${
                  ch.connected 
                    ? 'border-[#27272A] bg-transparent text-neutral-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20' 
                    : 'border-[#27272A] bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {togglingId === ch.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border border-neutral-400 border-t-transparent" />
                ) : ch.connected ? (
                  <>
                    <Link2Off className="h-3.5 w-3.5" />
                    <span>Unlink Connection</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Establish Integration</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialMedia;
