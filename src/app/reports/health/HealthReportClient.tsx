'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Scale, Smile, Flame, 
  TrendingUp, TrendingDown, Leaf, Dumbbell, 
  Calendar, Timer, Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import ShareableHealthReport from './ShareableHealthReport';
import { getHealthReport, getRecentMoods } from '../../actions/reports';

const PERIODS = [
  { value: 'last7Days', label: '7D' },
  { value: 'last14Days', label: '14D' },
  { value: 'thisWeek', label: 'Week' },
  { value: 'thisMonth', label: 'Month' },
  { value: 'last3Months', label: '3M' },
  { value: 'thisYear', label: 'Year' },
];

function TrendBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-medium',
      isPositive ? 'text-emerald-500' : 'text-rose-500'
    )}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  change, 
  color = 'primary' 
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  change?: number;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    orange: 'text-orange-500',
  };
  const textColor = colorMap[color] || 'text-foreground';

  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 hover:border-border/80 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Icon size={16} className={cn("opacity-80", textColor)} />
        {change !== undefined && change !== 0 && (
          <TrendBadge value={change} />
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// Minimalist Tooltip
function MinimalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border/50 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-foreground mb-1 border-b border-border/30 pb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-mono font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-24 animate-pulse max-w-5xl mx-auto">
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
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}

export default function HealthReportClient() {
  const [period, setPeriod] = useState('last7Days');
  const [data, setData] = useState<any>(null);
  const [recentMoods, setRecentMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [reportData, moodsData] = await Promise.all([
          getHealthReport(period),
          getRecentMoods(30)
        ]);
        setData(reportData);
        setRecentMoods(moodsData);
      } catch (error) {
        console.error('Failed to fetch health report:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-center py-12 text-muted-foreground">Failed to load report</div>;

  const { summary, muscleWork, weightLogs, dailyExercise } = data;
  
  // Format data
  const workoutChartData = dailyExercise?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(d.date).toLocaleDateString(),
    shortDate: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sessions: d.sessions,
    sets: d.sets,
  })) || [];

  const weightChartData = weightLogs?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: d.weight,
  })) || [];

  // Streak logic
  const last7Days = dailyExercise?.slice(-7) || [];
  const daysWithStatus = last7Days.map((day: any, index: number, array: any[]) => {
    const hasWorkout = day.sessions > 0;
    let isRestDay = false;
    if (!hasWorkout && index > 0) {
      // Simple check for previous workout
      let consecutiveWorkouts = 0;
      for (let i = index - 1; i >= 0; i--) {
        if (array[i].sessions > 0) consecutiveWorkouts++;
        else break;
      }
      isRestDay = consecutiveWorkouts >= 1;
    }
    return { ...day, hasWorkout, isRestDay };
  });

  // Muscle Visualization Data
  const topMuscles = muscleWork?.slice(0, 10) || [];
  const allMuscleCounts = muscleWork?.map((m: any) => m.count) || [];
  const maxMuscleCount = Math.max(...allMuscleCounts, 1);
  
  const muscleScores = (muscleWork || []).reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.muscle.toLowerCase()] = curr.count / maxMuscleCount;
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="group p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Health Report</h1>
            <p className="text-sm text-muted-foreground">Fitness analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Period Selector */}
           <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg border border-border/40 overflow-x-auto">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[10px] font-medium transition-all whitespace-nowrap uppercase tracking-wide',
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm border border-border/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <ShareableHealthReport data={data} period={period} periodLabel={PERIODS.find(p => p.value === period)?.label || period} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Workout Sessions"
          value={summary.totalExerciseDays}
          icon={Dumbbell}
          change={summary.exerciseDaysChange}
          color="orange"
        />
        <StatCard
          label="Weight"
          value={summary.currentWeight ? `${summary.currentWeight}kg` : '—'}
          icon={Scale}
          change={summary.weightChange}
          color="blue"
        />
        <StatCard
          label="Avg Mood"
          value={summary.avgMood > 0 ? `${summary.avgMood}/5` : '—'}
          icon={Smile}
          color="emerald"
        />
        <StatCard
          label="Tasks"
          value={`${summary.healthTasksCompletionRate}%`}
          icon={Activity}
          color="rose"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Workout Streak - Spans 2 cols */}
        <div className="md:col-span-2 bg-card border border-border/40 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
             <Flame size={120} />
          </div>
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div>
               <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Consistency</h3>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-bold tracking-tight">{summary.workoutStreak}</span>
                 <span className="text-sm text-muted-foreground font-medium">day streak</span>
               </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500">
                {last7Days.filter((d: any) => d.sessions > 0).length}<span className="text-muted-foreground text-sm font-medium">/7</span>
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last 7 Days</div>
            </div>
          </div>
          
          <div className="flex justify-between items-end gap-2 relative z-10 h-16">
            {daysWithStatus.map((day: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                 <div className="relative w-full flex justify-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500',
                      day.hasWorkout ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 
                      day.isRestDay ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/50' : 
                      'bg-secondary text-muted-foreground'
                    )}>
                      {day.hasWorkout ? <Flame size={14} fill="currentColor" /> : 
                       day.isRestDay ? <Leaf size={14} /> : 
                       <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                    </div>
                    {/* Tooltip for day */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-popover border border-border text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                      {day.hasWorkout ? `${day.sessions} sessions` : day.isRestDay ? 'Rest Day' : 'No Activity'}
                    </div>
                 </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Moods */}
        <div className="bg-card border border-border/40 rounded-xl p-6 flex flex-col">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Moods</h3>
               <div className="space-y-2 max-h-[200px] overflow-y-auto">
                 {recentMoods.length > 0 ? (
                   recentMoods.map((mood: any, index: number) => {
                     const moodEmoji: Record<string, string> = {
                       great: '😄',
                       good: '🙂',
                       okay: '😐',
                       low: '😕',
                       bad: '😢'
                     };
                     const moodColor: Record<string, string> = {
                       great: 'text-emerald-500',
                       good: 'text-blue-500',
                       okay: 'text-amber-500',
                       low: 'text-orange-500',
                       bad: 'text-rose-500'
                     };
                     return (
                       <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                         <span className="text-2xl">{moodEmoji[mood.mood]}</span>
                         <div className="flex-1 min-w-0">
                           <p className={cn("font-medium text-sm capitalize", moodColor[mood.mood])}>{mood.mood}</p>
                           <p className="text-[10px] text-muted-foreground">
                             {new Date(mood.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                           </p>
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <p className="text-xs text-muted-foreground text-center py-4">No mood data available</p>
                 )}
               </div>
            </div>
        </div>
      </div>

      {/* Muscle Focus Visualization */}
      <div className="bg-card border border-border/40 rounded-xl p-0 overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
           <h3 className="font-semibold flex items-center gap-2">
             <Activity size={16} className="text-rose-500" />
             <span className="text-sm">Muscle Focus Distribution</span>
           </h3>
           <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
             {topMuscles.length} Muscle Groups Targeted
           </span>
        </div>
        
        <div className="p-6">
             <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Volume by Muscle Group</h4>
             <div className="space-y-4">
                {topMuscles.map((item: any, i: number) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium capitalize flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></span>
                         {item.muscle}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{item.count} sets</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out group-hover:bg-rose-400"
                         style={{ width: `${(item.count / maxMuscleCount) * 100}%` }}
                       />
                    </div>
                  </div>
                ))}
                {topMuscles.length === 0 && (
                   <p className="text-sm text-muted-foreground italic">Start logging sets to see your muscle breakdown.</p>
                )}
             </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Workout Sessions */}
        {workoutChartData.length > 0 && (
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Workout Volume</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutChartData} barSize={32}>
                  <XAxis 
                     dataKey="shortDate" 
                     tick={{ fontSize: 10, fill: 'currentColor' }} 
                     className="text-muted-foreground"
                     axisLine={false} 
                     tickLine={false} 
                     dy={10}
                  />
                  <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.3 }} />
                  <Bar 
                    dataKey="sessions" 
                    fill="#f97316" 
                    radius={[4, 4, 0, 0]} 
                    name="Sessions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weight Trend */}
        {weightChartData.length > 0 && (
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Weight Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                     dataKey="date" 
                     tick={{ fontSize: 10, fill: 'currentColor' }} 
                     className="text-muted-foreground"
                     axisLine={false} 
                     tickLine={false} 
                     dy={10}
                  />
                  <Tooltip content={<MinimalTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fill="url(#weightGradient)" 
                    name="kg"
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
