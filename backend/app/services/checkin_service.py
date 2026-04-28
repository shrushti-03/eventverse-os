from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.models import Attendance, Event
from app.models.schemas import CheckInRequest, CheckInResponse

class QRCheckInService:
    """Handles QR code check-in and fraud detection"""
    
    # Track recent check-ins for fraud detection
    recent_checkins: Dict[str, List[Dict]] = {}
    
    @staticmethod
    def process_checkin(
        db: Session, 
        checkin_request: CheckInRequest
    ) -> CheckInResponse:
        # Check if event exists
        event = db.query(Event).filter(Event.id == checkin_request.event_id).first()
        if not event:
            return CheckInResponse(
                success=False,
                message="Event not found",
                fraud_detected=False
            )
        
        # Check if user is registered
        attendance = db.query(Attendance).filter(
            Attendance.event_id == checkin_request.event_id,
            Attendance.user_id == checkin_request.user_id
        ).first()
        
        if not attendance:
            return CheckInResponse(
                success=False,
                message="User is not registered for this event",
                fraud_detected=False
            )
        
        # Check if already checked in
        if attendance.status == "checked_in":
            return CheckInResponse(
                success=False,
                message="User has already checked in",
                fraud_detected=False
            )
        
        # Fraud detection
        fraud_result = QRCheckInService._detect_fraud(
            checkin_request.event_id,
            checkin_request.user_id,
            checkin_request.device_fingerprint,
            checkin_request.ip_address
        )
        
        if fraud_result["detected"]:
            return CheckInResponse(
                success=False,
                message="Check-in blocked due to suspicious activity",
                fraud_detected=True,
                fraud_reason=fraud_result["reason"]
            )
        
        # Process check-in
        attendance.status = "checked_in"
        attendance.check_in_time = datetime.utcnow()
        attendance.device_fingerprint = checkin_request.device_fingerprint
        attendance.ip_address = checkin_request.ip_address
        
        # Update event attendee count
        event.current_attendees = (event.current_attendees or 0) + 1
        
        db.commit()
        
        # Track this check-in
        QRCheckInService._track_checkin(
            checkin_request.event_id,
            checkin_request.device_fingerprint,
            checkin_request.ip_address
        )
        
        return CheckInResponse(
            success=True,
            message="Check-in successful!",
            check_in_time=attendance.check_in_time,
            fraud_detected=False
        )
    
    @staticmethod
    def _detect_fraud(
        event_id: int,
        user_id: int,
        device_fingerprint: Optional[str],
        ip_address: Optional[str]
    ) -> Dict[str, Any]:
        """
        Detects potential fraud using device/IP heuristics:
        - Multiple check-ins from same device
        - Rapid check-ins from same IP
        - Unusual patterns
        """
        event_key = f"event_{event_id}"
        
        if event_key not in QRCheckInService.recent_checkins:
            return {"detected": False, "reason": None}
        
        recent = QRCheckInService.recent_checkins[event_key]
        
        # Check for same device used for multiple check-ins
        if device_fingerprint:
            device_count = sum(1 for c in recent if c.get("device") == device_fingerprint)
            if device_count >= 3:
                return {
                    "detected": True,
                    "reason": "Multiple check-ins detected from the same device"
                }
        
        # Check for rapid check-ins from same IP (more than 5 in 1 minute)
        if ip_address:
            one_minute_ago = datetime.utcnow().timestamp() - 60
            ip_recent_count = sum(
                1 for c in recent 
                if c.get("ip") == ip_address and c.get("time", 0) > one_minute_ago
            )
            if ip_recent_count >= 5:
                return {
                    "detected": True,
                    "reason": "Too many check-ins from the same IP address in a short time"
                }
        
        return {"detected": False, "reason": None}
    
    @staticmethod
    def _track_checkin(event_id: int, device_fingerprint: str, ip_address: str):
        event_key = f"event_{event_id}"
        
        if event_key not in QRCheckInService.recent_checkins:
            QRCheckInService.recent_checkins[event_key] = []
        
        QRCheckInService.recent_checkins[event_key].append({
            "device": device_fingerprint,
            "ip": ip_address,
            "time": datetime.utcnow().timestamp()
        })
        
        # Keep only last 100 check-ins per event
        if len(QRCheckInService.recent_checkins[event_key]) > 100:
            QRCheckInService.recent_checkins[event_key] = \
                QRCheckInService.recent_checkins[event_key][-100:]

    @staticmethod
    def get_attendance_analytics(db: Session, event_id: int) -> Dict[str, Any]:
        """Get real-time attendance analytics for an event"""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return {"error": "Event not found"}
        
        attendances = db.query(Attendance).filter(
            Attendance.event_id == event_id
        ).all()
        
        registered = len(attendances)
        checked_in = sum(1 for a in attendances if a.status == "checked_in")
        no_show = registered - checked_in if event.status == "completed" else 0
        
        # Calculate peak check-in time
        checkin_times = [a.check_in_time for a in attendances if a.check_in_time]
        peak_time = None
        if checkin_times:
            # Group by hour and find the peak
            hour_counts = {}
            for t in checkin_times:
                hour = t.replace(minute=0, second=0, microsecond=0)
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            if hour_counts:
                peak_time = max(hour_counts, key=hour_counts.get)
        
        turnout_rate = (checked_in / registered * 100) if registered > 0 else 0
        
        return {
            "event_id": event_id,
            "event_title": event.title,
            "registered": registered,
            "checked_in": checked_in,
            "no_show": no_show,
            "turnout_rate": round(turnout_rate, 2),
            "peak_check_in_time": peak_time,
            "predicted_turnout": event.predicted_turnout,
            "prediction_accuracy": round(
                (checked_in / event.predicted_turnout * 100) if event.predicted_turnout else 0, 2
            )
        }
