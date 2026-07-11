import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const Creators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [followers, setFollowers] = useState('');
  const [engagement, setEngagement] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Active');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');

  const fetchCreators = async () => {
    try {
      const res = await api.creators.list();
      setCreators(res);
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const resetForm = () => {
    setName('');
    setHandle('');
    setPlatform('Instagram');
    setFollowers('');
    setEngagement('');
    setCategory('');
    setStatus('Active');
    setAvatar('');
    setError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (creator) => {
    setSelectedCreator(creator);
    setName(creator.name);
    setHandle(creator.handle);
    setPlatform(creator.platform);
    setFollowers(creator.followers.toString());
    setEngagement(creator.engagement_rate.toString());
    setCategory(creator.category);
    setStatus(creator.status);
    setAvatar(creator.avatar || '');
    setError('');
    setEditModalOpen(true);
  };

  const handleAddCreator = async (e) => {
    e.preventDefault();
    setError('');
    
    // Handlers validation
    if (!handle.startsWith('@')) {
      setError('Handle must start with @');
      return;
    }

    const payload = {
      name,
      handle,
      platform,
      followers: parseInt(followers, 10),
      engagement_rate: parseFloat(engagement),
      category,
      status,
      avatar: avatar || undefined
    };

    try {
      await api.creators.create(payload);
      setAddModalOpen(false);
      fetchCreators();
      // Trigger premium feedback
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#71717A', '#E4E4E7', '#3F3F46']
      });
    } catch (err) {
      setError(err.message || 'Failed to add creator. Check details.');
    }
  };

  const handleEditCreator = async (e) => {
    e.preventDefault();
    setError('');

    if (!handle.startsWith('@')) {
      setError('Handle must start with @');
      return;
    }

    const payload = {
      name,
      handle,
      platform,
      followers: parseInt(followers, 10),
      engagement_rate: parseFloat(engagement),
      category,
      status,
      avatar: avatar || undefined
    };

    try {
      await api.creators.update(selectedCreator.id, payload);
      setEditModalOpen(false);
      fetchCreators();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Failed to update creator.');
    }
  };

  const handleDeleteCreator = async (id) => {
    if (window.confirm('Are you sure you want to remove this creator from your agency?')) {
      try {
        await api.creators.delete(id);
        fetchCreators();
      } catch (err) {
        console.error('Failed to delete creator:', err);
      }
    }
  };

  // Filter creators
  const filteredCreators = creators.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = platformFilter === 'All' || c.platform === platformFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white">Creators</h2>
          <p className="text-sm text-neutral-400">Manage and coordinate your agency's digital roster.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          data-testid="add-creator-btn"
          className="flex items-center justify-center gap-2 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors duration-200 px-4 py-2.5 text-sm font-semibold tracking-wide"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Creator</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-[#121212] border border-[#27272A] rounded-xl p-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, handle, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#52525B] focus:outline-none transition-colors duration-200"
          />
        </div>

        {/* Platform Dropdown */}
        <div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none transition-colors duration-200"
          >
            <option value="All">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
            <option value="Twitch">Twitch</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none transition-colors duration-200"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Break">On Break</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-[#121212] border border-[#27272A] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm text-neutral-400 italic">No creators match the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Creator</th>
                  <th className="px-6 py-4 font-medium">Platform</th>
                  <th className="px-6 py-4 font-medium">Followers</th>
                  <th className="px-6 py-4 font-medium">Engagement</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreators.map((c, index) => (
                  <tr 
                    key={c.id} 
                    className="border-b border-[#27272A] hover:bg-[#1A1A1A]/30 transition-colors duration-150 text-sm animate-fade-in-up"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={c.avatar} 
                          alt={c.name} 
                          className="h-10 w-10 rounded-lg object-cover border border-[#27272A]"
                        />
                        <div>
                          <p className="font-semibold text-white leading-tight">{c.name}</p>
                          <p className="text-xs text-neutral-500 mt-1">{c.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-medium">{c.platform}</td>
                    <td className="px-6 py-4 font-mono text-neutral-300">
                      {c.followers >= 1000000 
                        ? `${(c.followers / 1000000).toFixed(2)}M` 
                        : c.followers >= 1000 
                        ? `${(c.followers / 1000).toFixed(0)}K` 
                        : c.followers}
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-300">{c.engagement_rate}%</td>
                    <td className="px-6 py-4 text-neutral-400">{c.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${
                        c.status === 'Active' 
                          ? 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20' 
                          : 'bg-amber-500/10 text-[#F59E0B] border-amber-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          data-testid={`edit-creator-${c.id}`}
                          className="p-1.5 rounded-lg border border-[#27272A] bg-[#0A0A0A] text-neutral-400 hover:text-white hover:border-[#52525B] transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCreator(c.id)}
                          data-testid={`delete-creator-${c.id}`}
                          className="p-1.5 rounded-lg border border-[#27272A] bg-[#0A0A0A] text-neutral-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add & Edit Modal Overlay */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-[#27272A] bg-[#121212] p-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-white">
                {addModalOpen ? 'Add Roster Creator' : 'Edit Creator Profile'}
              </h3>
              <button 
                onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-[#1A1A1A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={addModalOpen ? handleAddCreator : handleEditCreator} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Evelyn Sterling"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Social Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Primary Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Twitch">Twitch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Category Roster
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Fashion, Gaming, Tech..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Audience Followers
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1200000"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Engagement Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="4.8"
                    value={engagement}
                    onChange={(e) => setEngagement(e.target.value)}
                    className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://unsplash.com/..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-sm text-white focus:border-[#52525B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Active Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                      className="accent-white"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="On Break"
                      checked={status === 'On Break'}
                      onChange={() => setStatus('On Break')}
                      className="accent-white"
                    />
                    <span>On Break</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#27272A] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
                  className="rounded-lg border border-[#27272A] text-white hover:bg-[#1A1A1A] transition-colors duration-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-creator-form-btn"
                  className="rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors duration-200 px-4 py-2.5 text-xs font-semibold"
                >
                  {addModalOpen ? 'Add Creator' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Creators;
