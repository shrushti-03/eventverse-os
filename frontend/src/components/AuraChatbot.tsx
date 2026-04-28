'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';
import { askChatbot } from '@/lib/api';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Format message with markdown-like styling
const formatMessage = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|\n|•)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part === '\n') {
      return <br key={i} />;
    }
    if (part === '•') {
      return <span key={i} className="text-primary font-bold">• </span>;
    }
    return part;
  });
};

export default function AuraChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hello! 👋 I'm **Aura**, your AI assistant for EVENTVERSE OS. I can help you with information about events, venues, schedules, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      // Call backend chatbot API
      const response = await askChatbot(query);
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const botResponse: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm having trouble connecting to the server right now. Please make sure the backend is running and try again. You can ask me about events, venues, schedules, and more!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Upcoming Events', query: 'What events are upcoming?' },
    { label: 'Today\'s Events', query: 'Events today' },
    { label: 'Venues', query: 'Where are events held?' },
    { label: 'Help', query: 'What can you help me with?' },
  ];

  return (
    <>
      {/* Floating Aura Character Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 z-50 group ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } transition-all duration-300`}
        aria-label="Open Aura AI Assistant"
      >
        {/* Aura Character Container */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-full blur-xl animate-pulse" />
          
          {/* Main character circle */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary via-secondary to-primary-600 p-1 shadow-2xl hover:scale-110 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-primary/30">
              {/* Aura face/icon */}
              <div className="relative">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Orbiting particles */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary/60 rounded-full animate-ping" />
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-secondary/60 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Name label */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl border border-primary/30 shadow-lg">
            <p className="text-white font-bold text-sm whitespace-nowrap">Chat with Aura</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="border-8 border-transparent border-t-slate-800/90" />
            </div>
          </div>
        </div>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-8 right-8 z-50 w-[420px] h-[600px] bg-slate-900 rounded-3xl shadow-2xl border border-primary/20 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header with Aura character */}
        <div className="p-5 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mini Aura character */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-slate-900 shadow-lg" />
            </div>
            
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Aura
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold">AI</span>
              </h3>
              <p className="text-xs font-medium text-primary/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Online & Ready
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors group"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  message.type === 'bot'
                    ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30'
                    : 'bg-gradient-to-br from-slate-700 to-slate-600'
                }`}
              >
                {message.type === 'bot' ? (
                  <Bot className="w-5 h-5 text-primary" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message bubble */}
              <div className="flex-1 max-w-[80%]">
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.type === 'bot'
                      ? 'bg-slate-800/50 border border-primary/10 text-slate-100'
                      : 'bg-gradient-to-br from-primary to-secondary text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {formatMessage(message.content)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-slate-800/50 border border-primary/10 px-5 py-3 rounded-2xl">
                <div className="flex space-x-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="px-5 pb-3 bg-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setInputValue(action.query);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="px-3 py-2 bg-slate-800/50 hover:bg-primary/10 border border-slate-700 hover:border-primary/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-primary transition-all hover:scale-105"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-5 border-t border-primary/10 bg-slate-900">
          <div className="flex items-center space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Aura anything..."
              className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-primary/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 hover:scale-105"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[9px] text-slate-600 text-center mt-2.5">
            Powered by EVENTVERSE AI • Real-time event intelligence
          </p>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </>
  );
}
