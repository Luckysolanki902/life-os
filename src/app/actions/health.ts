'use server';

import connectDB from '@/lib/db';
import WeightLog from '@/models/WeightLog';
import HealthPage from '@/models/HealthPage';
import ExerciseDefinition from '@/models/ExerciseDefinition';
import ExerciseLog from '@/models/ExerciseLog';
import MoodLog from '@/models/MoodLog';
import Task from '@/models/Task';
import DailyLog from '@/models/DailyLog';
import { revalidatePath } from 'next/cache';

const ALLOWED_MUSCLES = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Obliques', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
  'Traps', 'Lats', 'Cardio'
] as const;

function refineMuscles(_title: string, muscles: string[]): string[] {
  const allowedSet = new Set<string>(ALLOWED_MUSCLES as unknown as string[]);
  const clean: string[] = [];

  muscles.forEach((m) => {
    if (typeof m !== 'string') return;
    const trimmed = m.trim();
    if (!trimmed) return;
    if (!allowedSet.has(trimmed)) return;
    if (!clean.includes(trimmed)) clean.push(trimmed);
  });

  // Enforce upper bound; lower bound is handled by the AI schema (minItems)
  return clean.slice(0, 6);
}

// --- Date Utilities for Robust Timezone Handling ---

/**
 * Parse a date string (YYYY-MM-DD) to UTC midnight of that date.
 * This ensures consistent storage regardless of server timezone.
 * @param dateStr - Date string in YYYY-MM-DD format from client
 * @returns Date object set to midnight UTC of that date
 */
function parseToUTCMidnight(dateStr: string): Date {
  // Split the date string and create UTC date directly
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Get today's date as UTC midnight based on client timezone offset.
 * @param timezoneOffset - Client's timezone offset in minutes (from Date.getTimezoneOffset())
 * @returns Date object set to midnight UTC representing today in client's timezone
 */
function getTodayUTCMidnight(timezoneOffset?: number): Date {
  const now = new Date();
  if (timezoneOffset !== undefined) {
    // Adjust for client timezone to get their "today"
    const clientNow = new Date(now.getTime() - timezoneOffset * 60 * 1000);
    return new Date(Date.UTC(clientNow.getUTCFullYear(), clientNow.getUTCMonth(), clientNow.getUTCDate(), 0, 0, 0, 0));
  }
  // Fallback: use server's today
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

/**
 * Get the date range for a day, extended to handle timezone differences.
 * This finds records stored at either UTC midnight OR local midnight converted to UTC.
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Object with startOfDay and endOfDay (extended range)
 */
function getDateRange(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = parseToUTCMidnight(dateStr);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
  return { startOfDay, endOfDay };
}

/**
 * Get extended date range to find records that might have been stored with timezone offset.
 * This handles legacy data stored at local midnight (e.g., IST) converted to UTC.
 * For Jan 8: looks from Jan 7 12:00 UTC to Jan 9 12:00 UTC to catch all timezones.
 */
function getExtendedDateRange(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Start from previous day noon UTC to catch dates stored at local midnight from UTC+12 or later
  const startOfDay = new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0, 0));
  // End at next day noon UTC to catch dates stored at local midnight from UTC-12 or earlier  
  const endOfDay = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0, 0));
  return { startOfDay, endOfDay };
}

// --- Fetching ---

import User from '@/models/User';

// ... existing imports ...

// Helper function to check if a task should appear on a given day
function shouldShowTaskOnDay(task: any, dayOfWeek: number): boolean {
  const recurrenceType = task.recurrenceType || 'daily';
  
  switch (recurrenceType) {
    case 'daily':
      return true;
    case 'weekdays':
      // Monday (1) through Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      // Saturday (6) and Sunday (0)
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      // Check if dayOfWeek is in the recurrenceDays array
      return (task.recurrenceDays || []).includes(dayOfWeek);
    default:
      return true;
  }
}

