from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.models.models import Event, Attendance, Venue, ConflictLog
from app.models.schemas import ConflictResponse, ConflictCheck
import qrcode
import io
import base64
import uuid

class EventService:
    @staticmethod
    def create_event(db: Session, event_data: dict, organizer_id: int) -> Event:
        # Generate QR code
        qr_code = EventService.generate_qr_code(str(uuid.uuid4()))
        
        event = Event(
            **event_data,
            organizer_id=organizer_id,
            qr_code=qr_code
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def get_event(db: Session, event_id: int) -> Optional[Event]:
        return db.query(Event).filter(Event.id == event_id).first()
    
    @staticmethod
    def get_events(db: Session, skip: int = 0, limit: int = 100, status: str = None) -> List[Event]:
        query = db.query(Event)
        if status:
            query = query.filter(Event.status == status)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_event(db: Session, event_id: int, event_data: dict) -> Optional[Event]:
        event = db.query(Event).filter(Event.id == event_id).first()
        if event:
            for key, value in event_data.items():
                if value is not None:
                    setattr(event, key, value)
            db.commit()
            db.refresh(event)
        return event
    
    @staticmethod
    def delete_event(db: Session, event_id: int) -> bool:
        event = db.query(Event).filter(Event.id == event_id).first()
        if event:
            db.delete(event)
            db.commit()
            return True
        return False
    
    @staticmethod
    def generate_qr_code(data: str) -> str:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        base64_image = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{base64_image}"

class ConflictRadarService:
    """Detects and alerts for potential conflicts in event scheduling"""
    
    @staticmethod
    def check_conflicts(db: Session, conflict_check: ConflictCheck) -> ConflictResponse:
        conflicts = []
        recommendations = []
        severity = "low"
        
        # Check venue conflicts
        venue_conflicts = ConflictRadarService._check_venue_conflicts(
            db, 
            conflict_check.venue,
            conflict_check.start_datetime,
            conflict_check.end_datetime,
            conflict_check.event_id
        )
        if venue_conflicts:
            conflicts.extend(venue_conflicts)
            severity = "high"
            recommendations.append(f"Consider alternative venues or reschedule the event")
        
        # Check time overlaps with similar events
        time_conflicts = ConflictRadarService._check_time_conflicts(
            db,
            conflict_check.start_datetime,
            conflict_check.end_datetime,
            conflict_check.target_audience,
            conflict_check.event_id
        )
        if time_conflicts:
            conflicts.extend(time_conflicts)
            if severity != "high":
                severity = "medium"
            recommendations.append("Multiple events at the same time may split your audience")
        
        # Check exam period conflicts
        exam_conflicts = ConflictRadarService._check_exam_conflicts(
            conflict_check.start_datetime
        )
        if exam_conflicts:
            conflicts.extend(exam_conflicts)
            severity = "high"
            recommendations.append("Avoid scheduling during exam periods for better attendance")
        
        # Check holiday conflicts
        holiday_conflicts = ConflictRadarService._check_holiday_conflicts(
            conflict_check.start_datetime
        )
        if holiday_conflicts:
            conflicts.extend(holiday_conflicts)
            recommendations.append("Consider if holiday timing affects your target audience")
        
        return ConflictResponse(
            has_conflicts=len(conflicts) > 0,
            conflicts=conflicts,
            severity=severity,
            recommendations=recommendations
        )
    
    @staticmethod
    def _check_venue_conflicts(
        db: Session, 
        venue: str, 
        start: datetime, 
        end: datetime,
        exclude_event_id: int = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Event).filter(
            and_(
                Event.venue == venue,
                Event.status.in_(["published", "ongoing"]),
                or_(
                    and_(Event.start_datetime <= start, Event.end_datetime > start),
                    and_(Event.start_datetime < end, Event.end_datetime >= end),
                    and_(Event.start_datetime >= start, Event.end_datetime <= end)
                )
            )
        )
        if exclude_event_id:
            query = query.filter(Event.id != exclude_event_id)
        
        conflicts = []
        for event in query.all():
            conflicts.append({
                "type": "venue",
                "severity": "high",
                "conflicting_event": event.title,
                "conflicting_event_id": event.id,
                "description": f"Venue '{venue}' is already booked for '{event.title}' from {event.start_datetime} to {event.end_datetime}"
            })
        return conflicts
    
    @staticmethod
    def _check_time_conflicts(
        db: Session,
        start: datetime,
        end: datetime,
        target_audience: str,
        exclude_event_id: int = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Event).filter(
            and_(
                Event.status.in_(["published", "ongoing"]),
                or_(
                    and_(Event.start_datetime <= start, Event.end_datetime > start),
                    and_(Event.start_datetime < end, Event.end_datetime >= end)
                )
            )
        )
        if exclude_event_id:
            query = query.filter(Event.id != exclude_event_id)
        
        conflicts = []
        for event in query.all():
            conflicts.append({
                "type": "time_overlap",
                "severity": "medium",
                "conflicting_event": event.title,
                "conflicting_event_id": event.id,
                "description": f"'{event.title}' is scheduled at the same time, potentially splitting audience"
            })
        return conflicts
    
    @staticmethod
    def _check_exam_conflicts(date: datetime) -> List[Dict[str, Any]]:
        # Mock exam periods - in production, this would come from academic calendar
        exam_periods = [
            {"start": datetime(2026, 4, 15), "end": datetime(2026, 5, 5), "name": "Mid-Semester Exams"},
            {"start": datetime(2026, 11, 20), "end": datetime(2026, 12, 15), "name": "End-Semester Exams"},
        ]
        
        conflicts = []
        for period in exam_periods:
            if period["start"] <= date <= period["end"]:
                conflicts.append({
                    "type": "exam_period",
                    "severity": "high",
                    "description": f"Event falls during {period['name']} ({period['start'].strftime('%b %d')} - {period['end'].strftime('%b %d')})"
                })
        return conflicts
    
    @staticmethod
    def _check_holiday_conflicts(date: datetime) -> List[Dict[str, Any]]:
        # Mock holidays - in production, this would come from a calendar API
        holidays = [
            {"date": datetime(2026, 1, 26), "name": "Republic Day"},
            {"date": datetime(2026, 8, 15), "name": "Independence Day"},
            {"date": datetime(2026, 10, 2), "name": "Gandhi Jayanti"},
        ]
        
        conflicts = []
        for holiday in holidays:
            if date.date() == holiday["date"].date():
                conflicts.append({
                    "type": "holiday",
                    "severity": "low",
                    "description": f"Event is scheduled on {holiday['name']}"
                })
        return conflicts
