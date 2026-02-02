<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?style=for-the-badge&logo=capacitor" alt="Capacitor"/>
</p>

<h1 align="center">
  <br/>
  <strong>🎯 Gamified Life Dashboard</strong>
  <br/>
  <em>Track your habits, master your life, become a better version of yourself</em>
</h1>

<p align="center">
  <strong>The North Star:</strong> <em>"You are X% better version of yourself"</em>
</p>

---

## 🌟 What is LifeOS?

**LifeOS** is a comprehensive personal life management system that gamifies your daily routines and habits. It transforms mundane tasks into a rewarding game where every completed habit earns you points, pushing you to become a better version of yourself.

### Core Philosophy

- **Gamification**: Every routine task earns points that accumulate to show how much "better" you've become
- **Streaks**: Maintain daily consistency to build unstoppable momentum
- **Multi-Domain Tracking**: Health, Career, Learning, Social, Discipline, Personality, and Startups
- **Data-Driven Insights**: Visualize your progress with charts, heatmaps, and detailed reports
- **Mobile-First**: Built as a Progressive Web App with native Android support via Capacitor

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [🏠 Home Dashboard](../readmes/HOME.md) | The main dashboard with your "Better %" metric, streaks, and quick actions |
| [✅ Routine System](../readmes/ROUTINE.md) | Daily task management with drag-and-drop ordering and recurrence patterns |
| [💪 Health Module](../readmes/HEALTH.md) | Weight tracking, workout logging, muscle map visualization, and mood tracking |
| [📚 Books Tracker](../readmes/BOOKS.md) | Reading list management with domains, progress tracking, and check-ins |
| [🧠 Learning Hub](../readmes/LEARNING.md) | Skill development tracking with areas, skills, and practice mediums |
| [📊 Reports & Analytics](../readmes/REPORTS.md) | Comprehensive analytics, heatmaps, and historical data visualization |
| [🔄 Sync System](../readmes/SYNC.md) | Real-time multi-device synchronization architecture |
| [🏗️ Architecture](../readmes/ARCHITECTURE.md) | Technical architecture, data models, and system design |
| [📱 Mobile App](../readmes/MOBILE.md) | Android app setup and Capacitor configuration |

---

## 🎮 How Gamification Works

### The "Better %" Metric

Your **Better Percentage** is calculated based on total points earned:

```
Better % = floor(Total Points / 150)
```

Every **150 points** = **1% better** version of yourself.

### Points System

| Action | Points |
|--------|--------|
| Complete a routine task | 1-10 (based on task difficulty) |
| Maintain streak bonus | Multiplier applied |
| Skip task | 0 points |

> **Note:** Only **Routine Tasks** generate points. Health logs, books, and learning entries are for tracking and insights only.

---

## 🗂️ Application Pages

### 1. 🏠 Home Dashboard
> *Your command center*

- **Better % Widget** - See your overall progress
- **Streak Counter** - Current streak with 7-day visualization
- **Incomplete Tasks** - Today's remaining routine items
- **Weight Quick-Log** - Log today's weight instantly
- **Domain Overview** - Quick access to all life domains

### 2. ✅ Routine
> *Daily habit management*

- **Today's Tasks** - All habits scheduled for today
- **Time-of-Day Grouping** - Morning, Afternoon, Evening, Night
- **Drag & Drop Ordering** - Rearrange task priority
- **Recurrence Patterns** - Daily, Weekdays, Weekends, Custom days
- **Task Actions** - Complete, Skip, Unskip with swipe gestures

### 3. 💪 Health
> *Physical wellness tracking*

- **Weight Logging** - Track weight with BMI calculation
- **Weight Delta** - Compare vs 30 days ago
- **Workout Pages** - Organize exercises by day (Day A, Leg Day, etc.)
- **Exercise Logging** - Sets, reps, weight, duration
- **Muscle Map** - Visual SVG showing recently worked muscles
- **Mood Tracking** - Daily mood check-in (Great → Bad)

### 4. 📚 Books
> *Reading management*

- **Book Domains** - Organize by category (Fiction, Business, Self-Help)
- **Reading Status** - Reading, Paused, Completed, Dropped
- **Check-In System** - Track reading sessions
- **Progress Tracking** - Pages read, completion percentage
- **Scheduled Books** - Books linked to routine tasks

