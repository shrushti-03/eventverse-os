# Eventverse OS - Technical Visualization

## 🔄 1. Process Flow Diagram
*For Slide 6: This shows the end-to-end lifecycle of an event within the system.*

```mermaid
graph LR
    subgraph "Planning Phase"
        A[Input Idea] --> B{AI Engine}
        B --> C[AI Content]
        B --> D[Optimal Timing]
    end

    subgraph "Validation"
        C & D --> E[Conflict Radar]
        E --> F{Issues?}
        F -->|Yes| G[Resolution]
        G --> E
    end

    subgraph "Execution & Analytics"
        F -->|No| H[Deploy]
        H --> I[Auto-Comm]
        I --> J[QR Check-in]
        J --> K[Analytics]
    end
```

## 🏗️ 2. System Architecture Diagram
*For Slide 8: This illustrates the interaction between Next.js, FastAPI, and AI models.*

```mermaid
graph LR
    subgraph "Frontend (Next.js 14)"
        UI[User Interface]
        SC[Socket.io Client]
        API_C[Axios API Client]
    end

    subgraph "Backend (FastAPI)"
        API[REST Endpoints]
        WS[WebSocket Server]
        AUTH[JWT Security]
        
        subgraph "Intelligence Engine"
            GEMINI[Google Gemini Pro]
            ML[Turnout Predictor: RF+KNN]
            CONFLICT[Conflict Logic]
        end
    end

    subgraph "Data Layer"
        DB[(PostgreSQL/SQLite)]
        REDIS[Redis Cache]
    end

    UI <--> API_C
    API_C <--> API
    SC <--> WS
    API <--> AUTH
    API <--> GEMINI
    API <--> ML
    API <--> CONFLICT
    API <--> DB
    CONFLICT <--> REDIS
```

## 👥 3. Use Case Diagram
*Defining how different personas interact with the "Brain".*

```mermaid
graph TD
    Organizer((Organizer))
    Student((Student))
    Admin((Admin))

    subgraph "Eventverse OS"
        UC1(Plan Event with Gemini)
        UC2(Monitor Conflict Radar)
        UC3(Predict Turnout ML)
        UC4(Verify QR Attendance)
        UC5(Analyze Community Health)
    end

    Organizer --> UC1
    Organizer --> UC2
    Organizer --> UC3
    Student --> UC4
    Admin --> UC5
```

## 🖼️ 4. Wireframe Layout Map
*For Slide 7: This diagram explains the structural hierarchy of the AI Control Room UI.*

```mermaid
graph TD
    subgraph "Navigation (Left Sidebar)"
        S1[System Status & Branding]
        S2[Feature Navigation]
        S3[Admin Profile & Root Access]
    end

    subgraph "Core Interface (Main Panel)"
        subgraph "Header: Key Performance Indicators"
            T1[Event Count]
            T2[Attendance Stats]
            T3[Turnout Prediction]
            T4[AI Confidence Score]
        end
        
        subgraph "Analytics: Real-time Trends"
            C1[Engagement Area Chart]
            C2[Conflict Alert Feed]
        end
        
        subgraph "Sidebar: Temporal Stream"
            R1[Upcoming Event Timeline]
            R2[System Status Log]
        end
    end

    subgraph "Global Assistance"
        F1[Aura AI Chatbot]
    end

    S2 --> Header
    C2 --> F1
```

