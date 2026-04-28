'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import EventsPage from '@/components/EventsPage';
import CreateEvent from '@/components/CreateEvent';
import ConflictRadar from '@/components/ConflictRadar';
import BudgetPlanner from '@/components/BudgetPlanner';
import Communication from '@/components/Communication';
import Analytics from '@/components/Analytics';
import QRCheckIn from '@/components/QRCheckIn';
import AuraChatbot from '@/components/AuraChatbot';

type PageType = 'dashboard' | 'events' | 'create' | 'conflicts' | 'budget' | 'communication' | 'analytics' | 'checkin';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-pulse-slow fade-in">
            <div className="mb-6 flex justify-center">
              <div className="p-6 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl border border-primary-500/30 glow-primary">
                <svg className="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-bold gradient-text mb-4 tracking-tight">EVENTVERSE OS</h1>
            <p className="text-slate-400 text-lg font-medium">Initializing AI Control Room...</p>
          </div>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce shadow-lg glow-primary" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-accent-500 rounded-full animate-bounce shadow-lg glow-accent" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce shadow-lg glow-primary" style={{ animationDelay: '300ms' }}></div>
          </div>
          <div className="mt-6 text-slate-500 text-sm">
            Powered by AI & Machine Learning
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'events':
        return <EventsPage onNavigate={setCurrentPage} />;
      case 'create':
        return <CreateEvent onNavigate={setCurrentPage} />;
      case 'conflicts':
        return <ConflictRadar />;
      case 'budget':
        return <BudgetPlanner />;
      case 'communication':
        return <Communication />;
      case 'analytics':
        return <Analytics />;
      case 'checkin':
        return <QRCheckIn />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 ml-64 p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {renderPage()}
      </main>
      
      {/* Global AI Chatbot */}
      <AuraChatbot />
    </div>
  );
}
