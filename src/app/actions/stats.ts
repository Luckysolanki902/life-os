'use server';

import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';
import Task from '@/models/Task';
import { dayjs } from '@/lib/server-date-utils';

// Ensure Task model is registered
import '@/models/Task'; 

export async function getIdentityMetric() {
  await dbConnect();
  
  // Aggregate points from all completed logs
  const result = await DailyLog.aggregate([
    { $match: { status: 'completed' } },
    {
      $lookup: {
        from: 'routinetasks', // Mongoose pluralizes 'RoutineTask' to 'routinetasks'
        localField: 'taskId',
        foreignField: '_id',
        as: 'task'
      }
    },
    { $unwind: '$task' },
    { $group: { 
        _id: null, 
        totalPoints: { $sum: "$pointsEarned" },
        health: { $sum: { $cond: [{ $eq: ["$task.domainId", "health"] }, "$pointsEarned", 0] } },
        career: { $sum: { $cond: [{ $eq: ["$task.domainId", "career"] }, "$pointsEarned", 0] } },
        learning: { $sum: { $cond: [{ $eq: ["$task.domainId", "learning"] }, "$pointsEarned", 0] } },
        discipline: { $sum: { $cond: [{ $eq: ["$task.domainId", "discipline"] }, "$pointsEarned", 0] } },
        personality: { $sum: { $cond: [{ $eq: ["$task.domainId", "personality"] }, "$pointsEarned", 0] } },
        startups: { $sum: { $cond: [{ $eq: ["$task.domainId", "startups"] }, "$pointsEarned", 0] } }
      } 
    }
  ]);

  const stats = result[0] || { totalPoints: 0, health: 0, career: 0, learning: 0, discipline: 0, personality: 0, startups: 0 };

  // Calculate percentage (e.g., 1% per 100 points, or just a level)
  // Let's say 100 points = 1% better version.
  const percentage = Math.floor(stats.totalPoints / 100);

  return {
    percentage,
    totalPoints: stats.totalPoints,
    domains: {
      health: stats.health,
      career: stats.career,
      learning: stats.learning,
      discipline: stats.discipline,
      personality: stats.personality,
      startups: stats.startups,
    }
  };
}

// Get last 7 days completion rate for mini chart
export async function getLast7DaysCompletion(): Promise<{ date: string; day: string; completed: number; total: number; rate: number }[]> {
  await dbConnect();
  
  const allTasks = await Task.find({ isActive: true }).lean();
  
  // Helper to check if task shows on a given day
  const shouldShowTaskOnDay = (task: any, dayOfWeek: number): boolean => {
    const recurrenceType = task.recurrenceType || 'daily';
    switch (recurrenceType) {
      case 'daily': return true;
      case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
      case 'custom': return (task.recurrenceDays || []).includes(dayOfWeek);
      default: return true;
    }
  };
  
  const result: { date: string; day: string; completed: number; total: number; rate: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().tz('Asia/Kolkata').subtract(i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const dayOfWeek = date.day();
    
    const dayStart = date.startOf('day').toDate();
    const dayEnd = date.endOf('day').toDate();
    
    // Expected tasks for this day
    const expectedTasks = allTasks.filter((task: any) => shouldShowTaskOnDay(task, dayOfWeek)).length;
    
    // Completed tasks
    const completed = await DailyLog.countDocuments({
      date: { $gte: dayStart, $lte: dayEnd },
      status: 'completed'
    });
    
    result.push({
      date: dateStr,
      day: date.format('dd').slice(0, 1),
      completed,
      total: expectedTasks,
      rate: expectedTasks > 0 ? Math.round((completed / expectedTasks) * 100) : 0
    });
  }
  
  return result;
}
