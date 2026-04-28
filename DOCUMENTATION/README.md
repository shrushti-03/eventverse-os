# EVENTVERSE OS

## The AI Control Room for College Events

> **"Events don't need managers. They need a Brain."**

EVENTVERSE OS is an intelligent operating system for event organizers that leverages advanced AI and machine learning to provide a real-time command center, transforming chaotic planning into seamless execution.

![EVENTVERSE OS](./docs/banner.png)

## 🚀 Features

### 1. Smart Event Planner
AI assists in event creation by suggesting titles, descriptions (using NLP), and predicting turnout with ML models. It also recommends optimal dates and times, preventing clashes based on historical data, exam schedules, and venue availability.

### 2. Conflict Radar
Our killer feature provides instant alerts for potential conflicts:
- Same venue/time booking
- Overlapping target audiences
- Conflicts with exams/holidays

This proactive system minimizes last-minute issues, ensuring smooth operations.

### 3. Community Health & Engagement Meter
A dynamic dashboard visualizes key metrics:
- Event engagement scores
- Expected vs. actual turnout
- Inactive users/clubs
- Volunteer fatigue
- All displayed through intuitive charts and heatmaps

### 4. AI Budget Planner
AI estimates and optimizes an event's full budget:
- Recommending costs
- Swapping cheaper vendors
- Flagging unnecessary spend
- Producing a clean, shareable budget breakdown

### 5. Auto-Pilot Communication
Generate targeted communication automatically across platforms:
- WhatsApp
- Instagram
- Email
- Push Notifications

Our NLP text generator crafts engaging messages, reminders, and push notifications.

### 6. QR Check-in + Attendance Analytics
Secure QR code check-in for each event:
- Detects fake scans using device/IP heuristics
- Real-time turnout analytics
- Immediate insights into attendance rates

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Styling:** Tailwind CSS
- **Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Core API:** Python (FastAPI)
- **Real-Time Engine:** WebSockets
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Caching:** Redis

### AI & Machine Learning
- **Prediction Models:** Scikit-learn (Random Forest, KNN)
- **NLP/Text Generation:** Custom templates with future OpenAI/HuggingFace integration

### Tools & Utilities
- **QR System:** qrcode (Python) + html5-qrcode (Scanner)
- **Authentication:** JWT
- **Deployment:** Vercel (Frontend) + Render/Railway (Backend)

## 📁 Project Structure

```
eventverse-os/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── events.py        # Event CRUD & AI features
│   │   │   ├── checkin.py       # QR check-in system
│   │   │   ├── budget.py        # Budget planner
│   │   │   ├── communication.py # Auto-pilot messaging
│   │   │   └── analytics.py     # Community health metrics
│   │   ├── models/
│   │   │   ├── models.py        # SQLAlchemy models
│   │   │   └── schemas.py       # Pydantic schemas
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── event_service.py
│   │   │   ├── checkin_service.py
│   │   │   ├── budget_service.py
│   │   │   ├── communication_service.py
│   │   │   └── engagement_service.py
│   │   ├── ml/
│   │   │   └── predictor.py     # ML models for predictions
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EventsPage.tsx
│   │   │   ├── CreateEvent.tsx
│   │   │   ├── ConflictRadar.tsx
│   │   │   ├── BudgetPlanner.tsx
│   │   │   ├── Communication.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── QRCheckIn.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd eventverse-os/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment file and configure:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API Documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd eventverse-os/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for the interactive Swagger documentation.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/token` | POST | Login and get token |
| `/events/` | GET/POST | List/Create events |
| `/events/suggest` | POST | Get AI event suggestions |
| `/events/predict-turnout` | POST | Predict event turnout |
| `/events/check-conflicts` | POST | Check for conflicts |
| `/checkin/` | POST | Process QR check-in |
| `/checkin/analytics/{id}` | GET | Get attendance analytics |
| `/budget/estimate` | POST | Estimate event budget |
| `/communication/generate` | POST | Generate AI messages |
| `/analytics/community-health` | GET | Get engagement metrics |

## 🧠 ML Models

### Turnout Predictor
Uses an ensemble of Random Forest and KNN models trained on synthetic event data to predict attendance based on:
- Day of week and hour
- Event category
- Duration
- Historical marketing effectiveness
- Exam period detection

### Event Suggestion Engine
Generates intelligent event recommendations including:
- Title suggestions by category
- Description generation
- Optimal date/time recommendations
- Venue suggestions based on capacity

## 🎨 Screenshots

### Dashboard
![Dashboard](./docs/dashboard.png)

### Conflict Radar
![Conflict Radar](./docs/conflicts.png)

### Budget Planner
![Budget Planner](./docs/budget.png)

## 👥 Team

**CODING AGENTS**
- Shrushti Panchal (Team Leader)
- Krushnang Nivendkar
- Tejas Mestry
- Sukesh Kotian

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by CODING AGENTS
