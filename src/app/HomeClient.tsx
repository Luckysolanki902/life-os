'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Library,
  CheckCircle2,
  Circle,
  Scale,
  Clock,
  ChevronRight,
  ArrowRight,
  Loader2,
  SkipForward,
  Pencil,
  BarChart3,
} from 'lucide-react';
import { toggleTaskStatus, skipTask, unskipTask } from './actions/routine';
import { logWeight, updateWeight } from './actions/health';
import { getLocalDateString } from '@/lib/date-utils';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Heart,
  Brain,
  Library,
};

interface Task {
  _id: string;
  title: string;
  domainId: string;
  timeOfDay?: string;
  points: number;
  status?: 'pending' | 'completed' | 'skipped';
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

interface Props {
  incompleteTasks: Task[];
  domains: Domain[];
  todaysWeight: TodaysWeight | null;
}

export default function HomeClient({ incompleteTasks, domains, todaysWeight }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [skippingTaskId, setSkippingTaskId] = useState<string | null>(null);
  
  // Weight logging state
  const [weight, setWeight] = useState<string>('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightSuccess, setWeightSuccess] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);


  const handleToggleTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    startTransition(async () => {
      await toggleTaskStatus(taskId, true);
      setCompletingTaskId(null);
    });
  };

  const handleSkipTask = async (taskId: string, isCurrentlySkipped: boolean) => {
    setSkippingTaskId(taskId);
    startTransition(async () => {
      if (isCurrentlySkipped) {
        await unskipTask(taskId);
      } else {
        await skipTask(taskId);
      }
      setSkippingTaskId(null);
    });
  };

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    
    setWeightLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format using dayjs-based utility
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
    };
    return bgs[domainId] || 'bg-secondary';
  };

  return (
    <>
      {/* Next 3 Tasks Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Next Up</h2>
          <Link href="/routine" className="text-sm text-primary hover:underline flex items-center gap-1">
            All Tasks <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-2">
          {incompleteTasks.length === 0 ? (
            <div className="bg-card rounded-2xl border border-emerald-500/30 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={32} />
              <p className="font-medium text-emerald-500">All done for today! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">You&apos;ve completed all your tasks</p>
            </div>
          ) : (
            <>
              {/* Regular tasks (not skipped) */}
              {incompleteTasks.filter(t => t.status !== 'skipped').map((task) => (
                <div
                  key={task._id}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 
                    hover:border-primary/30 hover:bg-primary/5 transition-all text-left group
                    ${completingTaskId === task._id || skippingTaskId === task._id ? 'opacity-50' : ''}`}
                >
                  {/* Complete Button */}
                  <button
                    onClick={() => handleToggleTask(task._id)}
                    disabled={completingTaskId === task._id || isPending}
                    className={`p-2 rounded-xl ${getDomainBg(task.domainId)}`}
                  >
                    {completingTaskId === task._id ? (
                      <Loader2 size={20} className="animate-spin text-primary" />
                    ) : (
                      <Circle size={20} className={getDomainColor(task.domainId)} />
                    )}
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
                  {/* Skip Button */}
                  <button
                    onClick={() => handleSkipTask(task._id, false)}
                    disabled={skippingTaskId === task._id || isPending}
                    className="p-2 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 
                      transition-all"
                    title="Skip task"
                  >
                    {skippingTaskId === task._id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <SkipForward size={18} />
                    )}
                  </button>
                </div>
              ))}
              
              {/* Skipped tasks section */}
              {/* {incompleteTasks.filter(t => t.status === 'skipped').length > 0 && (
                <div className="pt-2 mt-2 border-t border-border/30">
                  <p className="text-xs text-amber-500 font-medium mb-2 px-1">Skipped</p>
                  {incompleteTasks.filter(t => t.status === 'skipped').map((task) => (
                    <div
                      key={task._id}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 
                        hover:border-primary/30 transition-all text-left group opacity-70
                        ${completingTaskId === task._id || skippingTaskId === task._id ? 'opacity-40' : ''}`}
                    >
                      <button
                        onClick={() => handleToggleTask(task._id)}
                        disabled={completingTaskId === task._id || isPending}
                        className={`p-2 rounded-xl bg-amber-500/10`}
                      >
                        {completingTaskId === task._id ? (
                          <Loader2 size={20} className="animate-spin text-primary" />
                        ) : (
                          <Circle size={20} className="text-amber-500/50" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-amber-500/70">
                          {task.title}
                          <span className="ml-2 text-xs">(skipped)</span>
                        </p>
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
                        disabled={skippingTaskId === task._id || isPending}
                        className="p-2 rounded-lg text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
                        title="Undo skip"
                      >
                        {skippingTaskId === task._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <SkipForward size={18} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )} */}
            </>
          )}
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
            // Show existing weight with edit option
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
            // Show input form for new or editing weight
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
        
        <div className="grid gap-3 grid-cols-3">
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
                <p className="text-xs text-muted-foreground">
                  {domain.points.toLocaleString()} pts
                </p>
                
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
    </>
  );
}
