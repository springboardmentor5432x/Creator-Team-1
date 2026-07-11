import React, { useState, useEffect } from 'react';
import { useAuto } from '../contexts/AutoContext';
import { api } from '../lib/api';
import { Mail, Phone, Globe, MapPin, Edit3, Save, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const AgencyProfile = () => {
  const { agencyProfile, setAgencyProfile } = useAuto();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agencyProfile) {
      setName(agencyProfile.name || '');
      setTagline(agencyProfile.tagline || '');
      setEmail(agencyProfile.email || '');
      setPhone(agencyProfile.phone || '');
      setWebsite(agencyProfile.website || '');
      setLocation(agencyProfile.location || '');
    }
  }, [agencyProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.agency.update({
        name,
        tagline,
        email,
        phone,
        website,
        location
      });
      setAgencyProfile(updated);
      setEditing(false);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Failed to update agency profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!agencyProfile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover Image & Avatar Header */}
      <div className="relative rounded-xl border border-[#27272A] overflow-hidden bg-[#121212]">
        {/* Cover banner using specified unsplash url */}
        <div className="h-44 md:h-60 w-full overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1710438399422-2fca27686bcd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMG1pbmltYWwlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODM3NjQxMDR8MA&ixlib=rb-4.1.0&q=85" 
            alt="Agency Cover" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
        </div>

        {/* Profile Details Header */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-10 md:-mt-14">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
            <img 
              src={agencyProfile.logo} 
              alt="Agency Logo" 
              className="h-20 w-20 md:h-28 md:w-28 rounded-xl object-cover border-4 border-[#121212] bg-[#1A1A1A]"
            />
            <div className="space-y-1">
              <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                {agencyProfile.name}
                <Sparkles className="h-5 w-5 text-neutral-400" />
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
                {agencyProfile.tagline}
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            data-testid="edit-profile-btn"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#27272A] bg-[#0A0A0A] hover:bg-[#1A1A1A] hover:border-[#52525B] transition-all px-4 py-2.5 text-xs font-semibold shrink-0"
          >
            {editing ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roster & Stats Bento Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Core Stats */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 space-y-4 h-full flex flex-col justify-between">
          <h3 className="font-heading text-sm font-semibold text-neutral-400 uppercase tracking-wider">
            Agency Footprint
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <span className="text-sm text-neutral-400">Total Followers</span>
              <span className="text-sm font-bold font-mono">{(agencyProfile.total_followers / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <span className="text-sm text-neutral-400">Monthly Reach</span>
              <span className="text-sm font-bold font-mono">{(agencyProfile.monthly_reach / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <span className="text-sm text-neutral-400">Active Campaigns</span>
              <span className="text-sm font-bold font-mono">{agencyProfile.active_campaigns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Campaigns Completed</span>
              <span className="text-sm font-bold font-mono">{agencyProfile.campaigns_completed}</span>
            </div>
          </div>
        </div>

        {/* Profile details / Edit Profile Form */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#27272A] rounded-xl p-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="font-heading text-lg font-bold text-white mb-2">Edit Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Tagline / Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    required
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#27272A] mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="save-profile-btn"
                  className="flex items-center gap-2 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors px-4 py-2.5 text-xs font-semibold"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3.5 rounded-lg border border-[#27272A] bg-[#0A0A0A]/40 p-4">
                    <Mail className="h-5 w-5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Email</p>
                      <p className="text-sm font-semibold text-white truncate">{agencyProfile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-lg border border-[#27272A] bg-[#0A0A0A]/40 p-4">
                    <Phone className="h-5 w-5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Phone</p>
                      <p className="text-sm font-semibold text-white truncate">{agencyProfile.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-lg border border-[#27272A] bg-[#0A0A0A]/40 p-4">
                    <Globe className="h-5 w-5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Website</p>
                      <p className="text-sm font-semibold text-white truncate">{agencyProfile.website}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-lg border border-[#27272A] bg-[#0A0A0A]/40 p-4">
                    <MapPin className="h-5 w-5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Location</p>
                      <p className="text-sm font-semibold text-white truncate">{agencyProfile.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyProfile;
