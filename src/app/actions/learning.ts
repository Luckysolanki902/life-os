'use server';

import connectDB from '@/lib/db';
import LearningArea from '@/models/LearningArea';
import LearningSkill from '@/models/LearningSkill';
import PracticeMedium from '@/models/PracticeMedium';
import LearningLog from '@/models/LearningLog';
import Task from '@/models/Task';
import DailyLog from '@/models/DailyLog';
import { revalidatePath } from 'next/cache';

interface LearningLogDoc {
  _id: { toString(): string };
  mediumId: { toString(): string };
  date: Date;
  duration: number;
  activities?: string;
  difficulty?: string;
  notes?: string;
  rating?: number;
}

interface PracticeMediumDoc {
  _id: { toString(): string };
  skillId: { toString(): string };
  title: string;
  description?: string;
  icon?: string;
  order: number;
}

interface LearningSkillDoc {
  _id: { toString(): string };
  areaId: { toString(): string };
  title: string;
  description?: string;
  order: number;
}

interface LearningAreaDoc {
  _id: { toString(): string };
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
}

interface TaskDoc {
  _id: { toString(): string };
  title: string;
  domainId: string;
  [key: string]: unknown;
}

interface DailyLogDoc {
  _id?: { toString(): string };
  taskId: { toString(): string };
  date: Date;
  completed?: boolean;
  [key: string]: unknown;
}

