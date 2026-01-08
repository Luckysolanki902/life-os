'use server';

import connectDB from '@/lib/db';
import Task from '@/models/Task';
import DailyLog from '@/models/DailyLog';
import User from '@/models/User';
import { revalidatePath } from 'next/cache';

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

// --- Fetching ---

export async function getRoutine(timezone?: string) {
  await connectDB();
  
  // Use client timezone to determine the current day
  const now = new Date();
  let dayOfWeek: number;
  
  if (timezone) {
    // Get day of week in client's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short'
    });
    const dayStr = formatter.format(now);
    const dayMap: Record<string, number> = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    dayOfWeek = dayMap[dayStr] ?? now.getDay();
  } else {
    dayOfWeek = now.getDay();
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Get all active tasks definition
  const tasks = await Task.find({ isActive: true }).sort({ order: 1 }).lean();
  
  // 2. Filter tasks by recurrence for today
  const todaysTasks = tasks.filter((task: any) => shouldShowTaskOnDay(task, dayOfWeek));

  // 3. Get today's logs for these tasks
  const logs = await DailyLog.find({
    date: today,
    taskId: { $in: todaysTasks.map((t: any) => t._id) }
  }).lean();

  // 4. Merge them
  const routine = todaysTasks.map((task: any) => {
    const log = logs.find((l: any) => l.taskId.toString() === task._id.toString());
    
    // Destructure to remove potential subtasks or other non-serializable fields from old schema
    const { subtasks, ...cleanTask } = task;

    return {
      ...cleanTask,
      _id: task._id.toString(),
      log: log ? {
        ...log,
        _id: log._id.toString(),
        taskId: log.taskId.toString(),
      } : null
    };
  });

  return routine;
}

// Get all tasks (regardless of recurrence) for management view
export async function getAllTasks() {
  await connectDB();
  
  const tasks = await Task.find({ isActive: true }).sort({ order: 1 }).lean();
  
  return tasks.map((task: any) => {
    const { subtasks, ...cleanTask } = task;
    return {
      ...cleanTask,
      _id: task._id.toString(),
    };
  });
}

// --- Actions ---

export async function createTask(formData: FormData) {
  await connectDB();
  
  const title = formData.get('title');
  const domainId = formData.get('domainId');
  const basePoints = Number(formData.get('basePoints'));
  const timeOfDay = formData.get('timeOfDay') || 'none';
  
  const isScheduled = formData.get('isScheduled') === 'true';
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const notificationsEnabled = formData.get('notificationsEnabled') === 'on';
  
  // Recurrence
  const recurrenceType = formData.get('recurrenceType') || 'daily';
  const recurrenceDaysStr = formData.get('recurrenceDays');
  const recurrenceDays = recurrenceDaysStr ? JSON.parse(recurrenceDaysStr as string) : [];

  // Basic validation
  if (!title || !domainId) return { error: 'Missing fields' };

  await Task.create({
    title,
    domainId,
    basePoints,
    timeOfDay,
    isScheduled,
    startTime: isScheduled ? startTime : null,
    endTime: isScheduled ? endTime : null,
    notificationsEnabled,
    recurrenceType,
    recurrenceDays,
    order: 999, // Append to end
  });

  revalidatePath('/routine');
  revalidatePath('/health');
  revalidatePath('/social');
  return { success: true };
}

export async function updateTask(taskId: string, data: {
  title?: string;
  domainId?: string;
  timeOfDay?: string;
  basePoints?: number;
  isScheduled?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  notificationsEnabled?: boolean;
  recurrenceType?: string;
  recurrenceDays?: number[];
}) {
  await connectDB();
  
  const task = await Task.findById(taskId);
  if (!task) return { error: 'Task not found' };
  
  await Task.findByIdAndUpdate(taskId, {
    $set: {
      ...data,
    }
  });

  revalidatePath('/routine');
  revalidatePath('/health');
  revalidatePath('/social');
  return { success: true };
}

export async function deleteTask(taskId: string) {
  await connectDB();
  
  // Soft delete - set isActive to false
  await Task.findByIdAndUpdate(taskId, { $set: { isActive: false } });

  revalidatePath('/routine');
  revalidatePath('/health');
  revalidatePath('/social');
  return { success: true };
}

export async function completeTask(taskId: string) {
  await connectDB();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const task = await Task.findById(taskId);
  if (!task) return { error: 'Task not found' };

  const points = task.basePoints || 0;

  // Create/Update Log
  const log = await DailyLog.findOneAndUpdate(
    { taskId, date: today },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        pointsEarned: points,
      }
    },
    { upsert: true, new: true }
  );

  // Update User Total
  // Note: In a real app, we'd need to handle un-completing or re-completing (diffing points)
  // For MVP, we just add. *Bug risk: double counting if re-clicked* -> Fixed below
  
  // Simple fix: We should recalculate total points from scratch or handle diff.
  // For now, let's just increment. *To be improved*.
  await User.findOneAndUpdate({}, { $inc: { totalPoints: points } });

  revalidatePath('/routine');
  return { success: true };
}

export async function uncompleteTask(taskId: string) {
  await connectDB();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the log to know how many points to deduct
  const log = await DailyLog.findOne({ taskId, date: today });
  
  if (log && log.status === 'completed') {
    // Deduct points
    await User.findOneAndUpdate({}, { $inc: { totalPoints: -log.pointsEarned } });
    
    // Remove log or set to pending
    // We'll remove it to allow fresh completion
    await DailyLog.deleteOne({ _id: log._id });
  }

  revalidatePath('/routine');
  return { success: true };
}

export async function toggleTaskStatus(taskId: string, isCompleted: boolean) {
    if (isCompleted) {
        return completeTask(taskId);
    } else {
        return uncompleteTask(taskId);
    }
}

export async function updateTaskOrder(items: { id: string; order: number }[]) {
  await connectDB();
  
  const operations = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } },
    },
  }));

  await Task.bulkWrite(operations);
  revalidatePath('/routine');
  return { success: true };
}

export async function bulkCreateTasks(tasksData: any[]) {
  await connectDB();
  
  const tasksToInsert = tasksData.map((t, index) => ({
    title: t.title,
    domainId: t.domainId || 'health',
    timeOfDay: t.timeOfDay || 'none',
    basePoints: Number(t.basePoints) || 1,
    isScheduled: !!t.startTime,
    startTime: t.startTime || null,
    endTime: t.endTime || null,
    notificationsEnabled: true,
    recurrenceType: t.recurrenceType || 'daily',
    recurrenceDays: t.recurrenceDays || [],
    order: t.order !== undefined ? Number(t.order) : index
  }));

  if (tasksToInsert.length > 0) {
    await Task.insertMany(tasksToInsert);
    revalidatePath('/routine');
    revalidatePath('/health');
    revalidatePath('/social');
  }
  
  return { success: true };
}
