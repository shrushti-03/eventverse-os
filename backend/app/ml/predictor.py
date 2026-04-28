import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import os
import random
from dotenv import load_dotenv

load_dotenv()

# Optional: Try importing google generative AI (handle deprecation gracefully)
genai = None
try:
    import google.generativeai as genai_module
    genai_module.configure(api_key=os.getenv("GEMINI_API_KEY"))
    genai = genai_module
except ImportError:
    pass
except Exception:
    pass

class TurnoutPredictor:
    """ML-based turnout prediction using Random Forest and KNN"""
    
    def __init__(self):
        self.rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.knn_model = KNeighborsRegressor(n_neighbors=5)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        
        # Generate synthetic training data
        self._train_with_synthetic_data()
    
    def _train_with_synthetic_data(self):
        """Train with synthetic historical data"""
        np.random.seed(42)
        n_samples = 500
        
        # Features: day_of_week, hour, month, category_encoded, duration_hours, 
        # capacity, marketing_score, is_weekend, is_exam_period
        
        categories = ["technical", "cultural", "sports", "workshop", "seminar", "competition"]
        self.label_encoders["category"] = LabelEncoder()
        self.label_encoders["category"].fit(categories)
        
        X = []
        y = []
        
        for _ in range(n_samples):
            day_of_week = random.randint(0, 6)
            hour = random.randint(8, 20)
            month = random.randint(1, 12)
            category = random.choice(categories)
            category_encoded = self.label_encoders["category"].transform([category])[0]
            duration = random.uniform(1, 8)
            capacity = random.choice([50, 100, 150, 200, 300, 500])
            marketing_score = random.uniform(0, 1)
            is_weekend = 1 if day_of_week >= 5 else 0
            is_exam_period = 1 if month in [4, 5, 11, 12] else 0
            
            # Generate target (turnout rate)
            base_rate = 0.6
            
            # Adjustments
            if is_weekend:
                base_rate -= 0.1
            if is_exam_period:
                base_rate -= 0.2
            if hour in [10, 11, 14, 15, 16]:  # Good hours
                base_rate += 0.1
            if category in ["cultural", "sports"]:
                base_rate += 0.1
            if marketing_score > 0.7:
                base_rate += 0.15
            
            # Add noise
            turnout_rate = max(0.1, min(1.0, base_rate + random.gauss(0, 0.1)))
            turnout = int(capacity * turnout_rate)
            
            X.append([day_of_week, hour, month, category_encoded, duration, 
                     capacity, marketing_score, is_weekend, is_exam_period])
            y.append(turnout)
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train models
        self.rf_model.fit(X_scaled, y)
        self.knn_model.fit(X_scaled, y)
        self.is_trained = True
    
    def predict_turnout(
        self,
        event_datetime: datetime,
        category: str,
        duration_hours: float,
        capacity: int,
        marketing_score: float = 0.5
    ) -> Dict[str, Any]:
        """Predict turnout for an event"""
        
        if category not in self.label_encoders["category"].classes_:
            category = "seminar"  # Default
        
        # Extract features
        day_of_week = event_datetime.weekday()
        hour = event_datetime.hour
        month = event_datetime.month
        category_encoded = self.label_encoders["category"].transform([category])[0]
        is_weekend = 1 if day_of_week >= 5 else 0
        is_exam_period = 1 if month in [4, 5, 11, 12] else 0
        
        X = np.array([[day_of_week, hour, month, category_encoded, duration_hours,
                      capacity, marketing_score, is_weekend, is_exam_period]])
        X_scaled = self.scaler.transform(X)
        
        # Get predictions from both models
        rf_pred = self.rf_model.predict(X_scaled)[0]
        knn_pred = self.knn_model.predict(X_scaled)[0]
        
        # Ensemble prediction (weighted average)
        final_pred = int(0.7 * rf_pred + 0.3 * knn_pred)
        final_pred = max(5, min(capacity, final_pred))
        
        # Calculate confidence based on model agreement
        diff = abs(rf_pred - knn_pred)
        confidence = max(0.5, 1 - (diff / capacity))
        
        return {
            "predicted_turnout": final_pred,
            "turnout_range": {
                "low": max(5, int(final_pred * 0.8)),
                "high": min(capacity, int(final_pred * 1.2))
            },
            "confidence": round(confidence, 2),
            "factors": self._get_factors(day_of_week, hour, month, is_exam_period, marketing_score)
        }
    
    def _get_factors(self, day, hour, month, is_exam, marketing):
        """Get factors affecting prediction"""
        factors = []
        
        if day >= 5:
            factors.append({"factor": "Weekend", "impact": "negative", "description": "Lower attendance expected on weekends"})
        if hour < 9 or hour > 18:
            factors.append({"factor": "Off-peak hours", "impact": "negative", "description": "Early morning or late evening times have lower attendance"})
        if is_exam:
            factors.append({"factor": "Exam period", "impact": "negative", "description": "Students focus on exams during this period"})
        if marketing > 0.7:
            factors.append({"factor": "Good marketing", "impact": "positive", "description": "Strong promotional campaign expected to boost turnout"})
        if hour in [10, 11, 14, 15, 16]:
            factors.append({"factor": "Optimal timing", "impact": "positive", "description": "Peak hours for student availability"})
        
        return factors