// ============ DASHBOARD DATA ============
export async function getLearningDashboardData() {
  await connectDB();

  // Get all areas with their skills, mediums nested
  const areas = await LearningArea.find().sort({ order: 1, createdAt: 1 }).lean();
  
  const areasWithData = await Promise.all(areas.map(async (area: LearningAreaDoc) => {
    const skills = await LearningSkill.find({ areaId: area._id }).sort({ order: 1 }).lean();
    
    const skillsWithMediums = await Promise.all(skills.map(async (skill: LearningSkillDoc) => {
      const mediums = await PracticeMedium.find({ skillId: skill._id }).sort({ order: 1 }).lean();
      
      const mediumsWithStats = await Promise.all(mediums.map(async (medium: PracticeMediumDoc) => {
        // Get recent logs (last 10)
        const recentLogs = await LearningLog.find({ mediumId: medium._id })
          .sort({ date: -1 })
          .limit(10)
          .lean();
        
        const totalLogs = await LearningLog.countDocuments({ mediumId: medium._id });
        const totalMinutes = await LearningLog.aggregate([
          { $match: { mediumId: medium._id } },
          { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);
        
        return {
          ...medium,
          _id: medium._id.toString(),
          logs: recentLogs.map((log: LearningLogDoc) => ({
            _id: log._id.toString(),
            date: log.date,
            duration: log.duration,
            activities: log.activities,
            difficulty: log.difficulty,
            notes: log.notes,
            rating: log.rating
          })),
          lastLog: recentLogs[0] ? {
            date: recentLogs[0].date,
            duration: recentLogs[0].duration,
            difficulty: recentLogs[0].difficulty
          } : null,
          totalSessions: totalLogs,
          totalMinutes: totalMinutes[0]?.total || 0
        };
      }));
      
      return {
        ...skill,
        _id: skill._id.toString(),
        mediums: mediumsWithStats
      };
    }));
    
    // Calculate total time for area
    const areaTotalMinutes = skillsWithMediums.reduce((acc, skill) => 
      acc + skill.mediums.reduce((mediumAcc: number, m) => mediumAcc + m.totalMinutes, 0), 0);
    
    return {
      ...area,
      _id: area._id.toString(),
      skills: skillsWithMediums,
      totalMinutes: areaTotalMinutes
    };
  }));

  // Get today's learning tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()];
  
  const learningTasks = await Task.find({
    domain: 'learning',
    isActive: true,
    [`schedule.${dayOfWeek}`]: true
  }).lean();

  const taskIds = learningTasks.map((t: TaskDoc) => t._id);
  const taskLogs = await DailyLog.find({
    taskId: { $in: taskIds },
    date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
  }).lean();

  const routine = learningTasks.map((task: TaskDoc) => {
    const log = taskLogs.find((l: DailyLogDoc) => l.taskId.toString() === task._id.toString());
    return {
      ...task,
      _id: task._id.toString(),
      completed: log?.completed || false,
      logId: log?._id?.toString() || null
    };
  });

  // Recent logs across all mediums
  const recentLogs = await LearningLog.find()
    .sort({ date: -1 })
    .limit(10)
    .lean();
  
  // Enrich recent logs with medium/skill/area info
  const enrichedLogs = await Promise.all(recentLogs.map(async (log: LearningLogDoc) => {
    const medium = await PracticeMedium.findById(log.mediumId).lean();
    if (!medium) return null;
    const skill = await LearningSkill.findById((medium as PracticeMediumDoc).skillId).lean();
    if (!skill) return null;
    const area = await LearningArea.findById((skill as LearningSkillDoc).areaId).lean();
    if (!area) return null;
    
    return {
      ...log,
      _id: log._id.toString(),
      mediumId: log.mediumId.toString(),
      medium: { title: (medium as PracticeMediumDoc).title, icon: (medium as PracticeMediumDoc).icon },
      skill: { title: (skill as LearningSkillDoc).title },
      area: { title: (area as LearningAreaDoc).title, color: (area as LearningAreaDoc).color }
    };
  }));

  return {
    areas: areasWithData,
    routine,
    recentLogs: enrichedLogs.filter(Boolean)
  };
}

// ============ AREA CRUD ============
export async function createArea(data: { title: string; description?: string; icon?: string; color?: string }) {
  await connectDB();
  const maxOrder = await LearningArea.findOne().sort({ order: -1 }).lean();
  await LearningArea.create({ ...data, order: ((maxOrder as LearningAreaDoc | null)?.order || 0) + 1 });
  revalidatePath('/learning');
  return { success: true };
}

export async function updateArea(areaId: string, data: { title?: string; description?: string; icon?: string; color?: string }) {
  await connectDB();
  await LearningArea.findByIdAndUpdate(areaId, data);
  revalidatePath('/learning');
  return { success: true };
}

export async function deleteArea(areaId: string) {
  await connectDB();
  // Delete all nested data
  const skills = await LearningSkill.find({ areaId });
  for (const skill of skills) {
    const mediums = await PracticeMedium.find({ skillId: skill._id });
    for (const medium of mediums) {
      await LearningLog.deleteMany({ mediumId: medium._id });
    }
    await PracticeMedium.deleteMany({ skillId: skill._id });
  }
  await LearningSkill.deleteMany({ areaId });
  await LearningArea.findByIdAndDelete(areaId);
  revalidatePath('/learning');
  return { success: true };
}

// ============ SKILL CRUD ============
export async function createSkill(data: { areaId: string; title: string; description?: string }) {
  await connectDB();
  const maxOrder = await LearningSkill.findOne({ areaId: data.areaId }).sort({ order: -1 }).lean();
  await LearningSkill.create({ ...data, order: ((maxOrder as LearningSkillDoc | null)?.order || 0) + 1 });
  revalidatePath('/learning');
  return { success: true };
}

export async function updateSkill(skillId: string, data: { title?: string; description?: string }) {
  await connectDB();
  await LearningSkill.findByIdAndUpdate(skillId, data);
  revalidatePath('/learning');
  return { success: true };
}

export async function deleteSkill(skillId: string) {
  await connectDB();
  const mediums = await PracticeMedium.find({ skillId });
  for (const medium of mediums) {
    await LearningLog.deleteMany({ mediumId: medium._id });
  }
  await PracticeMedium.deleteMany({ skillId });
  await LearningSkill.findByIdAndDelete(skillId);
  revalidatePath('/learning');
  return { success: true };
}

// ============ MEDIUM CRUD ============
export async function createMedium(data: { skillId: string; title: string; description?: string; icon?: string }) {
  await connectDB();
  const maxOrder = await PracticeMedium.findOne({ skillId: data.skillId }).sort({ order: -1 }).lean();
  await PracticeMedium.create({ ...data, order: ((maxOrder as PracticeMediumDoc | null)?.order || 0) + 1 });
  revalidatePath('/learning');
  return { success: true };
}

export async function updateMedium(mediumId: string, data: { title?: string; description?: string; icon?: string }) {
  await connectDB();
  await PracticeMedium.findByIdAndUpdate(mediumId, data);
  revalidatePath('/learning');
  return { success: true };
}

export async function deleteMedium(mediumId: string) {
  await connectDB();
  await LearningLog.deleteMany({ mediumId });
  await PracticeMedium.findByIdAndDelete(mediumId);
  revalidatePath('/learning');
  return { success: true };
}

// ============ LOG CRUD ============
export async function createLog(data: {
  mediumId: string;
  date: string;
  duration: number;
  activities?: string;
  difficulty?: string;
  notes?: string;
  rating?: number;
}) {
  await connectDB();
  const logDate = new Date(data.date);
  logDate.setHours(12, 0, 0, 0); // Noon to avoid timezone issues
  
  await LearningLog.create({
    ...data,
    date: logDate
  });
  revalidatePath('/learning');
  return { success: true };
}

export async function updateLog(logId: string, data: {
  duration?: number;
  activities?: string;
  difficulty?: string;
  notes?: string;
  rating?: number;
}) {
  await connectDB();
  await LearningLog.findByIdAndUpdate(logId, data);
  revalidatePath('/learning');
  return { success: true };
}

export async function deleteLog(logId: string) {
  await connectDB();
  await LearningLog.findByIdAndDelete(logId);
  revalidatePath('/learning');
  return { success: true };
}

// ============ QUICK LOG (for fast logging) ============
export async function quickLog(mediumId: string, duration: number, difficulty: string = 'moderate') {
  await connectDB();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  await LearningLog.create({
    mediumId,
    date: today,
    duration,
    difficulty
  });
  revalidatePath('/learning');
  return { success: true };
}

// ============ STATS ============
export async function getMediumStats(mediumId: string) {
  await connectDB();
  
  const logs = await LearningLog.find({ mediumId }).sort({ date: -1 }).lean();
  
  // Calculate streaks, weekly stats, etc.
  const totalMinutes = logs.reduce((acc, l: LearningLogDoc) => acc + l.duration, 0);
  const totalSessions = logs.length;
  const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  
  // Last 7 days practice
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLogs = logs.filter((l: LearningLogDoc) => new Date(l.date) >= weekAgo);
  const weekMinutes = weekLogs.reduce((acc, l: LearningLogDoc) => acc + l.duration, 0);
  
  return {
    totalMinutes,
    totalSessions,
    avgDuration,
    weekMinutes,
    weekSessions: weekLogs.length,
    logs: logs.slice(0, 20).map((l: LearningLogDoc) => ({
      ...l,
      _id: l._id.toString(),
      mediumId: l.mediumId.toString()
    }))
  };
}
