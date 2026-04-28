import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/token', new URLSearchParams({ username, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

export const register = (data: { email: string; username: string; password: string; full_name?: string }) =>
  api.post('/auth/register', data);

export const getCurrentUser = () => api.get('/auth/me');

// Events
export const getEvents = (status?: string) =>
  api.get('/events', { params: { status } });

export const getEvent = (id: number) => api.get(`/events/${id}`);

export const createEvent = (data: any) => api.post('/events', data);

export const updateEvent = (id: number, data: any) => api.put(`/events/${id}`, data);

export const deleteEvent = (id: number) => api.delete(`/events/${id}`);

export const getEventSuggestions = (data: any) => api.post('/events/suggest', data);

export const predictTurnout = (params: any) => api.post('/events/predict-turnout', null, { params });

export const checkConflicts = (data: any) => api.post('/events/check-conflicts', data);

// Check-in
export const processCheckIn = (data: any) => api.post('/checkin', data);

export const registerForEvent = (eventId: number) => api.post(`/checkin/register/${eventId}`);

export const getAttendanceAnalytics = (eventId: number) => api.get(`/checkin/analytics/${eventId}`);

export const getEventQR = (eventId: number) => api.get(`/checkin/qr/${eventId}`);

// Budget
export const estimateBudget = (data: any) => api.post('/budget/estimate', data);

export const optimizeBudget = (data: any) => api.post('/budget/optimize', null, { params: data });

export const getBudgetTemplate = (eventType: string) => api.get(`/budget/templates/${eventType}`);

// Communication
export const generateMessage = (data: any) => api.post('/communication/generate', data);

export const sendCommunication = (eventId: number, channel: string, messageType: string) =>
  api.post(`/communication/send/${eventId}`, null, { params: { channel, message_type: messageType } });

export const getCommunicationHistory = (eventId: number) => api.get(`/communication/history/${eventId}`);

// Analytics
export const getCommunityHealth = () => api.get('/analytics/community-health');

export const getEventEngagement = (eventId: number) => api.get(`/analytics/event/${eventId}`);

export const getEngagementHeatmap = () => api.get('/analytics/heatmap');

export const getDashboardSummary = () => api.get('/analytics/dashboard-summary');

// Chatbot
export const askChatbot = (query: string, context?: string) => 
  api.post('/chatbot/ask', { query, context });

export const getChatbotStats = () => api.get('/chatbot/stats');

export default api;
