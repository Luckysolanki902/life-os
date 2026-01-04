# Application Logic & Data Model

## Core Philosophy
The app is a "Gamified Life Dashboard".
- **North Star Metric**: "You are X% better version of yourself".
- **Source of Truth**: Only **Routine Tasks** generate points for this metric.
- **Other Logs**: Things like weight, exercise logs, diet, etc., are for **Reports/History/Insights** only and do not directly contribute to the "Better Version" percentage.

## Navigation Structure
1.  **Home (Dashboard)**: High-level stats, Identity Metric, Current Focus.
2.  **Routine**: The daily driver. Shows *only* today's tasks.
3.  **Domains**: Hub to access specific domains (Health, Career, etc.).
4.  **Reports**: Analytics, history, punctuality scores (Future).
5.  **Settings**: Profile, Data management.

## Data Models

### 1. RoutineTask (Routine Definition)
Defines a habit or task that appears in the routine.
- `title`: String
- `domainId`: 'health' | 'career' | 'learning' | 'startups' | 'social'
- `order`: Number (for Drag & Drop sorting)
- `isScheduled`: Boolean
- `startTime`: String (HH:mm) - Optional
- `endTime`: String (HH:mm) - Optional
- `notificationsEnabled`: Boolean
- `timeOfDay`: 'morning' | 'afternoon' | 'evening' | 'night' | 'day' | 'none'
- `basePoints`: Number (1-10)

### 2. DailyLog (Routine Execution)
Records the completion of a task for a specific date.
- `taskId`: Reference to Task
- `date`: Date (normalized to midnight)
- `completedAt`: Date (Timestamp of actual completion)
- `status`: 'completed' | 'pending'
- `pointsEarned`: Number

### 3. User
- `totalPoints`: Sum of all DailyLog points.
- `profile`: Height, Weight, etc.

### 4. Health Domain Models

#### A. WeightLog
Tracks body weight over time.
- `date`: Date
- `weight`: Number (kg)

#### B. HealthPage (Exercise Grouping)
Represents a workout day or category (e.g., "Day A", "Leg Day").
- `title`: String
- `description`: String (Optional)

#### C. ExerciseDefinition
Defines a specific exercise available within a HealthPage.
- `pageId`: Reference to HealthPage
- `title`: String
- `type`: 'reps_weight' | 'duration'
- `targetMuscles`: Array of Strings (e.g., ['chest', 'triceps'])
- `impact`: 'high' | 'medium' | 'low' (Default: high)

#### D. ExerciseLog
Records the performance of an exercise on a specific date.
- `date`: Date
- `exerciseId`: Reference to ExerciseDefinition
- `sets`: Array
    - `reps`: Number (Optional)
    - `weight`: Number (Optional)
    - `duration`: Number (Minutes, Optional)

#### E. DailyHealthCheckin
Tracks daily diet and sleep habits.
- `date`: Date
- `mealsTaken`: Boolean (Did you take all meals?)
- `proteinTaken`: Boolean (Did you take protein shake?)
- `sleepStart`: Date (When did you sleep?)
- `sleepEnd`: Date (When did you wake up?)

## Business Rules
1.  **Daily Reset**: Routine shows tasks for the current day.
2.  **Gamification**: Only Routine Tasks give points. Health logs are for data tracking.
3.  **Health Insights**:
    - Weight: Show delta vs 30 days ago.
    - Exercise: Show "Last Logged" stats when logging today to guide progressive overload.
    - Muscle Map: Visualize `targetMuscles` from recent `ExerciseLog`s.

