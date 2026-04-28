from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.models.schemas import CommunicationRequest, CommunicationResponse
import random

class CommunicationService:
    """Auto-pilot communication generator using NLP"""
    
    # Message templates
    TEMPLATES = {
        "announcement": {
            "professional": [
                "We are pleased to announce {event_title}, scheduled for {date} at {venue}. {description} Register now to secure your spot!",
                "Mark your calendars! {event_title} is happening on {date}. Join us at {venue} for {description}. Don't miss out!",
                "Exciting news! {event_title} is coming up on {date}. {description} Limited seats available - register today!"
            ],
            "casual": [
                "Hey! 🎉 {event_title} is happening on {date}! {description} See you at {venue}!",
                "Guess what's coming? {event_title}! 🚀 {date} at {venue}. {description} RSVP now!",
                "Big things coming! {event_title} drops on {date} 🔥 {description} Be there!"
            ],
            "urgent": [
                "URGENT: {event_title} registration closing soon! Event on {date} at {venue}. {description} Register NOW!",
                "⚠️ LAST CHANCE! {event_title} - {date} at {venue}. {description} Limited spots remaining!",
                "ATTENTION: Don't miss {event_title}! Happening {date}. {description} Register immediately!"
            ]
        },
        "reminder": {
            "professional": [
                "Reminder: {event_title} is tomorrow at {venue}. Please arrive 15 minutes early. We look forward to seeing you!",
                "This is a gentle reminder about {event_title} scheduled for {date}. Don't forget to bring your registration confirmation.",
                "Just a reminder that {event_title} is happening on {date} at {venue}. See you there!"
            ],
            "casual": [
                "Hey! Quick reminder - {event_title} is tomorrow! 📅 Don't forget to show up at {venue}!",
                "Psst... {event_title} is just around the corner! See you on {date} 👋",
                "T-minus 24 hours until {event_title}! Can't wait to see you at {venue}! 🎯"
            ],
            "urgent": [
                "⏰ REMINDER: {event_title} starts in a few hours! Head to {venue} now!",
                "DON'T FORGET: {event_title} is TODAY at {venue}. Be there!",
                "FINAL REMINDER: {event_title} begins soon at {venue}. Last chance to attend!"
            ]
        },
        "update": {
            "professional": [
                "Important update regarding {event_title}: {update_content}. Thank you for your understanding.",
                "Please note the following change for {event_title}: {update_content}. Contact us for any queries.",
                "Update: {update_content}. All other details for {event_title} remain unchanged."
            ],
            "casual": [
                "Heads up! 📢 Quick update about {event_title}: {update_content}",
                "Hey everyone! Small change for {event_title} - {update_content}. Stay tuned!",
                "Update alert! 🔔 {event_title} update: {update_content}"
            ],
            "urgent": [
                "IMPORTANT UPDATE for {event_title}: {update_content}. Please take note immediately.",
                "⚠️ URGENT CHANGE: {update_content}. Please update your plans for {event_title}.",
                "ATTENTION: Critical update for {event_title} - {update_content}!"
            ]
        }
    }
    
    # Subject line templates
    SUBJECTS = {
        "announcement": [
            "🎉 Join us for {event_title}!",
            "You're Invited: {event_title}",
            "Don't Miss: {event_title} on {date}"
        ],
        "reminder": [
            "⏰ Reminder: {event_title} is coming up!",
            "Don't forget: {event_title} tomorrow",
            "See you at {event_title}!"
        ],
        "update": [
            "📢 Update: {event_title}",
            "Important: Changes to {event_title}",
            "Action Required: {event_title} Update"
        ]
    }
    
    # Channel-specific formatting
    CHANNEL_FORMATS = {
        "email": {"max_length": 1000, "supports_html": True},
        "whatsapp": {"max_length": 500, "emoji_friendly": True},
        "instagram": {"max_length": 300, "hashtag_friendly": True},
        "push": {"max_length": 100, "title_length": 50}
    }
    
    @staticmethod
    def generate_message(
        request: CommunicationRequest,
        event_data: Dict[str, Any],
        update_content: Optional[str] = None
    ) -> CommunicationResponse:
        # Select template based on message type and tone
        templates = CommunicationService.TEMPLATES.get(
            request.message_type, 
            CommunicationService.TEMPLATES["announcement"]
        )
        tone_templates = templates.get(request.tone, templates["professional"])
        template = random.choice(tone_templates)
        
        # Format the message
        message = template.format(
            event_title=event_data.get("title", "the event"),
            date=event_data.get("start_datetime", "TBD").strftime("%B %d, %Y at %I:%M %p") if isinstance(event_data.get("start_datetime"), datetime) else str(event_data.get("start_datetime", "TBD")),
            venue=event_data.get("venue", "TBD"),
            description=event_data.get("description", "An amazing event awaits!"),
            update_content=update_content or ""
        )
        
        # Channel-specific formatting
        channel_format = CommunicationService.CHANNEL_FORMATS.get(
            request.channel, 
            {"max_length": 500}
        )
        
        # Truncate if necessary
        if len(message) > channel_format.get("max_length", 500):
            message = message[:channel_format["max_length"] - 3] + "..."
        
        # Add hashtags for Instagram
        if request.channel == "instagram" and channel_format.get("hashtag_friendly"):
            category = event_data.get("category", "event")
            hashtags = f"\n\n#{category.replace(' ', '')} #CollegeEvents #EventverseOS #CampusLife"
            if len(message) + len(hashtags) <= channel_format["max_length"]:
                message += hashtags
        
        # Generate subject for email
        subject = None
        if request.channel == "email":
            subject_templates = CommunicationService.SUBJECTS.get(
                request.message_type, 
                CommunicationService.SUBJECTS["announcement"]
            )
            subject = random.choice(subject_templates).format(
                event_title=event_data.get("title", "Event"),
                date=event_data.get("start_datetime", "")
            )
        
        # Calculate best send time
        best_time = CommunicationService._calculate_best_send_time(
            request.message_type,
            event_data.get("start_datetime")
        )
        
        return CommunicationResponse(
            generated_content=message,
            suggested_subject=subject,
            best_send_time=best_time,
            target_audience_size=event_data.get("target_audience_size", 0)
        )
    
    @staticmethod
    def _calculate_best_send_time(message_type: str, event_datetime: datetime = None) -> datetime:
        """Calculate optimal send time based on message type and event timing"""
        now = datetime.utcnow()
        
        if message_type == "reminder" and event_datetime:
            # Send reminder 24 hours before event
            return event_datetime - timedelta(hours=24)
        elif message_type == "announcement":
            # Send announcements at 10 AM on weekdays
            next_weekday = now
            while next_weekday.weekday() >= 5:  # Skip weekends
                next_weekday += timedelta(days=1)
            return next_weekday.replace(hour=10, minute=0, second=0, microsecond=0)
        else:
            # Default: send at next 10 AM
            if now.hour >= 10:
                return (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
            return now.replace(hour=10, minute=0, second=0, microsecond=0)
    
    @staticmethod
    def generate_push_notification(event_data: Dict[str, Any], notification_type: str = "reminder") -> Dict[str, str]:
        """Generate short push notification"""
        templates = {
            "reminder": {
                "title": "⏰ Event Reminder",
                "body": f"{event_data.get('title')} starts soon! Don't miss it."
            },
            "checkin_open": {
                "title": "🎫 Check-in Open",
                "body": f"Check-in is now open for {event_data.get('title')}. Scan your QR code!"
            },
            "last_chance": {
                "title": "🔥 Last Chance!",
                "body": f"Only a few spots left for {event_data.get('title')}!"
            }
        }
        return templates.get(notification_type, templates["reminder"])
