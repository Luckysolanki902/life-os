'use server';

import connectDB from '@/lib/db';
import DailyStreakRecord, { STREAK_TARGETS } from '@/models/DailyStreakRecord';
import DailyLog from '@/models/DailyLog';
import ExerciseLog from '@/models/ExerciseLog';
import BookLog from '@/models/BookLog';
import SimpleLearningLog from '@/models/SimpleLearningLog';
import Book from '@/models/Book';
import { revalidatePath } from 'next/cache';
import {
  getTodayISTMidnight,
  getTodayDateString,
  getDateRange,
  dayjs
} from '@/lib/server-date-utils';

const MIN_ROUTINE_TASKS = 5;
const MIN_BOOK_READING_MINUTES = 5;
const BOOK_TASK_POINTS = 20;
const EXERCISE_TASK_POINTS = 25;
const LEARNING_TASK_POINTS = 15;

// Helper: Check if a day can be considered a rest day (valid if 2 consecutive exercise days before)
async function canBeRestDay(dateStr: string): Promise<boolean> {
  const checkDate = dayjs(dateStr).tz('Asia/Kolkata');
  const day1 = checkDate.subtract(1, 'day');
  const day2 = checkDate.subtract(2, 'day');
  
  const { startOfDay: start1, endOfDay: end1 } = getDateRange(day1.format('YYYY-MM-DD'));
  const { startOfDay: start2, endOfDay: end2 } = getDateRange(day2.format('YYYY-MM-DD'));
  
  const exercise1 = await ExerciseLog.countDocuments({ date: { $gte: start1, $lt: end1 } });
  const exercise2 = await ExerciseLog.countDocuments({ date: { $gte: start2, $lt: end2 } });
  
  return exercise1 > 0 && exercise2 > 0;
}

