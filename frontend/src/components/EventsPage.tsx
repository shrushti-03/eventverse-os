'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  Edit,
  Trash2,
  Loader2,
  X,
  Save,
} from 'lucide-react';
import { getEvents, deleteEvent, updateEvent } from '@/lib/api';

type PageType = 'dashboard' | 'events' | 'create' | 'conflicts' | 'budget' | 'communication' | 'analytics' | 'checkin';

interface EventsPageProps {
  onNavigate: (page: PageType) => void;
}

interface Event {
  id: number;
  title: string;
  description: string;
  venue: string;
  start_datetime: string;
  end_datetime: string;
  category: string;
  status: string;
  current_attendees: number;
  max_capacity: number;
  predicted_turnout: number;
  engagement_score: number;
}

const categoryColors: Record<string, string> = {
  Technical: 'bg-blue-500',
  Cultural: 'bg-pink-500',
  Sports: 'bg-green-500',
  Workshop: 'bg-yellow-500',
  Seminar: 'bg-purple-500',
  Competition: 'bg-orange-500',
};

export default function EventsPage({ onNavigate }: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});

  // Load events
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await getEvents();
      const apiEvents = response.data || [];
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      
      const allEvents = [...apiEvents];
      const existingIds = new Set(allEvents.map((e: Event) => e.id));
      
      storedEvents.forEach((e: Event) => {
        if (!existingIds.has(e.id)) {
          allEvents.push(e);
          existingIds.add(e.id);
        }
      });
      
      setEvents(allEvents);
    } catch (error) {
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      setEvents(storedEvents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
    window.addEventListener('storage', loadEvents);
    return () => window.removeEventListener('storage', loadEvents);
  }, []);

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEvent(eventId);
    } catch (error) {}
    
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    
    const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
    const filteredStored = storedEvents.filter((e: Event) => e.id !== eventId);
    localStorage.setItem('eventverse_events', JSON.stringify(filteredStored));
    
    window.dispatchEvent(new Event('storage'));
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setEditForm(event);
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    
    try {
      // Try API update
      try {
        await updateEvent(editingEvent.id, editForm);
      } catch (e) {
        console.log('API update failed, updating local');
      }
      
      // Update local state
      const updatedEvents = events.map(e => e.id === editingEvent.id ? { ...e, ...editForm } as Event : e);
      setEvents(updatedEvents);
      
      // Update localStorage
      const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
      const updatedStored = storedEvents.map((e: Event) => e.id === editingEvent.id ? { ...e, ...editForm } : e);
      localStorage.setItem('eventverse_events', JSON.stringify(updatedStored));
      
      setEditingEvent(null);
      window.dispatchEvent(new Event('storage'));
      alert('Event updated successfully!');
    } catch (error) {
      alert('Failed to update event.');
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-soft-fade">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Events Manifest</h1>
          <p className="text-[#8e8e93] font-bold text-sm uppercase tracking-widest mt-1">
            Real-time management & optimization
          </p>
        </div>
        <button
          onClick={() => onNavigate('create')}
          className="btn-premium flex items-center space-x-2"
        >
          <Calendar className="w-5 h-5" />
          <span>INITIALIZE EVENT</span>
        </button>
      </div>

      {/* Control Panel */}
      <div className="premium-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93] group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Filter by title or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold"
            />
          </div>
          <div className="relative w-full md:w-48 group">
             <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 appearance-none text-sm font-bold text-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft Phase</option>
                <option value="published">Active Nodes</option>
                <option value="ongoing">In Progress</option>
                <option value="completed">Archive</option>
              </select>
          </div>
        </div>
        
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-[#8e8e93] hover:text-white'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-[#8e8e93] hover:text-white'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Grid Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Syncing Database</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div key={event.id} className="premium-card group hover:scale-[1.02] transition-all duration-500 bg-white/5 overflow-hidden border-white/10">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    event.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    event.status === 'draft' ? 'bg-primary/10 text-primary border-primary/20' : 
                    'bg-white/5 text-[#8e8e93] border-white/10'
                  }`}>
                    {event.status}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditClick(event)} className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-[#8e8e93] hover:text-primary hover:border-primary/20 transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="p-2.5 bg-red-500/5 rounded-xl border border-white/5 text-red-500/60 hover:text-red-400 hover:border-red-500/20 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-2 leading-tight tracking-tight group-hover:text-primary transition-colors cursor-pointer">
                  {event.title}
                </h3>
                <p className="text-sm text-[#8e8e93] font-medium leading-relaxed mb-8 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center text-sm font-bold text-slate-300">
                    <MapPin className="w-4 h-4 mr-3 text-primary" />
                    {event.venue}
                  </div>
                  <div className="flex items-center text-sm font-bold text-slate-300">
                    <Clock className="w-4 h-4 mr-3 text-primary" />
                    {new Date(event.start_datetime).toLocaleDateString()} at {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest">Growth Index</span>
                    <span className="text-xs font-black text-white">{Math.round((event.current_attendees / event.max_capacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 shadow-[0_0_15px_rgba(167,139,250,0.5)]" 
                      style={{ width: `${(event.current_attendees / event.max_capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal - Styled for Premium Theme */}
      {editingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-soft-fade">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingEvent(null)} />
          <div className="premium-card w-full max-w-2xl bg-[#0d0d12] border-white/10 relative z-10 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">Modify Node</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Critical Update Operations</p>
                </div>
                <button onClick={() => setEditingEvent(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-6 h-6 text-[#8e8e93]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest ml-1">Event Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest ml-1">Strategic Venue</label>
                    <input
                      type="text"
                      value={editForm.venue}
                      onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                      className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest ml-1">Operational Briefing</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest ml-1">Start Temporal Marker</label>
                    <input
                      type="datetime-local"
                      value={editForm.start_datetime?.slice(0, 16)}
                      onChange={(e) => setEditForm({ ...editForm, start_datetime: e.target.value })}
                      className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest ml-1">Max Payload Capacity</label>
                    <input
                      type="number"
                      value={editForm.max_capacity}
                      onChange={(e) => setEditForm({ ...editForm, max_capacity: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveEdit}
                  className="w-full py-5 btn-premium flex items-center justify-center space-x-3 mt-4"
                >
                  <Save className="w-5 h-5" />
                  <span>COMMIT CHANGES</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
