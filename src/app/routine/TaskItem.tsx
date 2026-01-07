'use client';

import { useState } from 'react';
import { Check, Clock, Edit2, Trash2, X, CalendarDays, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { completeTask, uncompleteTask, updateTask, deleteTask } from '@/app/actions/routine';

const DAYS_OF_WEEK = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

function getRecurrenceLabel(task: any) {
  const type = task.recurrenceType || 'daily';
  if (type === 'daily') return 'Daily';
  if (type === 'weekdays') return 'Mon-Fri';
  if (type === 'weekends') return 'Sat-Sun';
  if (type === 'custom' && task.recurrenceDays?.length > 0) {
    return task.recurrenceDays.map((d: number) => DAYS_OF_WEEK[d].label).join('');
  }
  return 'Daily';
}

interface TaskItemProps {
  task: any;
  onOptimisticToggle?: (taskId: string, newStatus: boolean) => void;
}

export default function TaskItem({ task, onOptimisticToggle }: TaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  // Optimistic state for completion
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  
  // Edit form state
  const [title, setTitle] = useState(task.title);
  const [domainId, setDomainId] = useState(task.domainId);
  const [timeOfDay, setTimeOfDay] = useState(task.timeOfDay || 'none');
  const [basePoints, setBasePoints] = useState(task.basePoints || 5);
  const [isScheduled, setIsScheduled] = useState(task.isScheduled || false);
  const [startTime, setStartTime] = useState(task.startTime || '');
  const [endTime, setEndTime] = useState(task.endTime || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(task.notificationsEnabled ?? true);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>(
    task.recurrenceType || 'daily'
  );
  const [customDays, setCustomDays] = useState<number[]>(task.recurrenceDays || []);

  // Use optimistic state if set, otherwise use server state
  const isCompleted = optimisticCompleted !== null 
    ? optimisticCompleted 
    : task.log?.status === 'completed';

  const handleToggle = async () => {
    const newStatus = !isCompleted;
    
    // Optimistic update
    setOptimisticCompleted(newStatus);
    setIsCompleting(true);
    
    // Notify parent for list-level optimistic update
    onOptimisticToggle?.(task._id, newStatus);
    
    try {
      if (!newStatus) {
        await uncompleteTask(task._id);
      } else {
        await completeTask(task._id);
      }
      // Reset optimistic state - server state will take over on revalidation
      setOptimisticCompleted(null);
    } catch (error) {
      // Revert on error
      setOptimisticCompleted(!newStatus);
      console.error('Failed to toggle task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const toggleDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    setIsPending(true);
    await updateTask(task._id, {
      title,
      domainId,
      timeOfDay,
      basePoints,
      isScheduled,
      startTime: isScheduled ? startTime : null,
      endTime: isScheduled ? endTime : null,
      notificationsEnabled,
      recurrenceType,
      recurrenceDays: customDays,
    });
    setIsPending(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setIsPending(true);
    await deleteTask(task._id);
    setIsPending(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setTitle(task.title);
    setDomainId(task.domainId);
    setTimeOfDay(task.timeOfDay || 'none');
    setBasePoints(task.basePoints || 5);
    setIsScheduled(task.isScheduled || false);
    setStartTime(task.startTime || '');
    setEndTime(task.endTime || '');
    setNotificationsEnabled(task.notificationsEnabled ?? true);
    setRecurrenceType(task.recurrenceType || 'daily');
    setCustomDays(task.recurrenceDays || []);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-primary/30 shadow-lg space-y-4 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Edit Task</h3>
          <button type="button" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Domain */}
        <div>
          <label className="text-xs font-medium text-muted-foreground ml-1">Domain</label>
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="health">Health</option>
            <option value="career">Career</option>
            <option value="learning">Learning</option>
            <option value="startups">Startups</option>
            <option value="social">Social</option>
            <option value="discipline">Discipline</option>
            <option value="personality">Personality</option>
          </select>
        </div>

        {/* Time of Day */}
        <div>
          <label className="text-xs font-medium text-muted-foreground ml-1">Time of Day</label>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="none">Any Time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
            <option value="day">Day</option>
          </select>
        </div>

        {/* Points */}
        <div>
          <label className="text-xs font-medium text-muted-foreground ml-1">Points</label>
          <input
            type="number"
            value={basePoints}
            onChange={(e) => setBasePoints(Number(e.target.value))}
            min={1}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Schedule */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScheduled(!isScheduled)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isScheduled ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                <Clock size={16} />
              </button>
              <span className="text-sm font-medium text-muted-foreground">Schedule</span>
            </div>
            
            {isScheduled && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none [color-scheme:dark]"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none [color-scheme:dark]"
                />
              </div>
            )}
          </div>

          {isScheduled && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="rounded"
              />
              <Bell size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Notify me</span>
            </label>
          )}
        </div>

        {/* Recurrence */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Repeat</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['daily', 'weekdays', 'weekends', 'custom'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRecurrenceType(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize border",
                  recurrenceType === type 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {type === 'weekdays' ? 'Mon-Fri' : type === 'weekends' ? 'Sat-Sun' : type}
              </button>
            ))}
          </div>

          {recurrenceType === 'custom' && (
            <div className="flex gap-1 animate-in slide-in-from-top-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  title={day.fullLabel}
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-medium transition-colors border",
                    customDays.includes(day.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "group relative rounded-2xl border transition-all duration-300 overflow-hidden",
      isCompleted 
        ? "bg-secondary/30 border-transparent opacity-60" 
        : "bg-card border-border/50 hover:shadow-md hover:border-primary/20"
    )}>
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4">
        {/* Checkbox / Status */}
        <button
          onClick={handleToggle}
          disabled={isCompleting}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isCompleted
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium truncate transition-all",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span className={cn(
              "px-1.5 py-0.5 rounded-md bg-secondary font-medium uppercase tracking-wider text-[10px]",
              task.domainId === 'health' && "text-rose-500 bg-rose-500/10",
              task.domainId === 'career' && "text-blue-500 bg-blue-500/10",
              task.domainId === 'learning' && "text-amber-500 bg-amber-500/10",
            )}>
              {task.domainId}
            </span>
            {task.timeOfDay && task.timeOfDay !== 'none' && (
              <span className="px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground capitalize text-[10px]">
                {task.timeOfDay}
              </span>
            )}
            {task.isScheduled && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {task.startTime}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/70 text-[10px]">
              {getRecurrenceLabel(task)}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>{task.basePoints} pts</span>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  );
}
