'use server';

import connectDB from '@/lib/db';
import Task from '@/models/Task';
import DailyLog from '@/models/DailyLog';
import WeightLog from '@/models/WeightLog';
import ExerciseLog from '@/models/ExerciseLog';
import ExerciseDefinition from '@/models/ExerciseDefinition';
import MoodLog from '@/models/MoodLog';
import Book from '@/models/Book';
import BookLog from '@/models/BookLog';
import BookDomain from '@/models/BookDomain';
import LearningArea from '@/models/LearningArea';
import LearningSkill from '@/models/LearningSkill';
import PracticeMedium from '@/models/PracticeMedium';
import LearningLog from '@/models/LearningLog';
import Relation from '@/models/Relation';
import Person from '@/models/Person';
import InteractionLog from '@/models/InteractionLog';

// Helper functions for date ranges
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today': {
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return { start: yesterday, end: today };
    }
    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      return { start: startOfWeek, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const startOfThisWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: startOfLastWeek, end: startOfThisWeek };
    }
    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfMonth, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    case 'lastMonth': {
      const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { start: startOfLastMonth, end: startOfThisMonth };
    }
    case 'last3Months': {
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      return { start: threeMonthsAgo, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    case 'last6Months': {
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      return { start: sixMonthsAgo, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    case 'thisYear': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { start: startOfYear, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    case 'allTime': {
      return { start: new Date(2020, 0, 1), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
    default:
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
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
  
  // HEALTH: Exercise sessions, weight change
  const exerciseSessions = await ExerciseLog.countDocuments({
    date: { $gte: start, $lt: end }
  });
  const prevExerciseSessions = await ExerciseLog.countDocuments({
    date: { $gte: prev.start, $lt: prev.end }
  });
  
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
  
  // BOOKS: Pages read, books completed
  const bookLogs = await BookLog.find({ date: { $gte: start, $lt: end } }).lean();
  const pagesRead = bookLogs.reduce((acc, log: any) => {
    // Find the previous log for this book to calculate pages read
    return acc + (log.currentPage || 0);
  }, 0);
  
  const booksCompleted = await Book.countDocuments({
    completedDate: { $gte: start, $lt: end }
  });
  const prevBooksCompleted = await Book.countDocuments({
    completedDate: { $gte: prev.start, $lt: prev.end }
  });
  
  // LEARNING: Total minutes practiced
  const learningResult = await LearningLog.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  const learningMinutes = learningResult[0]?.total || 0;
  
  const prevLearningResult = await LearningLog.aggregate([
    { $match: { date: { $gte: prev.start, $lt: prev.end } } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  const prevLearningMinutes = prevLearningResult[0]?.total || 0;
  
  // SOCIAL: Interactions count
  const interactions = await InteractionLog.countDocuments({
    date: { $gte: start, $lt: end }
  });
  const prevInteractions = await InteractionLog.countDocuments({
    date: { $gte: prev.start, $lt: prev.end }
  });
  
  // Domain breakdown for the period
  const domainBreakdown = await Promise.all(['health', 'learning', 'social'].map(async (domainId) => {
    const domainTasks = await Task.find({ domainId, isActive: true }).lean();
    const domainTaskIds = domainTasks.map((t: any) => t._id);
    
    const completed = await DailyLog.countDocuments({
      taskId: { $in: domainTaskIds },
      date: { $gte: start, $lt: end },
      status: 'completed'
    });
    
    const total = await DailyLog.countDocuments({
      taskId: { $in: domainTaskIds },
      date: { $gte: start, $lt: end }
    });
    
    const pointsRes = await DailyLog.aggregate([
      { $match: { taskId: { $in: domainTaskIds }, date: { $gte: start, $lt: end }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
    ]);
    
    return {
      domain: domainId,
      completed,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      points: pointsRes[0]?.total || 0
    };
  }));
  
  // Daily breakdown for charts
  const dailyBreakdown = [];
  for (let i = 0; i < daysInPeriod && i < 31; i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayCompleted = await DailyLog.countDocuments({
      taskId: { $in: taskIds },
      date: { $gte: dayStart, $lt: dayEnd },
      status: 'completed'
    });
    
    const dayTotal = await DailyLog.countDocuments({
      taskId: { $in: taskIds },
      date: { $gte: dayStart, $lt: dayEnd }
    });
    
    dailyBreakdown.push({
      date: dayStart.toISOString().split('T')[0],
      completed: dayCompleted,
      total: dayTotal,
      rate: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0
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
      exerciseSessions,
      exerciseChange: exerciseSessions - prevExerciseSessions,
      weightChange,
      avgMood: Number(avgMood),
      booksCompleted,
      booksChange: booksCompleted - prevBooksCompleted,
      learningMinutes,
      learningChange: learningMinutes - prevLearningMinutes,
      interactions,
      interactionsChange: interactions - prevInteractions
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // Exercise stats
  const exerciseLogs = await ExerciseLog.find({ date: { $gte: start, $lt: end } })
    .populate('exerciseId')
    .lean();
    
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
  
  // Daily exercise chart
  const dailyExercise = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayLogs = await ExerciseLog.find({ date: { $gte: dayStart, $lt: dayEnd } }).lean();
    const totalSets = dayLogs.reduce((acc, log: any) => acc + (log.sets?.length || 0), 0);
    
    dailyExercise.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
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
        : 0
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
  
  // Daily reading chart
  const dailyReading = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayLogs = await BookLog.find({ date: { $gte: dayStart, $lt: dayEnd } }).lean();
    const dayMinutes = dayLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
    
    dailyReading.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: dayLogs.length,
      minutes: dayMinutes
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
    const area = allAreas.find((a: any) => a._id.toString() === skill.areaId.toString());
    const mediums = allMediums.filter((m: any) => m.skillId.toString() === skill._id.toString());
    const mediumIds = mediums.map((m: any) => m._id);
    
    const skillLogs = await LearningLog.find({
      mediumId: { $in: mediumIds },
      date: { $gte: start, $lt: end }
    }).lean();
    
    const minutes = skillLogs.reduce((acc, log: any) => acc + (log.duration || 0), 0);
    
    return {
      _id: skill._id.toString(),
      name: skill.name,
      areaId: skill.areaId.toString(),
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
        areaId: s.areaId.toString() 
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

// ============ SOCIAL REPORT ============
export async function getSocialReport(period: string = 'thisWeek', relationId?: string, personId?: string) {
  await connectDB();
  
  const { start, end } = getDateRange(period);
  const prev = getPreviousPeriodRange(period);
  const daysInPeriod = getDaysBetween(start, end);
  
  // Get filter options
  const allRelations = await Relation.find().sort({ order: 1 }).lean();
  const allPeople = await Person.find().populate('relationId').sort({ order: 1 }).lean();
  
  // Build filter based on selection
  let personFilter: any = {};
  if (personId) {
    personFilter = { personId };
  } else if (relationId) {
    const people = await Person.find({ relationId }).lean();
    personFilter = { personId: { $in: people.map((p: any) => p._id) } };
  }
  
  // Get all interaction logs for period with filter
  const logs = await InteractionLog.find({ 
    date: { $gte: start, $lt: end },
    ...personFilter
  })
    .populate('personId')
    .sort({ date: -1 })
    .lean();
  
  const prevLogs = await InteractionLog.find({ 
    date: { $gte: prev.start, $lt: prev.end },
    ...personFilter
  }).lean();
  
  // Total stats
  const totalInteractions = logs.length;
  
  // By relation type
  const relations = await Relation.find().lean();
  const byRelation = await Promise.all(relations.map(async (relation: any) => {
    const people = await Person.find({ relationId: relation._id }).lean();
    const personIds = people.map((p: any) => p._id);
    
    const relationLogs = await InteractionLog.find({
      personId: { $in: personIds },
      date: { $gte: start, $lt: end }
    }).lean();
    
    // Emotional tone breakdown for this relation
    const toneBreakdown: Record<string, number> = {};
    relationLogs.forEach((log: any) => {
      if (log.emotionalTone) {
        toneBreakdown[log.emotionalTone] = (toneBreakdown[log.emotionalTone] || 0) + 1;
      }
    });
    
    return {
      _id: relation._id.toString(),
      name: relation.name,
      color: relation.color,
      icon: relation.icon,
      peopleCount: people.length,
      interactions: relationLogs.length,
      toneBreakdown
    };
  }));
  
  // Detailed people stats
  const peopleWithStats = await Promise.all(allPeople.map(async (person: any) => {
    const personLogs = await InteractionLog.find({
      personId: person._id,
      date: { $gte: start, $lt: end }
    }).sort({ date: -1 }).lean();
    
    const lastInteraction = personLogs[0];
    const daysSinceContact = lastInteraction 
      ? Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Calculate emotional quality score
    const toneScores: Record<string, number> = {
      happy: 5, excited: 5, calm: 4, neutral: 3, sad: 2, tense: 2, frustrated: 1
    };
    const avgTone = personLogs.length > 0 
      ? personLogs.reduce((acc, l: any) => acc + (toneScores[l.emotionalTone] || 3), 0) / personLogs.length
      : 0;
    
    return {
      _id: person._id.toString(),
      name: person.name,
      nickname: person.nickname,
      relationId: person.relationId?._id?.toString() || person.relationId?.toString(),
      relationName: (person.relationId as any)?.name || 'Unknown',
      relationColor: (person.relationId as any)?.color || '#888',
      interactions: personLogs.length,
      daysSinceContact,
      avgEmotionalScore: Math.round(avgTone * 10) / 10,
      lastContext: lastInteraction?.context,
      lastTone: lastInteraction?.emotionalTone
    };
  }));
  
  // Context distribution (call, chat, meet, video, other)
  const contextDist: Record<string, number> = { call: 0, chat: 0, meet: 0, video: 0, other: 0 };
  logs.forEach((log: any) => {
    if (log.context) {
      contextDist[log.context] = (contextDist[log.context] || 0) + 1;
    }
  });
  
  // Emotional tone distribution
  const emotionalDist: Record<string, number> = {};
  logs.forEach((log: any) => {
    if (log.emotionalTone) {
      emotionalDist[log.emotionalTone] = (emotionalDist[log.emotionalTone] || 0) + 1;
    }
  });
  
  // Your behavior distribution
  const behaviorDist: Record<string, number> = {};
  logs.forEach((log: any) => {
    if (log.yourBehavior) {
      behaviorDist[log.yourBehavior] = (behaviorDist[log.yourBehavior] || 0) + 1;
    }
  });
  
  // Calculate behavior quality score
  const behaviorScores: Record<string, number> = {
    present: 5, supportive: 5, patient: 4, distracted: 2, reactive: 2, defensive: 1
  };
  const avgBehavior = logs.length > 0 
    ? logs.reduce((acc, l: any) => acc + (behaviorScores[l.yourBehavior] || 3), 0) / logs.length
    : 0;
  
  // Top people by interactions
  const topPeople = [...peopleWithStats]
    .filter(p => p.interactions > 0)
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 10);
  
  // People who need attention (not contacted or low score)
  const neglectedPeople = [...peopleWithStats]
    .filter(p => p.interactions === 0 || (p.daysSinceContact && p.daysSinceContact > 14))
    .sort((a, b) => (b.daysSinceContact || 999) - (a.daysSinceContact || 999))
    .slice(0, 10);
  
  // Daily interactions chart
  const dailyInteractions = [];
  for (let i = 0; i < Math.min(daysInPeriod, 31); i++) {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayLogs = await InteractionLog.find({ 
      date: { $gte: dayStart, $lt: dayEnd },
      ...personFilter
    }).lean();
    
    // Context breakdown for the day
    const dayContexts: Record<string, number> = {};
    dayLogs.forEach((l: any) => {
      if (l.context) dayContexts[l.context] = (dayContexts[l.context] || 0) + 1;
    });
    
    dailyInteractions.push({
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      interactions: dayLogs.length,
      call: dayContexts.call || 0,
      chat: dayContexts.chat || 0,
      meet: dayContexts.meet || 0,
      video: dayContexts.video || 0,
      other: dayContexts.other || 0
    });
  }
  
  // Recent interactions log
  const recentInteractions = logs.slice(0, 20).map((log: any) => ({
    _id: log._id.toString(),
    date: log.date,
    personName: log.personId?.name || 'Unknown',
    context: log.context,
    emotionalTone: log.emotionalTone,
    yourBehavior: log.yourBehavior,
    insight: log.insight,
    nextIntention: log.nextIntention
  }));
  
  // Unique people contacted
  const contactedPersonIds = new Set(logs.map((l: any) => l.personId?._id?.toString() || l.personId?.toString()));
  
  return {
    period,
    filters: {
      relations: allRelations.map((r: any) => ({ _id: r._id.toString(), name: r.name, color: r.color })),
      people: allPeople.map((p: any) => ({ 
        _id: p._id.toString(), 
        name: p.name,
        relationId: p.relationId?._id?.toString() || p.relationId?.toString()
      })),
      selectedRelation: relationId || null,
      selectedPerson: personId || null
    },
    summary: {
      totalInteractions,
      prevInteractions: prevLogs.length,
      interactionsChange: totalInteractions - prevLogs.length,
      uniquePeopleContacted: contactedPersonIds.size,
      totalPeople: allPeople.length,
      neglectedCount: neglectedPeople.length,
      avgBehaviorScore: Math.round(avgBehavior * 10) / 10
    },
    byRelation: byRelation.filter(r => r.peopleCount > 0),
    peopleWithStats: peopleWithStats.sort((a, b) => b.interactions - a.interactions),
    contextDist,
    emotionalDist,
    behaviorDist,
    topPeople,
    neglectedPeople,
    dailyInteractions,
    recentInteractions
  };
}
