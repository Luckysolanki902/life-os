'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Library,
  Brain,
  CheckCircle2,
  Circle,
  Scale,
  Clock,
  ChevronRight,
  ArrowRight,
  Loader2,
  Plus,
  Minus,
} from 'lucide-react';
import { toggleTaskCompletion } from './actions/routine';
import { logWeight } from './actions/health';
import { addLearningLog } from './actions/learning';

const iconMap: Record<string, any> = {
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
}

interface Medium {
  id: string;
  title: string;
  skill: string;
  area: string;
  areaColor: string;
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

interface Props {
  incompleteTasks: Task[];
  allMediums: Medium[];
  domains: Domain[];
}

export default function HomeClient({ incompleteTasks, allMediums, domains }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  
  // Weight logging state
  const [weight, setWeight] = useState<string>('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightSuccess, setWeightSuccess] = useState(false);
  
  // Learning logging state
  const [selectedMedium, setSelectedMedium] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningSuccess, setLearningSuccess] = useState(false);

  const handleToggleTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    startTransition(async () => {
      await toggleTaskCompletion(taskId);
      router.refresh();
      setCompletingTaskId(null);
    });
  };

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    
    setWeightLoading(true);
    try {
      await logWeight(parseFloat(weight), new Date());
      setWeightSuccess(true);
      setWeight('');
      setTimeout(() => setWeightSuccess(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Error logging weight:', error);
    } finally {
      setWeightLoading(false);
    }
  };

  const handleLogLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedium || duration <= 0) return;
    
    setLearningLoading(true);
    try {
      await addLearningLog({
        mediumId: selectedMedium,
        date: new Date().toISOString(),
        duration,
      });
      setLearningSuccess(true);
      setSelectedMedium('');
      setDuration(30);
      setTimeout(() => setLearningSuccess(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Error logging learning:', error);
    } finally {
      setLearningLoading(false);
    }
  };

  const getDomainColor = (domainId: string) => {
    const colors: Record<string, string> = {
      health: 'text-rose-500',
      learning: 'text-amber-500',
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
      learning: 'bg-amber-500/10',
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
            incompleteTasks.map((task) => (
              <button
                key={task._id}
                onClick={() => handleToggleTask(task._id)}
                disabled={completingTaskId === task._id || isPending}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 
                  hover:border-primary/30 hover:bg-primary/5 transition-all text-left group
                  ${completingTaskId === task._id ? 'opacity-50' : ''}`}
              >
                <div className={`p-2 rounded-xl ${getDomainBg(task.domainId)}`}>
                  {completingTaskId === task._id ? (
                    <Loader2 size={20} className="animate-spin text-primary" />
                  ) : (
                    <Circle size={20} className={getDomainColor(task.domainId)} />
                  )}
                </div>
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
                <CheckCircle2 
                  size={20} 
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                />
              </button>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weight Logging */}
        <section className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <Scale size={18} className="text-rose-500" />
            </div>
            <h3 className="font-semibold">Log Weight</h3>
          </div>

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
                ) : (
                  'Log'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Learning Quick Log */}
        <section className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Brain size={18} className="text-amber-500" />
            </div>
            <h3 className="font-semibold">Log Practice</h3>
          </div>

          <form onSubmit={handleLogLearning} className="space-y-3">
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 
                focus:outline-none focus:border-primary/50 text-sm appearance-none"
            >
              <option value="">Select what you practiced...</option>
              {allMediums.map((medium) => (
                <option key={medium.id} value={medium.id}>
                  {medium.area} → {medium.skill} → {medium.title}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => setDuration(Math.max(5, duration - 5))}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">{duration}</span>
                  <span className="text-sm text-muted-foreground ml-1">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDuration(duration + 5)}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!selectedMedium || duration <= 0 || learningLoading}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all
                  ${learningSuccess 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {learningLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : learningSuccess ? (
                  <CheckCircle2 size={18} />
                ) : (
                  'Log'
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

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
            hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
        >
          <Brain size={20} className="text-amber-500" />
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
