export interface Event {
  id: number;
  title: string;
  description?: string;
  venue?: string;
  start_datetime: string;
  end_datetime: string;
  max_capacity: number;
  current_attendees: number;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  qr_code?: string;
  predicted_turnout?: number;
  engagement_score: number;
  estimated_budget: number;
  actual_budget: number;
  organizer_id: number;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Conflict {
  type: string;
  severity: 'low' | 'medium' | 'high';
  conflicting_event?: string;
  conflicting_event_id?: number;
  description: string;
}

export interface ConflictResponse {
  has_conflicts: boolean;
  conflicts: Conflict[];
  severity: string;
  recommendations: string[];
}

export interface BudgetItem {
  category: string;
  item: string;
  estimated_cost: number;
  quantity: number;
  total: number;
  alternatives?: { item: string; savings?: number; savings_percent?: number }[];
}

export interface BudgetResponse {
  total_estimated: number;
  breakdown: BudgetItem[];
  optimization_tips: string[];
  savings_potential: number;
}

export interface CommunityHealth {
  total_events: number;
  total_attendance: number;
  average_turnout_rate: number;
  engagement_score: number;
  inactive_clubs: string[];
  volunteer_fatigue_index: number;
  trending_categories: string[];
  health_status: {
    status: string;
    color: string;
    recommendation: string;
  };
  period: string;
}

export interface AttendanceAnalytics {
  event_id: number;
  event_title: string;
  registered: number;
  checked_in: number;
  no_show: number;
  turnout_rate: number;
  peak_check_in_time?: string;
}
