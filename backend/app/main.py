from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
from typing import List, Dict

from app.database import Base, engine
from app.api import auth, events, checkin, budget, communication, analytics, chatbot
from app.config import settings

# Create tables
Base.metadata.create_all(bind=engine)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
    
    async def broadcast(self, message: dict, room: str):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 EVENTVERSE OS Starting...")
    print("📊 AI/ML Models initialized")
    yield
    # Shutdown
    print("👋 EVENTVERSE OS Shutting down...")

app = FastAPI(
    title="EVENTVERSE OS",
    description="""
    ## The AI Control Room for College Events
    
    **"Events don't need managers. They need a Brain."**
    
    ### Features:
    
    1. **Smart Event Planner** - AI-powered event creation with title/description suggestions and turnout prediction
    2. **Conflict Radar** - Instant alerts for venue/time conflicts, exam periods, and overlapping audiences
    3. **Community Health & Engagement Meter** - Dynamic dashboard with engagement scores and analytics
    4. **AI Budget Planner** - Smart budget estimation with optimization tips
    5. **Auto-Pilot Communication** - NLP-generated messages for WhatsApp, Email, Instagram
    6. **QR Check-in + Attendance Analytics** - Secure check-in with fraud detection
    
    ### Tech Stack:
    - **Backend**: Python (FastAPI)
    - **Real-Time**: WebSockets
    - **AI/ML**: Scikit-learn (Random Forest, KNN)
    - **Database**: SQLite/PostgreSQL
    
    ---
    Built by **CODING AGENTS** 🚀
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(checkin.router)
app.include_router(budget.router)
app.include_router(communication.router)
app.include_router(analytics.router)
app.include_router(chatbot.router)

@app.get("/")
async def root():
    return {
        "name": "EVENTVERSE OS",
        "tagline": "Events don't need managers. They need a Brain.",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "Smart Event Planner",
            "Conflict Radar",
            "Community Health & Engagement Meter",
            "AI Budget Planner",
            "Auto-Pilot Communication",
            "QR Check-in + Attendance Analytics"
        ],
        "docs": "/docs",
        "team": "CODING AGENTS"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EVENTVERSE OS"}

# WebSocket endpoints for real-time updates
@app.websocket("/ws/event/{event_id}")
async def websocket_event_updates(websocket: WebSocket, event_id: int):
    """Real-time event updates (attendance, check-ins, etc.)"""
    room = f"event_{event_id}"
    await manager.connect(websocket, room)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Broadcast to all connected clients
            await manager.broadcast({
                "type": "update",
                "event_id": event_id,
                "data": message
            }, room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)

@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """Real-time dashboard updates"""
    await manager.connect(websocket, "dashboard")
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(json.loads(data), "dashboard")
    except WebSocketDisconnect:
        manager.disconnect(websocket, "dashboard")

# Helper function to broadcast updates (can be called from services)
async def broadcast_event_update(event_id: int, update_type: str, data: dict):
    await manager.broadcast({
        "type": update_type,
        "event_id": event_id,
        "data": data
    }, f"event_{event_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