### 5. 🧠 Learning
> *Skill development*

- **Learning Areas** - High-level categories (Music, Code, Languages)
- **Skills** - Specific abilities within areas
- **Practice Mediums** - How you practice (YouTube, Books, Courses)
- **Session Logging** - Duration, difficulty, notes
- **Quick Log** - Fast session entry

### 6. 📊 Reports
> *Analytics and insights*

- **Period Selection** - 7D, 30D, Month, 3M, Year, All Time
- **Routine Completion Rate** - Percentage over time
- **Domain Breakdown** - Performance by life area
- **Activity Heatmap** - GitHub-style yearly visualization
- **Weight Graph** - Historical weight trend
- **Mood Trends** - Emotional patterns over time

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **State** | Redux Toolkit, React Redux, Redux Persist |
| **Database** | MongoDB with Mongoose ODM |
| **Charts** | Recharts |
| **Mobile** | Capacitor 8 (Android) |
| **Icons** | Lucide React |
| **Drag & Drop** | dnd-kit |
| **Dates** | date-fns, dayjs |
| **Auth** | Custom JWT with jose |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- Android Studio (for mobile)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd main-repo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and secrets

# Run development server
npm run dev
```

### Building for Android

```bash
# Build Next.js and sync with Capacitor
npm run android:build

# Open in Android Studio
npm run cap:open
```

---

## 📁 Project Structure

```
main-repo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── routine/           # Routine management
│   │   ├── health/            # Health tracking
│   │   ├── books/             # Book management
│   │   ├── learning/          # Learning hub
│   │   ├── reports/           # Analytics
│   │   ├── login/             # Authentication
│   │   ├── actions/           # Server actions
│   │   └── api/               # API routes
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── MuscleMap.tsx     # SVG muscle visualization
│   │   └── SwipeableTask.tsx # Swipe gesture handler
│   ├── lib/                   # Utilities and helpers
│   │   ├── reactive-cache.ts # Local-first caching
│   │   ├── sync-manager.ts   # Multi-device sync
│   │   ├── date-utils.ts     # Date handling
│   │   └── better.ts         # Better % calculation
│   └── models/               # MongoDB schemas
├── android/                   # Capacitor Android project
├── public/                    # Static assets
└── readmes/                   # Detailed documentation
```

---

## ✨ Key Features

### 🔄 Real-Time Sync
- **Optimistic Updates** - UI updates instantly before server confirmation
- **Multi-Device Sync** - Changes sync across devices within 5 seconds
- **Offline Support** - Works offline with local cache, syncs when online

### 📱 Mobile-First Design
- **Responsive UI** - Works on all screen sizes
- **Touch Gestures** - Swipe to complete/skip tasks
- **Haptic Feedback** - Native feel on mobile
- **PWA Ready** - Install as app on any device

### 🎨 Modern UI/UX
- **Dark Theme** - Easy on the eyes
- **Smooth Animations** - Framer Motion powered
- **Glass Morphism** - Beautiful translucent cards
- **Intuitive Navigation** - Bottom tab navigation

---

## 🔒 Authentication

Simple password-based authentication with JWT tokens stored securely:
- 7-day token expiry
- Capacitor Preferences for native storage
- Automatic redirect on session expiry

---

## 📈 Data Models Overview

| Model | Purpose |
|-------|---------|
| `Task` | Routine task definitions with recurrence |
| `DailyLog` | Daily task completion records |
| `User` | User profile and total points |
| `WeightLog` | Body weight entries |
| `HealthPage` | Workout day groupings |
| `ExerciseDefinition` | Exercise templates |
| `ExerciseLog` | Workout session records |
| `MoodLog` | Daily mood check-ins |
| `Book` | Book entries with progress |
| `BookDomain` | Book categories |
| `LearningArea` | Learning categories |
| `LearningSkill` | Skills within areas |
| `PracticeMedium` | Practice methods |
| `LearningLog` | Practice session records |
| `SyncState` | Multi-device sync tracking |
| `DailyStreakRecord` | Streak calculation records |

---

## 🤝 Contributing

This is a personal project, but feel free to fork and adapt for your own use!

---

## 📄 License

Private - All Rights Reserved

---

<p align="center">
  <strong>Built with ❤️ for personal growth</strong>
  <br/>
  <em>Every day is a chance to be 1% better</em>
</p>
