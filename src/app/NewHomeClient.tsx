'use client';

import { useState, useTransition, useOptimistic, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Heart,
  Library,
  CheckCircle2,
  Circle,
  Scale,
  Clock,
  ChevronRight,
  ArrowRight,
  SkipForward,
  Pencil,
  BarChart3,
  Brain,
  Flame,
  BookMarked,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
  Target,
} from 'lucide-react';
import { toggleTaskStatus, skipTask, unskipTask } from './actions/routine';
import { logWeight, updateWeight } from './actions/health';
import { getLocalDateString, dayjs } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { hapticTaskComplete, hapticTaskSkip, hapticTaskUnskip } from '@/lib/haptics';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Heart,
  Brain,
  Library,
  BookMarked,
};

interface Task {
  _id: string;
  title: string;
  domainId: string;
  timeOfDay?: string;
  points: number;
  status?: 'pending' | 'completed' | 'skipped';
}

interface SpecialTask {
  _id: string;
  title: string;
  type: 'health' | 'books' | 'learning';
  points: number;
  completed: boolean;
  source: string;
}

interface Domain {
  id: string;
  name: string;
  icon: string;
  points: number;
  color: string;
  bg: string;
  border: string;
}

interface TodaysWeight {
  _id: string;
  weight: number;
  date: Date;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayValid: boolean;
  todayRoutineTasks: number;
  todayHasExercise: boolean;
  todayIsRestDay: boolean;
  todayCanBeRestDay: boolean;
  last7Days: { date: string; valid: boolean; isRestDay?: boolean }[];
  nextTarget: { days: number; points: number; label: string } | null;
  totalStreakPoints: number;
  reachedMilestones: { days: number; points: number; label: string }[];
}

interface DayCompletion {
  date: string;
  day: string;
  completed: number;
  total: number;
  rate: number;
}

interface Props {
  incompleteTasks: Task[];
  domains: Domain[];
  todaysWeight: TodaysWeight | null;
  streakData: StreakData;
  specialTasks: SpecialTask[];
  totalPoints: number;
  last7DaysCompletion: DayCompletion[];
}

