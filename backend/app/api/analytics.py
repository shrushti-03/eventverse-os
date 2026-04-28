from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.services.engagement_service import EngagementMeterService

router = APIRouter(prefix="/analytics", tags=["Community Health & Analytics"])

@router.get("/community-health")
async def get_community_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get overall community health and engagement metrics.
    
    Returns:
    - Total events and attendance
    - Average turnout rate
    - Engagement score (0-100)
    - Inactive clubs list
    - Volunteer fatigue index
    - Trending categories
    - Health status with recommendations
    """
    return EngagementMeterService.get_community_health(db)

@router.get("/event/{event_id}")
async def get_event_engagement(
    event_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed engagement metrics for a specific event"""
    return EngagementMeterService.get_event_engagement_details(db, event_id)

@router.get("/heatmap")
async def get_engagement_heatmap(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get heatmap data for engagement visualization.
    
    Returns data grouped by day and hour showing event frequency
    and total attendance.
    """
    return EngagementMeterService.get_heatmap_data(db)

@router.get("/dashboard-summary")
async def get_dashboard_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get complete dashboard summary with all key metrics.
    
    Combines community health, recent events, and quick stats
    for the main dashboard display.
    """
    health = EngagementMeterService.get_community_health(db)
    heatmap = EngagementMeterService.get_heatmap_data(db)
    
    # Find peak times from heatmap
    peak_time = None
    max_attendance = 0
    for item in heatmap:
        if item.get("total_attendance", 0) > max_attendance:
            max_attendance = item["total_attendance"]
            peak_time = f"{item['day']} at {item['hour']}:00"
    
    return {
        "health_metrics": health,
        "peak_engagement_time": peak_time,
        "quick_stats": {
            "engagement_score": health["engagement_score"],
            "status": health["health_status"]["status"],
            "trending": health["trending_categories"][:3] if health["trending_categories"] else [],
            "alerts": len(health["inactive_clubs"])
        },
        "heatmap_data": heatmap
    }