// Helper: Check if a day is valid for streak (either has exercise OR is a valid rest day)
async function isDayValidForStreak(dateStr: string): Promise<{ valid: boolean; isRestDay: boolean; routineTasks: number; hasExercise: boolean }> {
  const { startOfDay, endOfDay } = getDateRange(dateStr);
  
  const routineTasks = await DailyLog.countDocuments({
    date: { $gte: startOfDay, $lt: endOfDay },
    status: 'completed'
  });
  
  const exerciseCount = await ExerciseLog.countDocuments({
    date: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const hasExercise = exerciseCount > 0;
  const hasEnoughTasks = routineTasks >= MIN_ROUTINE_TASKS;
  
  // If has exercise and tasks, it's a normal valid day
  if (hasExercise && hasEnoughTasks) {
    return { valid: true, isRestDay: false, routineTasks, hasExercise };
  }
  
  // If has tasks but no exercise, check if it can be a rest day
  if (hasEnoughTasks && !hasExercise) {
    const isRestDay = await canBeRestDay(dateStr);
    return { valid: isRestDay, isRestDay, routineTasks, hasExercise };
  }
  
  return { valid: false, isRestDay: false, routineTasks, hasExercise };
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayValid: boolean;
  todayRoutineTasks: number;
  todayHasExercise: boolean;
  todayIsRestDay: boolean;
  todayCanBeRestDay: boolean;
  last7Days: { date: string; valid: boolean; isRestDay?: boolean }[];
  nextTarget: { days: number; points: number; label: string } | null;
  totalStreakPoints: number;
  reachedMilestones: { days: number; points: number; label: string }[];
}

// Calculate and update streak for a specific date
export async function updateStreakForDate(dateStr: string) {
  await connectDB();
  
  const { startOfDay, endOfDay } = getDateRange(dateStr);
  
  // Count completed routine tasks
  const completedTasks = await DailyLog.countDocuments({
    date: { $gte: startOfDay, $lt: endOfDay },
    status: 'completed'
  });
  
  // Check for exercise logs
  const exerciseLogs = await ExerciseLog.countDocuments({
    date: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const hasExercise = exerciseLogs > 0;
  const streakValid = completedTasks >= MIN_ROUTINE_TASKS && hasExercise;
  
  // Calculate current streak to determine milestones
  let currentStreak = 0;
  if (streakValid) {
    // Count consecutive valid days backwards from this date
    currentStreak = 1;
    let checkDate = dayjs(dateStr).tz('Asia/Kolkata').subtract(1, 'day');
    
    while (true) {
      const prevRecord = await DailyStreakRecord.findOne({
        date: { 
          $gte: checkDate.startOf('day').toDate(),
          $lt: checkDate.add(1, 'day').startOf('day').toDate()
        }
      });
      
      if (prevRecord && prevRecord.streakValid) {
        currentStreak++;
        checkDate = checkDate.subtract(1, 'day');
      } else {
        break;
      }
    }
  }
  
  // Find new milestones reached
  const existingRecord = await DailyStreakRecord.findOne({
    date: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const previousMilestones = existingRecord?.milestonesReached || [];
  const newMilestones: number[] = [];
  let bonusPoints = 0;
  
  if (streakValid) {
    for (const target of STREAK_TARGETS) {
      if (currentStreak >= target.days && !previousMilestones.includes(target.days)) {
        newMilestones.push(target.days);
        bonusPoints += target.points;
      }
    }
  }
  
  // Update or create record
  await DailyStreakRecord.findOneAndUpdate(
    { date: { $gte: startOfDay, $lt: endOfDay } },
    {
      date: startOfDay,
      routineTasksCompleted: completedTasks,
      hasExerciseLog: hasExercise,
      streakValid,
      bonusPointsAwarded: (existingRecord?.bonusPointsAwarded || 0) + bonusPoints,
      milestonesReached: [...previousMilestones, ...newMilestones]
    },
    { upsert: true, new: true }
  );
  
  revalidatePath('/');
  return { streakValid, currentStreak, bonusPoints };
}

// Get streak data for homepage
export async function getStreakData(): Promise<StreakData> {
  await connectDB();
  
  const today = getTodayDateString();
  
  // Get today's validation using helper
  const todayResult = await isDayValidForStreak(today);
  const todayValid = todayResult.valid;
  const todayRoutineTasks = todayResult.routineTasks;
  const todayHasExercise = todayResult.hasExercise;
  const todayIsRestDay = todayResult.isRestDay;
  // Check if today could be a rest day (even if not yet valid)
  const todayCanBeRestDay = await canBeRestDay(today);
  
  // Calculate current streak - start from yesterday and count backwards
  let currentStreak = 0;
  let checkDate = dayjs().tz('Asia/Kolkata').subtract(1, 'day');
  
  // Count backwards from yesterday
  while (true) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayResult = await isDayValidForStreak(dateStr);
    
    if (dayResult.valid) {
      currentStreak++;
      checkDate = checkDate.subtract(1, 'day');
    } else {
      break;
    }
    
    // Safety limit
    if (currentStreak > 365) break;
  }
  
  // If today is already valid, add it to the streak
  if (todayValid) {
    currentStreak++;
  }
  
  // Calculate longest streak
  const allRecords = await DailyStreakRecord.find({ streakValid: true }).sort({ date: 1 });
  let longestStreak = currentStreak;
  let tempStreak = 0;
  let prevDate: dayjs.Dayjs | null = null;
  
  for (const record of allRecords) {
    const recordDate = dayjs(record.date).tz('Asia/Kolkata');
    
    if (prevDate && recordDate.diff(prevDate, 'day') === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    
    prevDate = recordDate;
  }
  
  // Get last 7 days data
  const last7Days: { date: string; valid: boolean; isRestDay?: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().tz('Asia/Kolkata').subtract(i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    
    if (i === 0) {
      // Today
      last7Days.push({ date: dateStr, valid: todayValid, isRestDay: todayIsRestDay });
    } else {
      const dayResult = await isDayValidForStreak(dateStr);
      last7Days.push({ date: dateStr, valid: dayResult.valid, isRestDay: dayResult.isRestDay });
    }
  }
  
  // Find next target
  let nextTarget: { days: number; points: number; label: string } | null = null;
  for (const target of STREAK_TARGETS) {
    if (currentStreak < target.days) {
      nextTarget = target;
      break;
    }
  }
  
  // Calculate total streak bonus points
  const totalStreakPoints = await DailyStreakRecord.aggregate([
    { $group: { _id: null, total: { $sum: '$bonusPointsAwarded' } } }
  ]).then(result => result[0]?.total || 0);
  
  // Get reached milestones
  const reachedMilestones = STREAK_TARGETS.filter(t => currentStreak >= t.days);
  
  return {
    currentStreak,
    longestStreak,
    todayValid,
    todayRoutineTasks,
    todayHasExercise,
    todayIsRestDay,
    todayCanBeRestDay,
    last7Days,
    nextTarget,
    totalStreakPoints,
    reachedMilestones
  };
}

// Get special tasks for domains (auto-generated based on activity)
export async function getSpecialTasks() {
  await connectDB();
  
  const today = getTodayDateString();
  const { startOfDay, endOfDay } = getDateRange(today);
  
  const specialTasks: Array<{
    _id: string;
    title: string;
    type: 'health' | 'books' | 'learning';
    points: number;
    completed: boolean;
    source: string;
  }> = [];
  
  // Check for exercise logs today
  const exerciseLogs = await ExerciseLog.find({
    date: { $gte: startOfDay, $lt: endOfDay }
  });
  
  if (exerciseLogs.length > 0) {
    specialTasks.push({
      _id: `special-exercise-${today}`,
      title: 'Do Exercise',
      type: 'health',
      points: EXERCISE_TASK_POINTS,
      completed: true,
      source: `${exerciseLogs.length} exercise(s) logged`
    });
  }
  
  // Check for book reading logs today (at least 5 minutes per book)
  const bookLogs = await BookLog.find({
    date: { $gte: startOfDay, $lt: endOfDay },
    duration: { $gte: MIN_BOOK_READING_MINUTES }
  });
  
  // Also check book check-ins (lastReadDate = today)
  const booksReadToday = await Book.find({
    lastReadDate: { $gte: startOfDay, $lt: endOfDay }
  });
  
  // Combine unique books
  const readBookIds = new Set([
    ...bookLogs.map((l: { bookId: { toString: () => string } }) => l.bookId.toString()),
    ...booksReadToday.map((b: { _id: { toString: () => string } }) => b._id.toString())
  ]);
  
  for (const bookId of readBookIds) {
    const book = await Book.findById(bookId);
    if (book) {
      specialTasks.push({
        _id: `special-book-${bookId}-${today}`,
        title: `Read Book (${(book as { title: string }).title.substring(0, 20)}${(book as { title: string }).title.length > 20 ? '...' : ''})`,
        type: 'books',
        points: BOOK_TASK_POINTS,
        completed: true,
        source: (book as { title: string }).title
      });
    }
  }
  
  // Check for learning logs today
  const learningLogs = await SimpleLearningLog.find({
    date: { $gte: startOfDay, $lt: endOfDay }
  });
  
  // Group by skill name
  const skillMap = new Map<string, number>();
  for (const log of learningLogs) {
    const current = skillMap.get((log as { skillName: string }).skillName) || 0;
    skillMap.set((log as { skillName: string }).skillName, current + (log as { duration: number }).duration);
  }
  
  for (const [skillName, duration] of skillMap) {
    if (duration >= 1) { // At least 1 minute
      specialTasks.push({
        _id: `special-learning-${skillName}-${today}`,
        title: `Learnt ${skillName}`,
        type: 'learning',
        points: LEARNING_TASK_POINTS,
        completed: true,
        source: `${duration} minutes`
      });
    }
  }
  
  return specialTasks;
}

// Calculate total points including streak bonuses and special tasks
export async function getTotalPointsWithBonuses() {
  await connectDB();
  
  // Base points from completed tasks
  const basePointsResult = await DailyLog.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
  ]);
  const basePoints = basePointsResult[0]?.total || 0;
  
  // Streak bonus points
  const streakBonusResult = await DailyStreakRecord.aggregate([
    { $group: { _id: null, total: { $sum: '$bonusPointsAwarded' } } }
  ]);
  const streakBonus = streakBonusResult[0]?.total || 0;
  
  // Special task points - count all logged activities
  const today = getTodayDateString();
  const { startOfDay, endOfDay } = getDateRange(today);
  
  // Count all books read today
  const booksReadToday = await Book.countDocuments({
    lastReadDate: { $gte: startOfDay, $lt: endOfDay }
  });
  const bookPoints = booksReadToday * BOOK_TASK_POINTS;
  
  // Count exercise days (unique days with exercise)
  const exerciseDays = await ExerciseLog.distinct('date');
  const exercisePoints = exerciseDays.length * EXERCISE_TASK_POINTS;
  
  // Count learning sessions
  const learningDaysWithSkills = await SimpleLearningLog.aggregate([
    { $group: { _id: { date: '$date', skill: '$skillName' } } },
    { $count: 'total' }
  ]);
  const learningPoints = (learningDaysWithSkills[0]?.total || 0) * LEARNING_TASK_POINTS;
  
  return {
    basePoints,
    streakBonus,
    specialTaskPoints: bookPoints + exercisePoints + learningPoints,
    totalPoints: basePoints + streakBonus + bookPoints + exercisePoints + learningPoints
  };
}
