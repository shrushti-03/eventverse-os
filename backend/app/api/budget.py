from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.schemas import BudgetRequest, BudgetResponse
from app.services.budget_service import BudgetPlannerService

router = APIRouter(prefix="/budget", tags=["AI Budget Planner"])

@router.post("/estimate", response_model=BudgetResponse)
async def estimate_budget(request: BudgetRequest):
    """
    AI-powered budget estimation and optimization.
    
    Provides:
    - Detailed cost breakdown
    - Cheaper alternatives
    - Optimization tips
    - Potential savings
    """
    budget = BudgetPlannerService.estimate_budget(request)
    return budget

@router.post("/optimize")
async def optimize_budget(
    current_budget: float,
    budget_breakdown: Dict[str, float],
    target_savings: float = 0.2
) -> Dict[str, Any]:
    """
    Optimize an existing budget to achieve target savings.
    
    Returns optimized breakdown with specific recommendations.
    """
    optimizations = []
    total_savings = 0
    optimized_breakdown = {}
    
    for category, amount in budget_breakdown.items():
        # Apply category-specific optimization rules
        if category.lower() in ["catering", "food"]:
            # 20% savings possible with cafeteria partnership
            savings = amount * 0.2
            optimized_breakdown[category] = amount - savings
            total_savings += savings
            optimizations.append({
                "category": category,
                "original": amount,
                "optimized": amount - savings,
                "savings": savings,
                "tip": "Partner with college cafeteria"
            })
        elif category.lower() in ["equipment", "av"]:
            # Use college equipment for free
            savings = amount * 0.8
            optimized_breakdown[category] = amount - savings
            total_savings += savings
            optimizations.append({
                "category": category,
                "original": amount,
                "optimized": amount - savings,
                "savings": savings,
                "tip": "Request college AV equipment"
            })
        elif category.lower() in ["certificates", "printing"]:
            # Digital alternatives
            savings = amount * 0.8
            optimized_breakdown[category] = amount - savings
            total_savings += savings
            optimizations.append({
                "category": category,
                "original": amount,
                "optimized": amount - savings,
                "savings": savings,
                "tip": "Switch to e-certificates"
            })
        else:
            optimized_breakdown[category] = amount
    
    return {
        "original_total": current_budget,
        "optimized_total": current_budget - total_savings,
        "total_savings": total_savings,
        "savings_percentage": round((total_savings / current_budget) * 100, 2),
        "optimizations": optimizations,
        "optimized_breakdown": optimized_breakdown,
        "target_achieved": total_savings >= (current_budget * target_savings)
    }

@router.get("/templates/{event_type}")
async def get_budget_template(event_type: str) -> Dict[str, Any]:
    """Get pre-built budget templates for common event types"""
    templates = {
        "technical": {
            "name": "Technical Event Budget Template",
            "typical_budget_range": {"min": 5000, "max": 25000},
            "categories": [
                {"name": "Venue", "percentage": 20},
                {"name": "Equipment (Projectors, Laptops)", "percentage": 25},
                {"name": "Refreshments", "percentage": 15},
                {"name": "Marketing", "percentage": 10},
                {"name": "Prizes/Certificates", "percentage": 15},
                {"name": "Miscellaneous", "percentage": 15}
            ]
        },
        "cultural": {
            "name": "Cultural Event Budget Template",
            "typical_budget_range": {"min": 10000, "max": 50000},
            "categories": [
                {"name": "Venue & Decorations", "percentage": 25},
                {"name": "Sound & Lighting", "percentage": 20},
                {"name": "Catering", "percentage": 20},
                {"name": "Marketing & Promotion", "percentage": 10},
                {"name": "Prizes & Awards", "percentage": 10},
                {"name": "Miscellaneous", "percentage": 15}
            ]
        },
        "workshop": {
            "name": "Workshop Budget Template",
            "typical_budget_range": {"min": 3000, "max": 15000},
            "categories": [
                {"name": "Trainer/Speaker Fees", "percentage": 30},
                {"name": "Venue", "percentage": 15},
                {"name": "Materials & Supplies", "percentage": 20},
                {"name": "Refreshments", "percentage": 15},
                {"name": "Certificates", "percentage": 10},
                {"name": "Miscellaneous", "percentage": 10}
            ]
        },
        "sports": {
            "name": "Sports Event Budget Template",
            "typical_budget_range": {"min": 8000, "max": 30000},
            "categories": [
                {"name": "Venue & Ground", "percentage": 20},
                {"name": "Equipment & Supplies", "percentage": 25},
                {"name": "Refreshments & First Aid", "percentage": 15},
                {"name": "Prizes & Trophies", "percentage": 20},
                {"name": "Marketing", "percentage": 10},
                {"name": "Miscellaneous", "percentage": 10}
            ]
        }
    }
    
    template = templates.get(event_type.lower())
    if not template:
        raise HTTPException(
            status_code=404, 
            detail=f"Template not found. Available: {list(templates.keys())}"
        )
    
    return template
