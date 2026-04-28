'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Instagram,
  Bell,
  Sparkles,
  Copy,
  Check,
  Clock,
  Loader2,
} from 'lucide-react';

const mockEvents = [
  { id: 1, title: 'AI/ML Workshop 2026' },
  { id: 2, title: 'Cultural Night' },
  { id: 3, title: 'Hackathon 2026' },
  { id: 4, title: 'Sports Day' },
];

const channels = [
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-blue-500' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'push', label: 'Push Notification', icon: Bell, color: 'bg-purple-500' },
];

const messageTypes = [
  { id: 'announcement', label: 'Announcement', description: 'New event announcement' },
  { id: 'reminder', label: 'Reminder', description: 'Event reminder for registered users' },
  { id: 'update', label: 'Update', description: 'Event details update notification' },
];

const tones = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'urgent', label: 'Urgent' },
];

export default function Communication() {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [messageType, setMessageType] = useState('announcement');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    content: string;
    subject?: string;
    bestTime: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!selectedEvent) return;
    
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const event = mockEvents.find(e => e.id === selectedEvent);
      
      let content = '';
      let subject = '';
      
      if (selectedChannel === 'email') {
        subject = `🎉 Join us for ${event?.title}!`;
        if (tone === 'professional') {
          content = `Dear Students,

We are pleased to announce ${event?.title}, scheduled for April 2, 2026 at Seminar Hall A.

This event will feature hands-on sessions and industry experts. Don't miss this incredible opportunity to learn and network with peers!

Key Highlights:
• Interactive workshops
• Expert speakers
• Networking opportunities
• Certificates for participants

Register now to secure your spot!

Best regards,
EVENTVERSE OS Team`;
        } else if (tone === 'casual') {
          content = `Hey there! 👋

${event?.title} is happening on April 2, 2026! 🚀

We've got some amazing stuff planned - hands-on sessions, cool speakers, and lots of networking. You definitely don't want to miss this!

What's in store:
• Interactive workshops
• Expert speakers
• Networking vibes
• Certificates to flex 💪

Hit that register button now!

Catch you there! ✌️
EVENTVERSE OS Team`;
        } else {
          content = `⚠️ URGENT: Registration Closing Soon!

${event?.title} - April 2, 2026

This is your LAST CHANCE to register for this highly anticipated event. Seats are filling up FAST!

Don't miss out on:
• Industry expert sessions
• Hands-on workshops
• Exclusive networking

Register NOW before it's too late!

EVENTVERSE OS Team`;
        }
      } else if (selectedChannel === 'whatsapp') {
        content = `🎉 *${event?.title}*

📅 Date: April 2, 2026
📍 Venue: Seminar Hall A
⏰ Time: 10:00 AM - 5:00 PM

Join us for an amazing event featuring hands-on sessions and industry experts!

✨ Limited seats available!

Register now: eventverse.os/register

#EVENTVERSEOS`;
      } else if (selectedChannel === 'instagram') {
        content = `🚀 ${event?.title} is HERE!

Mark your calendars! 📅 April 2, 2026

Join us for an incredible day of:
✨ Hands-on workshops
🎤 Expert speakers
🤝 Networking opportunities

Link in bio to register! 

#${event?.title.replace(/\s+/g, '')} #CollegeEvents #EventverseOS #CampusLife #TechEvent`;
      } else {
        content = `⏰ Event Reminder: ${event?.title} starts soon! Don't miss it.`;
      }

      setGeneratedContent({
        content,
        subject: selectedChannel === 'email' ? subject : undefined,
        bestTime: 'April 1, 2026 at 10:00 AM',
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(
        generatedContent.subject 
          ? `Subject: ${generatedContent.subject}\n\n${generatedContent.content}`
          : generatedContent.content
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Send className="w-8 h-8 mr-3 text-primary-500" />
          Omni-Channel Communication
        </h1>
        <p className="text-slate-400 mt-1">AI-powered narrative generation and strategic dispatch</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="col-span-1 space-y-6">
          {/* Select Event */}
          <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Select Campaign</h3>
            <div className="space-y-2">
              {mockEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                    selectedEvent === event.id
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                      : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {event.title}
                </button>
              ))}
            </div>
          </div>

          {/* Select Channel */}
          <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Select Medium</h3>
            <div className="grid grid-cols-2 gap-3">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`flex flex-col items-center p-4 rounded-xl transition-all border ${
                      selectedChannel === channel.id
                        ? 'bg-primary-500/10 text-primary-400 border-primary-500/30'
                        : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${channel.color} bg-opacity-20 mb-2 border border-white/10`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{channel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Type */}
          <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Objective</h3>
            <div className="space-y-2">
              {messageTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMessageType(type.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                    messageType === type.id
                      ? 'bg-accent-500/10 text-accent-400 border-accent-500/30'
                      : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 border-transparent'
                  }`}
                >
                  <p className="font-bold text-xs uppercase tracking-wider">{type.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Linguistic Style</h3>
            <div className="flex space-x-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    tone === t.id
                      ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedEvent || isGenerating}
            className="w-full px-6 py-4 btn-gradient text-white rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all disabled:opacity-50 active:scale-95 shadow-xl"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI Drafting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span className="uppercase tracking-widest text-xs">Generate Narrative</span>
              </>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="col-span-2">
          <div className="dark-card-bg rounded-3xl border border-slate-800/50 shadow-2xl h-full flex flex-col">
            <div className="p-8 border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="font-bold text-xl text-white tracking-tight">AI Generated Output</h3>
                </div>
                {generatedContent && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all border border-slate-700/50"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Payload</span>
                        </>
                      )}
                    </button>
                    <button className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-400 transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                      <Send className="w-4 h-4" />
                      <span>Execute Dispatch</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 flex-1">
              {generatedContent ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {generatedContent.subject && (
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Header</label>
                      <p className="text-xl font-bold text-white">{generatedContent.subject}</p>
                    </div>
                  )}
                  <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 relative group">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Payload Content</label>
                    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-medium">
                      {generatedContent.content}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-bold text-primary-400 bg-primary-500/5 p-4 rounded-xl border border-primary-500/10 inline-block">
                    <Clock className="w-4 h-4" />
                    <span className="uppercase tracking-widest">Optimal Engagement Time: {generatedContent.bestTime}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                    <MessageSquare className="w-8 h-8 opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400 mb-2">Neural Engine Idle</h3>
                  <p className="text-sm max-w-xs mx-auto">Select a campaign and target channel to initiate the AI drafting process.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