export async function getHealthDashboardData(dateStr?: string) {
  await connectDB();
  
  // Use UTC midnight for consistent date handling
  // dateStr should be in YYYY-MM-DD format from client
  const { startOfDay: targetDate, endOfDay: nextDay } = dateStr 
    ? getDateRange(dateStr)
    : { startOfDay: getTodayUTCMidnight(), endOfDay: (() => { const d = getTodayUTCMidnight(); d.setUTCDate(d.getUTCDate() + 1); return d; })() };
  
  // Get day of week based on the UTC date
  const dayOfWeek = targetDate.getUTCDay();

  // 0. User Profile for BMI
  const user = await User.findOne().lean();
  const heightCm = user?.profile?.height || 183; // Default fallback

  // 1. Routine Tasks for that specific date
  // Note: Tasks are definitions, logs are what matters for a specific date.
  // We fetch all active tasks and filter by recurrence.
  const allHealthTasks = await Task.find({ domainId: 'health', isActive: true }).lean();
  const healthTasks = allHealthTasks.filter((task: any) => shouldShowTaskOnDay(task, dayOfWeek));
  
  const taskLogs = await DailyLog.find({
    date: { $gte: targetDate, $lt: nextDay },
    taskId: { $in: healthTasks.map((t: any) => t._id) }
  }).lean();

  const routine = healthTasks.map((task: any) => {
    const log = taskLogs.find((l: any) => l.taskId.toString() === task._id.toString());
    const { subtasks, ...cleanTask } = task; // Sanitize
    
    // Deep sanitize log to handle any nested ObjectIds (like in subtasks)
    const cleanLog = log ? JSON.parse(JSON.stringify(log)) : null;

    return {
      ...cleanTask,
      _id: task._id.toString(),
      log: cleanLog
    };
  });

  // 2. Weight Stats (Current vs 30 days ago)
  const latestWeight = await WeightLog.findOne({ date: { $lt: nextDay } }).sort({ date: -1 }).lean();
  
  // Check if there's a weight entry for the selected date (using extended range for timezone compatibility)
  const weightDateRange = dateStr 
    ? getExtendedDateRange(dateStr) 
    : getExtendedDateRange(`${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`);
  const todaysWeight = await WeightLog.findOne({ 
    date: { $gte: weightDateRange.startOfDay, $lt: weightDateRange.endOfDay } 
  }).sort({ date: -1 }).lean();
  
  const thirtyDaysAgo = new Date(targetDate);
  thirtyDaysAgo.setDate(targetDate.getDate() - 30);
  const pastWeight = await WeightLog.findOne({ date: { $lte: thirtyDaysAgo } }).sort({ date: -1 }).lean();

  const currentWeight = latestWeight?.weight || 0;
  const bmi = currentWeight > 0 ? (currentWeight / ((heightCm / 100) ** 2)).toFixed(1) : null;

  const weightStats = {
    current: currentWeight,
    delta: (latestWeight && pastWeight) ? (latestWeight.weight - pastWeight.weight).toFixed(1) : null,
    lastLogged: latestWeight?.date || null,
    bmi,
    // Add today's specific weight for edit functionality
    todaysWeight: todaysWeight ? { 
      _id: (todaysWeight as any)._id.toString(),
      weight: todaysWeight.weight,
      date: todaysWeight.date
    } : null
  };

  // 3. Health Pages (Static definitions)
  const pages = await HealthPage.find().sort({ createdAt: 1 }).lean();
  const pageIds = pages.map((p: any) => p._id.toString());

  // 4. Find the most recent workout log to determine cycle position
  let lastWorkoutPageIndex = -1;
  let lastWorkoutDate: Date | null = null;
  
  if (pageIds.length > 0) {
    // Get all exercises for all pages
    const allExercises = await ExerciseDefinition.find({ pageId: { $in: pageIds } }).lean();
    const exerciseToPage: Record<string, string> = {};
    allExercises.forEach((ex: any) => {
      exerciseToPage[ex._id.toString()] = ex.pageId.toString();
    });
    
    // Find the most recent exercise log
    const latestLog = await ExerciseLog.findOne({
      exerciseId: { $in: allExercises.map((e: any) => e._id) }
    }).sort({ date: -1 }).lean();
    
    if (latestLog) {
      const loggedPageId = exerciseToPage[(latestLog as any).exerciseId.toString()];
      lastWorkoutPageIndex = pageIds.indexOf(loggedPageId);
      lastWorkoutDate = (latestLog as any).date;
    }
  }

  // Calculate next workout index (cycles back to 0)
  const nextWorkoutIndex = pageIds.length > 0 
    ? (lastWorkoutPageIndex + 1) % pageIds.length 
    : 0;

  // 5. Mood for that date - use extended range to handle timezone differences in legacy data
  const extendedRange = dateStr 
    ? getExtendedDateRange(dateStr) 
    : getExtendedDateRange(`${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`);
  const moodLog = await MoodLog.findOne({ 
    date: { $gte: extendedRange.startOfDay, $lt: extendedRange.endOfDay } 
  }).sort({ date: -1 }).lean();

  return {
    date: targetDate.toISOString(),
    routine,
    weightStats,
    pages: pages.map((p: any, index: number) => ({ 
      ...p, 
      _id: p._id.toString(),
      cycleStatus: index <= lastWorkoutPageIndex ? 'done' : index === nextWorkoutIndex ? 'current' : 'upcoming'
    })),
    cycleInfo: {
      lastWorkoutPageIndex,
      lastWorkoutDate: lastWorkoutDate?.toISOString() || null,
      nextWorkoutIndex
    },
    mood: moodLog ? { mood: moodLog.mood, note: moodLog.note } : null
  };
}

