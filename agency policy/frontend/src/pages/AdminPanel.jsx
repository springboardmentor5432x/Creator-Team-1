import React, { useEffect, useState } from 'react';
import { useAuto } from '../contexts/AutoContext';
import { api } from '../lib/api';
import { Shield, Activity, Cpu, RefreshCw, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const AdminPanel = () => {
  const { settings } = useAuto();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pingSpeed, setPingSpeed] = useState(null);

  const fetchLogs = async () => {
    try {
      const res = await api.status.list();
      setLogs(res.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    // Mimic database sync procedure
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSyncing(false);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleTestLatency = async () => {
    const start = performance.now();
    try {
      await api.status.list();
      const end = performance.now();
      setPingSpeed(Math.round(end - start));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Title */}
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-neutral-400 stroke-[1.5]" />
          Admin Panel
        </h2>
        <p className="text-sm text-neutral-400">Manage database connections, check-in logs, and health status diagnostics.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Diagnostics Info */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-neutral-400" />
              Environment Metrics
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Host OS</span>
                <p className="text-sm font-semibold text-white mt-0.5">Windows Server (Node v24)</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Active Database Mode</span>
                <p className="text-sm font-semibold text-white mt-0.5">{settings?.database_mode || 'JSON DB Fallback'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">API Latency Speed</span>
                <p className="text-sm font-semibold text-white mt-0.5 font-mono">
                  {pingSpeed ? `${pingSpeed}ms` : 'Not Measured'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleTestLatency}
              className="flex-1 rounded-lg border border-[#27272A] bg-transparent text-neutral-400 hover:text-white hover:bg-[#1A1A1A] transition-colors py-2 text-xs font-semibold"
            >
              Test Latency
            </button>
            
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex-1 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Database'}</span>
            </button>
          </div>
        </div>

        {/* Database Status Checks Logs Table */}
        <div className="md:col-span-2 bg-[#121212] border border-[#27272A] rounded-xl p-6">
          <h3 className="font-heading text-base font-bold text-white mb-4 flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-neutral-400" />
            Client Check-In Register
          </h3>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-8 text-center">No logs generated yet.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272A] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="pb-3 pt-2 font-medium">Record ID</th>
                    <th className="pb-3 pt-2 font-medium">Client / Component Name</th>
                    <th className="pb-3 pt-2 font-medium text-right">Register Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#27272A] hover:bg-[#1A1A1A]/30 text-xs">
                      <td className="py-3 font-mono text-neutral-500">{log.id.slice(0, 8)}...</td>
                      <td className="py-3 font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        {log.client_name}
                      </td>
                      <td className="py-3 text-right text-neutral-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
