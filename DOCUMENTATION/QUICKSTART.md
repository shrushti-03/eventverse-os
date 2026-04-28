# 🚀 Eventverse OS - Quick Start Guide

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed (for backend)
- npm or yarn package manager

---

## 🎯 Launch the Application

### Option 1: Frontend Only (Recommended for Testing)
The frontend now works independently with localStorage!

```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:3000**

### Option 2: Full Stack (Frontend + Backend)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:3000**

---

## 🧪 Testing All Features

### 1. Dashboard (Landing Page)
✅ Real-time stats
✅ Live attendance charts
✅ Upcoming events
✅ Engagement score
✅ Community health

**Test:**
- Observe the dashboard loads with clean slate
- Stats should be 0 or minimal initially
- Create events and watch dashboard update within 5 seconds

---

### 2. Create Event
✅ AI-powered suggestions
✅ Varied event titles (60+ options)
✅ Smart predictions
✅ Conflict warnings

**Test Steps:**
1. Click "Create Event" in sidebar
2. Select a category (e.g., "Technical")
3. Click "AI Suggestions" button
4. Observe unique title and description
5. Click again → Different suggestion
6. Fill in date, time, venue
7. Submit event
8. See success message
9. Navigate to Events page → Event appears

**Try Different Categories:**
- Technical → Programming/AI events
- Cultural → Arts/Music events
- Sports → Athletic competitions
- Workshop → Skill-building sessions
- Seminar → Talks/Lectures
- Competition → Challenges/Contests

---

### 3. Events Page
✅ Grid and List views
✅ Search functionality
✅ Status filtering
✅ Event deletion
✅ Real-time updates

**Test Steps:**
1. Create 5+ events
2. Use search bar → Find events
3. Filter by status
4. Switch between grid/list view
5. Delete an event
6. Confirm it's removed from all pages

---

### 4. Conflict Radar
✅ Dynamic conflict detection
✅ Smart notifications
✅ Venue overlap detection
✅ Exam period warnings

**Test Steps:**
1. Sidebar shows 0 conflicts initially
2. Create two events:
   - Event A: "Workshop" | Venue: "Seminar Hall A" | April 5, 2026, 10:00-12:00
   - Event B: "Tech Talk" | Venue: "Seminar Hall A" | April 5, 2026, 11:00-13:00
3. Sidebar badge shows "1" conflict
4. Go to Conflict Radar tab
5. See detailed conflict description
6. Click "Resolve" or "Reschedule"
7. Sidebar count decreases

**Create Exam Period Conflict:**
- Create event on April 20, 2026
- See exam period warning (April 15 - May 5)

---

### 5. Analytics
✅ Real-time charts
✅ Category performance
✅ Engagement metrics
✅ Top events ranking

**Test Steps:**
1. Create 10+ events across different:
   - Categories
   - Dates (spread across months)
   - Venues
2. Go to Analytics tab
3. Observe all charts populate with real data
4. Change time range dropdown
5. Charts update dynamically

**Check:**
- Attendance trend shows real numbers
- Category performance reflects your events
- Top events ranked correctly
- Engagement by day shows patterns

---

### 6. Real-time Synchronization

**Test in Multiple Tabs:**
1. Open app in 2 browser tabs
2. In Tab 1: Create an event
3. In Tab 2: Watch dashboard update (within 5s)
4. In Tab 1: Delete an event
5. In Tab 2: See it disappear from Events page

**Expected Behavior:**
- Dashboard: Updates every 5 seconds
- Conflict Radar: Updates every 3 seconds
- Analytics: Updates every 10 seconds
- All components: Instant on storage event

---

## 🎨 UI/UX Features to Explore

### Dark Theme Elements
- **Cards:** Hover to see lift + glow effect
- **Buttons:** Watch gradient shimmer on hover
- **Inputs:** Focus to see blue glow
- **Loading:** Beautiful animated loader
- **Badges:** Color-coded status indicators

### Animations
- Page transitions: Smooth fade-in
- Card hovers: 8px lift + scale
- Buttons: Shimmer effect
- Notifications: Pulse glow
- Charts: Smooth data transitions

---

## 📊 Sample Testing Workflow

### Complete Feature Test (15 minutes)

**Phase 1: Setup (2 min)**
1. Launch app
2. Observe clean dashboard
3. Check sidebar (0 conflicts)

**Phase 2: Create Events (5 min)**
1. Create "AI Workshop" - Technical - April 5, 10:00-12:00 - Seminar Hall A
2. Create "Coding Challenge" - Technical - April 5, 11:00-14:00 - Seminar Hall A (CONFLICT!)
3. Create "Cultural Fest" - Cultural - April 10, 18:00-22:00 - Main Auditorium
4. Create "Sports Day" - Sports - April 15, 08:00-18:00 - Sports Ground
5. Create "Career Seminar" - Seminar - April 20, 14:00-17:00 - Conference Room

**Phase 3: Test AI Variety (3 min)**
1. Go to Create Event
2. Select "Cultural"
3. Click AI Suggestions 5 times
4. Note different titles each time
5. Select "Sports"
6. Click AI Suggestions 5 times
7. Observe category-specific suggestions

**Phase 4: Verify Updates (2 min)**
1. Go to Dashboard → See 5 events
2. Check Analytics → See real charts
3. Conflict Radar → See 1 conflict (overlapping events)
4. Events Page → See all 5 events

**Phase 5: Test Deletion (2 min)**
1. Delete "Coding Challenge"
2. Sidebar conflict count → 0
3. Dashboard → 4 events
4. Analytics → Updated charts

**Phase 6: Real-time Sync (1 min)**
1. Open second tab
2. Create event in Tab 1
3. Watch Tab 2 update within 5 seconds

---

## 🐛 Troubleshooting

### Events not appearing?
- Check localStorage: `localStorage.getItem('eventverse_events')`
- Clear localStorage: `localStorage.clear()` and refresh
- Ensure dates are in future (for upcoming events)

### Conflict count not updating?
- Wait 2-3 seconds (auto-refresh interval)
- Manually refresh page
- Check events have overlapping venue + time

### Charts showing no data?
- Create more events (minimum 3-5 recommended)
- Ensure events have `current_attendees` and `max_capacity`
- Check different time ranges

### Styling issues?
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- Clear browser cache
- Ensure globals.css is loaded

---

## 💡 Pro Tips

1. **AI Suggestions:** Click multiple times for variety
2. **Conflict Detection:** Create overlapping venue+time for demo
3. **Analytics:** Spread events across months for better charts
4. **Real-time:** Keep multiple tabs open to see sync
5. **Dark Theme:** Best viewed in dimmed environment for full effect

---

## 🎯 Key Performance Indicators

After full testing, you should see:

✅ **Dashboard:**
- Total Events: 5+
- Total Attendees: Sum of all attendees
- Avg Turnout: Calculated from events
- Active Conflicts: 0 (after resolving)

✅ **Analytics:**
- Attendance trend: Real data per month
- Category performance: Real turnout %
- Top events: Sorted by actual performance

✅ **Conflict Radar:**
- Dynamic count (0 when no conflicts)
- Real-time detection
- Proper descriptions

✅ **UI/UX:**
- Smooth animations everywhere
- Professional dark theme
- Responsive hover effects
- Fast loading times

---

## 📧 Support

If you encounter any issues:
1. Check console for errors (F12)
2. Verify localStorage has data
3. Ensure all dependencies installed
4. Try clearing cache and hard refresh

---

**Enjoy your professional event management platform! 🎉**

*Built with ❤️ by CODING AGENTS*
*Version 1.0.0 - Production Ready*
