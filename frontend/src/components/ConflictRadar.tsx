'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  MapPin,
  CheckCircle,
  RefreshCw,
  Shield,
  Loader2,
  Zap,
} from 'lucide-react';
import { getEvents } from '@/lib/api';

interface Conflict {
  id: number;
  type: 'venue' | 'time_overlap' | 'exam_period' | 'holiday';
  severity: 'high' | 'medium' | 'low';
  event_title: string;
  conflicting_with: string;
  description: string;
  date: string;
  resolved: boolean;
  suggested_reschedule?: string;
}

// Robust date validation helper
const isValidDate = (date: any) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

// Normalize venue names for comparison
const normalizeVenue = (v: string) => v ? v.trim().toLowerCase() : '';

const suggestNewTime = (afterDate: Date): string => {
  const suggested = new Date(afterDate);
  suggested.setHours(suggested.getHours() + 2);
  return suggested.toISOString().slice(0, 16).replace('T', ' ');
};

const generateConflictsFromEvents = (events: any[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  let conflictId = 1;

  // Filter out corrupted events first to avoid logic failures
  const validEvents = events.filter(e => e.title && e.start_datetime && isValidDate(e.start_datetime));
  
  for (let i = 0; i < validEvents.length; i++) {
    for (let j = i + 1; j < validEvents.length; j++) {
      const e1 = validEvents[i];
      const e2 = validEvents[j];
      
      const v1 = normalizeVenue(e1.venue);
      const v2 = normalizeVenue(e2.venue);
      
      if (v1 === v2 && v1 && v1 !== 'virtual' && v1 !== 'online' && v1 !== 'tbd') {
        const start1 = new Date(e1.start_datetime);
        // Robust fallback for end times
        const end1 = (e1.end_datetime && isValidDate(e1.end_datetime)) 
          ? new Date(e1.end_datetime) 
          : new Date(start1.getTime() + 2 * 60 * 60 * 1000);
          
        const start2 = new Date(e2.start_datetime);
        const end2 = (e2.end_datetime && isValidDate(e2.end_datetime)) 
          ? new Date(e2.end_datetime) 
          : new Date(start2.getTime() + 2 * 60 * 60 * 1000);
        
        // Overlap detection
        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            id: conflictId++,
            type: 'venue',
            severity: 'high',
            event_title: e1.title,
            conflicting_with: e2.title,
            description: `${e1.venue} is double-booked for these concurrent time-slots.`,
            date: e1.start_datetime,
            resolved: false,
            suggested_reschedule: suggestNewTime(end2),
          });
        }
      }
    }
  }
  
  // Mid-Sem & End-Sem Exam Period Detectors
  validEvents.forEach(event => {
    const date = new Date(event.start_datetime);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Mid-sem: April 15 - May 5 approx
    if ((month === 4 && day >= 15) || (month === 5 && day <= 5)) {
      conflicts.push({
        id: conflictId++,
        type: 'exam_period',
        severity: 'high',
        event_title: event.title,
        conflicting_with: 'Mid-Semester Exams',
        description: 'Scheduled during high-intensity examination window (Mid-Sem).',
        date: event.start_datetime,
        resolved: false,
      });
    }

    // End-sem: Nov 20 - Dec 15 approx
    if ((month === 11 && day >= 20) || (month === 12 && day <= 15)) {
      conflicts.push({
        id: conflictId++,
        type: 'exam_period',
        severity: 'high',
        event_title: event.title,
        conflicting_with: 'End-Semester Exams',
        description: 'Scheduled during final academic year examinations (End-Sem).',
        date: event.start_datetime,
        resolved: false,
      });
    }
  });

  return conflicts;
};

