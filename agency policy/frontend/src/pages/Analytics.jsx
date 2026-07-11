import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-recharts-tooltip">
        <p className="text-xs font-semibold text-neutral-400 mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
            <span 
              className="inline-block h-2 w-2 rounded-full" 
              style={{ backgroundColor: item.stroke || item.fill || '#FFFFFF' }}
            />
            {item.name}: <span className="font-mono text-neutral-300">
              {typeof item.value === 'number' && item.name.includes('Revenue')
                ? `$${item.value.toLocaleString()}`
                : typeof item.value === 'number' && item.value > 100000
                ? `${(item.value / 1000000).toFixed(1)}M`
                : item.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6M');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.analytics.get();
        setData(res);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-white"></div>
      </div>
    );
  }

  const performance = data?.monthly_performance || [];
  const platforms = data?.platform_distribution || [];

  const COLORS = ['#FFFFFF', '#A1A1AA', '#71717A', '#3F3F46'];

  return (
    <div className="space-y-6">
      {/* Page Title & Time Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white">Analytics</h2>
          <p className="text-sm text-neutral-400">Detailed analytics logs and engagement metrics.</p>
        </div>
        
        {/* Time Selector */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#27272A] p-1.5 rounded-lg">
          <Calendar className="h-4 w-4 text-neutral-400 ml-1.5" />
          {['7D', '30D', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Bento Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Follower Reach Growth (Monochrome Area Chart) */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading text-base font-bold text-white">Audience Reach Expansion</h3>
            <p className="text-xs text-neutral-400">Aggregated reach distribution across months.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#71717A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  name="Audience Reach"
                  type="monotone" 
                  dataKey="reach" 
                  stroke="#FFFFFF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#areaReach)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Trend (Dotted Line Chart) */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading text-base font-bold text-white">Roster Engagement Curve</h3>
            <p className="text-xs text-neutral-400">Average interaction and feedback rate percentage.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#71717A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  name="Engagement Rate"
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#A1A1AA" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, stroke: '#121212', strokeWidth: 2, fill: '#FFFFFF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Generation (Bar Chart) */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading text-base font-bold text-white">Monthly Invoice Values</h3>
            <p className="text-xs text-neutral-400">Accumulated campaign payouts.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#71717A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  name="Agency Revenue"
                  dataKey="earnings" 
                  fill="#52525B" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audience Platform Distribution (Pie Chart) */}
        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading text-base font-bold text-white">Platform Reach Partition</h3>
            <p className="text-xs text-neutral-400">Follower share by network channel.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-64">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={platforms.filter(p => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platforms.filter(p => p.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="space-y-2.5">
              {platforms.map((platform, index) => {
                if (platform.value === 0) return null;
                return (
                  <div key={platform.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <span 
                        className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold">{platform.name}</span>
                    </div>
                    <span className="font-mono text-neutral-500">
                      {(platform.value / 1000000).toFixed(2)}M
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