export async function getHealthPageData(pageId: string, dateStr?: string) {
  await connectDB();
  
  // Use UTC midnight for consistent date handling
  const { startOfDay: targetDate, endOfDay: nextDay } = dateStr 
    ? getDateRange(dateStr)
    : { startOfDay: getTodayUTCMidnight(), endOfDay: (() => { const d = getTodayUTCMidnight(); d.setUTCDate(d.getUTCDate() + 1); return d; })() };

  const page = await HealthPage.findById(pageId).lean();
  if (!page) return null;

  const exercises = await ExerciseDefinition.find({ pageId }).sort({ order: 1, createdAt: 1 }).lean();
  const exerciseIds = exercises.map((e: any) => e._id);

  // 1. Get Log for Target Date
  const todaysLogs = await ExerciseLog.find({
    exerciseId: { $in: exerciseIds },
    date: { $gte: targetDate, $lt: nextDay }
  }).lean();

  // 2. Get Last Log (Before Target Date)
  // We can use aggregate to find the most recent log before targetDate for each exercise
  const lastLogs = await ExerciseLog.aggregate([
    { $match: { 
        exerciseId: { $in: exerciseIds },
        date: { $lt: targetDate }
      } 
    },
    { $sort: { date: -1 } },
    { $group: {
        _id: '$exerciseId',
        lastLog: { $first: '$$ROOT' }
      }
    }
  ]);

  const exercisesWithHistory = exercises.map((ex: any) => {
    const today = todaysLogs.find((l: any) => l.exerciseId.toString() === ex._id.toString());
    const history = lastLogs.find((l: any) => l._id.toString() === ex._id.toString());
    
    // Serialize tutorials properly (remove MongoDB _id if present)
    const tutorials = (ex.tutorials || []).map((t: any) => ({
      url: t.url,
      title: t.title || ''
    }));
    
    return {
      ...ex,
      _id: ex._id.toString(),
      pageId: ex.pageId.toString(),
      tutorials,
      todaysLog: today ? {
        ...today,
        _id: today._id.toString(),
        exerciseId: today.exerciseId.toString(),
        date: today.date.toISOString(),
        sets: today.sets.map((s: any) => ({
          ...s,
          _id: s._id.toString()
        }))
      } : null,
      lastLog: history ? {
        ...history.lastLog,
        _id: history.lastLog._id.toString(),
        exerciseId: history.lastLog.exerciseId.toString(),
        date: history.lastLog.date.toISOString(),
        sets: history.lastLog.sets.map((s: any) => ({
          ...s,
          _id: s._id.toString()
        }))
      } : null
    };
  });

  return {
    page: { ...page, _id: page._id.toString() },
    exercises: exercisesWithHistory,
    date: targetDate.toISOString()
  };
}

