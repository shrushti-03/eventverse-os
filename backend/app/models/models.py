from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="user")  # user, organizer, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organized_events = relationship("Event", back_populates="organizer")
    attendances = relationship("Attendance", back_populates="user")
    
class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    venue = Column(String(255))
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    max_capacity = Column(Integer, default=100)
    current_attendees = Column(Integer, default=0)
    category = Column(String(100))
    tags = Column(JSON)
    status = Column(String(50), default="draft")  # draft, published, ongoing, completed, cancelled
    qr_code = Column(String(500))
    predicted_turnout = Column(Integer)
    engagement_score = Column(Float, default=0.0)
    
    # Budget fields
    estimated_budget = Column(Float, default=0.0)
    actual_budget = Column(Float, default=0.0)
    budget_breakdown = Column(JSON)
    
    organizer_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organizer = relationship("User", back_populates="organized_events")
    attendances = relationship("Attendance", back_populates="event")
    
class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    status = Column(String(50), default="registered")  # registered, checked_in, no_show
    check_in_time = Column(DateTime(timezone=True))
    device_fingerprint = Column(String(255))
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="attendances")
    event = relationship("Event", back_populates="attendances")

class Venue(Base):
    __tablename__ = "venues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    capacity = Column(Integer)
    location = Column(String(255))
    amenities = Column(JSON)
    availability = Column(JSON)  # Stores availability schedule
    
class Club(Base):
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    member_count = Column(Integer, default=0)
    activity_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ConflictLog(Base):
    __tablename__ = "conflict_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    conflict_type = Column(String(100))  # venue, time, audience, exam
    conflicting_event_id = Column(Integer)
    description = Column(Text)
    severity = Column(String(50))  # low, medium, high
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Communication(Base):
    __tablename__ = "communications"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    channel = Column(String(50))  # email, whatsapp, instagram, push
    message_type = Column(String(50))  # announcement, reminder, update
    content = Column(Text)
    recipients_count = Column(Integer, default=0)
    sent_at = Column(DateTime(timezone=True))
    status = Column(String(50), default="draft")  # draft, scheduled, sent
    created_at = Column(DateTime(timezone=True), server_default=func.now())
