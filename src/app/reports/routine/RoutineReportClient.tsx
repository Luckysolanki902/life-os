'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Trophy,
  Flame,
  Target,
  Clock,
  Sun,
  Sunset,
  Moon,
  Cloud,
  Activity,
  Brain,
  Users,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: 'last7Days', label: '7 Days' },
  { value: 'last14Days', label: '14 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: '3 Months' },
  { value: 'last6Months', label: '6 Months' },
];

interface RoutineReportClientProps {
  initialData: any;
  initialPeriod: string;
}

function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const isPositive = value > 0;
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-medium', isPositive ? 'text-emerald-500' : 'text-rose-500')}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

function TaskRow({ task }: { task: any }) {
  const rateChange = task.completionRate - task.prevCompletionRate;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
        task.completionRate >= 80 ? 'bg-emerald-500/20 text-emerald-500' :
        task.completionRate >= 50 ? 'bg-amber-500/20 text-amber-500' :
        'bg-rose-500/20 text-rose-500'
      )}>
        {task.completionRate}%
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{task.completed}/{task.total} completed</span>
          {task.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Flame size={12} /> {task.currentStreak} streak
            </span>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium">{task.points} pts</p>
        <TrendIndicator value={rateChange} suffix="%" />
      </div>
    </div>
  );
}

function DomainSection({ domain, tasks, icon: Icon, color }: { domain: string; tasks: any[]; icon: any; color: string }) {
  const colorClasses: Record<string, string> = {
    health: 'text-rose-500 bg-rose-500/10',
    learning: 'text-amber-500 bg-amber-500/10',
    social: 'text-emerald-500 bg-emerald-500/10',
    career: 'text-blue-500 bg-blue-500/10',
  };
  
  const avgRate = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + t.completionRate, 0) / tasks.length)
    : 0;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-xl', colorClasses[domain] || 'bg-primary/10 text-primary')}>
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-semibold capitalize">{domain}</h3>
            <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
          </div>
        </div>
        <div className={cn(
          'px-3 py-1 rounded-lg text-sm font-bold',
          avgRate >= 80 ? 'bg-emerald-500/20 text-emerald-500' :
          avgRate >= 50 ? 'bg-amber-500/20 text-amber-500' :
          'bg-rose-500/20 text-rose-500'
        )}>
          {avgRate}%
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TimeOfDaySection({ time, tasks }: { time: string; tasks: any[] }) {
  const icons: Record<string, any> = {
    morning: Sun,
    afternoon: Cloud,
    evening: Sunset,
    night: Moon,
    day: Clock,
    none: Calendar,
  };
  
  const labels: Record<string, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    day: 'All Day',
    none: 'Unscheduled',
  };
  
  const Icon = icons[time] || Clock;
  const avgRate = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + t.completionRate, 0) / tasks.length)
    : 0;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-muted-foreground" />
          <span className="font-medium">{labels[time]}</span>
        </div>
        <span className={cn(
          'text-sm font-bold',
          avgRate >= 80 ? 'text-emerald-500' : avgRate >= 50 ? 'text-amber-500' : 'text-rose-500'
        )}>
          {avgRate}%
        </span>
      </div>
      
      <div className="space-y-1">
        {tasks.slice(0, 5).map((task) => (
          <div key={task._id} className="flex items-center justify-between text-sm py-1">
            <span className="truncate text-muted-foreground">{task.title}</span>
            <span className="font-medium ml-2">{task.completionRate}%</span>
          </div>
        ))}
        {tasks.length > 5 && (
          <p className="text-xs text-muted-foreground pt-1">+{tasks.length - 5} more</p>
        )}
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: any[] }) {
  const maxRate = Math.max(...data.map(d => d.rate), 1);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4">Daily Performance</h3>
      <div className="flex items-end gap-1 h-40">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-secondary rounded-t relative group cursor-pointer" 
              style={{ height: `${Math.max((day.rate / maxRate) * 100, 2)}%` }}
            >
              <div className={cn(
                'absolute inset-0 rounded-t transition-colors',
                day.rate >= 80 ? 'bg-emerald-500' : day.rate >= 50 ? 'bg-amber-500' : day.rate > 0 ? 'bg-rose-500' : 'bg-muted'
              )} />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                <p className="font-medium">{day.rate}%</p>
                <p className="text-muted-foreground">{day.completed}/{day.total}</p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{day.dayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoutineReportClient({ initialData, initialPeriod }: RoutineReportClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(`/reports/routine?period=${newPeriod}`);
    });
  };

  const { summary, taskStats, byDomain, byTimeOfDay, bestTasks, worstTasks, dailyData } = data;

  const domainIcons: Record<string, any> = {
    health: Activity,
    learning: Brain,
    social: Users,
    career: Target,
  };

  return (
    <div className={cn('space-y-6 pb-24', isPending && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/reports?period=${period}`}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Routine Report</h1>
            <p className="text-muted-foreground mt-1">
              Track your daily habits and streaks
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-sm text-muted-foreground">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold">{summary.avgCompletionRate}%</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-500" />
            <span className="text-sm text-muted-foreground">Tasks Completed</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalCompleted}/{summary.totalTasks}</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-sm text-muted-foreground">Points Earned</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalPoints}</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-purple-500" />
            <span className="text-sm text-muted-foreground">Active Tasks</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalActiveTasks}</p>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyData && dailyData.length > 0 && <DailyChart data={dailyData} />}

      {/* Best & Worst */}
      <div className="grid md:grid-cols-2 gap-4">
        {bestTasks && bestTasks.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-emerald-500" />
              <h3 className="font-semibold">Best Performing</h3>
            </div>
            <div className="space-y-2">
              {bestTasks.slice(0, 5).map((task: any) => (
                <div key={task._id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5">
                  <span className="truncate">{task.title}</span>
                  <span className="font-bold text-emerald-500 ml-2">{task.completionRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {worstTasks && worstTasks.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={18} className="text-rose-500" />
              <h3 className="font-semibold">Needs Attention</h3>
            </div>
            <div className="space-y-2">
              {worstTasks.slice(0, 5).map((task: any) => (
                <div key={task._id} className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5">
                  <span className="truncate">{task.title}</span>
                  <span className="font-bold text-rose-500 ml-2">{task.completionRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* By Time of Day */}
      {byTimeOfDay && Object.keys(byTimeOfDay).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">By Time of Day</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(byTimeOfDay).map(([time, tasks]) => (
              <TimeOfDaySection key={time} time={time} tasks={tasks as any[]} />
            ))}
          </div>
        </div>
      )}

      {/* By Domain */}
      {byDomain && Object.keys(byDomain).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">By Domain</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(byDomain).map(([domain, tasks]) => (
              <DomainSection
                key={domain}
                domain={domain}
                tasks={tasks as any[]}
                icon={domainIcons[domain] || Target}
                color={domain}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Tasks */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
        <h3 className="font-semibold mb-4">All Tasks ({taskStats?.length || 0})</h3>
        <div className="space-y-2 max-h-125 overflow-y-auto">
          {taskStats?.map((task: any) => (
            <TaskRow key={task._id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