class EventSuggestionEngine:
    """AI-powered event suggestions"""
    
    # Event title templates by category
    TITLE_TEMPLATES = {
        "technical": [
            "{topic} Workshop",
            "{topic} Hackathon",
            "Tech Talk: {topic}",
            "{topic} Bootcamp",
            "Code Sprint: {topic}"
        ],
        "cultural": [
            "{topic} Festival",
            "Cultural Night: {topic}",
            "{topic} Showcase",
            "Talent Hunt: {topic}",
            "{topic} Competition"
        ],
        "sports": [
            "{topic} Tournament",
            "{topic} Championship",
            "Sports Day: {topic}",
            "{topic} League",
            "{topic} Challenge"
        ],
        "workshop": [
            "{topic} Masterclass",
            "Hands-on {topic}",
            "{topic} Training",
            "Learn {topic}",
            "{topic} Skill Session"
        ],
        "seminar": [
            "{topic} Seminar",
            "Guest Lecture: {topic}",
            "{topic} Conference",
            "Panel Discussion: {topic}",
            "{topic} Symposium"
        ]
    }
    
    # Description templates
    DESCRIPTION_TEMPLATES = [
        "Join us for an exciting {event_type} focused on {topic}. This event will feature {highlights} and is perfect for {audience}.",
        "Don't miss this incredible opportunity to explore {topic}! Our {event_type} brings together {highlights} for an unforgettable experience.",
        "Calling all {audience}! Experience the best of {topic} at our upcoming {event_type}. Expect {highlights} and much more!",
        "Be part of something amazing! Our {event_type} on {topic} promises {highlights}. Perfect for {audience} looking to {goal}."
    ]
    
    HIGHLIGHTS_BY_CATEGORY = {
        "technical": ["hands-on coding sessions", "industry experts", "networking opportunities", "project demonstrations"],
        "cultural": ["live performances", "artistic displays", "cultural exchange", "traditional showcases"],
        "sports": ["competitive matches", "professional coaching", "team building activities", "prizes and awards"],
        "workshop": ["practical exercises", "skill development", "certification", "expert guidance"],
        "seminar": ["keynote speakers", "interactive sessions", "Q&A panels", "industry insights"]
    }
    
    def suggest_event(
        self,
        event_type: str,
        topic: str,
        target_audience: str = "students",
        preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate AI suggestions for event planning"""
        
        preferences = preferences or {}
        
        # Try real LLM if API Key is available and genai is loaded
        if genai and os.getenv("GEMINI_API_KEY"):
            try:
                model = genai.GenerativeModel('gemini-pro')
                prompt = f"""
                Generate an event plan for a {event_type} event.
                Topic: {topic}
                Target Audience: {target_audience}
                Capacity: {preferences.get('expected_attendees', 100)}
                
                Respond ONLY with a JSON object containing:
                - title_suggestions: list of 3 creative strings
                - description: a 2-sentence compelling narrative
                - tags: list of 4 relevant tags
                """
                response = model.generate_content(prompt)
                import json
                # Extract JSON from response text (basic cleaning)
                clean_text = response.text.strip().replace("```json", "").replace("```", "")
                ai_data = json.loads(clean_text)
                
                return {
                    "title_suggestions": ai_data.get("title_suggestions", []),
                    "description": ai_data.get("description", ""),
                    "recommended_dates": self._suggest_optimal_dates(event_type, preferences),
                    "recommended_venue": self._suggest_venue(event_type, preferences.get("expected_attendees", 100)),
                    "estimated_duration": self._estimate_duration(event_type),
                    "tags": ai_data.get("tags", [])
                }
            except Exception as e:
                print(f"AI Generation Error: {e}")

        # High-Fidelity Fallback Logic (if LLM fails or no key)
        prefixes = ["Universal", "Global", "Next-Gen", "Advanced", "Elite", "Future"]
        suffixes = ["Summit", "Exchange", "Symposium", "Lab", "Masterclass", "Collab"]
        
        selected_topic = topic if topic and topic != event_type else random.choice(["Sustainability", "Bio-Tech", "Digital Ethics", "Quantum Leap"])
        
        title_suggestions = [
            f"{random.choice(prefixes)} {selected_topic} {random.choice(suffixes)}",
            f"{selected_topic} {random.choice(suffixes)}: 2026 Edition",
            f"The {selected_topic} {random.choice(suffixes)}"
        ]
        
        description = f"Experience an immersive {event_type} sequence exploring the frontiers of {selected_topic}. Collaborative engineering for the {target_audience} community."
        
        return {
            "title_suggestions": title_suggestions,
            "description": description,
            "recommended_dates": self._suggest_optimal_dates(event_type, preferences),
            "recommended_venue": self._suggest_venue(event_type, preferences.get("expected_attendees", 100)),
            "estimated_duration": self._estimate_duration(event_type),
            "tags": [event_type, selected_topic.lower(), "innovation"]
        }
    
    def _suggest_optimal_dates(self, event_type: str, preferences: Dict) -> List[Dict[str, Any]]:
        """Suggest optimal dates avoiding conflicts"""
        suggestions = []
        base_date = datetime.now() + timedelta(days=14)  # Start from 2 weeks ahead
        
        # Good hours by event type
        good_hours = {
            "technical": [10, 14],
            "cultural": [17, 18],
            "sports": [8, 16],
            "workshop": [10, 14],
            "seminar": [11, 15]
        }
        
        hours = good_hours.get(event_type, [10, 14])
        
        for i in range(3):
            date = base_date + timedelta(days=i * 7)
            # Skip weekends for most events
            while date.weekday() >= 5 and event_type not in ["cultural", "sports"]:
                date += timedelta(days=1)
            
            for hour in hours:
                suggestions.append({
                    "datetime": date.replace(hour=hour, minute=0),
                    "reason": f"Good timing for {event_type} events",
                    "expected_availability": "high"
                })
        
        return suggestions[:3]
    
    def _suggest_venue(self, event_type: str, expected_attendees: int) -> Dict[str, Any]:
        """Suggest appropriate venue"""
        venues = {
            "technical": ["Computer Lab", "Seminar Hall", "Auditorium"],
            "cultural": ["Auditorium", "Open Air Theatre", "Main Ground"],
            "sports": ["Sports Complex", "Main Ground", "Indoor Stadium"],
            "workshop": ["Workshop Hall", "Lab", "Conference Room"],
            "seminar": ["Seminar Hall", "Auditorium", "Conference Room"]
        }
        
        venue_list = venues.get(event_type, ["Seminar Hall"])
        
        if expected_attendees > 300:
            recommended = "Auditorium"
        elif expected_attendees > 100:
            recommended = venue_list[1] if len(venue_list) > 1 else venue_list[0]
        else:
            recommended = venue_list[0]
        
        return {
            "recommended": recommended,
            "alternatives": venue_list,
            "capacity_needed": expected_attendees
        }
    
    def _estimate_duration(self, event_type: str) -> Dict[str, float]:
        """Estimate event duration"""
        durations = {
            "technical": {"min": 3, "recommended": 6, "max": 8},
            "cultural": {"min": 2, "recommended": 4, "max": 6},
            "sports": {"min": 2, "recommended": 4, "max": 8},
            "workshop": {"min": 2, "recommended": 3, "max": 4},
            "seminar": {"min": 1, "recommended": 2, "max": 3}
        }
        return durations.get(event_type, {"min": 2, "recommended": 3, "max": 4})


# Initialize global instances
turnout_predictor = TurnoutPredictor()
suggestion_engine = EventSuggestionEngine()
