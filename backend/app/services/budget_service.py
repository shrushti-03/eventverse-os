from typing import Dict, List, Any
from app.models.schemas import BudgetRequest, BudgetResponse, BudgetItem

class BudgetPlannerService:
    """AI-powered budget planning and optimization"""
    
    # Base cost estimates per category
    BASE_COSTS = {
        "venue": {
            "auditorium": 5000,
            "seminar_hall": 2000,
            "open_ground": 3000,
            "classroom": 500,
            "online": 0
        },
        "catering": {
            "per_person_snacks": 100,
            "per_person_lunch": 250,
            "per_person_dinner": 350,
            "per_person_beverages": 50
        },
        "marketing": {
            "posters_printing": 500,
            "social_media_ads": 1000,
            "banners": 1500,
            "standees": 800
        },
        "equipment": {
            "projector_rental": 500,
            "sound_system": 1500,
            "lighting": 2000,
            "photography": 3000,
            "videography": 5000
        },
        "miscellaneous": {
            "stationary": 300,
            "decorations": 1000,
            "certificates": 50,  # per certificate
            "goodies_per_person": 100
        }
    }
    
    # Cheaper alternatives
    ALTERNATIVES = {
        "auditorium": [
            {"item": "Open Ground", "savings": 2000},
            {"item": "Seminar Hall", "savings": 3000}
        ],
        "catering": [
            {"item": "In-house cafeteria", "savings_percent": 20},
            {"item": "Student-made refreshments", "savings_percent": 50}
        ],
        "photography": [
            {"item": "Photography Club volunteers", "savings": 2500},
            {"item": "Student photographers", "savings": 2000}
        ],
        "sound_system": [
            {"item": "College AV equipment", "savings": 1000}
        ]
    }
    
    @staticmethod
    def estimate_budget(request: BudgetRequest) -> BudgetResponse:
        breakdown = []
        total = 0
        optimization_tips = []
        savings_potential = 0
        
        # Venue cost
        venue_type = BudgetPlannerService._determine_venue_type(
            request.venue, 
            request.expected_attendees
        )
        venue_cost = BudgetPlannerService.BASE_COSTS["venue"].get(venue_type, 2000)
        breakdown.append(BudgetItem(
            category="Venue",
            item=venue_type.replace("_", " ").title(),
            estimated_cost=venue_cost,
            quantity=1,
            total=venue_cost,
            alternatives=BudgetPlannerService.ALTERNATIVES.get(venue_type, [])
        ))
        total += venue_cost
        
        # Catering
        if "food" in request.requirements or "catering" in request.requirements:
            catering_cost = request.expected_attendees * \
                BudgetPlannerService.BASE_COSTS["catering"]["per_person_snacks"]
            breakdown.append(BudgetItem(
                category="Catering",
                item="Snacks & Refreshments",
                estimated_cost=100,
                quantity=request.expected_attendees,
                total=catering_cost,
                alternatives=[
                    {"item": "In-house cafeteria", "savings_percent": 20}
                ]
            ))
            total += catering_cost
            savings_potential += catering_cost * 0.2
            optimization_tips.append("Consider partnering with college cafeteria for 20% savings on catering")
        
        # Marketing
        marketing_cost = BudgetPlannerService.BASE_COSTS["marketing"]["posters_printing"]
        if request.expected_attendees > 100:
            marketing_cost += BudgetPlannerService.BASE_COSTS["marketing"]["social_media_ads"]
        breakdown.append(BudgetItem(
            category="Marketing",
            item="Posters & Promotion",
            estimated_cost=marketing_cost,
            quantity=1,
            total=marketing_cost,
            alternatives=[
                {"item": "Digital-only promotion", "savings": 500}
            ]
        ))
        total += marketing_cost
        
        # Equipment
        if "av_equipment" in request.requirements or request.expected_attendees > 50:
            equip_cost = BudgetPlannerService.BASE_COSTS["equipment"]["projector_rental"] + \
                        BudgetPlannerService.BASE_COSTS["equipment"]["sound_system"]
            breakdown.append(BudgetItem(
                category="Equipment",
                item="AV Equipment (Projector + Sound)",
                estimated_cost=equip_cost,
                quantity=1,
                total=equip_cost,
                alternatives=[
                    {"item": "College AV equipment (free)", "savings": equip_cost}
                ]
            ))
            total += equip_cost
            savings_potential += equip_cost
            optimization_tips.append("Request college AV equipment through official channels to save on rentals")
        
        # Photography
        if "photography" in request.requirements:
            photo_cost = BudgetPlannerService.BASE_COSTS["equipment"]["photography"]
            breakdown.append(BudgetItem(
                category="Documentation",
                item="Photography",
                estimated_cost=photo_cost,
                quantity=1,
                total=photo_cost,
                alternatives=BudgetPlannerService.ALTERNATIVES.get("photography", [])
            ))
            total += photo_cost
            savings_potential += 2500
            optimization_tips.append("Reach out to Photography Club for volunteer photographers")
        
        # Certificates
        if "certificates" in request.requirements:
            cert_cost = request.expected_attendees * \
                BudgetPlannerService.BASE_COSTS["miscellaneous"]["certificates"]
            breakdown.append(BudgetItem(
                category="Certificates",
                item="Participation Certificates",
                estimated_cost=50,
                quantity=request.expected_attendees,
                total=cert_cost,
                alternatives=[
                    {"item": "E-certificates", "savings_percent": 80}
                ]
            ))
            total += cert_cost
            savings_potential += cert_cost * 0.8
            optimization_tips.append("Switch to e-certificates for 80% savings and eco-friendly approach")
        
        # Miscellaneous (10% buffer)
        misc_cost = total * 0.1
        breakdown.append(BudgetItem(
            category="Miscellaneous",
            item="Contingency Buffer (10%)",
            estimated_cost=misc_cost,
            quantity=1,
            total=misc_cost,
            alternatives=[]
        ))
        total += misc_cost
        
        # Add general optimization tips
        if total > 10000:
            optimization_tips.append("Consider sponsorships from local businesses to offset costs")
        if request.expected_attendees > 200:
            optimization_tips.append("Large events qualify for institutional funding - check with administration")
        
        return BudgetResponse(
            total_estimated=round(total, 2),
            breakdown=breakdown,
            optimization_tips=optimization_tips,
            savings_potential=round(savings_potential, 2)
        )
    
    @staticmethod
    def _determine_venue_type(venue: str, attendees: int) -> str:
        if venue:
            venue_lower = venue.lower()
            if "auditorium" in venue_lower:
                return "auditorium"
            elif "seminar" in venue_lower:
                return "seminar_hall"
            elif "ground" in venue_lower or "outdoor" in venue_lower:
                return "open_ground"
            elif "online" in venue_lower or "virtual" in venue_lower:
                return "online"
        
        # Auto-suggest based on attendees
        if attendees > 300:
            return "auditorium"
        elif attendees > 100:
            return "seminar_hall"
        elif attendees > 50:
            return "open_ground"
        else:
            return "classroom"
