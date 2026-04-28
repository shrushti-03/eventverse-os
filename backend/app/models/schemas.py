from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    max_capacity: Optional[int] = 100
    category: Optional[str] = None
    tags: Optional[List[str]] = []

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    max_capacity: Optional[int] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: int
    status: str
    qr_code: Optional[str] = None
    predicted_turnout: Optional[int] = None
    engagement_score: float
    estimated_budget: float
    actual_budget: float
    current_attendees: int
    organizer_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Smart Event Planner Schemas
class EventSuggestionRequest(BaseModel):
    event_type: str
    target_audience: Optional[str] = None
    preferred_date_range: Optional[Dict[str, datetime]] = None
    budget_range: Optional[Dict[str, float]] = None

class EventSuggestion(BaseModel):
    suggested_title: str
    suggested_description: str
    recommended_date: datetime
    recommended_venue: str
    predicted_turnout: int
    confidence_score: float

# Conflict Radar Schemas
class ConflictCheck(BaseModel):
    event_id: Optional[int] = None
    venue: str
    start_datetime: datetime
    end_datetime: datetime
    target_audience: Optional[str] = None

class ConflictResponse(BaseModel):
    has_conflicts: bool
    conflicts: List[Dict[str, Any]]
    severity: str
    recommendations: List[str]

# Budget Planner Schemas
class BudgetRequest(BaseModel):
    event_type: str
    expected_attendees: int
    venue: Optional[str] = None
    duration_hours: float
    requirements: Optional[List[str]] = []

class BudgetItem(BaseModel):
    category: str
    item: str
    estimated_cost: float
    quantity: int
    total: float
    alternatives: Optional[List[Dict[str, Any]]] = []

class BudgetResponse(BaseModel):
    total_estimated: float
    breakdown: List[BudgetItem]
    optimization_tips: List[str]
    savings_potential: float

# Communication Schemas
class CommunicationRequest(BaseModel):
    event_id: int
    channel: str  # email, whatsapp, instagram, push
    message_type: str  # announcement, reminder, update
    tone: Optional[str] = "professional"  # professional, casual, urgent

class CommunicationResponse(BaseModel):
    generated_content: str
    suggested_subject: Optional[str] = None
    best_send_time: datetime
    target_audience_size: int

# QR Check-in Schemas
class CheckInRequest(BaseModel):
    event_id: int
    user_id: int
    qr_code: str
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None

class CheckInResponse(BaseModel):
    success: bool
    message: str
    check_in_time: Optional[datetime] = None
    fraud_detected: bool
    fraud_reason: Optional[str] = None

# Analytics Schemas
class EngagementMetrics(BaseModel):
    total_events: int
    total_attendance: int
    average_turnout_rate: float
    engagement_score: float
    inactive_clubs: List[str]
    volunteer_fatigue_index: float
    trending_categories: List[str]

class AttendanceAnalytics(BaseModel):
    event_id: int
    registered: int
    checked_in: int
    no_show: int
    turnout_rate: float
    peak_check_in_time: Optional[datetime] = None
    demographics: Optional[Dict[str, Any]] = None
