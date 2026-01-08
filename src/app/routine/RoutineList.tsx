'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CalendarDays, List } from 'lucide-react';
import TaskItem from './TaskItem';
import { updateTaskOrder, getRoutine } from '@/app/actions/routine';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

// Helper to check if task should show on a day
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

// Sortable Wrapper for TaskItem
function SortableTaskItem({ task }: { task: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <div className="relative group">
        {/* Drag Handle - Absolute positioned to left or integrated */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
        >
          <GripVertical size={20} />
        </div>
        
        <TaskItem task={task} />
      </div>
    </div>
  );
}

interface RoutineListProps {
  initialTasks: any[];
  allTasks?: any[];
}

export default function RoutineList({ initialTasks, allTasks = [] }: RoutineListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState('all');
  
  // Get current day of week in client timezone
  const todayDayOfWeek = new Date().getDay();

  // Re-fetch tasks with correct timezone on mount
  useEffect(() => {
    const fetchWithTimezone = async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todaysTasks = await getRoutine(timezone);
      setTasks(todaysTasks);
    };
    fetchWithTimezone();
  }, []);

  // Sync with server data if it changes (e.g. new task added)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentList = viewMode === 'today' ? tasks : allTasks;
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Trigger server update
        const orderUpdates = newItems.map((item, index) => ({
          id: item._id,
          order: index
        }));
        updateTaskOrder(orderUpdates);

        return newItems;
      });
    }
  }

  // Use allTasks when in 'all' view mode
  const displayTasks = viewMode === 'today' ? tasks : allTasks;

  const filteredTasks = displayTasks.filter(task => {
    const taskTime = task.timeOfDay || 'none';
    const matchesTime = timeFilter === 'all' || taskTime === timeFilter;
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'scheduled' && task.isScheduled) ||
      (typeFilter === 'flexible' && !task.isScheduled);
    
    // Recurrence filter (only applies in 'all' view)
    let matchesRecurrence = true;
    if (viewMode === 'all' && recurrenceFilter !== 'all') {
      const recType = task.recurrenceType || 'daily';
      matchesRecurrence = recType === recurrenceFilter;
    }
      
    return matchesTime && matchesType && matchesRecurrence;
  });

  // Sort tasks: pending first, then skipped, then completed
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder = { pending: 0, undefined: 0, skipped: 1, completed: 2 };
    const aStatus = a.log?.status || 'pending';
    const bStatus = b.log?.status || 'pending';
    return (statusOrder[aStatus as keyof typeof statusOrder] || 0) - (statusOrder[bStatus as keyof typeof statusOrder] || 0);
  });

  // Separate skipped tasks for display
  const pendingAndCompletedTasks = sortedTasks.filter(t => t.log?.status !== 'skipped');
  const skippedTasks = sortedTasks.filter(t => t.log?.status === 'skipped');

  // Count active filters
  const activeFilters = [timeFilter, typeFilter, recurrenceFilter].filter(f => f !== 'all').length;

  return (
    <div className="space-y-4">
      {/* Minimal Header with View Toggle + Filter Button */}
      <div className="flex items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 flex-1 sm:flex-initial">
          <button
            onClick={() => setViewMode('today')}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-all",
              viewMode === 'today' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-all",
              viewMode === 'all' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
            filterOpen || activeFilters > 0
              ? "bg-primary/10 text-primary border-primary/30" 
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          )}
        >
          Filter
          {activeFilters > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filters */}
      {filterOpen && (
        <div className="space-y-2 p-3 rounded-xl bg-secondary/30 border border-border/50 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Type:</span>
            {['all', 'scheduled', 'flexible'].map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium transition-all capitalize",
                  typeFilter === f 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background text-muted-foreground hover:bg-primary/10"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Time:</span>
            {['all', 'morning', 'afternoon', 'evening', 'night'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium transition-all capitalize",
                  timeFilter === f 
                    ? "bg-secondary-foreground/20 text-foreground" 
                    : "bg-background text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {viewMode === 'all' && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Recurrence:</span>
              {['all', 'daily', 'weekdays', 'weekends', 'custom'].map((f) => (
                <button
                  key={f}
                  onClick={() => setRecurrenceFilter(f)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-all",
                    recurrenceFilter === f 
                      ? "bg-violet-500/20 text-violet-400" 
                      : "bg-background text-muted-foreground hover:bg-violet-500/10"
                  )}
                >
                  {f === 'weekdays' ? 'Mon-Fri' : f === 'weekends' ? 'Sat-Sun' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={pendingAndCompletedTasks.map(t => t._id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {pendingAndCompletedTasks.map((task) => (
              <SortableTaskItem key={task._id} task={task} />
            ))}
            {pendingAndCompletedTasks.length === 0 && skippedTasks.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    {viewMode === 'today' 
                      ? "No tasks scheduled for today. Check 'All' or add a new habit!"
                      : "No tasks match the selected filters."
                    }
                </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Skipped Tasks Section */}
      {skippedTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-xs font-medium text-amber-500 mb-3 px-1 flex items-center gap-2">
            <span>Skipped Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-[10px]">
              {skippedTasks.length}
            </span>
          </p>
          <div className="space-y-2">
            {skippedTasks.map((task) => (
              <TaskItem key={task._id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
