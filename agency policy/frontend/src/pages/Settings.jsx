import React, { useEffect, useState } from 'react';
import { useAuto } from '../contexts/AutoContext';
import { api } from '../lib/api';
import { Settings as SettingsIcon, Save, Database, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

const Settings = () => {
  const { settings, setSettings } = useAuto();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency || 'USD');
      setLanguage(settings.default_language || 'en');
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await api.settings.update({
        currency,
        default_language: language
      });
      setSettings(updated);
      setSuccess('Settings updated successfully.');
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Settings
        </h2>
        <p className="text-sm text-neutral-400">Configure dashboard environment and default preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Settings form */}
        <div className="md:col-span-2 bg-[#121212] border border-[#27272A] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2.5">
              <SettingsIcon className="h-5 w-5 text-neutral-400" />
              General Preferences
            </h3>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-[#EF4444]">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-[#10B981]">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  System Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                >
                  <option value="USD">USD ($) — US Dollar</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="CHF">CHF (fr) — Swiss Franc</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Default Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#52525B] focus:outline-none"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="de">Deutsch (Switzerland/Germany)</option>
                  <option value="fr">Français (Switzerland/France)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Active Theme Strategy
              </label>
              <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A]/40 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Default Theme: Dark mode</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Luxury Swiss design defaults to Deep Obsidian to prevent eye strain.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-[#1A1A1A] px-2.5 py-1 text-xs font-semibold text-white border border-[#27272A]">
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#27272A]">
              <button
                type="submit"
                disabled={saving}
                data-testid="save-settings-btn"
                className="flex items-center gap-2 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors px-4 py-2.5 text-xs font-semibold"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Database info card */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-neutral-400" />
              Database Status
            </h3>
            
            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Engine Mode</span>
                <p className="text-sm font-semibold text-white mt-0.5">{settings?.database_mode || 'JSON DB Fallback'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Endpoint Prefix</span>
                <p className="text-sm font-semibold text-white mt-0.5 font-mono bg-[#0A0A0A] border border-[#27272A] px-2.5 py-1 rounded select-all inline-block">
                  {settings?.api_endpoint || '/api'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Storage Path</span>
                <p className="text-[10px] font-mono text-neutral-400 mt-1 break-all bg-[#0A0A0A] border border-[#27272A] p-2 rounded">
                  {settings?.database_mode?.includes('Mongo') 
                    ? 'mongodb://localhost:27017' 
                    : 'backend/db.json (Self-Contained JSON)'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mt-6 flex gap-2.5">
            <ShieldAlert className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Database Fallback</p>
              <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                If the MongoDB server selection fails at startup, the system will use local files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
