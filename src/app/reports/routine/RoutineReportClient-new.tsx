'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRoutineReport } from '../../actions/reports';

const PERIODS = [
  { value: 'last7Days', label: '7D' },
  { value: 'last14Days', label: '14D' },
  { value: 'thisWeek', label: 'Week' },
  { value: 'thisMonth', label: 'Month' },
  { value: 'last3Months', label: '3M' },
];

function TaskCard({ task }: { task: any }) {
  const rateChange = task.completionRate - task.prevCompletionRate;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-border/60 transition-colors">
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold',
        task.completionRate >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
        task.completionRate >= 50 ? 'bg-amber-500/10 text-amber-500' :
        'bg-rose-500/10 text-rose-500'
      )}>
        {task.completionRate}%
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.completed}/{task.total} completed</p>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium">{task.points} pts</p>
        {rateChange !== 0 && (
          <span className={cn(
            'text-xs flex items-center gap-0.5 justify-end',
            rateChange > 0 ? 'text-emerald-500' : 'text-rose-500'
          )}>
            {rateChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {rateChange > 0 ? '+' : ''}{rateChange}%
          </span>
        )}
      </div>
    </div>
  );
}

function DomainSection({ domain, tasks }: { domain: string; tasks: any[] }) {
  const avgRate = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + t.completionRate, 0) / tasks.length)
    : 0;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">{domain}</h3>
        <div className={cn(
          'px-2.5 py-1 rounded-lg text-sm font-bold',
          avgRate >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
          avgRate >= 50 ? 'bg-amber-500/10 text-amber-500' :
          'bg-rose-500/10 text-rose-500'
        )}>
          {avgRate}%
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-24 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="w-48 h-8 bg-muted rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-12 h-8 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-card/50 border border-border/30 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-card/50 border border-border/30 rounded-xl" />
    </div>
  );
}

export default function RoutineReportClient() {
  const [period, setPeriod] = useState('last7Days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getRoutineReport(period);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch routine report:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load report</div>;
  }

  const { summary, tasks, dailyCompletion } = data;
  
  // Group tasks by domain
  const tasksByDomain = tasks.reduce((acc: any, task: any) => {
    if (!acc[task.domainId]) acc[task.domainId] = [];
    acc[task.domainId].push(task);
    return acc;
  }, {});

  // Prepare chart data
  const chartData = dailyCompletion?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rate: d.completionRate,
    completed: d.completed,
    total: d.total,
  })) || [];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/reports" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routine Report</h1>
          <p className="text-sm text-muted-foreground">Your task completion</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card/50 border border-border/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle size={14} className="text-primary" />
            </div>
            {summary.completionChange !== 0 && (
              <span className={cn(
                'text-xs font-medium flex items-center gap-0.5',
                summary.completionChange > 0 ? 'text-emerald-500' : 'text-rose-500'
              )}>
                {summary.completionChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {summary.completionChange > 0 ? '+' : ''}{summary.completionChange}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">{summary.completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-xl p-4">
          <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
            <CheckCircle size={14} className="text-primary" />
          </div>
          <p className="text-2xl font-bold">{summary.totalCompleted}</p>
          <p className="text-xs text-muted-foreground">Tasks Completed</p>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-xl p-4">
          <div className="p-2 rounded-lg bg-amber-500/10 w-fit mb-2">
            <Trophy size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold">{summary.totalPoints}</p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-xl p-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 w-fit mb-2">
            <CheckCircle size={14} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold">{summary.perfectDays}</p>
          <p className="text-xs text-muted-foreground">Perfect Days</p>
        </div>
      </div>

      {/* Completion Chart */}
      {chartData.length > 0 && (
        <div className="bg-card/50 border border-border/30 rounded-xl p-4">
          <h3 className="font-semibold mb-4">Daily Completion Rate</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Completion']}
                />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tasks by Domain */}
      <div className="space-y-6">
        {Object.entries(tasksByDomain).map(([domain, domainTasks]) => (
          <DomainSection key={domain} domain={domain} tasks={domainTasks as any[]} />
        ))}
      </div>
    </div>
  );
}
