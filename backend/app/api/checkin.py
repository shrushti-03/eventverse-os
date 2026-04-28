from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.schemas import CheckInRequest, CheckInResponse
from app.models.models import Attendance, Event
from app.services.checkin_service import QRCheckInService
from app.api.auth import get_current_user

router = APIRouter(prefix="/checkin", tags=["QR Check-in"])

@router.post("/", response_model=CheckInResponse)
async def process_checkin(
    checkin: CheckInRequest,
    db: Session = Depends(get_db)
):
    """Process QR code check-in with fraud detection"""
    result = QRCheckInService.process_checkin(db, checkin)
    return result

@router.post("/register/{event_id}")
async def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Register for an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already registered
    existing = db.query(Attendance).filter(
        Attendance.event_id == event_id,
        Attendance.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check capacity
    if event.current_attendees >= event.max_capacity:
        raise HTTPException(status_code=400, detail="Event is at full capacity")
    
    # Create attendance record
    attendance = Attendance(
        event_id=event_id,
        user_id=current_user.id,
        status="registered"
    )
    db.add(attendance)
    db.commit()
    
    return {
        "message": "Successfully registered for the event",
        "event_id": event_id,
        "qr_code": event.qr_code
    }

@router.get("/analytics/{event_id}")
async def get_attendance_analytics(
    event_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get real-time attendance analytics for an event"""
    analytics = QRCheckInService.get_attendance_analytics(db, event_id)
    if "error" in analytics:
        raise HTTPException(status_code=404, detail=analytics["error"])
    return analytics

@router.get("/qr/{event_id}")
async def get_event_qr(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get QR code for an event (for registered users)"""
    attendance = db.query(Attendance).filter(
        Attendance.event_id == event_id,
        Attendance.user_id == current_user.id
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Not registered for this event")
    
    event = db.query(Event).filter(Event.id == event_id).first()
    return {
        "event_id": event_id,
        "event_title": event.title,
        "qr_code": event.qr_code,
        "status": attendance.status
    }
