'use server';

import connectDB from '@/lib/db';
import Task from '@/models/Task';
import DailyLog from '@/models/DailyLog';
import WeightLog from '@/models/WeightLog';
import ExerciseLog from '@/models/ExerciseLog';
import ExerciseDefinition from '@/models/ExerciseDefinition';
import HealthPage from '@/models/HealthPage';
import MoodLog from '@/models/MoodLog';
import Book from '@/models/Book';
import BookLog from '@/models/BookLog';
import BookDomain from '@/models/BookDomain';
import LearningArea from '@/models/LearningArea';
import LearningSkill from '@/models/LearningSkill';
import PracticeMedium from '@/models/PracticeMedium';
import LearningLog from '@/models/LearningLog';
import SimpleLearningLog from '@/models/SimpleLearningLog';
import {
  dayjs
} from '@/lib/server-date-utils';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// Helper functions for date ranges - using dayjs with IST
function getDateRange(period: string): { start: Date; end: Date } {
  const today = dayjs().tz(DEFAULT_TIMEZONE).startOf('day');
  
  switch (period) {
    case 'last7Days': {
      // Last 7 days including today
      const sevenDaysAgo = today.subtract(6, 'day');
      return { start: sevenDaysAgo.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'last14Days': {
      const fourteenDaysAgo = today.subtract(13, 'day');
      return { start: fourteenDaysAgo.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'thisWeek': {
      // Start of week (Sunday) to today
      const startOfWeek = today.startOf('week');
      return { start: startOfWeek.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'lastWeek': {
      const startOfThisWeek = today.startOf('week');
      const startOfLastWeek = startOfThisWeek.subtract(7, 'day');
      return { start: startOfLastWeek.toDate(), end: startOfThisWeek.toDate() };
    }
    case 'thisMonth': {
      const startOfMonth = today.startOf('month');
      return { start: startOfMonth.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'lastMonth': {
      const startOfThisMonth = today.startOf('month');
      const startOfLastMonth = startOfThisMonth.subtract(1, 'month');
      return { start: startOfLastMonth.toDate(), end: startOfThisMonth.toDate() };
    }
    case 'last3Months': {
      const threeMonthsAgo = today.subtract(3, 'month');
      return { start: threeMonthsAgo.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'last6Months': {
      const sixMonthsAgo = today.subtract(6, 'month');
      return { start: sixMonthsAgo.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'thisYear': {
      const startOfYear = today.startOf('year');
      return { start: startOfYear.toDate(), end: today.add(1, 'day').toDate() };
    }
    case 'allTime': {
      return { start: dayjs('2020-01-01').tz(DEFAULT_TIMEZONE).toDate(), end: today.add(1, 'day').toDate() };
    }
    default:
      // Default to last 7 days
      const sevenDaysAgo = today.subtract(6, 'day');
      return { start: sevenDaysAgo.toDate(), end: today.add(1, 'day').toDate() };
  }
}

function getPreviousPeriodRange(period: string): { start: Date; end: Date } {
  const current = getDateRange(period);
  const duration = current.end.getTime() - current.start.getTime();
  return {
    start: new Date(current.start.getTime() - duration),
    end: current.start
  };
}

function getDaysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

// ============ OVERALL DASHBOARD REPORT ============
export async function getOverallReport(period: string = 'thisWeek') {
  await connectDB();
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // ROUTINE: Task completion stats
  const allTasks = await Task.find({ isActive: true }).lean();
  const taskIds = allTasks.map((t: any) => t._id);
  
  const completedLogs = await DailyLog.countDocuments({
    taskId: { $in: taskIds },
    date: { $gte: start, $lt: end },
    status: 'completed'
  });
  
  const totalPossibleTasks = await DailyLog.countDocuments({
    taskId: { $in: taskIds },
    date: { $gte: start, $lt: end }
  });
  
  const prevCompletedLogs = await DailyLog.countDocuments({
    taskId: { $in: taskIds },
    date: { $gte: prev.start, $lt: prev.end },
    status: 'completed'
  });
  
  const prevTotalPossibleTasks = await DailyLog.countDocuments({
    taskId: { $in: taskIds },
    date: { $gte: prev.start, $lt: prev.end }
  });
  
  const routineCompletionRate = totalPossibleTasks > 0 ? Math.round((completedLogs / totalPossibleTasks) * 100) : 0;
  const prevRoutineCompletionRate = prevTotalPossibleTasks > 0 ? Math.round((prevCompletedLogs / prevTotalPossibleTasks) * 100) : 0;
  
  // Points earned
  const pointsResult = await DailyLog.aggregate([
    { $match: { date: { $gte: start, $lt: end }, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
  ]);
  const totalPoints = pointsResult[0]?.total || 0;
  
  const prevPointsResult = await DailyLog.aggregate([
    { $match: { date: { $gte: prev.start, $lt: prev.end }, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
  ]);
  const prevTotalPoints = prevPointsResult[0]?.total || 0;
  
  // HEALTH: Exercise days (unique days with exercise), weight change
  const exerciseDaysResult = await ExerciseLog.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } } },
    { $count: 'days' }
  ]);
  const exerciseDays = exerciseDaysResult[0]?.days || 0;
  
  const prevExerciseDaysResult = await ExerciseLog.aggregate([
    { $match: { date: { $gte: prev.start, $lt: prev.end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } } },
    { $count: 'days' }
  ]);
  const prevExerciseDays = prevExerciseDaysResult[0]?.days || 0;
  
  // Weight change
  const latestWeight = await WeightLog.findOne({ date: { $lt: end } }).sort({ date: -1 }).lean();
  const startWeight = await WeightLog.findOne({ date: { $lt: start } }).sort({ date: -1 }).lean();
  const weightChange = latestWeight && startWeight 
    ? Number(((latestWeight as any).weight - (startWeight as any).weight).toFixed(1))
    : 0;
    
  // Mood average
  const moodLogs = await MoodLog.find({ date: { $gte: start, $lt: end } }).lean();
  const moodValues: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
  const avgMood = moodLogs.length > 0 
    ? (moodLogs.reduce((acc, m: any) => acc + moodValues[m.mood], 0) / moodLogs.length).toFixed(1)
    : 0;
  
  // BOOKS: Pages read (calculate from progress), books completed
  const bookLogs = await BookLog.find({ date: { $gte: start, $lt: end } })
    .populate('bookId')
    .sort({ date: 1 })
    .lean();
  
  // Calculate pages read by tracking progress per book
  const bookPageTracker: Record<string, { firstPage: number; lastPage: number }> = {};
  bookLogs.forEach((log: any) => {
    const bookId = log.bookId?._id?.toString() || log.bookId?.toString();
    if (!bookId) return;
    
    if (!bookPageTracker[bookId]) {
      bookPageTracker[bookId] = { firstPage: log.currentPage, lastPage: log.currentPage };
    } else {
      bookPageTracker[bookId].lastPage = Math.max(bookPageTracker[bookId].lastPage, log.currentPage);
      bookPageTracker[bookId].firstPage = Math.min(bookPageTracker[bookId].firstPage, log.currentPage);
    }
  });
  
  const totalPagesRead = Object.values(bookPageTracker).reduce(
    (acc, p) => acc + Math.max(0, p.lastPage - p.firstPage), 
    0
  );
  
  // Previous period pages read
  const prevBookLogs = await BookLog.find({ date: { $gte: prev.start, $lt: prev.end } })
    .sort({ date: 1 })
    .lean();
  
  const prevBookPageTracker: Record<string, { firstPage: number; lastPage: number }> = {};
  prevBookLogs.forEach((log: any) => {
    const bookId = log.bookId?._id?.toString() || log.bookId?.toString();
    if (!bookId) return;
    
    if (!prevBookPageTracker[bookId]) {
      prevBookPageTracker[bookId] = { firstPage: log.currentPage, lastPage: log.currentPage };
    } else {
      prevBookPageTracker[bookId].lastPage = Math.max(prevBookPageTracker[bookId].lastPage, log.currentPage);
      prevBookPageTracker[bookId].firstPage = Math.min(prevBookPageTracker[bookId].firstPage, log.currentPage);
    }
  });
  
  const prevPagesRead = Object.values(prevBookPageTracker).reduce(
    (acc, p) => acc + Math.max(0, p.lastPage - p.firstPage), 
    0
  );
  
  const booksCompleted = await Book.countDocuments({
    completedDate: { $gte: start, $lt: end }
  });
  const prevBooksCompleted = await Book.countDocuments({
    completedDate: { $gte: prev.start, $lt: prev.end }
  });
  
  // LEARNING: Total minutes practiced (using SimpleLearningLog)
  const learningResult = await SimpleLearningLog.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  const learningMinutes = learningResult[0]?.total || 0;
  
  const prevLearningResult = await SimpleLearningLog.aggregate([
    { $match: { date: { $gte: prev.start, $lt: prev.end } } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  const prevLearningMinutes = prevLearningResult[0]?.total || 0;
  
  // Domain breakdown for the period
  // Health: based on routine tasks
  const healthTasks = await Task.find({ domainId: 'health', isActive: true }).lean();
  const healthTaskIds = healthTasks.map((t: any) => t._id);
  
  const healthCompleted = await DailyLog.countDocuments({
    taskId: { $in: healthTaskIds },
    date: { $gte: start, $lt: end },
    status: 'completed'
  });
  
  const healthTotal = await DailyLog.countDocuments({
    taskId: { $in: healthTaskIds },
    date: { $gte: start, $lt: end }
  });
  
  const healthPointsRes = await DailyLog.aggregate([
    { $match: { taskId: { $in: healthTaskIds }, date: { $gte: start, $lt: end }, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
  ]);
  
  // Learning: based on learning logs - calculate days with practice vs total days
  const learningLogDays = await SimpleLearningLog.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } } },
    { $count: 'days' }
  ]);
  const learningDaysWithPractice = learningLogDays[0]?.days || 0;
  
  // Learning points: calculate from duration (1 point per 5 minutes)
  const learningPoints = Math.floor(learningMinutes / 5);
  
  const domainBreakdown = [
    {
      domain: 'health',
      completed: healthCompleted,
      total: healthTotal,
      completionRate: healthTotal > 0 ? Math.round((healthCompleted / healthTotal) * 100) : 0,
      points: healthPointsRes[0]?.total || 0
    },
    {
      domain: 'learning',
      completed: learningDaysWithPractice,
      total: daysInPeriod,
      completionRate: daysInPeriod > 0 ? Math.round((learningDaysWithPractice / daysInPeriod) * 100) : 0,
      points: learningPoints
    }
  ];
  
  // Daily breakdown for charts
  const dailyBreakdown = [];
  
  // Helper function to check if task should appear on a given day
  const shouldShowTaskOnDay = (task: any, dayOfWeek: number): boolean => {
    const recurrenceType = task.recurrenceType || 'daily';
    switch (recurrenceType) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'custom':
        return (task.recurrenceDays || []).includes(dayOfWeek);
      default:
        return true;
    }
  };
  
  for (let i = 0; i < daysInPeriod && i < 31; i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = dayStart.getDay();
    
    // Calculate how many tasks SHOULD appear on this day based on recurrence
    const expectedTasksForDay = allTasks.filter((task: any) => shouldShowTaskOnDay(task, dayOfWeek)).length;
    
    // Get actual completed tasks from DailyLog
    const dayCompleted = await DailyLog.countDocuments({
      taskId: { $in: taskIds },
      date: { $gte: dayStart, $lt: dayEnd },
      status: 'completed'
    });
    
    // Get learning duration for this day
    const dayLearningResult = await SimpleLearningLog.aggregate([
      { $match: { date: { $gte: dayStart, $lt: dayEnd } } },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);
    const dayLearningMinutes = dayLearningResult[0]?.total || 0;
    
    // Get pages read for this day
    const dayBookLogs = await BookLog.find({ date: { $gte: dayStart, $lt: dayEnd } })
      .sort({ date: 1 })
      .lean();
    
    const dayBookPageTracker: Record<string, { firstPage: number; lastPage: number }> = {};
    dayBookLogs.forEach((log: any) => {
      const bookId = log.bookId?._id?.toString() || log.bookId?.toString();
      if (!bookId) return;
      
      if (!dayBookPageTracker[bookId]) {
        dayBookPageTracker[bookId] = { firstPage: log.currentPage, lastPage: log.currentPage };
      } else {
        dayBookPageTracker[bookId].lastPage = Math.max(dayBookPageTracker[bookId].lastPage, log.currentPage);
        dayBookPageTracker[bookId].firstPage = Math.min(dayBookPageTracker[bookId].firstPage, log.currentPage);
      }
    });
    
    const dayPagesRead = Object.values(dayBookPageTracker).reduce(
      (acc, p) => acc + Math.max(0, p.lastPage - p.firstPage), 
      0
    );
    
    // Use expected tasks as total (not just logged tasks)
    dailyBreakdown.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: dayCompleted,
      total: expectedTasksForDay,
      rate: expectedTasksForDay > 0 ? Math.round((dayCompleted / expectedTasksForDay) * 100) : 0,
      learningMinutes: dayLearningMinutes,
      pagesRead: dayPagesRead
    });
  }
  
  return {
    period,
    dateRange: { start: start.toISOString(), end: end.toISOString() },
    summary: {
      routineCompletionRate,
      routineChange: routineCompletionRate - prevRoutineCompletionRate,
      totalPoints,
      pointsChange: totalPoints - prevTotalPoints,
      exerciseDays,
      exerciseChange: exerciseDays - prevExerciseDays,
      weightChange,
      avgMood: Number(avgMood),
      booksCompleted,
      booksChange: booksCompleted - prevBooksCompleted,
      pagesRead: totalPagesRead,
      pagesReadChange: totalPagesRead - prevPagesRead,
      learningMinutes,
      learningChange: learningMinutes - prevLearningMinutes,
      interactions: 0,
      interactionsChange: 0
    },
    domainBreakdown,
    dailyBreakdown
  };
}

// ============ ROUTINE REPORT ============
export async function getRoutineReport(period: string = 'thisWeek') {
  await connectDB();
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // Get all tasks grouped by domain
  const tasks = await Task.find({ isActive: true }).sort({ order: 1 }).lean();
  
  const taskStats = await Promise.all(tasks.map(async (task: any) => {
    const completed = await DailyLog.countDocuments({
      taskId: task._id,
      date: { $gte: start, $lt: end },
      status: 'completed'
    });
    
    const total = await DailyLog.countDocuments({
      taskId: task._id,
      date: { $gte: start, $lt: end }
    });
    
    const prevCompleted = await DailyLog.countDocuments({
      taskId: task._id,
      date: { $gte: prev.start, $lt: prev.end },
      status: 'completed'
    });
    
    const prevTotal = await DailyLog.countDocuments({
      taskId: task._id,
      date: { $gte: prev.start, $lt: prev.end }
    });
    
    const pointsRes = await DailyLog.aggregate([
      { $match: { taskId: task._id, date: { $gte: start, $lt: end }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
    ]);
    
    // Get streak
    const recentLogs = await DailyLog.find({ taskId: task._id })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    
    let currentStreak = 0;
    
    for (let i = 0; i < recentLogs.length; i++) {
      const log = recentLogs[i] as any;
      if (log.status === 'completed') {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      _id: task._id.toString(),
      title: task.title,
      domainId: task.domainId,
      timeOfDay: task.timeOfDay,
      completed,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      prevCompletionRate: prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0,
      points: pointsRes[0]?.total || 0,
      currentStreak
    };
  }));
  
  // Group by domain
  const byDomain: Record<string, any[]> = {};
  taskStats.forEach(task => {
    if (!byDomain[task.domainId]) byDomain[task.domainId] = [];
    byDomain[task.domainId].push(task);
  });
  
  // Group by time of day
  const byTimeOfDay: Record<string, any[]> = {};
  taskStats.forEach(task => {
    const time = task.timeOfDay || 'none';
    if (!byTimeOfDay[time]) byTimeOfDay[time] = [];
    byTimeOfDay[time].push(task);
  });
  
  // Overall stats
  const totalCompleted = taskStats.reduce((acc, t) => acc + t.completed, 0);
  const totalTasks = taskStats.reduce((acc, t) => acc + t.total, 0);
  const totalPoints = taskStats.reduce((acc, t) => acc + t.points, 0);
  const avgCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  
  // Best and worst performing tasks
  const sortedByRate = [...taskStats].sort((a, b) => b.completionRate - a.completionRate);
  const bestTasks = sortedByRate.slice(0, 5);
  const worstTasks = sortedByRate.filter(t => t.total > 0).slice(-5).reverse();
  
  // Daily completion chart
  const dailyData = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayCompleted = await DailyLog.countDocuments({
      date: { $gte: dayStart, $lt: dayEnd },
      status: 'completed'
    });
    
    const dayTotal = await DailyLog.countDocuments({
      date: { $gte: dayStart, $lt: dayEnd }
    });
    
    dailyData.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: dayCompleted,
      total: dayTotal,
      rate: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0
    });
  }
  
  return {
    period,
    summary: {
      totalCompleted,
      totalTasks,
      avgCompletionRate,
      totalPoints,
      totalActiveTasks: tasks.length
    },
    taskStats: taskStats.sort((a, b) => b.completionRate - a.completionRate),
    byDomain,
    byTimeOfDay,
    bestTasks,
    worstTasks,
    dailyData
  };
}

// ============ HEALTH REPORT ============
export async function getHealthReport(period: string = 'thisWeek') {
  await connectDB();
  
  // Explicitly ensure ExerciseDefinition model is registered
  if (!ExerciseDefinition) {
    throw new Error('ExerciseDefinition model not loaded');
  }
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // Exercise stats
  const exerciseLogs = await ExerciseLog.find({ date: { $gte: start, $lt: end } })
    .populate('exerciseId')
    .exec()
    .then((docs) => docs.map(doc => doc.toObject({ flattenMaps: true })));
    
  const prevExerciseLogs = await ExerciseLog.find({ date: { $gte: prev.start, $lt: prev.end } }).lean();
  
  // Group exercises by muscle
  const muscleWork: Record<string, number> = {};
  const exercisesByType: Record<string, { count: number; totalSets: number; totalReps: number; totalWeight: number }> = {};
  
  exerciseLogs.forEach((log: any) => {
    if (log.exerciseId?.targetMuscles) {
      log.exerciseId.targetMuscles.forEach((muscle: string) => {
        muscleWork[muscle] = (muscleWork[muscle] || 0) + 1;
      });
    }
    
    const exerciseName = log.exerciseId?.title || 'Unknown';
    if (!exercisesByType[exerciseName]) {
      exercisesByType[exerciseName] = { count: 0, totalSets: 0, totalReps: 0, totalWeight: 0 };
    }
    exercisesByType[exerciseName].count++;
    exercisesByType[exerciseName].totalSets += log.sets?.length || 0;
    log.sets?.forEach((set: any) => {
      exercisesByType[exerciseName].totalReps += set.reps || 0;
      exercisesByType[exerciseName].totalWeight += (set.weight || 0) * (set.reps || 0);
    });
  });
  
  // Weight tracking
  const weightLogs = await WeightLog.find({ date: { $gte: start, $lt: end } })
    .sort({ date: 1 })
    .lean();
    
  const startWeight = await WeightLog.findOne({ date: { $lt: start } }).sort({ date: -1 }).lean();
  const latestWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1] 
    : await WeightLog.findOne({ date: { $lt: end } }).sort({ date: -1 }).lean();
  
  const weightChange = latestWeight && startWeight 
    ? Number(((latestWeight as any).weight - (startWeight as any).weight).toFixed(1))
    : 0;
  
  // Mood tracking
  const moodLogs = await MoodLog.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 }).lean();
  const moodValues: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
  const moodDistribution: Record<string, number> = { great: 0, good: 0, okay: 0, low: 0, bad: 0 };
  moodLogs.forEach((m: any) => {
    moodDistribution[m.mood] = (moodDistribution[m.mood] || 0) + 1;
  });
  
  const avgMood = moodLogs.length > 0 
    ? (moodLogs.reduce((acc, m: any) => acc + moodValues[m.mood], 0) / moodLogs.length).toFixed(1)
    : 0;
  
  // Health routine tasks
  const healthTasks = await Task.find({ domainId: 'health', isActive: true }).lean();
  const healthTaskIds = healthTasks.map((t: any) => t._id);
  
  const healthTasksCompleted = await DailyLog.countDocuments({
    taskId: { $in: healthTaskIds },
    date: { $gte: start, $lt: end },
    status: 'completed'
  });
  
  const healthTasksTotal = await DailyLog.countDocuments({
    taskId: { $in: healthTaskIds },
    date: { $gte: start, $lt: end }
  });

  // Calculate workout streak with rest day logic
  // Get all exercise logs for streak calculation (last 90 days)
  const streakStart = dayjs().tz(DEFAULT_TIMEZONE).subtract(90, 'day').startOf('day').toDate();
  const streakEnd = dayjs().tz(DEFAULT_TIMEZONE).add(1, 'day').startOf('day').toDate();
  const allExerciseLogs = await ExerciseLog.find({ 
    date: { $gte: streakStart, $lt: streakEnd } 
  }).sort({ date: -1 }).lean();

  // Group by date
  const exerciseByDate: Record<string, boolean> = {};
  allExerciseLogs.forEach((log: any) => {
    const logDate = dayjs(log.date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    exerciseByDate[logDate] = true;
  });

  // Calculate streak backwards from today (counting both workout and valid rest days)
  let workoutStreak = 0;
  let checkDate = dayjs().tz(DEFAULT_TIMEZONE);
  let consecutiveWorkoutDays = 0;

  while (true) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const hasWorkout = exerciseByDate[dateStr];

    if (hasWorkout) {
      workoutStreak++;
      consecutiveWorkoutDays++;
    } else {
      // Check if this can be a rest day (after 2+ consecutive workout days)
      if (consecutiveWorkoutDays >= 2) {
        // This is a valid rest day, streak continues
        workoutStreak++; // Count rest day in streak
        consecutiveWorkoutDays = 0; // Reset counter for next rest day eligibility
      } else {
        // Can't be a rest day, streak breaks
        break;
      }
    }

    checkDate = checkDate.subtract(1, 'day');
    if (workoutStreak > 365) break; // Safety limit
  }
  
  // Daily exercise chart - use dayjs for proper IST timezone handling
  const dailyExercise = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const currentDay = dayjs(start).tz(DEFAULT_TIMEZONE).add(i, 'day');
    const dayStart = currentDay.startOf('day').toDate();
    const dayEnd = currentDay.add(1, 'day').startOf('day').toDate();
    
    const dayLogs = await ExerciseLog.find({ date: { $gte: dayStart, $lt: dayEnd } }).lean();
    const totalSets = dayLogs.reduce((acc, log: any) => acc + (log.sets?.length || 0), 0);
    
    dailyExercise.push({
      date: currentDay.format('YYYY-MM-DD'),
      dayName: currentDay.format('ddd'),
      sessions: dayLogs.length,
      sets: totalSets
    });
  }
  
  return {
    period,
    summary: {
      totalExerciseSessions: exerciseLogs.length,
      prevExerciseSessions: prevExerciseLogs.length,
      sessionChange: exerciseLogs.length - prevExerciseLogs.length,
      currentWeight: latestWeight ? (latestWeight as any).weight : null,
      weightChange,
      avgMood: Number(avgMood),
      healthTasksCompletionRate: healthTasksTotal > 0 
        ? Math.round((healthTasksCompleted / healthTasksTotal) * 100) 
        : 0,
      workoutStreak
    },
    muscleWork: Object.entries(muscleWork)
      .map(([muscle, count]) => ({ muscle, count }))
      .sort((a, b) => b.count - a.count),
    exercisesByType: Object.entries(exercisesByType)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    weightLogs: weightLogs.map((w: any) => ({
      date: w.date.toISOString().split('T')[0],
      weight: w.weight
    })),
    moodDistribution,
    moodLogs: moodLogs.map((m: any) => ({
      date: m.date.toISOString().split('T')[0],
      mood: m.mood,
      value: moodValues[m.mood]
    })),
    dailyExercise
  };
}

// ============ BOOKS REPORT ============
export async function getBooksReport(period: string = 'thisWeek') {
  await connectDB();
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // Books completed
  const booksCompleted = await Book.find({ completedDate: { $gte: start, $lt: end } }).lean();
  const prevBooksCompleted = await Book.countDocuments({ completedDate: { $gte: prev.start, $lt: prev.end } });
  
  // Books started
  const booksStarted = await Book.find({ startDate: { $gte: start, $lt: end } }).lean();
  
  // Reading logs
  const readingLogs = await BookLog.find({ date: { $gte: start, $lt: end } })
    .populate('bookId')
    .sort({ date: -1 })
    .lean();
  
  // Calculate pages read (approximate from logs)
  const bookProgress: Record<string, { firstPage: number; lastPage: number; sessions: number; minutes: number }> = {};
  readingLogs.forEach((log: any) => {
    const bookId = log.bookId?._id?.toString() || log.bookId?.toString();
    if (!bookId) return;
    
    if (!bookProgress[bookId]) {
      bookProgress[bookId] = { firstPage: log.currentPage, lastPage: log.currentPage, sessions: 0, minutes: 0 };
    }
    bookProgress[bookId].lastPage = Math.max(bookProgress[bookId].lastPage, log.currentPage);
    bookProgress[bookId].firstPage = Math.min(bookProgress[bookId].firstPage, log.currentPage);
    bookProgress[bookId].sessions++;
    bookProgress[bookId].minutes += log.duration || 0;
  });
  
  const totalPagesRead = Object.values(bookProgress).reduce((acc, p) => acc + (p.lastPage - p.firstPage), 0);
  const totalReadingSessions = readingLogs.length;
  const totalReadingMinutes = Object.values(bookProgress).reduce((acc, p) => acc + p.minutes, 0);
  
  // Reading by domain
  const domains = await BookDomain.find().lean();
  const byDomain = await Promise.all(domains.map(async (domain: any) => {
    const domainBooks = await Book.find({ domainId: domain._id }).lean();
    const domainBookIds = domainBooks.map((b: any) => b._id);
    
    const completed = domainBooks.filter((b: any) => b.status === 'completed').length;
    const reading = domainBooks.filter((b: any) => b.status === 'reading').length;
    const paused = domainBooks.filter((b: any) => b.status === 'paused').length;
    
    const periodLogs = await BookLog.find({
      bookId: { $in: domainBookIds },
      date: { $gte: start, $lt: end }
    }).lean();
    
    return {
      _id: domain._id.toString(),
      name: domain.name,
      color: domain.color,
      totalBooks: domainBooks.length,
      completed,
      reading,
      paused,
      sessionsThisPeriod: periodLogs.length
    };
  }));
  
  // Currently reading books with progress
  const currentlyReading = await Book.find({ status: 'reading' })
    .sort({ lastReadDate: -1 })
    .limit(10)
    .lean();
  
  const currentlyReadingWithProgress = await Promise.all(currentlyReading.map(async (book: any) => {
    const domain = await BookDomain.findById(book.domainId).lean();
    const progress = book.totalPages && book.currentPage 
      ? Math.round((book.currentPage / book.totalPages) * 100)
      : 0;
    
    const lastLog = await BookLog.findOne({ bookId: book._id }).sort({ date: -1 }).lean();
    
    return {
      _id: book._id.toString(),
      title: book.title,
      author: book.author,
      domain: domain ? { name: (domain as any).name, color: (domain as any).color } : null,
      currentPage: book.currentPage,
      totalPages: book.totalPages,
      progress,
      lastReadDate: book.lastReadDate
    };
  }));
  
  // Daily reading chart - with pages calculation
  const dailyReading = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayLogs = await BookLog.find({ date: { $gte: dayStart, $lt: dayEnd } }).lean();
    const dayMinutes = dayLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
    
    // Calculate pages for this day - approximate by looking at progress jumps
    let dayPages = 0;
    const bookDayProgress: Record<string, number[]> = {};
    dayLogs.forEach((log: any) => {
      const bookId = log.bookId?.toString();
      if (bookId && log.currentPage) {
        if (!bookDayProgress[bookId]) bookDayProgress[bookId] = [];
        bookDayProgress[bookId].push(log.currentPage);
      }
    });
    // For each book, pages read = max - min (or just count pages if single log)
    Object.values(bookDayProgress).forEach(pages => {
      if (pages.length > 0) {
        dayPages += Math.max(...pages) - Math.min(...pages);
        // If only 1 log, estimate pages from duration (avg 2 pages per minute)
        if (pages.length === 1 && dayMinutes > 0) {
          dayPages += Math.round(dayMinutes / dayLogs.length * 0.5);
        }
      }
    });
    
    dailyReading.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: dayLogs.length,
      minutes: dayMinutes,
      pagesRead: dayPages
    });
  }
  
  return {
    period,
    summary: {
      booksCompleted: booksCompleted.length,
      prevBooksCompleted,
      booksStarted: booksStarted.length,
      totalReadingSessions,
      totalReadingMinutes,
      totalPagesRead,
      currentlyReading: currentlyReading.length
    },
    booksCompleted: booksCompleted.map((b: any) => ({
      _id: b._id.toString(),
      title: b.title,
      author: b.author,
      completedDate: b.completedDate,
      rating: b.rating
    })),
    byDomain: byDomain.filter(d => d.totalBooks > 0),
    currentlyReadingWithProgress,
    dailyReading
  };
}

// ============ LEARNING REPORT ============
export async function getLearningReport(period: string = 'thisWeek', skillId?: string, areaId?: string) {
  await connectDB();
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // Get filter options for dropdowns
  const allAreas = await LearningArea.find().sort({ order: 1 }).lean();
  const allSkills = await LearningSkill.find().sort({ order: 1 }).lean();
  const allMediums = await PracticeMedium.find().sort({ order: 1 }).lean();
  
  // Build medium filter based on skill/area selection
  let mediumFilter: any = {};
  if (skillId) {
    const mediums = await PracticeMedium.find({ skillId }).lean();
    mediumFilter = { mediumId: { $in: mediums.map((m: any) => m._id) } };
  } else if (areaId) {
    const skills = await LearningSkill.find({ areaId }).lean();
    const mediums = await PracticeMedium.find({ skillId: { $in: skills.map((s: any) => s._id) } }).lean();
    mediumFilter = { mediumId: { $in: mediums.map((m: any) => m._id) } };
  }
  
  // Get all learning logs for period with filter
  const logs = await LearningLog.find({ 
    date: { $gte: start, $lt: end },
    ...mediumFilter
  })
    .populate('mediumId')
    .lean();
  
  const prevLogs = await LearningLog.find({ 
    date: { $gte: prev.start, $lt: prev.end },
    ...mediumFilter
  }).lean();
  
  // Total stats
  const totalMinutes = logs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
  const prevTotalMinutes = prevLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
  const totalSessions = logs.length;
  
  // By skill breakdown (more detailed)
  const skillsWithData = await Promise.all(allSkills.map(async (skill: any) => {
    const area = skill.areaId ? allAreas.find((a: any) => a._id.toString() === skill.areaId.toString()) : null;
    const mediums = allMediums.filter((m: any) => m.skillId?.toString() === skill._id?.toString());
    const mediumIds = mediums.map((m: any) => m._id);
    
    const skillLogs = await LearningLog.find({
      mediumId: { $in: mediumIds },
      date: { $gte: start, $lt: end }
    }).lean();
    
    const minutes = skillLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
    
    return {
      _id: skill._id.toString(),
      name: skill.name,
      areaId: skill.areaId?.toString() || '',
      areaName: area?.name || 'Unknown',
      areaColor: area?.color || '#888',
      sessions: skillLogs.length,
      minutes,
      avgSessionLength: skillLogs.length > 0 ? Math.round(minutes / skillLogs.length) : 0
    };
  }));
  
  // By area breakdown
  const areas = await LearningArea.find().lean();
  const byArea = await Promise.all(areas.map(async (area: any) => {
    const skills = await LearningSkill.find({ areaId: area._id }).lean();
    const skillIds = skills.map((s: any) => s._id);
    
    const mediums = await PracticeMedium.find({ skillId: { $in: skillIds } }).lean();
    const mediumIds = mediums.map((m: any) => m._id);
    
    const areaLogs = await LearningLog.find({
      mediumId: { $in: mediumIds },
      date: { $gte: start, $lt: end }
    }).lean();
    
    const minutes = areaLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
    
    return {
      _id: area._id.toString(),
      name: area.name,
      color: area.color,
      sessions: areaLogs.length,
      minutes,
      avgSessionLength: areaLogs.length > 0 ? Math.round(minutes / areaLogs.length) : 0
    };
  }));
  
  // By difficulty distribution
  const difficultyDist: Record<string, number> = { easy: 0, moderate: 0, challenging: 0, hard: 0 };
  logs.forEach((log: any) => {
    if (log.difficulty) {
      difficultyDist[log.difficulty] = (difficultyDist[log.difficulty] || 0) + 1;
    }
  });
  
  // Rating distribution
  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  logs.forEach((log: any) => {
    if (log.rating) {
      ratingDist[log.rating] = (ratingDist[log.rating] || 0) + 1;
    }
  });
  
  // Most practiced mediums
  const mediumStats: Record<string, { name: string; skillName: string; sessions: number; minutes: number }> = {};
  for (const log of logs) {
    const mediumId = (log as any).mediumId?._id?.toString() || (log as any).mediumId?.toString();
    const medium = (log as any).mediumId;
    const mediumName = medium?.name || 'Unknown';
    
    if (!mediumStats[mediumId]) {
      const skill = await LearningSkill.findById(medium?.skillId).lean();
      mediumStats[mediumId] = { 
        name: mediumName, 
        skillName: (skill as any)?.name || 'Unknown',
        sessions: 0, 
        minutes: 0 
      };
    }
    mediumStats[mediumId].sessions++;
    mediumStats[mediumId].minutes += (log as any).duration || 0;
  }
  
  const topMediums = Object.entries(mediumStats)
    .map(([id, stats]) => ({ _id: id, ...stats }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10);
  
  // Daily learning chart with breakdown
  const dailyLearning = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayLogs = await LearningLog.find({ 
      date: { $gte: dayStart, $lt: dayEnd },
      ...mediumFilter
    }).lean();
    const dayMinutes = dayLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
    
    dailyLearning.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: dayLogs.length,
      minutes: dayMinutes
    });
  }
  
  // Weekly trend (for longer periods)
  const weeklyTrend = [];
  if (daysInPeriod > 14) {
    const weeks = Math.ceil(daysInPeriod / 7);
    for (let w = 0; w < Math.min(weeks, 12); w++) {
      const weekStart = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekLogs = await LearningLog.find({
        date: { $gte: weekStart, $lt: weekEnd },
        ...mediumFilter
      }).lean();
      
      const weekMinutes = weekLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
      
      weeklyTrend.push({
        week: `W${w + 1}`,
        startDate: weekStart.toISOString().split('T')[0],
        sessions: weekLogs.length,
        minutes: weekMinutes,
        hours: Math.round(weekMinutes / 60 * 10) / 10
      });
    }
  }
  
  // Recent sessions for activity log
  const recentSessions = await LearningLog.find({
    date: { $gte: start, $lt: end },
    ...mediumFilter
  })
    .sort({ date: -1 })
    .limit(20)
    .populate('mediumId')
    .lean();
  
  const recentSessionsFormatted = await Promise.all(recentSessions.map(async (log: any) => {
    const medium = log.mediumId;
    const skill = medium?.skillId ? await LearningSkill.findById(medium.skillId).lean() : null;
    const area = skill ? await LearningArea.findById((skill as any).areaId).lean() : null;
    
    return {
      _id: log._id.toString(),
      date: log.date,
      duration: log.duration,
      difficulty: log.difficulty,
      rating: log.rating,
      activities: log.activities,
      mediumName: medium?.name || 'Unknown',
      skillName: (skill as any)?.name || 'Unknown',
      areaName: (area as any)?.name || 'Unknown',
      areaColor: (area as any)?.color || '#888'
    };
  }));
  
  return {
    period,
    filters: {
      areas: allAreas.map((a: any) => ({ _id: a._id.toString(), name: a.name, color: a.color })),
      skills: allSkills.map((s: any) => ({ 
        _id: s._id.toString(), 
        name: s.name, 
        areaId: s.areaId?.toString() || '' 
      })),
      selectedArea: areaId || null,
      selectedSkill: skillId || null
    },
    summary: {
      totalMinutes,
      prevTotalMinutes,
      minutesChange: totalMinutes - prevTotalMinutes,
      totalSessions,
      prevSessions: prevLogs.length,
      avgSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10
    },
    byArea: byArea.filter(a => a.sessions > 0),
    bySkill: skillsWithData.filter(s => s.sessions > 0),
    difficultyDist,
    ratingDist,
    topMediums,
    dailyLearning,
    weeklyTrend,
    recentSessions: recentSessionsFormatted
  };
}
