'use server';

import connectDB from '@/lib/db';
import Relation from '@/models/Relation';
import Person from '@/models/Person';
import InteractionLog from '@/models/InteractionLog';
import Task from '@/models/Task';
import DailyLog from '@/models/DailyLog';
import { revalidatePath } from 'next/cache';

// Helper function to check if a task should appear on a given day
function shouldShowTaskOnDay(task: any, dayOfWeek: number): boolean {
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
}

// ============ DASHBOARD DATA ============
export async function getSocialDashboardData() {
  await connectDB();

  // Get all relations with their people nested
  const relations = await Relation.find().sort({ order: 1, createdAt: 1 }).lean();
  
  const relationsWithData = await Promise.all(relations.map(async (relation: any) => {
    const people = await Person.find({ relationId: relation._id }).sort({ order: 1 }).lean();
    
    const peopleWithLogs = await Promise.all(people.map(async (person: any) => {
      // Get recent interactions (last 10)
      const recentLogs = await InteractionLog.find({ personId: person._id })
        .sort({ date: -1 })
        .limit(10)
        .lean();
      
      const totalInteractions = await InteractionLog.countDocuments({ personId: person._id });
      
      return {
        ...person,
        _id: person._id.toString(),
        logs: recentLogs.map((log: any) => ({
          _id: log._id.toString(),
          date: log.date,
          context: log.context,
          emotionalTone: log.emotionalTone,
          yourBehavior: log.yourBehavior,
          insight: log.insight,
          nextIntention: log.nextIntention
        })),
        lastInteraction: recentLogs[0] ? {
          date: recentLogs[0].date,
          context: recentLogs[0].context,
          emotionalTone: recentLogs[0].emotionalTone
        } : null,
        totalInteractions
      };
    }));
    
    return {
      ...relation,
      _id: relation._id.toString(),
      people: peopleWithLogs,
      totalPeople: people.length
    };
  }));

  // Get today's social tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  
  const socialTasks = await Task.find({
    domainId: 'social',
    isActive: true
  }).lean();

  // Filter by recurrence
  const todaysTasks = socialTasks.filter((task: any) => shouldShowTaskOnDay(task, dayOfWeek));

  const taskIds = todaysTasks.map((t: any) => t._id);
  const taskLogs = await DailyLog.find({
    taskId: { $in: taskIds },
    date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
  }).lean();

  const routine = todaysTasks.map((task: any) => {
    const log = taskLogs.find((l: any) => l.taskId.toString() === task._id.toString());
    return {
      ...task,
      _id: task._id.toString(),
      log: log ? {
        ...log,
        _id: log._id.toString(),
        taskId: log.taskId.toString(),
      } : null
    };
  });

  // Recent interactions across all people
  const recentInteractions = await InteractionLog.find()
    .sort({ date: -1 })
    .limit(10)
    .lean();
  
  // Enrich recent interactions with person/relation info
  const enrichedInteractions = await Promise.all(recentInteractions.map(async (log: any) => {
    const person = await Person.findById(log.personId).lean();
    if (!person) return null;
    const relation = await Relation.findById((person as any).relationId).lean();
    if (!relation) return null;
    
    return {
      ...log,
      _id: log._id.toString(),
      personId: log.personId.toString(),
      person: { name: (person as any).name, nickname: (person as any).nickname },
      relation: { name: (relation as any).name, color: (relation as any).color, icon: (relation as any).icon }
    };
  }));

  return {
    relations: relationsWithData,
    routine,
    recentInteractions: enrichedInteractions.filter(Boolean)
  };
}

// ============ RELATION CRUD ============
export async function createRelation(data: { name: string; description?: string; icon?: string; color?: string }) {
  await connectDB();
  const maxOrder = await Relation.findOne().sort({ order: -1 }).lean();
  await Relation.create({ ...data, order: ((maxOrder as any)?.order || 0) + 1 });
  revalidatePath('/social');
  return { success: true };
}

export async function updateRelation(relationId: string, data: { name?: string; description?: string; icon?: string; color?: string }) {
  await connectDB();
  await Relation.findByIdAndUpdate(relationId, data);
  revalidatePath('/social');
  return { success: true };
}

export async function deleteRelation(relationId: string) {
  await connectDB();
  // Delete all nested data
  const people = await Person.find({ relationId });
  for (const person of people) {
    await InteractionLog.deleteMany({ personId: person._id });
  }
  await Person.deleteMany({ relationId });
  await Relation.findByIdAndDelete(relationId);
  revalidatePath('/social');
  return { success: true };
}

// ============ PERSON CRUD ============
export async function createPerson(data: { relationId: string; name: string; nickname?: string; notes?: string }) {
  await connectDB();
  const maxOrder = await Person.findOne({ relationId: data.relationId }).sort({ order: -1 }).lean();
  await Person.create({ ...data, order: ((maxOrder as any)?.order || 0) + 1 });
  revalidatePath('/social');
  return { success: true };
}

export async function updatePerson(personId: string, data: { name?: string; nickname?: string; notes?: string }) {
  await connectDB();
  await Person.findByIdAndUpdate(personId, data);
  revalidatePath('/social');
  return { success: true };
}

export async function deletePerson(personId: string) {
  await connectDB();
  await InteractionLog.deleteMany({ personId });
  await Person.findByIdAndDelete(personId);
  revalidatePath('/social');
  return { success: true };
}

// ============ INTERACTION LOG CRUD ============
export async function createInteractionLog(data: {
  personId: string;
  date: string;
  context: string;
  emotionalTone: string;
  yourBehavior: string;
  insight?: string;
  nextIntention?: string;
}) {
  await connectDB();
  await InteractionLog.create({
    ...data,
    date: new Date(data.date)
  });
  revalidatePath('/social');
  return { success: true };
}

export async function updateInteractionLog(logId: string, data: {
  context?: string;
  emotionalTone?: string;
  yourBehavior?: string;
  insight?: string;
  nextIntention?: string;
}) {
  await connectDB();
  await InteractionLog.findByIdAndUpdate(logId, data);
  revalidatePath('/social');
  return { success: true };
}

export async function deleteInteractionLog(logId: string) {
  await connectDB();
  await InteractionLog.findByIdAndDelete(logId);
  revalidatePath('/social');
  return { success: true };
}

// Quick log interaction with defaults
export async function quickLogInteraction(personId: string, context: string, emotionalTone: string, yourBehavior: string) {
  await connectDB();
  await InteractionLog.create({
    personId,
    date: new Date(),
    context,
    emotionalTone,
    yourBehavior
  });
  revalidatePath('/social');
  return { success: true };
}