export async function deleteSet(logId: string, setId: string, pageId: string) {
  await connectDB();
  await ExerciseLog.findByIdAndUpdate(logId, {
    $pull: { sets: { _id: setId } }
  });
  revalidatePath(`/health/${pageId}`);
  return { success: true };
}

export async function updateSet(logId: string, setId: string, data: { weight: number; reps: number }, pageId: string) {
  await connectDB();
  await ExerciseLog.findOneAndUpdate(
    { _id: logId, "sets._id": setId },
    { 
      $set: { 
        "sets.$.weight": data.weight,
        "sets.$.reps": data.reps
      }
    }
  );
  revalidatePath(`/health/${pageId}`);
  return { success: true };
}

export async function logExerciseSet(exerciseId: string, data: { weight?: number; reps?: number; duration?: number; distance?: number; notes?: string }, dateStr?: string) {
  await connectDB();
  
  // Use UTC midnight for consistent date handling
  const targetDate = dateStr 
    ? parseToUTCMidnight(dateStr)
    : getTodayUTCMidnight();
  
  await ExerciseLog.findOneAndUpdate(
    { exerciseId, date: targetDate },
    { $push: { sets: data } },
    { upsert: true, new: true }
  );

  // Revalidate the health page
  const exercise = await ExerciseDefinition.findById(exerciseId);
  if (exercise) {
    revalidatePath(`/health/${exercise.pageId}`);
    revalidatePath('/health');
  }
  
  return { success: true };
}

// --- Actions ---

export async function logWeight(weight: number, dateStr: string) {
  await connectDB();
  
  // Parse date as UTC midnight for consistent storage
  const logDate = parseToUTCMidnight(dateStr);
  
  // Use upsert to update existing entry or create new one for this date
  await WeightLog.findOneAndUpdate(
    { date: logDate },
    { weight, date: logDate },
    { upsert: true, new: true }
  );

  revalidatePath('/health');
  revalidatePath('/');
  return { success: true };
}

export async function updateWeight(weightId: string, weight: number) {
  await connectDB();
  
  await WeightLog.findByIdAndUpdate(weightId, { weight });

  revalidatePath('/health');
  revalidatePath('/');
  return { success: true };
}

/**
 * Get today's weight data for the home page
 */
export async function getTodaysWeightData(dateStr?: string) {
  await connectDB();
  
  // Use provided date or today
  const targetDateStr = dateStr || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const extendedRange = getExtendedDateRange(targetDateStr);
  
  // Get today's weight entry
  const todaysWeight = await WeightLog.findOne({ 
    date: { $gte: extendedRange.startOfDay, $lt: extendedRange.endOfDay } 
  }).sort({ date: -1 }).lean();
  
  return todaysWeight ? {
    _id: (todaysWeight as any)._id.toString(),
    weight: todaysWeight.weight,
    date: todaysWeight.date
  } : null;
}

export async function createHealthPage(title: string, description?: string) {
  await connectDB();
  await HealthPage.create({ title, description });
  revalidatePath('/health');
  return { success: true };
}

export async function updateHealthPage(pageId: string, data: { title?: string; description?: string }) {
  await connectDB();
  await HealthPage.findByIdAndUpdate(pageId, data);
  revalidatePath('/health');
  revalidatePath(`/health/${pageId}`);
  return { success: true };
}

export async function deleteHealthPage(pageId: string) {
  await connectDB();
  // Delete all exercises and their logs for this page
  const exercises = await ExerciseDefinition.find({ pageId });
  const exerciseIds = exercises.map(e => e._id);
  await ExerciseLog.deleteMany({ exerciseId: { $in: exerciseIds } });
  await ExerciseDefinition.deleteMany({ pageId });
  await HealthPage.findByIdAndDelete(pageId);
  revalidatePath('/health');
  return { success: true };
}

