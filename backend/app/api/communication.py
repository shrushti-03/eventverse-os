from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.schemas import CommunicationRequest, CommunicationResponse
from app.models.models import Event, Communication
from app.services.communication_service import CommunicationService
from app.api.auth import get_current_user

router = APIRouter(prefix="/communication", tags=["Auto-Pilot Communication"])

@router.post("/generate", response_model=CommunicationResponse)
async def generate_message(
    request: CommunicationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered communication content.
    
    Supports:
    - Email announcements
    - WhatsApp messages
    - Instagram posts
    - Push notifications
    """
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_data = {
        "title": event.title,
        "description": event.description,
        "venue": event.venue,
        "start_datetime": event.start_datetime,
        "category": event.category,
        "target_audience_size": event.max_capacity
    }
    
    response = CommunicationService.generate_message(request, event_data)
    return response

@router.post("/send/{event_id}")
async def send_communication(
    event_id: int,
    channel: str,
    message_type: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Schedule/send communication for an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Generate message
    request = CommunicationRequest(
        event_id=event_id,
        channel=channel,
        message_type=message_type
    )
    
    event_data = {
        "title": event.title,
        "description": event.description,
        "venue": event.venue,
        "start_datetime": event.start_datetime,
        "category": event.category,
        "target_audience_size": event.max_capacity
    }
    
    generated = CommunicationService.generate_message(request, event_data)
    
    # Save communication record
    communication = Communication(
        event_id=event_id,
        channel=channel,
        message_type=message_type,
        content=generated.generated_content,
        status="scheduled",
        recipients_count=generated.target_audience_size
    )
    db.add(communication)
    db.commit()
    
    return {
        "message": "Communication scheduled successfully",
        "content": generated.generated_content,
        "channel": channel,
        "scheduled_time": generated.best_send_time
    }

@router.get("/history/{event_id}")
async def get_communication_history(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get communication history for an event"""
    communications = db.query(Communication).filter(
        Communication.event_id == event_id
    ).order_by(Communication.created_at.desc()).all()
    
    return [{
        "id": c.id,
        "channel": c.channel,
        "message_type": c.message_type,
        "content": c.content,
        "status": c.status,
        "recipients_count": c.recipients_count,
        "sent_at": c.sent_at,
        "created_at": c.created_at
    } for c in communications]

@router.get("/push-notification/{event_id}")
async def get_push_notification(
    event_id: int,
    notification_type: str = "reminder",
    db: Session = Depends(get_db)
):
    """Generate push notification for an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    notification = CommunicationService.generate_push_notification(
        {"title": event.title},
        notification_type
    )
    return notification
