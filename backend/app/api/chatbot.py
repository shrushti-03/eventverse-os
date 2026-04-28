from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.models import Event, User

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

class ChatQuery(BaseModel):
    query: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    context_type: Optional[str] = None
    data: Optional[dict] = None

def analyze_events(db: Session):
    """Analyze current events in the database"""
    events = db.query(Event).all()
    
    upcoming_events = [e for e in events if e.date >= datetime.now().date()]
    ongoing_events = [e for e in events if e.date == datetime.now().date()]
    
    # Get statistics
    total_events = len(events)
    by_category = {}
    for event in events:
        category = event.category or "Uncategorized"
        by_category[category] = by_category.get(category, 0) + 1
    
    # Get venues
    venues = list(set([e.venue for e in events if e.venue]))
    
    return {
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "ongoing_events": ongoing_events,
        "by_category": by_category,
        "venues": venues,
        "all_events": events
    }

def smart_match(query: str, keywords: List[str]) -> bool:
    """Check if query contains any of the keywords"""
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in keywords)

@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(chat_query: ChatQuery, db: Session = Depends(get_db)):
    """
    Intelligent chatbot that analyzes actual event data to provide accurate responses
    """
    query = chat_query.query.lower().strip()
    
    # Analyze current events
    event_data = analyze_events(db)
    
    # Greeting
    if smart_match(query, ['hi', 'hello', 'hey', 'hola']):
        return ChatResponse(
            response=f"Hello! 👋 I'm **Aura**, your AI assistant for EVENTVERSE OS. I have access to {event_data['total_events']} events in the system. How can I help you today?",
            context_type="greeting"
        )
    
    # Help
    if smart_match(query, ['help', 'what can you do', 'assist', 'support']):
        return ChatResponse(
            response="""I can help you with:
• **Event Information** - Details about upcoming events
• **Venues** - Where events are being held
• **Schedule** - Event timings and dates
• **Categories** - Types of events (Technical, Cultural, Sports, etc.)
• **Statistics** - Event analytics and counts

Just ask me anything about the events!""",
            context_type="help"
        )
    
    # Events query
    if smart_match(query, ['event', 'events', 'what events', 'upcoming', 'scheduled']):
        if not event_data['upcoming_events']:
            return ChatResponse(
                response="Currently, there are no upcoming events scheduled in the system. Check back later or create a new event using the platform!",
                context_type="events",
                data={"count": 0}
            )
        
        event_list = []
        for event in event_data['upcoming_events'][:5]:  # Show max 5
            event_list.append(f"• **{event.title}** - {event.date.strftime('%B %d, %Y')} at {event.venue or 'TBA'}")
        
        response = f"📅 Here are the upcoming events ({len(event_data['upcoming_events'])} total):\n\n" + "\n".join(event_list)
        if len(event_data['upcoming_events']) > 5:
            response += f"\n\n_...and {len(event_data['upcoming_events']) - 5} more events_"
        
        return ChatResponse(
            response=response,
            context_type="events",
            data={"count": len(event_data['upcoming_events'])}
        )
    
    # Today's events
    if smart_match(query, ['today', 'now', 'current', 'happening now']):
        if not event_data['ongoing_events']:
            return ChatResponse(
                response="No events are scheduled for today. Check the **Events** page to see upcoming events!",
                context_type="today"
            )
        
        event_list = [f"• **{e.title}** at {e.venue or 'TBA'}" for e in event_data['ongoing_events']]
        return ChatResponse(
            response=f"🎉 **{len(event_data['ongoing_events'])} event(s)** happening today:\n\n" + "\n".join(event_list),
            context_type="today",
            data={"events": [{"id": e.id, "title": e.title} for e in event_data['ongoing_events']]}
        )
    
    # Venue query
    if smart_match(query, ['venue', 'where', 'location', 'place', 'room', 'hall']):
        if not event_data['venues']:
            return ChatResponse(
                response="No venues have been set for events yet. Venues will be assigned when events are created.",
                context_type="venue"
            )
        
        venues_list = "\n".join([f"• **{venue}**" for venue in event_data['venues'][:10]])
        response = f"📍 Events are being held at the following venues:\n\n{venues_list}"
        
        if len(event_data['venues']) > 10:
            response += f"\n\n_...and {len(event_data['venues']) - 10} more venues_"
        
        return ChatResponse(
            response=response,
            context_type="venue",
            data={"venues": event_data['venues']}
        )
    
    # Schedule/Timing
    if smart_match(query, ['time', 'timing', 'schedule', 'when', 'start']):
        if not event_data['upcoming_events']:
            return ChatResponse(
                response="No events are currently scheduled. Create your first event to get started!",
                context_type="schedule"
            )
        
        # Get next 3 events
        next_events = sorted(event_data['upcoming_events'], key=lambda x: x.date)[:3]
        event_list = []
        for event in next_events:
            date_str = event.date.strftime('%B %d, %Y')
            time_str = event.start_time.strftime('%I:%M %p') if event.start_time else 'Time TBA'
            event_list.append(f"• **{event.title}** - {date_str} at {time_str}")
        
        return ChatResponse(
            response=f"⏰ Next upcoming events:\n\n" + "\n".join(event_list),
            context_type="schedule",
            data={"events": [{"id": e.id, "title": e.title, "date": str(e.date)} for e in next_events]}
        )
    
    # Category query
    if smart_match(query, ['category', 'type', 'types', 'categories', 'technical', 'cultural', 'sports', 'workshop']):
        if not event_data['by_category']:
            return ChatResponse(
                response="No events have been categorized yet.",
                context_type="category"
            )
        
        category_list = [f"• **{cat}**: {count} event(s)" for cat, count in event_data['by_category'].items()]
        return ChatResponse(
            response=f"📊 Events by category:\n\n" + "\n".join(category_list),
            context_type="category",
            data={"categories": event_data['by_category']}
        )
    
    # Count query
    if smart_match(query, ['how many', 'count', 'number of', 'total']):
        return ChatResponse(
            response=f"📈 **{event_data['total_events']} total events** in the system:\n• {len(event_data['upcoming_events'])} upcoming\n• {len(event_data['ongoing_events'])} happening today",
            context_type="count",
            data={
                "total": event_data['total_events'],
                "upcoming": len(event_data['upcoming_events']),
                "today": len(event_data['ongoing_events'])
            }
        )
    
    # Workshop specific query
    if smart_match(query, ['workshop', 'workshops', 'training', 'session']):
        workshops = [e for e in event_data['all_events'] if 'workshop' in e.title.lower() or (e.category and 'workshop' in e.category.lower())]
        
        if not workshops:
            return ChatResponse(
                response="No workshops are currently scheduled. You can create workshop events using the **Create Event** page!",
                context_type="workshop"
            )
        
        workshop_list = []
        for ws in workshops[:5]:
            date_str = ws.date.strftime('%B %d, %Y')
            time_str = ws.start_time.strftime('%I:%M %p') if ws.start_time else 'Time TBA'
            workshop_list.append(f"• **{ws.title}** - {date_str} at {time_str}, {ws.venue or 'Venue TBA'}")
        
        response = f"🎓 {len(workshops)} workshop(s) found:\n\n" + "\n".join(workshop_list)
        if len(workshops) > 5:
            response += f"\n\n_...and {len(workshops) - 5} more workshops_"
        
        return ChatResponse(
            response=response,
            context_type="workshop",
            data={"count": len(workshops)}
        )
    
    # Registration query
    if smart_match(query, ['register', 'registration', 'sign up', 'how to register']):
        return ChatResponse(
            response="""To participate in events:

1. **Browse Events** - Go to the Events page to see all upcoming events
2. **QR Check-in** - Use the QR Check-in feature to register and check-in
3. **Create Events** - Organizers can create events using the Create Event page

Need help with a specific event? Ask me about it!""",
            context_type="registration"
        )
    
    # Contact/Support
    if smart_match(query, ['contact', 'support', 'help desk', 'email', 'phone']):
        return ChatResponse(
            response="""📞 Need assistance? Contact the EVENTVERSE OS team:

• **Email:** support@eventverse.os
• **Platform:** Use the dashboard for event management
• **AI Assistant:** That's me! Ask any questions about events

I'm here to help 24/7!""",
            context_type="contact"
        )
    
    # Features query
    if smart_match(query, ['feature', 'features', 'what can', 'capabilities']):
        return ChatResponse(
            response="""🚀 EVENTVERSE OS Features:

• **Smart Event Planner** - AI-powered event creation
• **Conflict Radar** - Automatic conflict detection
• **Budget Planner** - Intelligent cost estimation
• **Auto-Pilot Communication** - Message generation
• **QR Check-in** - Attendance tracking
• **Analytics Dashboard** - Community health metrics

Try them out from the sidebar!""",
            context_type="features"
        )
    
    # Search for specific event by name
    matching_events = [e for e in event_data['all_events'] if query.replace('event', '').strip() in e.title.lower()]
    if matching_events:
        event = matching_events[0]
        date_str = event.date.strftime('%B %d, %Y')
        time_str = event.start_time.strftime('%I:%M %p') if event.start_time else 'Time TBA'
        
        response = f"""📌 **{event.title}**

• **Date:** {date_str}
• **Time:** {time_str}
• **Venue:** {event.venue or 'To be announced'}
• **Category:** {event.category or 'General'}"""

        if event.description:
            response += f"\n• **Description:** {event.description[:150]}..."
        
        return ChatResponse(
            response=response,
            context_type="event_detail",
            data={"event_id": event.id, "title": event.title}
        )
    
    # Default fallback with helpful suggestions
    return ChatResponse(
        response=f"""I'm not sure about that specific query. 🤔 

Currently, we have **{event_data['total_events']} events** in the system. Try asking about:

• **"What events are upcoming?"** - See scheduled events
• **"Where are events held?"** - Venue information  
• **"Events today"** - Current events
• **"Categories"** - Event types
• **"Help"** - See all my capabilities

What would you like to know?""",
        context_type="fallback",
        data={"total_events": event_data['total_events']}
    )

@router.get("/stats")
async def get_chatbot_stats(db: Session = Depends(get_db)):
    """Get chatbot statistics for debugging"""
    event_data = analyze_events(db)
    return {
        "total_events": event_data['total_events'],
        "upcoming_events": len(event_data['upcoming_events']),
        "ongoing_events": len(event_data['ongoing_events']),
        "categories": event_data['by_category'],
        "venues_count": len(event_data['venues'])
    }