export async function createExercise(data: { 
  pageId: string; 
  title: string;
  initialSets?: number | null;
  initialReps?: number | null;
  recommendedWeight?: number | null;
}) {
  await connectDB();

  const allowedTypes = ['reps', 'duration', 'distance'] as const;
  let targetMuscles: string[] = [];
  let detectedType: (typeof allowedTypes)[number] = 'reps';

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: 'You are a fitness expert. Identify the primary and secondary muscles (2-6) and log type for the exercise provided by the user. Be accurate. For Pull-ups, include Back, Lats, Biceps.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: data.title
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'exercise_muscles_and_type',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              muscles: {
                type: 'array',
                description: 'Primary and key secondary muscles targeted by the exercise (2-6 unique items) using the allowed set.',
                minItems: 2,
                maxItems: 6,
                items: {
                  type: 'string',
                  enum: [
                    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
                    'Abs', 'Obliques', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
                    'Traps', 'Lats', 'Cardio'
                  ]
                }
              },
              type: {
                type: 'string',
                enum: ['reps', 'duration', 'distance'],
                description: 'Best-fit logging type for this exercise.'
              }
            },
            required: ['muscles', 'type'],
            additionalProperties: false
          }
        },
        verbosity: 'low'
      },
      reasoning: { effort: 'minimal' },
      tools: [],
      store: false,
      include: []
    });

    const content = response.output_text;
    const parsed = content ? JSON.parse(content) : { muscles: [], type: 'reps' };
    const rawMuscles = Array.isArray(parsed.muscles) ? parsed.muscles : [];
    targetMuscles = refineMuscles(data.title, rawMuscles);
    detectedType = allowedTypes.includes(parsed.type) ? parsed.type : 'reps';
  } catch (error) {
    console.error('AI muscle/type detection failed:', error);
  }

  await ExerciseDefinition.create({ 
    pageId: data.pageId, 
    title: data.title, 
    type: detectedType, 
    targetMuscles,
    initialSets: data.initialSets ?? null,
    initialReps: data.initialReps ?? null,
    recommendedWeight: data.recommendedWeight ?? null
  });
  revalidatePath(`/health/${data.pageId}`);
  return { success: true };
}

async function inferExercisesBulk(titles: string[]): Promise<Array<{ title: string; type: string; muscles: string[] }>> {
  if (titles.length === 0) return [];

  const allowedTypes = ['reps', 'duration', 'distance'] as const;

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: 'You are a fitness expert. For each exercise name provided, return the type (reps/duration/distance) and 2-6 primary/secondary muscles. Be accurate. Return as JSON array matching input order.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(titles)
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'bulk_exercise_inference',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              exercises: {
                type: 'array',
                description: 'Array of exercise definitions matching input order',
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Exercise name from input'
                    },
                    type: {
                      type: 'string',
                      enum: ['reps', 'duration', 'distance'],
                      description: 'Best-fit logging type'
                    },
                    muscles: {
                      type: 'array',
                      description: 'Primary and key secondary muscles (2-6 unique items)',
                      minItems: 2,
                      maxItems: 6,
                      items: {
                        type: 'string',
                        enum: [
                          'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
                          'Abs', 'Obliques', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
                          'Traps', 'Lats', 'Cardio'
                        ]
                      }
                    }
                  },
                  required: ['title', 'type', 'muscles'],
                  additionalProperties: false
                }
              }
            },
            required: ['exercises'],
            additionalProperties: false
          }
        },
        verbosity: 'low'
      },
      reasoning: { effort: 'minimal' },
      tools: [],
      store: false,
      include: []
    });

    const content = response.output_text;
    const parsed = content ? JSON.parse(content) : { exercises: [] };
    
    return (parsed.exercises || []).map((ex: any) => ({
      title: ex.title || '',
      type: allowedTypes.includes(ex.type) ? ex.type : 'reps',
      muscles: refineMuscles(ex.title || '', Array.isArray(ex.muscles) ? ex.muscles : [])
    }));
  } catch (error) {
    console.error('Bulk AI inference failed:', error);
    // Fallback: return with defaults
    return titles.map(title => ({ title, type: 'reps', muscles: [] }));
  }
}

