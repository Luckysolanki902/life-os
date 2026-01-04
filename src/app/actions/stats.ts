'use server';

import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';
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
        social: { $sum: { $cond: [{ $eq: ["$task.domainId", "social"] }, "$pointsEarned", 0] } }
      } 
    }
  ]);

  const stats = result[0] || { totalPoints: 0, health: 0, career: 0, learning: 0, social: 0 };

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
      social: stats.social,
    }
  };
}
