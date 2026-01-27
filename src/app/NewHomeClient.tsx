'use client';

import { useState, useOptimistic, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, Flame, Wind, Droplets, Dumbbell, BookOpen, Target, 
  CheckCircle2, Circle, MoreHorizontal, ArrowRight,
  TrendingUp, Calendar, Clock, ChevronRight, BarChart3,
  RotateCcw, Trash2, Edit2, Archive, Play, SkipForward, Eye, EyeOff,
  Scale, Pencil, Loader2, Leaf
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { toggleTaskStatus, skipTask, unskipTask } from '@/app/actions/routine';
import { logWeight } from '@/app/actions/health';
import { getDashboardStats } from '@/app/actions/reports';
import { getBetterPercentage } from '@/lib/better';
import { format } from 'date-fns';

// Fallback toast hook if '@/components/ui/use-toast' is unavailable
function useToast() {
  return {
    toast: (opts: { title?: string; description?: string; variant?: 'destructive' | string } = {}) => {
      if (typeof window !== 'undefined') {
        // Minimal non-blocking fallback: log to console (and optionally show alert during development)
        if (opts.variant === 'destructive') {
          console.error('Toast:', opts.title ?? '', opts.description ?? '');
        } else {
          console.log('Toast:', opts.title ?? '', opts.description ?? '');
        }
      }
    }
  };
}

type Task = {
  _id: string;
  title: string;
  domainId: string;
  timeOfDay?: string;
  points: number;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
};

type Props = {
  incompleteTasks: Task[];
  domains: any[];
  todaysWeight: any;
  streakData: {
    currentStreak: number;
    last7Days: Array<{
      date: string;
      valid: boolean;
      points: number;
      isRestDay: boolean; // Added backend support for rest days
    }>;
    todayValid: boolean;
    todayRoutineTasks: number;
    todayCanBeRestDay: boolean;
    todayIsRestDay: boolean;
  };
  specialTasks: any[]; // Kept for types but not used in new design yet
  totalPoints: number;
  last7DaysCompletion: any[];
  user?: {
    name: string;
  }
};

export default function NewHomeClient({ 
  incompleteTasks: initialTasks, 
  domains, 
  todaysWeight: initialWeight,
  streakData,
  totalPoints,
  last7DaysCompletion,
  user
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showSkippedTasks, setShowSkippedTasks] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setDashboardStats).catch(console.error);
  }, []);

  // Optimistic Tasks
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    initialTasks,
    (state, { taskId, type }: { taskId: string, type: 'toggle' | 'skip' | 'unskip' }) => {
      return state.map(task => {
        if (task._id === taskId) {
          if (type === 'toggle') {
            return {
              ...task,
              status: task.status === 'completed' ? 'pending' : 'completed',
              completedAt: task.status === 'completed' ? undefined : new Date().toISOString()
            };
          } else if (type === 'skip') {
            return { ...task, status: 'skipped' };
          } else if (type === 'unskip') {
            return { ...task, status: 'pending' };
          }
        }
        return task;
      });
    }
  );

  // Weight Logic
  const [weight, setWeight] = useState('');
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [todaysWeight, setTodaysWeight] = useState(initialWeight);
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightSuccess, setWeightSuccess] = useState(false);

  // Sort tasks: pending first, then time of day
  const sortedTasks = [...optimisticTasks].sort((a, b) => {
    // 1. Status priority: pending < skipped < completed
    const statusScore = (status: string) => {
      if (status === 'pending') return 0;
      if (status === 'skipped') return 1;
      return 2;
    };
    const scoreA = statusScore(a.status);
    const scoreB = statusScore(b.status);
    if (scoreA !== scoreB) return scoreA - scoreB;

    // 2. Time of day
    const times = { morning: 0, afternoon: 1, evening: 2, any: 3 };
    const timeA = times[a.timeOfDay as keyof typeof times] ?? 3;
    const timeB = times[b.timeOfDay as keyof typeof times] ?? 3;
    return timeA - timeB;
  });

  async function handleToggleTask(taskId: string) {
    const task = optimisticTasks.find(t => t._id === taskId);
    if (!task) return;

    startTransition(async () => {
      addOptimisticTask({ taskId, type: 'toggle' });
      try {
        await toggleTaskStatus(taskId, task.status === 'completed');
      } catch (error) {
        // Revert on error would need more complex optimistic logic or full revalidation
        toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
      }
    });
  }

  async function handleSkipTask(taskId: string, isUnskip: boolean) {
    startTransition(async () => {
      addOptimisticTask({ taskId, type: isUnskip ? 'unskip' : 'skip' });
      try {
        if (isUnskip) {
          await unskipTask(taskId);
        } else {
          await skipTask(taskId);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to skip task", variant: "destructive" });
      }
    });
  }

  async function handleLogWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;

    setWeightLoading(true);
    try {
      const result = await logWeight(parseFloat(weight), new Date().toISOString());
      setTodaysWeight(result);
      setWeightSuccess(true);
      setTimeout(() => {
        setWeightSuccess(false);
        setIsEditingWeight(false);
        setWeight('');
      }, 1500);
      toast({ title: "Weight Logged", description: "Your weight has been recorded." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to log weight", variant: "destructive" });
    } finally {
      setWeightLoading(false);
    }
  }

  function startEditingWeight() {
    setIsEditingWeight(true);
    setWeight(todaysWeight?.weight?.toString() || '');
  }

  const iconMap: Record<string, any> = {
    'dumbbell': Dumbbell,
    'book-open': BookOpen,
    'brain': Target,
    'droplet': Droplets,
    'moon': Wind,
  };

  const getDayAbbr = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
  };

  const getDomainColor = (domainId: string) => {
    switch (domainId) {
      case 'health': return 'text-rose-500';
      case 'learning': return 'text-sky-500';
      case 'routine': return 'text-amber-500';
      default: return 'text-primary';
    }
  };

  const getDomainBg = (domainId: string) => {
    switch (domainId) {
      case 'health': return 'bg-rose-500/10';
      case 'learning': return 'bg-sky-500/10';
      case 'routine': return 'bg-amber-500/10';
      default: return 'bg-primary/10';
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in-0 duration-500">
      
      {/* Header */}
      <header className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), 'EEEE, MMMM do')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
          <Flame size={16} className={streakData.todayValid ? "text-orange-500 fill-orange-500" : "text-muted-foreground"} />
          <span className="text-sm font-semibold">{streakData.currentStreak}</span>
        </div>
      </header>

      {/* Better Percentage Card */}
      {dashboardStats && dashboardStats.totalPoints > 0 && (
        <section className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-50">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Progress</p>
                <h2 className="text-3xl font-bold tracking-tight">
                  You are <span className="text-primary">{getBetterPercentage(dashboardStats.totalPoints)}%</span> better
                </h2>
              </div>
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <TrendingUp size={24} />
              </div>
           </div>
        </section>
      )}

      {/* Stats Overview */}
      {dashboardStats && (
        <section className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
          <div className="bg-card rounded-2xl border border-border/40 p-4 flex flex-col justify-between shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Points</span>
             </div>
             <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-bold tracking-tight">{dashboardStats.totalPoints >= 30 ? `${(dashboardStats.totalPoints).toLocaleString()}` : dashboardStats.totalPoints}</span>
                 {dashboardStats.improvement !== 0 && (
                     <div className="flex items-center text-[10px] font-medium">
                        <span className={dashboardStats.improvement > 0 ? "text-emerald-500" : "text-rose-500"}>
                          {dashboardStats.improvement > 0 ? '+' : ''}{dashboardStats.improvement}%
                        </span>
                        <span className="text-muted-foreground/60 ml-1">improved</span>
                     </div>
                 )}
             </div>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-1 relative z-10 w-full">
                <div className="flex items-center gap-2">
                    <Scale size={14} className="text-primary" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Weight</span>
                </div>
                <span className="text-xs font-bold text-foreground">{initialWeight?.weight || '--'} kg</span>
             </div>
             {dashboardStats.weightHistory?.length > 1 ? (
                 <div className="h-10 w-full mt-1 -ml-1 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardStats.weightHistory}>
                            <defs>
                                <linearGradient id="miniWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <YAxis domain={['auto', 'auto']} hide />
                            <Area 
                              type="monotone" 
                              dataKey="weight" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2} 
                              fill="url(#miniWeight)" 
                              dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
             ) : (
                <div className="mt-1">
                    <span className="text-2xl font-bold tracking-tight">{initialWeight?.weight || '--'}</span>
                    <span className="text-xs text-muted-foreground ml-1">kg</span>
                </div>
             )}
          </div>
        </section>
      )}

      {/* Week Glance */}
      <section className="bg-card rounded-2xl border border-border/40 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Last 7 Days</h3>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            streakData.todayValid 
              ? "bg-emerald-500/10 text-emerald-500" 
              : "bg-amber-500/10 text-amber-500"
          )}>
            {streakData.todayValid ? "Day Complete" : "In Progress"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          {streakData.last7Days.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm",
                  day.valid && !day.isRestDay ? "bg-orange-500 text-white shadow-orange-500/20" : 
                  day.valid && day.isRestDay ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                  index === 6 ? "bg-card border-2 border-dashed border-muted text-muted-foreground" :
                  "bg-secondary/40 text-muted-foreground/40"
                )}
              >
                {day.valid ? (
                  day.isRestDay ? <Leaf size={14} /> : <Flame size={14} className="fill-white" />
                ) : (
                  <span className="text-[10px] font-bold">{getDayAbbr(day.date)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Today&apos;s Focus</h2>
          <Link href="/routine" className="text-xs font-medium text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-2.5">
          {sortedTasks.filter(t => t.status !== 'completed' && t.status !== 'skipped').slice(0, 4).map((task) => (
            <div
              key={task._id}
              className="group flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/40 hover:border-border/80 transition-all shadow-sm active:scale-[0.99]"
            >
              <button
                onClick={() => handleToggleTask(task._id)}
                className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  "border-muted-foreground/30 hover:border-primary text-transparent hover:text-primary/20",
                  task.status === 'completed' && "bg-primary border-primary text-primary-foreground hover:text-primary-foreground" 
                )}
              >
                {task.status === 'completed' && <CheckCircle2 size={14} className="animate-in zoom-in duration-200" />}
                {task.status !== 'completed' && <div className="w-2.5 h-2.5 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{task.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  <span className={getDomainColor(task.domainId)}>{task.domainId}</span>
                  {task.timeOfDay && (
                    <>
                      <span>•</span>
                      <span>{task.timeOfDay}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{task.points} pts</span>
                </div>
              </div>

              <button
                onClick={() => handleSkipTask(task._id, false)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-all"
                title="Skip"
              >
                <SkipForward size={16} />
              </button>
            </div>
          ))}

          {sortedTasks.filter(t => t.status !== 'completed' && t.status !== 'skipped').length === 0 && (
             <div className="py-8 text-center bg-card/30 rounded-xl border border-border/30 border-dashed">
               <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                 <CheckCircle2 size={24} />
               </div>
               <p className="text-sm font-medium">All tasks completed!</p>
               <p className="text-xs text-muted-foreground mt-1">Great job today</p>
             </div>
          )}
        </div>

        {/* Skipped Tasks Toggle */}
        {sortedTasks.some(t => t.status === 'skipped') && (
           <div className="pt-2">
              <button
                onClick={() => setShowSkippedTasks(!showSkippedTasks)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                {showSkippedTasks ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showSkippedTasks ? 'Hide' : 'Show'} skipped tasks</span>
              </button>
           </div>
        )}

        {/* Skipped Tasks List */}
        {showSkippedTasks && (
          <div className="space-y-2 opacity-75">
            {sortedTasks.filter(t => t.status === 'skipped').map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30 text-muted-foreground"
              >
                 <SkipForward size={16} className="text-amber-500" />
                 <span className="flex-1 text-sm line-through decoration-amber-500/50">{task.title}</span>
                 <button
                    onClick={() => handleSkipTask(task._id, true)}
                    className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RotateCcw size={14} />
                 </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 gap-4">
        {/* Completion Rate */}
        <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Completion</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold">
                  {Math.round(last7DaysCompletion[last7DaysCompletion.length - 1]?.rate || 0)}%
                </span>
                <TrendingUp size={12} className="text-emerald-500" />
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Target size={14} />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-16 w-full opacity-50 group-hover:opacity-70 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysCompletion}>
                <defs>
                  <linearGradient id="miniCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#miniCompletion)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Weight */}
        <div className="p-4 rounded-2xl bg-card border border-border/40 flex flex-col h-32 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10 mb-2">
             <div>
              <p className="text-xs text-muted-foreground font-medium">Weight</p>
              {!isEditingWeight && todaysWeight ? (
                <p className="text-xl font-bold mt-1 max-w-[80px] truncate">{todaysWeight.weight} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
              ) : null}
            </div> 
            <button 
              onClick={isEditingWeight ? () => setIsEditingWeight(false) : startEditingWeight}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
            >
              <Scale size={14} />
            </button>
          </div>

          <div className="flex-1 flex items-end relative z-10">
            {isEditingWeight || !todaysWeight ? (
              <form onSubmit={handleLogWeight} className="flex gap-2 w-full">
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full min-w-0 bg-secondary/50 border border-border/50 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={!weight || weightLoading}
                  className="flex-shrink-0 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {weightLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                </button>
              </form>
            ) : (
                <p className="text-xs text-muted-foreground">Recorded today.</p>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Browse</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {domains.map((domain) => {
             const Icon = iconMap[domain.icon] || Heart;
             return (
               <Link
                 key={domain.id}
                 href={`/${domain.id}`}
                 className={`p-4 rounded-2xl bg-card border border-border/40 hover:border-${domain.color.replace('text-', '')}/50 transition-all group`}
               >
                 <div className={`w-9 h-9 rounded-xl ${domain.bg} ${domain.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                   <Icon size={18} />
                 </div>
                 <h3 className="font-medium text-sm">{domain.name}</h3>
                 <p className="text-[10px] text-muted-foreground mt-1">View Details</p>
               </Link>
             )
          })}
        </div>
      </section>
    </div>
  );
}

// Temporary Icon Helpers
const Heart = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);