export async function bulkCreateExercises(pageId: string, csvData: string) {
  await connectDB();
  
  // Parse CSV rows - format: name,type,initialSets,initialReps,recommendedWeight
  // Simple format (name only): "Pull-ups, Bench Press"
  // Extended format: "Pull-ups,reps,3,10,0\nRunning,duration,1,30,0"
  
  let parsedExercises: Array<{
    title: string;
    type: string | null;
    initialSets: number | null;
    initialReps: number | null;
    recommendedWeight: number | null;
  }> = [];

  // Check if extended CSV format - has newlines and each line has commas with type/numbers
  const hasNewlines = csvData.includes('\n');
  const rows = csvData.split('\n').map(r => r.trim()).filter(r => r.length > 0);
  
  const allowedTypes = ['reps', 'duration', 'distance'];
  
  // Extended format: lines with format "name,type,sets,reps,weight"
  const isExtendedFormat = hasNewlines && rows.some(row => {
    const parts = row.split(',');
    return parts.length >= 2 && (allowedTypes.includes(parts[1]?.trim().toLowerCase()) || !isNaN(Number(parts[1]?.trim())));
  });

  if (isExtendedFormat) {
    // Extended format: each line is "name,type,sets,reps,weight" or "name,sets,reps,weight" (legacy)
    for (const row of rows) {
      const parts = row.split(',').map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        // Check if second field is a type or a number
        const secondField = parts[1]?.toLowerCase();
        const hasType = allowedTypes.includes(secondField);
        
        let exercise;
        if (hasType) {
          // New format: name,type,sets,reps,weight
          exercise = {
            title: parts[0],
            type: secondField,
            initialSets: parts[2] && !isNaN(Number(parts[2])) ? Number(parts[2]) : null,
            initialReps: parts[3] && !isNaN(Number(parts[3])) ? Number(parts[3]) : null,
            recommendedWeight: parts[4] && !isNaN(Number(parts[4])) ? Number(parts[4]) : null
          };
        } else {
          // Legacy format: name,sets,reps,weight (no type)
          exercise = {
            title: parts[0],
            type: null,
            initialSets: parts[1] && !isNaN(Number(parts[1])) ? Number(parts[1]) : null,
            initialReps: parts[2] && !isNaN(Number(parts[2])) ? Number(parts[2]) : null,
            recommendedWeight: parts[3] && !isNaN(Number(parts[3])) ? Number(parts[3]) : null
          };
        }
        parsedExercises.push(exercise);
      }
    }
  } else {
    // Simple format: comma-separated names only
    const names = csvData
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    parsedExercises = names.map(title => ({
      title,
      type: null,
      initialSets: null,
      initialReps: null,
      recommendedWeight: null
    }));
  }

  if (parsedExercises.length === 0) return { success: false, error: 'No exercise names provided' };

  // Always get AI inference for muscles (and type if not specified)
  const inferred = await inferExercisesBulk(parsedExercises.map(e => e.title));

  // Create exercises with inferred data and initial values
  const exercises = parsedExercises.map((ex, i) => ({
    pageId,
    title: ex.title,
    type: ex.type || inferred[i]?.type || 'reps', // Use specified type or AI inferred
    targetMuscles: inferred[i]?.muscles || [],
    initialSets: ex.initialSets,
    initialReps: ex.initialReps,
    recommendedWeight: ex.recommendedWeight
  }));

  if (exercises.length > 0) {
    await ExerciseDefinition.insertMany(exercises);
    revalidatePath(`/health/${pageId}`);
  }
  
  return { success: true, count: exercises.length };
}

export async function logExercise(date: Date, exerciseId: string, sets: any[]) {
  await connectDB();
  
  // Normalize date to midnight for grouping? Or keep precise?
  // "until today's not loged show yesterdays' reps" -> implies daily buckets.
  const logDate = new Date(date);
  logDate.setHours(0, 0, 0, 0);

  await ExerciseLog.findOneAndUpdate(
    { date: logDate, exerciseId },
    { $set: { sets } },
    { upsert: true, new: true }
  );

  revalidatePath('/health');
  return { success: true };
}

