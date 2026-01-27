'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Scale, Smile, Flame, TrendingUp, TrendingDown, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ShareableHealthReport from './ShareableHealthReport';
import { getHealthReport } from '../../actions/reports';

const PERIODS = [
  { value: 'last7Days', label: '7D' },
  { value: 'last14Days', label: '14D' },
  { value: 'thisWeek', label: 'Week' },
  { value: 'thisMonth', label: 'Month' },
  { value: 'last3Months', label: '3M' },
  { value: 'thisYear', label: 'Year' },
];

function StatCard({ label, value, icon: Icon, change }: { label: string; value: string | number; icon: any; change?: number }) {
  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon size={14} className="text-primary" />
        </div>
        {change !== undefined && change !== 0 && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-0.5',
            change > 0 ? 'text-emerald-500' : 'text-rose-500'
          )}>
            {change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change > 0 ? '+' : ''}{change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-24 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-32 h-8 bg-muted rounded" />
        <div className="w-24 h-8 bg-muted rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="w-12 h-8 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-card/50 border border-border/30 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-card/50 border border-border/30 rounded-xl" />
    </div>
  );
}

export default function HealthReportClient() {
  const [period, setPeriod] = useState('last7Days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getHealthReport(period);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch health report:', error);
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

  const { summary, muscleWork, weightLogs, dailyExercise } = data;
  
  // Prepare chart data
  const workoutChartData = dailyExercise?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: d.sessions,
    sets: d.sets,
  })) || [];

  const weightChartData = weightLogs?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: d.weight,
  })) || [];

  // Get last 7 days for streak visualization
  const last7Days = dailyExercise?.slice(-7) || [];
  const daysWithStatus = last7Days.map((day: any, index: number, array: any[]) => {
    const hasWorkout = day.sessions > 0;
    
    // Check if this is a valid rest day
    let isRestDay = false;
    if (!hasWorkout && index > 0) {
      let consecutiveWorkouts = 0;
      for (let i = index - 1; i >= 0; i--) {
        if (array[i].sessions > 0) {
          consecutiveWorkouts++;
        } else {
          break;
        }
      }
      isRestDay = consecutiveWorkouts >= 2;
    }
    
    return { ...day, hasWorkout, isRestDay };
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Health Report</h1>
            <p className="text-sm text-muted-foreground">Track your fitness journey</p>
          </div>
        </div>
        <ShareableHealthReport data={data} period={period} periodLabel={PERIODS.find(p => p.value === period)?.label || period} />
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Exercises"
          value={summary.totalExerciseSessions}
          icon={Activity}
          change={summary.sessionChange}
        />
        <StatCard
          label="Current Weight"
          value={summary.currentWeight ? `${summary.currentWeight}kg` : '—'}
          icon={Scale}
          change={summary.weightChange}
        />
        <StatCard
          label="Avg Mood"
          value={summary.avgMood > 0 ? `${summary.avgMood}/5` : '—'}
          icon={Smile}
        />
        <StatCard
          label="Tasks Done"
          value={`${summary.healthTasksCompletionRate}%`}
          icon={Activity}
        />
      </div>

      {/* Workout Streak */}
      <div className="bg-card/50 border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame size={24} className="text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{summary.workoutStreak}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{last7Days.filter((d: any) => d.sessions > 0).length}/7</p>
            <p className="text-xs text-muted-foreground">last 7 days (43%)</p>
          </div>
        </div>
        
        {/* Last 7 Days */}
        <div className="flex justify-between gap-1">
          {daysWithStatus.map((day: any, i: number) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                day.hasWorkout ? 'bg-orange-500' : day.isRestDay ? 'bg-emerald-500' : 'bg-secondary/50'
              )}>
                {day.hasWorkout ? <Flame size={14} className="text-white" /> : day.isRestDay ? <Leaf size={14} className="text-white" /> : null}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">💡 Rest days allowed after 2 consecutive workout days</p>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Workout Sessions */}
        {workoutChartData.length > 0 && (
          <div className="bg-card/50 border border-border/30 rounded-xl p-4">
            <h3 className="font-semibold mb-4">Workout Sessions</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutChartData}>
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
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weight Trend */}
        {weightChartData.length > 0 && (
          <div className="bg-card/50 border border-border/30 rounded-xl p-4">
            <h3 className="font-semibold mb-4">Weight Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
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
                  />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Muscles */}
      {muscleWork && muscleWork.length > 0 && (
        <div className="bg-card/50 border border-border/30 rounded-xl p-4">
          <h3 className="font-semibold mb-4">Top Muscles Worked</h3>
          <div className="flex flex-wrap gap-2">
            {muscleWork.slice(0, 10).map((muscle: any, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
              >
                {muscle.muscle} ({muscle.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
