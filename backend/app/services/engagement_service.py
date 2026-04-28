from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Any
from datetime import datetime, timedelta
from app.models.models import Event, Attendance, Club, User

class EngagementMeterService:
    """Community Health & Engagement Metrics Dashboard"""
    
    @staticmethod
    def get_community_health(db: Session) -> Dict[str, Any]:
        """Get overall community health metrics"""
        
        # Get date ranges
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        ninety_days_ago = now - timedelta(days=90)
        
        # Total events in last 30 days
        recent_events = db.query(Event).filter(
            Event.created_at >= thirty_days_ago
        ).count()
        
        # Total attendance in last 30 days
        recent_attendance = db.query(Attendance).filter(
            Attendance.created_at >= thirty_days_ago,
            Attendance.status == "checked_in"
        ).count()
        
        # Calculate average turnout rate
        events_with_attendance = db.query(Event).filter(
            Event.status == "completed",
            Event.created_at >= ninety_days_ago
        ).all()
        
        if events_with_attendance:
            turnout_rates = []
            for event in events_with_attendance:
                registered = db.query(Attendance).filter(
                    Attendance.event_id == event.id
                ).count()
                if registered > 0:
                    checked_in = db.query(Attendance).filter(
                        Attendance.event_id == event.id,
                        Attendance.status == "checked_in"
                    ).count()
                    turnout_rates.append(checked_in / registered)
            avg_turnout = sum(turnout_rates) / len(turnout_rates) if turnout_rates else 0
        else:
            avg_turnout = 0
        
        # Calculate engagement score (0-100)
        engagement_score = EngagementMeterService._calculate_engagement_score(
            recent_events, recent_attendance, avg_turnout
        )
        
        # Get inactive clubs (no events in 60 days)
        sixty_days_ago = now - timedelta(days=60)
        all_clubs = db.query(Club).all()
        inactive_clubs = []
        
        for club in all_clubs:
            recent_club_events = db.query(Event).filter(
                Event.created_at >= sixty_days_ago
                # Add club_id filter when available
            ).count()
            if recent_club_events == 0:
                inactive_clubs.append(club.name)
        
        # Calculate volunteer fatigue index
        volunteer_fatigue = EngagementMeterService._calculate_volunteer_fatigue(db)
        
        # Get trending categories
        trending = EngagementMeterService._get_trending_categories(db)
        
        return {
            "total_events": recent_events,
            "total_attendance": recent_attendance,
            "average_turnout_rate": round(avg_turnout * 100, 2),
            "engagement_score": engagement_score,
            "inactive_clubs": inactive_clubs[:5],  # Top 5
            "volunteer_fatigue_index": volunteer_fatigue,
            "trending_categories": trending,
            "health_status": EngagementMeterService._get_health_status(engagement_score),
            "period": "Last 30 days"
        }
    
    @staticmethod
    def get_event_engagement_details(db: Session, event_id: int) -> Dict[str, Any]:
        """Get detailed engagement metrics for a specific event"""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return {"error": "Event not found"}
        
        attendances = db.query(Attendance).filter(
            Attendance.event_id == event_id
        ).all()
        
        registered = len(attendances)
        checked_in = sum(1 for a in attendances if a.status == "checked_in")
        
        # Calculate engagement metrics
        metrics = {
            "event_id": event_id,
            "event_title": event.title,
            "registered": registered,
            "checked_in": checked_in,
            "turnout_rate": round((checked_in / registered * 100) if registered > 0 else 0, 2),
            "expected_vs_actual": {
                "predicted": event.predicted_turnout or 0,
                "actual": checked_in,
                "variance": checked_in - (event.predicted_turnout or 0)
            },
            "engagement_score": event.engagement_score or 0,
            "capacity_utilization": round((checked_in / event.max_capacity * 100) if event.max_capacity else 0, 2)
        }
        
        return metrics
    
    @staticmethod
    def get_heatmap_data(db: Session) -> List[Dict[str, Any]]:
        """Get data for engagement heatmap visualization"""
        # Get events grouped by day and hour
        events = db.query(Event).filter(
            Event.status.in_(["completed", "published"]),
            Event.start_datetime >= datetime.utcnow() - timedelta(days=90)
        ).all()
        
        heatmap = {}
        for event in events:
            day = event.start_datetime.strftime("%A")
            hour = event.start_datetime.hour
            key = f"{day}_{hour}"
            
            if key not in heatmap:
                heatmap[key] = {"day": day, "hour": hour, "count": 0, "total_attendance": 0}
            
            heatmap[key]["count"] += 1
            heatmap[key]["total_attendance"] += event.current_attendees or 0
        
        return list(heatmap.values())
    
    @staticmethod
    def _calculate_engagement_score(events: int, attendance: int, turnout_rate: float) -> float:
        """Calculate overall engagement score (0-100)"""
        # Weights for different factors
        event_score = min(events / 10, 1) * 30  # Max 30 points for events
        attendance_score = min(attendance / 500, 1) * 40  # Max 40 points for attendance
        turnout_score = turnout_rate * 30  # Max 30 points for turnout rate
        
        return round(event_score + attendance_score + turnout_score, 2)
    
    @staticmethod
    def _calculate_volunteer_fatigue(db: Session) -> float:
        """Calculate volunteer fatigue index (0-1, higher = more fatigue)"""
        # This would typically analyze volunteer participation patterns
        # For now, return a calculated estimate based on event frequency
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        events = db.query(Event).filter(
            Event.created_at >= thirty_days_ago
        ).count()
        
        # If more than 20 events in 30 days, fatigue is high
        fatigue = min(events / 20, 1)
        return round(fatigue, 2)
    
    @staticmethod
    def _get_trending_categories(db: Session) -> List[str]:
        """Get trending event categories"""
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        category_counts = db.query(
            Event.category,
            func.count(Event.id).label('count')
        ).filter(
            Event.created_at >= thirty_days_ago,
            Event.category.isnot(None)
        ).group_by(Event.category).order_by(func.count(Event.id).desc()).limit(5).all()
        
        return [c[0] for c in category_counts if c[0]]
    
    @staticmethod
    def _get_health_status(score: float) -> Dict[str, Any]:
        """Get health status based on engagement score"""
        if score >= 80:
            return {
                "status": "Excellent",
                "color": "green",
                "recommendation": "Keep up the great work! Community engagement is thriving."
            }
        elif score >= 60:
            return {
                "status": "Good",
                "color": "blue",
                "recommendation": "Engagement is healthy. Consider introducing new event types to boost further."
            }
        elif score >= 40:
            return {
                "status": "Fair",
                "color": "yellow",
                "recommendation": "Room for improvement. Focus on marketing and diverse event offerings."
            }
        else:
            return {
                "status": "Needs Attention",
                "color": "red",
                "recommendation": "Community engagement is low. Consider surveys to understand student interests."
            }
