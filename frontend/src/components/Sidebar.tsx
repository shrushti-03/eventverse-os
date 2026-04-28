'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  BarChart3,
  QrCode,
  Settings,
  LogOut,
  Brain,
} from 'lucide-react';

type PageType = 'dashboard' | 'events' | 'create' | 'conflicts' | 'budget' | 'communication' | 'analytics' | 'checkin';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  conflictCount?: number;
}

const menuItems = [
  { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events' as PageType, label: 'Events', icon: Calendar },
  { id: 'create' as PageType, label: 'Create Event', icon: PlusCircle },
  { id: 'conflicts' as PageType, label: 'Conflict Radar', icon: AlertTriangle },
  { id: 'budget' as PageType, label: 'Budget Planner', icon: DollarSign },
  { id: 'communication' as PageType, label: 'Communication', icon: MessageSquare },
  { id: 'analytics' as PageType, label: 'Analytics', icon: BarChart3 },
  { id: 'checkin' as PageType, label: 'QR Check-in', icon: QrCode },
];

export default function Sidebar({ currentPage, onNavigate, conflictCount = 0 }: SidebarProps) {
  const [activeConflicts, setActiveConflicts] = useState(conflictCount);

  // Calculate real-time conflict count from localStorage and events
  useEffect(() => {
    const isValidDate = (date: any) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime());
    };
    
    const normalizeVenue = (v: string) => v ? v.trim().toLowerCase() : '';

    const calculateConflicts = () => {
      try {
        const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
        const resolvedConflicts = JSON.parse(localStorage.getItem('eventverse_resolved_conflicts') || '[]');
        
        let conflictCount = 0;
        const validEvents = storedEvents.filter((e: any) => e.title && e.start_datetime && isValidDate(e.start_datetime));
        
        // Venue Conflicts
        for (let i = 0; i < validEvents.length; i++) {
          for (let j = i + 1; j < validEvents.length; j++) {
            const e1 = validEvents[i];
            const e2 = validEvents[j];
            
            const v1 = normalizeVenue(e1.venue);
            const v2 = normalizeVenue(e2.venue);
            
            if (v1 === v2 && v1 && v1 !== 'virtual' && v1 !== 'online') {
              const start1 = new Date(e1.start_datetime);
              const end1 = (e1.end_datetime && isValidDate(e1.end_datetime)) 
                ? new Date(e1.end_datetime) 
                : new Date(start1.getTime() + 2 * 60 * 60 * 1000);
                
              const start2 = new Date(e2.start_datetime);
              const end2 = (e2.end_datetime && isValidDate(e2.end_datetime)) 
                ? new Date(e2.end_datetime) 
                : new Date(start2.getTime() + 2 * 60 * 60 * 1000);
              
              if (start1 < end2 && start2 < end1) {
                const key = `${e1.title}-${e2.title}`;
                const rev = `${e2.title}-${e1.title}`;
                if (!resolvedConflicts.includes(key) && !resolvedConflicts.includes(rev)) {
                  conflictCount++;
                }
              }
            }
          }
        }
        
        // Exam conflicts
        validEvents.forEach((event: any) => {
          const date = new Date(event.start_datetime);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          
          const isMid = (month === 4 && day >= 15) || (month === 5 && day <= 5);
          const isEnd = (month === 11 && day >= 20) || (month === 12 && day <= 15);
          
          if (isMid) {
            if (!resolvedConflicts.includes(`${event.title}-Mid-Semester Exams`)) conflictCount++;
          }
          if (isEnd) {
            if (!resolvedConflicts.includes(`${event.title}-End-Semester Exams`)) conflictCount++;
          }
        });
        
        setActiveConflicts(conflictCount);
      } catch (error) {
        setActiveConflicts(0);
      }
    };

    calculateConflicts();
    
    // Listen for storage changes
    const handleStorageChange = () => calculateConflicts();
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes every 2 seconds
    const interval = setInterval(calculateConflicts, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 sidebar-bg text-white flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-10">
        <div className="flex items-center space-x-4 mb-3">
          <div className="p-3 bg-primary/10 rounded-2xl animate-pulse-slow border border-primary/20">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter text-white">
              EVENTVERSE
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-1">
          <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8e8e93] font-black">
            AI CONTROL ROOM
          </p>
        </div>
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative ${
                isActive
                  ? 'nav-item-active'
                  : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`transition-all duration-500 ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-110 group-hover:text-white'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-bold tracking-tight transition-colors ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(167,139,250,0.8)]" />
              )}

              {item.id === 'conflicts' && activeConflicts > 0 && (
                <div className="ml-auto px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-black text-red-400 animate-pulse">
                  {activeConflicts} ALERT
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Intelligence */}
      <div className="p-6">
        <div className="premium-card p-5 bg-white/5 border-white/10 group">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-all">
                <span className="font-black text-primary text-sm">AD</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0d0d12]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate tracking-tight">Admin Terminal</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Root Access</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button className="w-full flex items-center justify-start space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white transition-all group">
              <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              <span className="text-xs font-bold">System Configuration</span>
            </button>
            <button className="w-full flex items-center justify-start space-x-3 p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-400 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold">Terminate Session</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
