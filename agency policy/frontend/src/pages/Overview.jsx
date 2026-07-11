import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import KpiCard from '../components/KpiCard';
import { 
  Users, 
  Percent, 
  Briefcase, 
  DollarSign, 
  Activity, 
  TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-recharts-tooltip">
        <p className="text-xs font-semibold text-neutral-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">
          Reach: <span className="font-mono text-neutral-300">{(payload[0].value / 1000000).toFixed(1)}M</span>
        </p>
        <p className="text-sm font-bold text-white mt-0.5">
          Revenue: <span className="font-mono text-neutral-300">${payload[1].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

const Overview = () => {
  const [data, setData] = useState(null);
  const [creators, setCreators] = useState([]);
  const [statusInput, setStatusInput] = useState('');
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsRes = await api.analytics.get();
        setData(analyticsRes);

        const creatorsRes = await api.creators.list();
        // Sort by followers desc for top performing
        const sorted = [...creatorsRes].sort((a, b) => b.followers - a.followers).slice(0, 3);
        setCreators(sorted);

        const logs = await api.status.list();
        // Sort logs by timestamp desc
        const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 4);
        setStatusLogs(sortedLogs);
      } catch (err) {
        console.error('Failed to load overview analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusInput.trim()) return;
    setSubmittingStatus(true);
    try {
      await api.status.create(statusInput);
      setStatusInput('');
      const logs = await api.status.list();
      const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 4);
      setStatusLogs(sortedLogs);
    } catch (err) {
      console.error('Error logging client check:', err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_followers: 0,
    engagement_rate: 0,
    active_campaigns: 0,
    monthly_reach: 0,
    monthly_revenue: 0
  };

  const chartData = data?.monthly_performance || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white">Overview</h2>
        <p className="text-sm text-neutral-400">Real-time performance and system status logs.</p>
      </div>

      {/* Bento Grid KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Agency Reach"
          value={(kpis.total_followers / 1000000).toFixed(2) + 'M'}
          icon={Users}
          change={12.4}
          changeType="positive"
          subtext="vs last month"
        />
        <KpiCard
          title="Avg. Engagement Rate"
          value={kpis.engagement_rate + '%'}
          icon={Percent}
          change={0.8}
          changeType="positive"
          subtext="vs last month"
        />
        <KpiCard
          title="Active Campaigns"
          value={kpis.active_campaigns}
          icon={Briefcase}
          change={5.1}
          changeType="positive"
          subtext="vs last month"
        />
        <KpiCard
          title="Monthly Revenue"
          value={'$' + kpis.monthly_revenue.toLocaleString()}
          icon={DollarSign}
          change={18.2}
          changeType="positive"
          subtext="vs last month"
        />
      </div>

      {/* High Density Bento Grid Layout Part 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Analytics Sparkline Chart */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-white">Monthly Analytics</h3>
              <p className="text-xs text-neutral-400">Reach expansion & agency earnings growth.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] bg-emerald-500/10 px-2 py-1 rounded">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Scale-Up Active</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#71717A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#71717A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000000 ? `${val / 1000000}M` : val}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="reach" 
                  stroke="#FFFFFF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorReach)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#71717A" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorEarnings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Logs panel */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-white mb-1">System Health Logs</h3>
            <p className="text-xs text-neutral-400 mb-4">Record database check-ins and test connectivity.</p>
            
            <form onSubmit={handleStatusSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                data-testid="status-client-input"
                placeholder="Client/Service name..."
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="flex-1 rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#52525B] focus:outline-none transition-colors duration-200"
              />
              <button
                type="submit"
                disabled={submittingStatus}
                data-testid="status-submit-btn"
                className="rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors duration-200 px-3 py-2 text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {submittingStatus ? 'Logging...' : 'Log'}
              </button>
            </form>

            <div className="space-y-3">
              {statusLogs.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-4 text-center">No logs generated yet.</p>
              ) : (
                statusLogs.map((log, index) => (
                  <div key={log.id || index} className="flex items-start gap-3 rounded-lg border border-[#27272A] bg-[#0A0A0A] p-2.5 animate-fade-in-up">
                    <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1">
                      <Activity className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{log.client_name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Creators Table Section */}
      <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-white">Top Performing Creators</h3>
            <p className="text-xs text-neutral-400">High engagement rates and audience metrics.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272A] text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="pb-3 pt-2 font-medium">Creator</th>
                <th className="pb-3 pt-2 font-medium">Platform</th>
                <th className="pb-3 pt-2 font-medium">Followers</th>
                <th className="pb-3 pt-2 font-medium">Engagement</th>
                <th className="pb-3 pt-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c, index) => (
                <tr 
                  key={c.id || index} 
                  className="border-b border-[#27272A] hover:bg-[#1A1A1A]/30 transition-colors duration-150 text-sm animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 75}ms` }}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={c.avatar} 
                        alt={c.name} 
                        className="h-9 w-9 rounded-lg object-cover border border-[#27272A]"
                      />
                      <div>
                        <p className="font-semibold text-white leading-tight">{c.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{c.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-neutral-300 font-medium">{c.platform}</td>
                  <td className="py-3 font-mono text-neutral-300">
                    {c.followers >= 1000000 
                      ? `${(c.followers / 1000000).toFixed(1)}M` 
                      : c.followers.toLocaleString()}
                  </td>
                  <td className="py-3 font-mono text-neutral-300">{c.engagement_rate}%</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded bg-[#1A1A1A] px-2 py-0.5 text-xs font-medium text-neutral-300 border border-[#27272A]">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
