'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getEvents } from '@/lib/api';

interface AnalyticsData {
  totalEvents: number;
  totalAttendance: number;
  avgTurnoutRate: number;
  engagementScore: number;
  attendanceTrend: { month: string; attendance: number }[];
  categoryPerformance: { name: string; value: number }[];
  topEvents: { name: string; value: number }[];
}

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalEvents: 0,
    totalAttendance: 0,
    avgTurnoutRate: 0,
    engagementScore: 0,
    attendanceTrend: [],
    categoryPerformance: [],
    topEvents: [],
  });

  const calculateAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await getEvents();
      const apiEvents = response.data || [];
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      const allEvents = [...apiEvents];
      const existingIds = new Set(allEvents.map((e: any) => e.id));
      storedEvents.forEach((e: any) => { if (!existingIds.has(e.id)) allEvents.push(e); });

      const totalEvents = allEvents.length;
      const totalAttendance = allEvents.reduce((acc, curr) => acc + (curr.current_attendees || 0), 0);
      const totalCapacity = allEvents.reduce((acc, curr) => acc + (curr.max_capacity || 100), 0);
      const avgTurnoutRate = totalCapacity > 0 ? Math.round((totalAttendance / totalCapacity) * 100) : 0;

      // Category breakdown
      const categories: Record<string, number> = {};
      allEvents.forEach(e => { categories[e.category] = (categories[e.category] || 0) + 1; });
      const categoryPerformance = Object.entries(categories).map(([name, value]) => ({ name, value }));

      // Top Events
      const topEvents = [...allEvents]
        .sort((a,b) => (b.current_attendees || 0) - (a.current_attendees || 0))
        .slice(0, 5)
        .map(e => ({ name: e.title, value: e.current_attendees }));

      // Trend (Mocking historical data based on current total)
      const attendanceTrend = [
        { month: 'Jan', attendance: totalAttendance * 0.4 },
        { month: 'Feb', attendance: totalAttendance * 0.6 },
        { month: 'Mar', attendance: totalAttendance * 0.8 },
        { month: 'Apr', attendance: totalAttendance },
      ];

      setData({
        totalEvents,
        totalAttendance,
        avgTurnoutRate,
        engagementScore: 88,
        attendanceTrend,
        categoryPerformance,
        topEvents,
      });
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    calculateAnalytics();
    window.addEventListener('storage', calculateAnalytics);
    return () => window.removeEventListener('storage', calculateAnalytics);
  }, []);

  const COLORS = ['#a78bfa', '#6366f1', '#d946ef', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-10 animate-soft-fade pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center">
             Intelligence Hub
             <Activity className="w-8 h-8 ml-3 text-primary animate-pulse" />
          </h1>
          <p className="text-[#8e8e93] font-bold text-sm uppercase tracking-[0.2em] mt-1">
            Predictive Analytics & Community Metrics
          </p>
        </div>
        <button
          onClick={calculateAnalytics}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8e8e93] hover:text-white transition-all flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Synchronize Data</span>
        </button>
      </div>

      {/* Grid Layout inspired by the 3rd image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Key Metrics */}
        <div className="lg:col-span-4 space-y-8">
          <div className="premium-card p-10 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <TrendingUp className="w-8 h-8 text-primary mb-6" />
            <div className="text-5xl font-black text-white mb-2">{data.engagementScore}%</div>
            <p className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest">Global Engagement Yield</p>
            <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-primary" style={{ width: `${data.engagementScore}%` }} />
            </div>
          </div>

          <div className="premium-card p-10 bg-white/5 border-white/5">
            <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-widest mb-8">Node Distribution</h3>
            <div className="h-[250px] w-full">
              {data.categoryPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryPerformance}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {data.categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', background: '#0d0d12', border: 'none', fontSize: '10px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8e8e93]">
                  <p className="text-xs font-bold uppercase tracking-widest">No category data available</p>
                </div>
              )}
            </div>
            <div className="mt-8 space-y-3">
               {data.categoryPerformance.map((cat, idx) => (
                 <div key={idx} className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                     <span className="text-xs font-bold text-white/70">{cat.name}</span>
                   </div>
                   <span className="text-xs font-black text-white">{cat.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right: Detailed Intelligence */}
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card p-10 bg-black/40 border-white/10">
            <h3 className="text-xl font-black text-white tracking-tighter mb-10">Temporal Growth Trajectory</h3>
            <div className="h-[350px] w-full">
              {data.attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.attendanceTrend}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#4a5568" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <YAxis stroke="#4a5568" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d0d12', borderRadius: '1rem', border: 'none', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="attendance" stroke="#a78bfa" strokeWidth={4} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8e8e93]">
                  <p className="text-xs font-bold uppercase tracking-widest">No trend data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="premium-card p-10 bg-white/5 border-white/10">
            <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-widest mb-10">High-Performance Nodes</h3>
            <div className="space-y-6">
               {data.topEvents.length > 0 ? (
                 data.topEvents.map((event, idx) => (
                   <div key={idx} className="flex items-center justify-between group cursor-pointer">
                     <div className="flex items-center space-x-6">
                       <span className="text-4xl font-black text-white/5 group-hover:text-primary/20 transition-colors">{idx + 1}</span>
                       <div>
                         <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{event.name || 'Unnamed Event'}</p>
                         <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest mt-1">Authenticated Attendees</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-xl font-black text-white">{event.value || 0}</p>
                       <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Top Tier</p>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="py-10 text-center text-[#8e8e93]">
                   <p className="text-xs font-bold uppercase tracking-widest">No events to display</p>
                   <p className="text-[10px] mt-2">Create events to see analytics</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
