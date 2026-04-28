'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  ArrowUpRight,
  Zap,
  Loader2,
  Target,
  Brain,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getEvents } from '@/lib/api';

type PageType = 'dashboard' | 'events' | 'create' | 'conflicts' | 'budget' | 'communication' | 'analytics' | 'checkin';

interface DashboardProps {
  onNavigate: (page: PageType) => void;
}

interface DashboardStats {
  totalEvents: number;
  totalAttendees: number;
  avgTurnoutRate: number;
  activeConflicts: number;
  engagementScore: number;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalAttendees: 0,
    avgTurnoutRate: 0,
    activeConflicts: 0,
    engagementScore: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const response = await getEvents();
      const apiEvents = response.data || [];
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      const allEvents = [...apiEvents];
      const existingIds = new Set(allEvents.map((e: any) => e.id));
      storedEvents.forEach((e: any) => { if (!existingIds.has(e.id)) allEvents.push(e); });

      // Calculate Stats
      const totalEvents = allEvents.length;
      const totalAttendees = allEvents.reduce((acc: number, curr: any) => acc + (curr.current_attendees || 0), 0);
      const avgTurnoutRate = totalEvents > 0 ? Math.round((totalAttendees / allEvents.reduce((acc: number, curr: any) => acc + (curr.max_capacity || 100), 0)) * 100) : 0;
      
      setStats({
        totalEvents,
        totalAttendees,
        avgTurnoutRate,
        activeConflicts: JSON.parse(localStorage.getItem('eventverse_active_conflicts') || '0'),
        engagementScore: 85, // Meta heuristic for demo
      });

      // Upcoming (sorted)
      const sorted = allEvents
        .filter(e => new Date(e.start_datetime) > new Date())
        .sort((a,b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
        .slice(0, 4);
      setUpcomingEvents(sorted);

      // Chart Data (Mocking growth curve from real total)
      const mockCurve = [
        { name: '08:00', value: totalAttendees * 0.2 },
        { name: '10:00', value: totalAttendees * 0.4 },
        { name: '12:00', value: totalAttendees * 0.7 },
        { name: '14:00', value: totalAttendees * 0.9 },
        { name: '16:00', value: totalAttendees },
      ];
      setChartData(mockCurve);

    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    const interval = setInterval(loadData, 5000);
    return () => {
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Synchronizing Neural Core</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-soft-fade pb-20">
      {/* Premium Pinterest-style Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="premium-card p-10 bg-gradient-to-br from-primary/20 to-transparent border-primary/30 group hover:shadow-[0_0_50px_rgba(167,139,250,0.15)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-100">Temporal Nodes</span>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="text-6xl font-black text-white tracking-tighter drop-shadow-sm">{stats.totalEvents}</div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-3">Active Pipeline</p>
        </div>

        <div className="premium-card p-10 bg-white/5 border-white/10 group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Ingress Yield</span>
            <Users className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </div>
          <div className="text-6xl font-black text-white tracking-tighter drop-shadow-sm">{stats.totalAttendees}</div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-3">Authenticated</p>
        </div>

        <div className="premium-card p-10 bg-white/5 border-white/10 group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Saturation</span>
            <Target className="w-5 h-5 text-white/50 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-6xl font-black text-white tracking-tighter drop-shadow-sm">{stats.avgTurnoutRate}%</div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-3">Capacity Use</p>
        </div>

        <div className="premium-card p-10 bg-white/5 border-white/10 group relative overflow-hidden transition-all">
          <div className="absolute inset-0 bg-primary/10 opacity-20 blur-3xl" />
          <div className="relative z-10 text-center flex flex-col justify-center h-full">
            <div className="flex items-center justify-center mb-1">
              <Brain className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="text-6xl font-black text-white tracking-tighter mb-1">94%</div>
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.5em] text-center">Neural Health</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Intelligence Panel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card p-10 bg-black/40 border-white/10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Engagement Telemetry</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Real-time audience saturation curve</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8e8e93]">Day</button>
                <button className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">Live</button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#4a5568" 
                    fontSize={10} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#4a5568" 
                    fontSize={10} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#16161c', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '1rem',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#a78bfa" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="premium-card p-10 bg-white/5 border-white/10 group">
              <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-[0.2em] mb-8">Quick Entry Point</h3>
              <button 
                onClick={() => onNavigate('create')}
                className="w-full h-32 rounded-3xl bg-primary/5 hover:bg-primary/10 border-2 border-dashed border-primary/20 hover:border-primary/40 flex flex-col items-center justify-center transition-all group"
              >
                <div className="p-3 bg-primary/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deploy New Event Node</span>
              </button>
            </div>

            <div className="premium-card p-10 bg-white/5 border-white/10">
              <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-[0.2em] mb-8">System Health Status</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-tight">API Infrastructure</span>
                  <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[9px] font-black uppercase">NOMINAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-tight">Latency Yield</span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] font-black uppercase">12MS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8e8e93] tracking-tight">Neural Sync</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#8e8e93] text-[9px] font-black uppercase">Standby</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Temporal Sequence (Upcoming) */}
        <div className="lg:col-span-4">
          <div className="premium-card h-full bg-[#0d0d12] flex flex-col border-white/10">
            <div className="p-10 border-b border-white/5">
              <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-[0.3em]">Temporal Flow</h3>
              <p className="text-[10px] font-black text-primary uppercase mt-1">Upcoming scheduled nodes</p>
            </div>
            
            <div className="flex-1 p-8 space-y-6">
              {upcomingEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <Clock className="w-10 h-10 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Temporal Stream Empty</p>
                </div>
              ) : (
                upcomingEvents.map((event, idx) => (
                  <div 
                    key={event.id} 
                    className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
                    onClick={() => onNavigate('events')}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">{new Date(event.start_datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <ArrowUpRight className="w-4 h-4 text-[#8e8e93] group-hover:text-primary transition-colors" />
                    </div>
                    <h4 className="text-sm font-black text-white mb-2 line-clamp-1">{event.title}</h4>
                    <div className="flex items-center text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest">
                       <MapPin className="w-3 h-3 mr-2" />
                       {event.venue}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-10">
               <button 
                onClick={() => onNavigate('events')}
                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-[#8e8e93] hover:text-white transition-all border border-white/5"
               >
                 Review All Nodes
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
