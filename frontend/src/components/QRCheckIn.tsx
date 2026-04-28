'use client';

import { useState, useEffect } from 'react';
import {
  QrCode,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { getEvents } from '@/lib/api';
import QRCode from 'qrcode';

interface Event {
  id: number;
  title: string;
  venue: string;
  start_datetime: string;
  end_datetime: string;
  current_attendees: number;
  max_capacity: number;
}

interface CheckinRecord {
  id: number;
  name: string;
  time: string;
  status: 'success' | 'fraud';
  reason?: string;
}

export default function QRCheckIn() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
    fraudDetected?: boolean;
    fraudReason?: string;
  } | null>(null);
  
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const fetchEvents = async () => {
    try {
      const response = await getEvents();
      const apiEvents = response.data || [];
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      
      const allEvents = [...apiEvents];
      const existingIds = new Set(allEvents.map((e: any) => e.id));
      storedEvents.forEach((e: any) => { if (!existingIds.has(e.id)) allEvents.push(e); });
      
      setEvents(allEvents);
      if (allEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(allEvents[0].id);
      }
    } catch (error) {
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      setEvents(storedEvents);
      if (storedEvents.length > 0 && !selectedEventId) setSelectedEventId(storedEvents[0].id);
    }
  };

  useEffect(() => {
    fetchEvents();
    window.addEventListener('storage', fetchEvents);
    return () => window.removeEventListener('storage', fetchEvents);
  }, []);

  useEffect(() => {
    if (selectedEventId) generateQRCode(selectedEventId);
  }, [selectedEventId]);

  const generateQRCode = async (eventId: number) => {
    try {
      const qrData = JSON.stringify({ type: 'eventverse_checkin', event_id: eventId, ts: Date.now() });
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 1,
        color: { dark: '#a78bfa', light: '#0d0d12' },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (e) {}
  };

  const handleSimulateScan = async () => {
    if (!selectedEventId) return;
    setIsScanning(true);
    setScanResult(null);

    // Simulate neural processing
    await new Promise(r => setTimeout(r, 1500));

    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    // Actual functionality: Update local state & localStorage
    const isFraud = Math.random() < 0.1; // 10% chance for simulation
    
    if (isFraud) {
      setScanResult({
        success: false,
        message: 'Security Alert: Biometric Mismatch',
        fraudDetected: true,
        fraudReason: 'Multiple check-in attempts from blocked MAC address.',
      });
      addRecord('Anonymous User', 'fraud', 'Duplicate MAC Address');
    } else {
      const userName = `Candidate #${Math.floor(Math.random() * 9000) + 1000}`;
      
      // Update data
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      const updatedStored = storedEvents.map((e: any) => {
        if (e.id === selectedEventId) {
          return { ...e, current_attendees: (e.current_attendees || 0) + 1 };
        }
        return e;
      });
      localStorage.setItem('eventverse_events', JSON.stringify(updatedStored));
      
      setScanResult({
        success: true,
        message: 'Check-in Validated',
        userName,
      });
      addRecord(userName, 'success');
      
      // Trigger update
      window.dispatchEvent(new Event('storage'));
    }
    
    setIsScanning(false);
  };

  const addRecord = (name: string, status: 'success' | 'fraud', reason?: string) => {
    const newRecord: CheckinRecord = {
      id: Date.now(),
      name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status,
      reason,
    };
    setRecentCheckins(prev => [newRecord, ...prev.slice(0, 5)]);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-8 animate-soft-fade">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center">
             Biometric Guard
             <Fingerprint className="w-8 h-8 ml-3 text-primary" />
          </h1>
          <p className="text-[#8e8e93] font-bold text-sm uppercase tracking-[0.2em] mt-1">
            Multispectral Identity Validation Node
          </p>
        </div>
        <div className="relative group min-w-[300px]">
          <select 
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-primary/40 appearance-none cursor-pointer font-bold text-sm"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id} className="bg-[#0d0d12]">{e.title}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Scanner Module */}
        <div className="lg:col-span-8 space-y-8">
          <div className="premium-card p-10 bg-black/40 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
               <QrCode className="w-64 h-64 text-primary" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="aspect-square bg-white rounded-3xl p-6 shadow-[0_0_50px_rgba(167,139,250,0.15)] flex items-center justify-center border-4 border-primary/20">
                   {qrCodeDataUrl ? (
                     <img src={qrCodeDataUrl} alt="Event QR" className="w-full h-full" />
                   ) : (
                     <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl" />
                   )}
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8e8e93] hover:text-white transition-all">
                    Export Asset
                  </button>
                  <button className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8e8e93] hover:text-white transition-all">
                    Terminal Log
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">{selectedEvent?.title || 'Operational Target'}</h3>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">{selectedEvent?.venue}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#8e8e93]">
                    <span>Secure Validation Pulse</span>
                    <span className="text-green-400">Optimal</span>
                  </div>
                  <button 
                    onClick={handleSimulateScan}
                    disabled={isScanning}
                    className="w-full btn-premium py-5 flex items-center justify-center space-x-3 group"
                  >
                    {isScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span>{isScanning ? 'PROCESSING...' : 'INITIALIZE OPTICAL VALIDATION'}</span>
                  </button>
                </div>

                {scanResult && (
                  <div className={`p-6 rounded-2xl animate-soft-fade border ${
                    scanResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    <div className="flex items-center space-x-4">
                      {scanResult.success ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest">{scanResult.message}</p>
                        <p className="text-xs font-bold text-white/70 mt-1">ID: {scanResult.userName || 'Unknown Entity'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="premium-card p-8 bg-white/5">
               <p className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest mb-2">Authenticated</p>
               <h4 className="text-3xl font-black text-white">{selectedEvent?.current_attendees || 0}</h4>
            </div>
            <div className="premium-card p-8 bg-white/5">
               <p className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest mb-2">Max Threshold</p>
               <h4 className="text-3xl font-black text-white">{selectedEvent?.max_capacity || 0}</h4>
            </div>
            <div className="premium-card p-8 bg-white/5 flex items-end">
               <div className="w-full">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span>Saturation</span>
                   <span className="text-primary">{Math.round(((selectedEvent?.current_attendees || 0) / (selectedEvent?.max_capacity || 1)) * 100)}%</span>
                 </div>
                 <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${((selectedEvent?.current_attendees || 0) / (selectedEvent?.max_capacity || 1)) * 100}%` }} />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Temporal Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="premium-card h-full bg-[#0d0d12] flex flex-col">
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xs font-black text-[#8e8e93] uppercase tracking-widest">Ingress Telemetry</h3>
            </div>
            
            <div className="flex-1 p-6 space-y-4">
              {recentCheckins.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <Clock className="w-8 h-8 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Waiting for ingress...</p>
                </div>
              ) : (
                recentCheckins.map(record => (
                  <div key={record.id} className="p-4 rounded-xl bg-white/5 border border-white/5 animate-soft-fade">
                    <div className="flex items-center justify-between mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${record.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                         {record.status}
                       </span>
                       <span className="text-[10px] font-bold text-[#8e8e93]">{record.time}</span>
                    </div>
                    <p className="text-sm font-black text-white">{record.name}</p>
                    {record.reason && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">{record.reason}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="p-8 bg-primary/5 border-t border-primary/10">
               <div className="flex items-center space-x-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Sync Operational</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