export async function saveMood(dateStr: string, mood: 'great' | 'good' | 'okay' | 'low' | 'bad', note?: string) {
  await connectDB();
  
  // Use UTC midnight for consistent date handling
  // dateStr should be YYYY-MM-DD from client
  const logDate = dateStr.includes('T') 
    ? parseToUTCMidnight(dateStr.split('T')[0])
    : parseToUTCMidnight(dateStr);

  await MoodLog.findOneAndUpdate(
    { date: logDate },
    { mood, note: note || null },
    { upsert: true, new: true }
  );

  revalidatePath('/health');
  return { success: true, mood };
}

export async function deleteExercise(exerciseId: string, pageId: string) {
  await connectDB();
  await ExerciseDefinition.findByIdAndDelete(exerciseId);
  await ExerciseLog.deleteMany({ exerciseId });
  revalidatePath(`/health/${pageId}`);
  return { success: true };
}

export async function updateExercise(exerciseId: string, pageId: string, data: { 
  title: string; 
  type?: string; 
  targetMuscles?: string[];
  initialSets?: number | null;
  initialReps?: number | null;
  recommendedWeight?: number | null;
  tutorials?: { url: string; title?: string }[];
}) {
  await connectDB();

  const allowedTypes = ['reps', 'duration', 'distance'] as const;
  let targetMuscles: string[] | undefined = data.targetMuscles;
  let nextType: (typeof allowedTypes)[number] | undefined = data.type && allowedTypes.includes(data.type as any)
    ? (data.type as (typeof allowedTypes)[number])
    : undefined;

  // If either muscles or type not provided, ask AI
  if (!targetMuscles || !nextType) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.responses.create({
        model: 'gpt-5-nano',
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: 'You are a fitness expert. Identify the primary and secondary muscles (2-6) and log type for the exercise provided by the user. Be accurate. For Pull-ups, include Back, Lats, Biceps.'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: data.title
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'exercise_muscles_and_type',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                muscles: {
                  type: 'array',
                  description: 'Primary and key secondary muscles targeted by the exercise (2-6 unique items) using the allowed set.',
                  minItems: 2,
                  maxItems: 6,
                  items: {
                    type: 'string',
                    enum: [
                      'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
                      'Abs', 'Obliques', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
                      'Traps', 'Lats', 'Cardio'
                    ]
                  }
                },
                type: {
                  type: 'string',
                  enum: ['reps', 'duration', 'distance'],
                  description: 'Best-fit logging type for this exercise.'
                }
              },
              required: ['muscles', 'type'],
              additionalProperties: false
            }
          },
          verbosity: 'low'
        },
        reasoning: { effort: 'minimal' },
        tools: [],
        store: false,
        include: []
      });

      const content = response.output_text;
      const parsed = content ? JSON.parse(content) : { muscles: [], type: 'reps' };
      if (!targetMuscles) {
        const rawMuscles = Array.isArray(parsed.muscles) ? parsed.muscles : [];
        targetMuscles = refineMuscles(data.title, rawMuscles);
      }
      if (!nextType) nextType = allowedTypes.includes(parsed.type) ? parsed.type : 'reps';
    } catch (error) {
      console.error('AI muscle/type detection failed:', error);
    }
  }

  const updateData: any = {
    title: data.title,
    type: nextType || 'reps',
    targetMuscles: targetMuscles ? refineMuscles(data.title, targetMuscles) : []
  };
  
  // Only set initial values if they are provided (not undefined)
  if (data.initialSets !== undefined) updateData.initialSets = data.initialSets;
  if (data.initialReps !== undefined) updateData.initialReps = data.initialReps;
  if (data.recommendedWeight !== undefined) updateData.recommendedWeight = data.recommendedWeight;
  if (data.tutorials !== undefined) updateData.tutorials = data.tutorials;
  
  await ExerciseDefinition.findByIdAndUpdate(exerciseId, updateData);
  revalidatePath(`/health/${pageId}`);
  return { success: true };
}

export async function reorderExercises(pageId: string, orderedIds: string[]) {
  await connectDB();
  
  // Update order for each exercise
  const updates = orderedIds.map((id, index) => 
    ExerciseDefinition.findByIdAndUpdate(id, { order: index })
  );
  
  await Promise.all(updates);
  revalidatePath(`/health/${pageId}`);
  return { success: true };
}


