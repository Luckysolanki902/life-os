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
import { GripVertical, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskItem from './TaskItem';
import { updateTaskOrder, getRoutine, getRoutineForDate } from '@/app/actions/routine';
import { cn } from '@/lib/utils';
import { getLocalDateString, addDays, formatDateForDisplay, getDayOfWeek } from '@/lib/date-utils';

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
function SortableTaskItem({ task, dateStr }: { task: any; dateStr?: string }) {
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
        
        <TaskItem task={task} dateStr={dateStr} />
      </div>
    </div>
  );
}

interface RoutineListProps {
  initialTasks: any[];
  allTasks?: any[];
  initialSpecialTasks?: any[];
}

export default function RoutineList({ initialTasks, allTasks = [], initialSpecialTasks = [] }: RoutineListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [specialTasks, setSpecialTasks] = useState(initialSpecialTasks);
  const [viewMode, setViewMode] = useState<'today' | 'custom'>('today');
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState('all');
  
  // Custom date picker state
  const [customDate, setCustomDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  
  // Get today's date in user's local timezone as YYYY-MM-DD using dayjs
  const todayIST = getLocalDateString();
  
  // Get current day of week in client timezone using dayjs
  const todayDayOfWeek = getDayOfWeek(todayIST);

  // Format date for display using dayjs-based utility
  const formatDateDisplay = (dateStr: string) => {
    return formatDateForDisplay(dateStr, { showTodayYesterday: true, format: 'short' });
  };

  // Navigate to previous/next day using dayjs-based utility
  const navigateDay = (direction: 'prev' | 'next') => {
    const currentDateStr = customDate || todayIST;
    const newDateStr = addDays(currentDateStr, direction === 'next' ? 1 : -1);
    
    // Don't allow future dates
    if (newDateStr > todayIST) return;
    
    setCustomDate(newDateStr);
    fetchCustomDate(newDateStr);
  };

  // Fetch tasks for custom date
  const fetchCustomDate = async (dateStr: string) => {
    setIsLoadingCustom(true);
    try {
      const { routine: customTasks, specialTasks: customSpecial } = await getRoutineForDate(dateStr);
      setTasks(customTasks);
      setSpecialTasks(customSpecial);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  // Handle date picker change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate > todayIST) return; // Don't allow future dates
    
    setCustomDate(selectedDate);
    setIsDatePickerOpen(false);
    fetchCustomDate(selectedDate);
  };

  // Switch to custom mode
  const switchToCustom = () => {
    setViewMode('custom');
    if (!customDate) {
      // Default to yesterday using dayjs-based utility
      const yesterdayStr = addDays(todayIST, -1);
      setCustomDate(yesterdayStr);
      fetchCustomDate(yesterdayStr);
    }
  };

  // Switch to today mode
  const switchToToday = () => {
    setViewMode('today');
    // Refetch today's tasks
    const fetchToday = async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todaysTasks = await getRoutine(timezone);
      setTasks(todaysTasks);
    };
    fetchToday();
  };

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
  const displayTasks = tasks;

  const filteredTasks = displayTasks.filter(task => {
    const taskTime = task.timeOfDay || 'none';
    const matchesTime = timeFilter === 'all' || taskTime === timeFilter;
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'scheduled' && task.isScheduled) ||
      (typeFilter === 'flexible' && !task.isScheduled);
    
    // Recurrence filter removed since we no longer have 'all' view
    return matchesTime && matchesType;
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
  const activeFilters = [timeFilter, typeFilter].filter(f => f !== 'all').length;

  return (
    <div className="space-y-4">
      {/* Minimal Header with View Toggle + Filter Button */}
      <div className="flex items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 flex-1 sm:flex-initial">
          <button
            onClick={switchToToday}
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
            onClick={switchToCustom}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'custom' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays size={12} />
            Custom
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

      {/* Custom Date Navigator */}
      {viewMode === 'custom' && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/30 border border-border/50">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex-1 text-center relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="px-4 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium flex items-center gap-2 mx-auto"
            >
              <CalendarDays size={14} className="text-primary" />
              {customDate ? formatDateDisplay(customDate) : 'Select date'}
            </button>
            
            {isDatePickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDatePickerOpen(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-card border border-border rounded-xl shadow-xl p-3 animate-in zoom-in-95">
                  <input
                    type="date"
                    value={customDate}
                    onChange={handleDateChange}
                    max={todayIST}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
                  />
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={() => navigateDay('next')}
            disabled={customDate >= todayIST}
            className={cn(
              "p-2 rounded-lg transition-colors",
              customDate >= todayIST
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Loading indicator for custom date */}
      {isLoadingCustom && (
        <div className="text-center py-2">
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      )}

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
              <SortableTaskItem key={task._id} task={task} dateStr={customDate || todayIST} />
            ))}
            {pendingAndCompletedTasks.length === 0 && skippedTasks.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    {viewMode === 'today' 
                      ? "No tasks scheduled for today. Add a new habit!"
                      : `No tasks scheduled for ${customDate ? formatDateDisplay(customDate) : 'this day'}.`
                    }
                </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Special Tasks Section (Auto-completed from logs) */}
      {specialTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-primary/20">
          <p className="text-xs font-medium text-primary mb-3 px-1 flex items-center gap-2">
            <span>✨ Auto-Completed Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px]">
              {specialTasks.length}
            </span>
          </p>
          <div className="space-y-2">
            {specialTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
              >
                <div className="p-2 rounded-lg bg-primary/20">
                  <span className="text-lg">
                    {task.type === 'health' ? '💪' : task.type === 'books' ? '📚' : '🧠'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">
                      +{task.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.source}</p>
                </div>
                <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <TaskItem key={task._id} task={task} dateStr={customDate || todayIST} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
