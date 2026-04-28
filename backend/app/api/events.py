from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.schemas import (
    EventCreate, EventUpdate, EventResponse, 
    EventSuggestionRequest, EventSuggestion,
    ConflictCheck, ConflictResponse
)
from app.services.event_service import EventService, ConflictRadarService
from app.ml.predictor import turnout_predictor, suggestion_engine
from app.api.auth import get_current_user

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("/", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new event"""
    event_data = event.model_dump()
    
    # Predict turnout using ML
    duration = (event.end_datetime - event.start_datetime).total_seconds() / 3600
    prediction = turnout_predictor.predict_turnout(
        event_datetime=event.start_datetime,
        category=event.category or "seminar",
        duration_hours=duration,
        capacity=event.max_capacity or 100
    )
    event_data["predicted_turnout"] = prediction["predicted_turnout"]
    
    db_event = EventService.create_event(db, event_data, current_user.id)
    return db_event

@router.get("/", response_model=List[EventResponse])
async def get_events(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all events with optional filtering"""
    events = EventService.get_events(db, skip, limit, status)
    return events

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a specific event by ID"""
    event = EventService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an event"""
    event = EventService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updated_event = EventService.update_event(db, event_id, event_update.model_dump(exclude_unset=True))
    return updated_event

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an event"""
    event = EventService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    EventService.delete_event(db, event_id)
    return {"message": "Event deleted successfully"}

# Smart Event Planner endpoints
@router.post("/suggest")
async def get_event_suggestions(request: EventSuggestionRequest):
    """Get AI-powered event suggestions"""
    suggestions = suggestion_engine.suggest_event(
        event_type=request.event_type,
        topic=request.event_type,  # Can be customized
        target_audience=request.target_audience or "students"
    )
    return suggestions

@router.post("/predict-turnout")
async def predict_turnout(
    event_datetime: datetime,
    category: str,
    duration_hours: float,
    capacity: int,
    marketing_score: float = 0.5
):
    """Predict event turnout using ML"""
    prediction = turnout_predictor.predict_turnout(
        event_datetime=event_datetime,
        category=category,
        duration_hours=duration_hours,
        capacity=capacity,
        marketing_score=marketing_score
    )
    return prediction

# Conflict Radar endpoints
@router.post("/check-conflicts", response_model=ConflictResponse)
async def check_conflicts(
    conflict_check: ConflictCheck,
    db: Session = Depends(get_db)
):
    """Check for potential conflicts with the proposed event"""
    conflicts = ConflictRadarService.check_conflicts(db, conflict_check)
    return conflicts
