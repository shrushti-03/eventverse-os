'use client';

import { useState } from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
  FileText,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Brain,
  Zap,
} from 'lucide-react';
import { getEventSuggestions, predictTurnout, checkConflicts, createEvent } from '@/lib/api';

type PageType = 'dashboard' | 'events' | 'create' | 'conflicts' | 'budget' | 'communication' | 'analytics' | 'checkin';

interface CreateEventProps {
  onNavigate: (page: PageType) => void;
}

interface PredictionResult {
  predicted_turnout: number;
  turnout_range: { low: number; high: number };
  confidence: number;
  factors: { factor: string; impact: string; description: string }[];
}

interface ConflictResult {
  type: string;
  severity: string;
  conflicting_event?: string;
  description: string;
}

// Move InputField OUTSIDE to fix focus/cursor issue
const InputField = ({ label, icon: Icon, children, required }: any) => (
  <div className="space-y-2.5 group">
    <label className="flex items-center text-xs font-black text-slate-300 uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">
      {Icon && <Icon className="w-3.5 h-3.5 mr-2 text-primary" />}
      {label} {required && <span className="text-red-500 ml-1 font-black">*</span>}
    </label>
    {children}
  </div>
);

export default function CreateEvent({ onNavigate }: CreateEventProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    category: '',
    max_capacity: 100,
    tags: [] as string[],
  });

  const categories = [
    'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition'
  ];

  const venues = [
    'Seminar Hall A', 'Seminar Hall B', 'Main Auditorium', 'Computer Lab',
    'Conference Room', 'Sports Ground', 'Open Air Theatre'
  ];

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response = await getEventSuggestions({
        event_type: formData.category || 'technical',
        topic: formData.title || 'Innovative Community Gathering',
        target_audience: 'students',
        preferences: { expected_attendees: formData.max_capacity },
      });
      
      const suggestions = response.data;
      setFormData(prev => ({
        ...prev,
        title: suggestions.title_suggestions?.[0] || prev.title,
        description: suggestions.description || prev.description,
      }));
      await handlePredictTurnout();
    } catch (error) {
      console.error('AI Suggestion Failed');
    }
    setShowSuggestions(true);
    setIsGenerating(false);
  };

  const handlePredictTurnout = async () => {
    setIsPredicting(true);
    try {
      const datetime = formData.start_date && formData.start_time 
        ? `${formData.start_date}T${formData.start_time}:00`
        : new Date().toISOString();
      
      const response = await predictTurnout({
        event_datetime: datetime,
        category: formData.category || 'technical',
        duration_hours: 4,
        capacity: formData.max_capacity,
        marketing_score: 0.8,
      });
      setPrediction(response.data);
    } catch (error) {}
    setIsPredicting(false);
  };

  const handleCheckConflicts = async () => {
    if (!formData.venue || !formData.start_date || !formData.start_time) return;
    try {
      const response = await checkConflicts({
        venue: formData.venue,
        start_datetime: `${formData.start_date}T${formData.start_time}:00`,
        end_datetime: `${formData.end_date || formData.start_date}T${formData.end_time || '23:59'}:00`,
      });
      setConflicts(response.data.conflicts || []);
    } catch (error) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const eventData = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      venue: formData.venue,
      start_datetime: `${formData.start_date}T${formData.start_time}:00`,
      end_datetime: `${formData.end_date || formData.start_date}T${formData.end_time}:00`,
      category: formData.category,
      max_capacity: formData.max_capacity,
      predicted_turnout: prediction?.predicted_turnout || Math.round(formData.max_capacity * 0.7),
      status: 'published',
      current_attendees: 0,
      engagement_score: 75,
    };
    
    try {
      await createEvent(eventData);
    } catch (error) {}
    
    const storedEvents = JSON.parse(localStorage.getItem('eventverse_events') || '[]');
    storedEvents.push(eventData);
    localStorage.setItem('eventverse_events', JSON.stringify(storedEvents));
    window.dispatchEvent(new Event('storage'));
    setIsSubmitting(false);
    alert('Event Node Deployed Successfully! 🚀');
    onNavigate('events');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-soft-fade pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center">
            Neural Architect
            <Sparkles className="w-7 h-7 ml-3 text-primary" />
          </h1>
          <p className="text-[#8e8e93] font-bold text-[11px] uppercase tracking-[0.2em] mt-1">
            Constructing high-impact temporal nodes
          </p>
        </div>
        <button
          onClick={handleGenerateSuggestions}
          disabled={isGenerating}
          className="btn-premium px-8 py-4 flex items-center space-x-3 text-xs"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          <span>{isGenerating ? 'GENESIS...' : 'AI SMART FILL'}</span>
        </button>
      </div>

      {/* AI Strategy Insights */}
      {showSuggestions && prediction && (
        <div className="premium-card p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 animate-soft-fade">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <Brain className="w-5 h-5 text-primary outline-none" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">AI Strategy Insight</h3>
              <p className="text-[9px] uppercase font-black tracking-widest text-primary">Predictive modeling complete</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
              <p className="text-[9px] font-black text-[#8e8e93] uppercase tracking-widest mb-2">Turnout Prediction</p>
              <div className="text-3xl font-black text-white">{prediction.predicted_turnout}</div>
              <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(prediction.predicted_turnout / formData.max_capacity) * 100}%` }} />
              </div>
            </div>
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-green-500/30 transition-all">
              <p className="text-[9px] font-black text-[#8e8e93] uppercase tracking-widest mb-2">Confidence Level</p>
              <div className="text-3xl font-black text-green-400">{Math.round(prediction.confidence * 100)}%</div>
              <p className="text-[9px] font-bold text-[#8e8e93] mt-2 uppercase tracking-tighter">Neural correlation: High</p>
            </div>
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-[#8e8e93] uppercase tracking-widest mb-4">Strategic Factors</p>
              <div className="space-y-2">
                {prediction.factors.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className={`w-1 h-1 rounded-full ${f.impact === 'positive' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter">{f.factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Architecture */}
      <form onSubmit={handleSubmit} className="premium-card p-12 bg-white/5 space-y-12">
        <div className="space-y-10">
          <div className="flex items-center space-x-4">
             <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
             <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Core Specifications</h2>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <InputField label="Operational Title" icon={FileText} required>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Declare the node title..."
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-white transition-all font-black text-sm placeholder:text-[#4a5568]"
                required
              />
            </InputField>

            <InputField label="Intel Narrative" icon={Tag}>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed operational parameters..."
                rows={3}
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-white transition-all font-bold text-sm placeholder:text-[#4a5568] resize-none"
              />
            </InputField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Classification" icon={Zap} required>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-5 py-4 text-white transition-all font-black text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-[#09090b]">Select Class</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()} className="bg-[#09090b]">{cat}</option>
                    ))}
                  </select>
                </div>
              </InputField>

              <InputField label="Max Payload Capacity" icon={Users}>
                <input
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-5 py-4 text-white transition-all font-black text-sm"
                />
              </InputField>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center space-x-4">
             <div className="w-1 h-6 bg-secondary rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
             <h2 className="text-xl font-black text-white tracking-tighter uppercase">Temporal Matrix</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InputField label="Start Date" icon={Calendar} required>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-4 py-4 text-white font-black text-xs [color-scheme:dark]"
                required
              />
            </InputField>
            <InputField label="Start Time" icon={Clock} required>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-4 py-4 text-white font-black text-xs [color-scheme:dark]"
                required
              />
            </InputField>
            <InputField label="End Date" icon={Calendar} required>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-4 py-4 text-white font-black text-xs [color-scheme:dark]"
                required
              />
            </InputField>
            <InputField label="End Time" icon={Clock} required>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-4 py-4 text-white font-black text-xs [color-scheme:dark]"
                required
              />
            </InputField>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center space-x-4">
             <div className="w-1 h-6 bg-green-500 rounded-full" />
             <h2 className="text-xl font-black text-white tracking-tighter uppercase">Logistics Venue</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <InputField label="Sector" icon={MapPin} required>
              <select
                value={formData.venue}
                onChange={(e) => {
                  setFormData({ ...formData, venue: e.target.value });
                  handleCheckConflicts();
                }}
                className="w-full bg-black/60 border border-white/10 focus:border-primary/50 rounded-2xl px-5 py-4 text-white font-black text-sm appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#09090b]">Select Neutral Sector</option>
                {venues.map((v) => (
                  <option key={v} value={v} className="bg-[#09090b]">{v}</option>
                ))}
              </select>
            </InputField>

            {conflicts.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 animate-pulse">
                <div className="flex items-center space-x-4 text-red-500 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="font-black uppercase tracking-[0.3em] text-xs">Temporal Collision Detected</span>
                </div>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-sm text-[#8e8e93] font-bold leading-relaxed">
                    Conflict Key: {c.description}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-10 flex flex-col md:flex-row md:items-center justify-between border-t border-white/5 gap-8">
           <button
             type="button"
             onClick={() => onNavigate('events')}
             className="text-xs font-black text-[#8e8e93] hover:text-white uppercase tracking-[0.4em] transition-all"
           >
             Terminate Build
           </button>
           <button
             type="submit"
             disabled={isSubmitting}
             className="btn-premium px-16 py-6 group"
           >
             {isSubmitting ? (
               <div className="flex items-center space-x-2">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span>ESTABLISHING NODE...</span>
               </div>
             ) : (
               <div className="flex items-center space-x-3">
                 <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 <span>DEPLOY TEMPORAL NODE</span>
               </div>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
