'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
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
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoutineReport } from '../../actions/reports';

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

function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-muted-foreground text-[10px] uppercase font-medium">—</span>;
  const isPositive = value > 0;
  return (
    <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', isPositive ? 'text-emerald-500' : 'text-rose-500')}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

function TaskRow({ task }: { task: any }) {
  const rateChange = task.completionRate - (task.prevCompletionRate || 0); // Handle potentially missing previous rate
  
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-secondary/10 transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border',
          task.completionRate >= 80 ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' :
          task.completionRate >= 50 ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' :
          'bg-rose-500/5 text-rose-600 border-rose-500/20'
        )}>
          {task.completionRate}%
        </div>
        
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{task.title}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
             <span>{task.completed}/{task.total} done</span>
             {task.currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                <Flame size={10} className="fill-amber-500/20" /> {task.currentStreak}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-foreground">{task.points} pts</p>
        <div className="flex justify-end mt-0.5">
           <TrendIndicator value={rateChange} suffix="%" />
        </div>
      </div>
    </div>
  );
}

function DomainSection({ domain, tasks, icon: Icon }: { domain: string; tasks: any[]; icon: any; color: string }) {
  const avgRate = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + t.completionRate, 0) / tasks.length)
    : 0;
  
  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
            <Icon size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm capitalize">{domain}</h3>
            <p className="text-[10px] text-muted-foreground">{tasks.length} tasks</p>
          </div>
        </div>
        <div className={cn(
          'px-2 py-0.5 rounded text-[10px] font-bold border',
          avgRate >= 80 ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' :
          avgRate >= 50 ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' :
          'bg-rose-500/5 text-rose-600 border-rose-500/20'
        )}>
          {avgRate}%
        </div>
      </div>
      
      <div className="space-y-2 overflow-y-auto max-h-60 pr-1">
        {tasks.map((task) => (
          <div key={task._id} className="flex justify-between items-center text-xs py-1 border-b border-border/30 last:border-0 hover:bg-secondary/5">
             <span className="truncate flex-1 pr-2">{task.title}</span>
             <span className={cn(
                "font-mono font-medium",
                task.completionRate >= 80 ? 'text-emerald-500' : 
                task.completionRate >= 50 ? 'text-amber-500' : 'text-rose-500'
             )}>{task.completionRate}%</span>
          </div>
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
    <div className="bg-card border border-border/40 rounded-xl p-4 flex flex-col justify-between h-full hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{labels[time]}</span>
        </div>
        <span className={cn(
          'text-xs font-bold',
          avgRate >= 80 ? 'text-emerald-500' : avgRate >= 50 ? 'text-amber-500' : 'text-rose-500'
        )}>
          {avgRate}%
        </span>
      </div>
      
      <div className="space-y-1.5">
        {tasks.slice(0, 4).map((task) => (
          <div key={task._id} className="flex items-center justify-between text-[11px] py-0.5">
            <span className="truncate text-foreground/80 max-w-[70%]">{task.title}</span>
            <span className="font-medium text-muted-foreground">{task.completionRate}%</span>
          </div>
        ))}
        {tasks.length > 4 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border/30 mt-1">+{tasks.length - 4} more</p>
        )}
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: any[] }) {
  const maxRate = Math.max(...data.map(d => d.rate), 1);
  
  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
         <h3 className="font-semibold text-sm">Daily Performance</h3>
         <div className="flex gap-2 text-[10px] text-muted-foreground">
           <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> High</span>
           <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Med</span>
           <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Low</span>
        </div>
      </div>
      
      <div className="flex items-end gap-1.5 h-32">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
             <div className="w-full h-full flex items-end bg-secondary/20 rounded-t-sm">
                <div 
                  className={cn(
                    'w-full rounded-t-sm transition-all duration-500',
                    day.rate >= 80 ? 'bg-emerald-500' : day.rate >= 50 ? 'bg-amber-500' : day.rate > 0 ? 'bg-rose-500' : 'bg-secondary'
                  )}
                  style={{ height: `${Math.max((day.rate / 100) * 100, 4)}%` }} // Normalize 0-100
                />
             </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border px-2 py-1.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                <p className="font-bold mb-0.5">{day.rate}%</p>
                <p className="text-[10px] text-muted-foreground">{day.completed}/{day.total} tasks</p>
            </div>
            
            <span className="text-[10px] font-medium text-muted-foreground">{day.dayName?.charAt(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoutineReportClient() {
  const [period, setPeriod] = useState('last7Days');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getRoutineReport(period);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch routine report:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        <div className="flex justify-between items-center">
           <div className="w-32 h-8 bg-muted rounded-lg" />
           <div className="w-24 h-8 bg-muted rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  const { summary, taskStats, byDomain, byTimeOfDay, bestTasks, worstTasks, dailyData } = data;

  const domainIcons: Record<string, any> = {
    health: Activity,
    learning: Brain,
    social: Users,
    career: Target,
  };

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Routine</h1>
        </div>

        <div className="relative group">
           <select 
             value={period}
             onChange={(e) => handlePeriodChange(e.target.value)}
             className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-sm font-medium hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors outline-none"
           >
             {PERIODS.map(p => (
               <option key={p.value} value={p.value} className="text-foreground bg-popover">{p.label}</option>
             ))}
           </select>
           <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Completion</div>
          <div className="text-2xl font-bold">{summary.avgCompletionRate}<span className="text-sm font-normal text-muted-foreground ml-0.5">%</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">Average rate</div>
        </div>
        
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Total Done</div>
          <div className="text-2xl font-bold">{summary.totalCompleted}<span className="text-sm font-normal text-muted-foreground mx-1">/</span><span className="text-lg text-muted-foreground">{summary.totalTasks}</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">Tasks completed</div>
        </div>
        
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Points</div>
          <div className="text-2xl font-bold">{summary.totalPoints >= 1000 ? `${(summary.totalPoints/1000).toFixed(1)}k` : summary.totalPoints}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Total earned</div>
        </div>
        
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Active</div>
          <div className="text-2xl font-bold">{summary.totalActiveTasks}</div>
           <div className="text-[10px] text-muted-foreground mt-1">Unique tasks</div>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyData && dailyData.length > 0 && <DailyChart data={dailyData} />}

      {/* By Time of Day */}
      {byTimeOfDay && Object.keys(byTimeOfDay).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">By Time</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(byTimeOfDay).map(([time, tasks]) => (
              <TimeOfDaySection key={time} time={time} tasks={tasks as any[]} />
            ))}
          </div>
        </div>
      )}

      {/* By Domain */}
      {byDomain && Object.keys(byDomain).length > 0 && (
        <div>
           <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">By Area</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      {/* Best & Worst (Compact) */}
      <div className="grid grid-cols-1 gap-4">
        {bestTasks && bestTasks.length > 0 && (
          <div>
             <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Top Performing</h2>
             <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl overflow-hidden">
                {bestTasks.slice(0, 3).map((task: any) => (
                   <div key={task._id} className="flex justify-between items-center p-3 border-b border-emerald-500/10 last:border-0">
                      <span className="text-sm font-medium">{task.title}</span>
                      <span className="text-sm font-bold text-emerald-600">{task.completionRate}%</span>
                   </div>
                ))}
             </div>
          </div>
        )}
        
        {worstTasks && worstTasks.length > 0 && (
           <div>
             <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Needs Focus</h2>
             <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl overflow-hidden">
                {worstTasks.slice(0, 3).map((task: any) => (
                   <div key={task._id} className="flex justify-between items-center p-3 border-b border-rose-500/10 last:border-0">
                      <span className="text-sm font-medium">{task.title}</span>
                      <span className="text-sm font-bold text-rose-600">{task.completionRate}%</span>
                   </div>
                ))}
            </div>
           </div>
        )}
      </div>

      {/* All Tasks Link or Expand (Leaving simple list for now, maybe too long for mobile if all shown) */}
      <div className="bg-card border border-border/40 rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4">All Tasks ({taskStats?.length || 0})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {taskStats?.map((task: any) => (
            <TaskRow key={task._id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