export default function HomeClient({ 
  incompleteTasks, 
  domains, 
  todaysWeight,
  streakData,
  specialTasks,
  totalPoints,
  last7DaysCompletion
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state for tasks - instant UI updates
  type TaskAction = 
    | { type: 'complete'; taskId: string }
    | { type: 'uncomplete'; taskId: string }
    | { type: 'skip'; taskId: string }
    | { type: 'unskip'; taskId: string };
  
  const [optimisticTasks, updateOptimisticTasks] = useOptimistic(
    incompleteTasks,
    (currentTasks, action: TaskAction) => {
      switch (action.type) {
        case 'complete':
          return currentTasks.map(task => 
            task._id === action.taskId ? { ...task, status: 'completed' as const } : task
          );
        case 'uncomplete':
          return currentTasks.map(task => 
            task._id === action.taskId ? { ...task, status: 'pending' as const } : task
          );
        case 'skip':
          return currentTasks.map(task => 
            task._id === action.taskId ? { ...task, status: 'skipped' as const } : task
          );
        case 'unskip':
          return currentTasks.map(task => 
            task._id === action.taskId ? { ...task, status: 'pending' as const } : task
          );
        default:
          return currentTasks;
      }
    }
  );
  
  // Weight logging state
  const [weight, setWeight] = useState<string>('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightSuccess, setWeightSuccess] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  
  // Skipped tasks visibility
  const [showSkippedTasks, setShowSkippedTasks] = useState(false);

  const handleToggleTask = useCallback(async (taskId: string) => {
    // Instant haptic feedback
    hapticTaskComplete();
    
    startTransition(async () => {
      // Optimistic update - instant UI change
      updateOptimisticTasks({ type: 'complete', taskId });
      
      // Server action in background
      await toggleTaskStatus(taskId, true);
    });
  }, [updateOptimisticTasks]);

  const handleSkipTask = useCallback(async (taskId: string, isCurrentlySkipped: boolean) => {
    // Instant haptic feedback
    if (isCurrentlySkipped) {
      hapticTaskUnskip();
    } else {
      hapticTaskSkip();
    }
    
    startTransition(async () => {
      // Optimistic update - instant UI change
      updateOptimisticTasks({ 
        type: isCurrentlySkipped ? 'unskip' : 'skip', 
        taskId 
      });
      
      // Server action in background
      if (isCurrentlySkipped) {
        await unskipTask(taskId);
      } else {
        await skipTask(taskId);
      }
    });
  }, [updateOptimisticTasks]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    
    setWeightLoading(true);
    try {
      const today = getLocalDateString();
      
      if (isEditingWeight && todaysWeight) {
        await updateWeight(todaysWeight._id, parseFloat(weight));
      } else {
        await logWeight(parseFloat(weight), today);
      }
      setWeightSuccess(true);
      setWeight('');
      setIsEditingWeight(false);
      setTimeout(() => setWeightSuccess(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Error logging weight:', error);
    } finally {
      setWeightLoading(false);
    }
  };

  const startEditingWeight = () => {
    if (todaysWeight) {
      setWeight(todaysWeight.weight.toString());
      setIsEditingWeight(true);
    }
  };

  const getDomainColor = (domainId: string) => {
    const colors: Record<string, string> = {
      health: 'text-rose-500',
      discipline: 'text-violet-500',
      personality: 'text-emerald-500',
      startups: 'text-blue-500',
      career: 'text-cyan-500',
      learning: 'text-violet-500',
      books: 'text-amber-500',
    };
    return colors[domainId] || 'text-muted-foreground';
  };

  const getDomainBg = (domainId: string) => {
    const bgs: Record<string, string> = {
      health: 'bg-rose-500/10',
      discipline: 'bg-violet-500/10',
      personality: 'bg-emerald-500/10',
      startups: 'bg-blue-500/10',
      career: 'bg-cyan-500/10',
      learning: 'bg-violet-500/10',
      books: 'bg-amber-500/10',
    };
    return bgs[domainId] || 'bg-secondary';
  };

  // Get day abbreviation
  const getDayAbbr = (dateStr: string) => {
    return dayjs(dateStr).format('dd')[0];
  };

  return (
    <>
      <div className="space-y-6">
        {/* Streak Card - Minimal & Clean */}
        <section className="p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                streakData.currentStreak > 0 
                  ? "bg-linear-to-br from-orange-500 to-amber-500" 
                  : "bg-secondary"
              )}>
                <Flame size={24} className={streakData.currentStreak > 0 ? "text-white" : "text-muted-foreground"} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{streakData.currentStreak}</h3>
                <p className="text-xs text-muted-foreground">day streak</p>
              </div>
            </div>
            {streakData.nextTarget && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next milestone</p>
                <p className="text-sm font-medium text-orange-400">
                  {streakData.nextTarget.days - streakData.currentStreak} {streakData.nextTarget.days - streakData.currentStreak === 1 ? 'day' : 'days'} more
                </p>
              </div>
            )}
          </div>
          
          {/* Last 7 Days - Simple dots */}
          <div className="flex justify-between gap-1">
            {streakData.last7Days.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  day.valid 
                    ? "bg-orange-500" 
                    : index === 6 
                      ? "border-2 border-dashed border-orange-500/40" 
                      : "bg-secondary/50"
                )}>
                  {day.valid && <Flame size={14} className="text-white" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{getDayAbbr(day.date)}</span>
              </div>
            ))}
          </div>
          
          {/* Today's Progress - Compact */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                streakData.todayValid 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-orange-500/20 text-orange-400"
              )}>
                {streakData.todayValid 
                  ? (streakData.todayIsRestDay ? "Rest Day ✓" : "Complete ✓") 
                  : streakData.todayRoutineTasks >= 5 
                    ? (streakData.todayCanBeRestDay ? "Rest Day OK" : (streakData.todayHasExercise ? "Complete ✓" : "Need Exercise"))
                    : `${streakData.todayRoutineTasks}/5 tasks`
                }
              </span>
            </div>
          </div>
        </section>

        {/* Next Tasks Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Next Up</h2>
            <Link href="/routine" className="text-sm text-primary hover:underline flex items-center gap-1">
              All Tasks <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2">
            {(() => {
              // Filter tasks by status
              const pendingTasks = optimisticTasks.filter(t => t.status !== 'skipped' && t.status !== 'completed');
              const skippedTasks = optimisticTasks.filter(t => t.status === 'skipped');
              
              // Show first 3 pending tasks
              const displayTasks = pendingTasks.slice(0, 3);
              const remainingCount = pendingTasks.length - 3;
              
              if (pendingTasks.length === 0 && skippedTasks.length === 0) {
                return (
                  <div className="bg-card rounded-2xl border border-emerald-500/30 p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={32} />
                    <p className="font-medium text-emerald-500">All done for today! 🎉</p>
                    <p className="text-sm text-muted-foreground mt-1">You&apos;ve completed all your tasks</p>
                  </div>
                );
              }
              
              return (
                <>
                  {displayTasks.map((task) => (
                    <div
                      key={task._id}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 
                        hover:border-primary/30 hover:bg-primary/5 transition-all text-left group
                        animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                    >
                      <button
                        onClick={() => handleToggleTask(task._id)}
                        className={`p-2 rounded-xl ${getDomainBg(task.domainId)} active:scale-90 transition-transform`}
                      >
                        <Circle size={20} className={getDomainColor(task.domainId)} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{task.domainId}</span>
                          {task.timeOfDay && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{task.timeOfDay}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{task.points} pts</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSkipTask(task._id, false)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 
                          transition-all active:scale-90"
                        title="Skip task"
                      >
                        <SkipForward size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Show remaining count */}
                  {remainingCount > 0 && (
                    <Link 
                      href="/routine"
                      className="block text-center py-3 rounded-2xl bg-secondary/30 border border-border/30 
                        text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                    >
                      +{remainingCount} more task{remainingCount > 1 ? 's' : ''}
                    </Link>
                  )}
                  
                  {/* Skipped tasks - hidden by default, show in chip like health page */}
                  {skippedTasks.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowSkippedTasks(!showSkippedTasks)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary"
                      >
                        {showSkippedTasks ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showSkippedTasks ? 'Hide' : 'Show'} skipped ({skippedTasks.length})
                      </button>
                      
                      {showSkippedTasks && (
                        <div className="space-y-2 opacity-60">
                          {skippedTasks.map((task) => (
                            <div
                              key={task._id}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 
                                text-left group animate-in fade-in-0 duration-200"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">{task.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="capitalize">{task.domainId}</span>
                                  {task.timeOfDay && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">{task.timeOfDay}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>{task.points} pts</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSkipTask(task._id, true)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 
                                  transition-all active:scale-90"
                                title="Unskip task"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* Daily Completion Chart */}
        <section className="p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground">Completion Rate</h3>
            </div>
            <Link href="/reports" className="text-xs text-primary hover:underline">
              Details
            </Link>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysCompletion}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.6 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.6 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? [`${value}%`, 'Completion'] : ['', '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#completionGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <Scale size={18} className="text-rose-500" />
            </div>
            <h3 className="font-semibold">Log Weight</h3>
          </div>

          {todaysWeight && !isEditingWeight ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Weight</p>
                <p className="text-2xl font-bold">{todaysWeight.weight} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
              </div>
              <button
                onClick={startEditingWeight}
                className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Edit weight"
              >
                <Pencil size={18} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogWeight} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Weight in kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 
                    focus:outline-none focus:border-primary/50 text-sm"
                />
                <button
                  type="submit"
                  disabled={!weight || weightLoading}
                  className={`px-6 py-3 rounded-xl font-medium text-sm transition-all
                    ${weightSuccess 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {weightLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : weightSuccess ? (
                    <CheckCircle2 size={18} />
                  ) : isEditingWeight ? (
                    'Update'
                  ) : (
                    'Log'
                  )}
                </button>
              </div>
              {isEditingWeight && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingWeight(false);
                    setWeight('');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel editing
                </button>
              )}
            </form>
          )}
        </section>

        {/* Domain Cards */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Domains</h2>
          
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {domains.map((domain) => {
              const Icon = iconMap[domain.icon] || Heart;
              
              return (
                <Link
                  key={domain.id}
                  href={`/${domain.id}`}
                  className={`group relative overflow-hidden p-4 rounded-2xl bg-card border ${domain.border} 
                    hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${domain.bg} ${domain.color} mb-2`}>
                    <Icon size={20} />
                  </div>
                  
                  <h3 className="font-medium text-sm">{domain.name}</h3>
                  
                  <ArrowRight 
                    size={14} 
                    className="absolute bottom-3 right-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-3">
          <Link 
            href="/routine"
            className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 
              hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <Clock size={20} className="text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Routine</p>
              <p className="text-xs text-muted-foreground truncate">Manage habits</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-all" />
          </Link>
          
          <Link 
            href="/reports"
            className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 
              hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <BarChart3 size={20} className="text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Reports</p>
              <p className="text-xs text-muted-foreground truncate">View analytics</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-all" />
          </Link>
        </section>
      </div>
    </>
  );
}