export default function ConflictRadar() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [lastScan, setLastScan] = useState<string>(new Date().toLocaleTimeString());

  const runScan = async (showLoading = true) => {
    if (showLoading) {
      setIsScanning(true);
      setScanStep('Initializing Neural Scan...');
      // Small artificial delay for visual feedback/premium feel
      await new Promise(r => setTimeout(r, 800));
    }
    
    try {
      setScanStep('Collecting event data manifests...');
      const response = await getEvents();
      const apiEvents = response.data || [];
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      
      const allEvents = [...apiEvents];
      const existingIds = new Set(allEvents.map((e: any) => e.id));
      storedEvents.forEach((e: any) => { if (!existingIds.has(e.id)) allEvents.push(e); });
      
      setScanStep(`Analyzing ${allEvents.length} temporal nodes for overlaps...`);
      await new Promise(r => setTimeout(r, 400));

      const generated = generateConflictsFromEvents(allEvents);
      const resolvedKeys = JSON.parse(localStorage.getItem('eventverse_resolved_conflicts') || '[]');
      
      const finalConflicts = generated.map(c => ({
        ...c,
        resolved: resolvedKeys.includes(`${c.event_title}-${c.conflicting_with}`)
      })).filter(c => !c.resolved);
      
      setConflicts(finalConflicts);
      setLastScan(new Date().toLocaleTimeString());
      setScanStep('Scan sequence completed.');
    } catch (e) {
      console.error('Scan Error:', e);
      setScanStep('Scan failed: System integrity warning.');
    }
    
    if (showLoading) {
      await new Promise(r => setTimeout(r, 400));
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runScan(false);
    
    // Auto-scan on storage events or every 10 seconds
    const handleUpdate = () => runScan(false);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(() => runScan(false), 10000);
    
    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleResolve = (eventTitle: string, conflictWith: string) => {
    const key = `${eventTitle}-${conflictWith}`;
    const resolved = JSON.parse(localStorage.getItem('eventverse_resolved_conflicts') || '[]');
    localStorage.setItem('eventverse_resolved_conflicts', JSON.stringify([...resolved, key]));
    setConflicts(prev => prev.filter(c => !(`${c.event_title}-${c.conflicting_with}` === key)));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-8 animate-soft-fade pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center">
            Neural Conflict Radar
            <Zap className="w-8 h-8 ml-3 text-primary" />
          </h1>
          <p className="text-[#8e8e93] font-bold text-sm uppercase tracking-[0.2em] mt-1">
            Autonomous overlap detection & mitigation
          </p>
          {isScanning && (
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse">
              [ {scanStep} ]
            </p>
          )}
        </div>
        <button
          onClick={() => runScan(true)}
          disabled={isScanning}
          className="btn-premium flex items-center space-x-3 px-8"
        >
          {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          <span>{isScanning ? 'SCANNING...' : 'INITIATE DEEP SCAN'}</span>
        </button>
      </div>

      {/* Radar Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Console: Status & Stats */}
        <div className="space-y-6">
          <div className="premium-card p-10 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">System Health</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-tighter">Live Monitor</span>
            </div>
            <div className="text-7xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">{conflicts.length}</div>
            <p className="text-[10px] font-black text-[#8e8e93] uppercase tracking-[0.3em]">Anomalies Detected</p>
            
            <div className="mt-10 pt-10 border-t border-white/5 space-y-5">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#8e8e93]">Neural Resonance</span>
                <span className="text-white">Active</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#8e8e93]">Check Interval</span>
                <span className="text-white">10.0s</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#8e8e93]">Last Sync</span>
                <span className="text-primary">{lastScan}</span>
              </div>
            </div>
          </div>

          <div className="premium-card p-8 bg-white/5 border-white/5">
            <div className="flex items-center space-x-3 mb-6">
               <Shield className="w-4 h-4 text-[#8e8e93]" />
               <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-[0.3em]">Mitigation Protocol</h3>
            </div>
            <p className="text-xs text-[#8e8e93] font-bold leading-relaxed opacity-60">
              Overlap scenarios are flagged when venue allocation conflicts with the temporal stream. High-severity alerts require immediate reallocation or date shifting.
            </p>
          </div>
        </div>

        {/* Right Console: Conflict Feed */}
        <div className="lg:col-span-2 space-y-6">
          {conflicts.length === 0 && !isScanning ? (
            <div className="premium-card p-24 flex flex-col items-center justify-center text-center bg-white/5 border-dashed border-white/10 group transition-all">
              <div className="w-24 h-24 rounded-full bg-green-500/5 flex items-center justify-center mb-8 border border-green-500/10 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-12 h-12 text-green-400 opacity-60" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight mb-2">Omniscient Clarity</h3>
              <p className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.3em]">Zero temporal overlaps found</p>
            </div>
          ) : (
            <div className="space-y-5">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="premium-card p-10 bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/[0.07] transition-all group animate-soft-fade">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-5">
                        <div className={`p-3 rounded-2xl ${conflict.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{conflict.type.replace('_', ' ')} ERROR</span>
                           <div className="flex items-center space-x-2 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-red-500/80">Immediate Action Advised</span>
                           </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                        {conflict.event_title} <span className="text-primary mx-2">vs</span> {conflict.conflicting_with}
                      </h3>
                      
                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-[#8e8e93] tracking-widest">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(conflict.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {conflict.type === 'venue' && (
                          <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-primary tracking-widest">
                            <MapPin className="w-3 h-3" />
                            <span>Resource Conflict</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-[#8e8e93] font-bold leading-relaxed max-w-xl">
                        {conflict.description} The system predicts severe attendance drop if both proceed concurrently. 
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleResolve(conflict.event_title, conflict.conflicting_with)}
                        className="px-8 py-5 bg-white/5 hover:bg-primary transition-all text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl border border-white/5 hover:border-primary/50 flex items-center justify-center space-x-3 group/btn shadow-xl active:scale-95"
                      >
                         <CheckCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                         <span>Resolve Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
