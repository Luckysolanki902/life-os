'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Scale,
  Smile,
  Frown,
  Meh,
  Target,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ShareableHealthReport from './ShareableHealthReport';

const PERIODS = [
  { value: 'last7Days', label: '7 Days' },
  { value: 'last14Days', label: '14 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: '3 Months' },
  { value: 'last6Months', label: '6 Months' },
  { value: 'thisYear', label: 'This Year' },
];

interface HealthReportClientProps {
  initialData: any;
  initialPeriod: string;
}

function MoodIcon({ mood, size = 16 }: { mood: string; size?: number }) {
  const icons: Record<string, { icon: any; color: string }> = {
    great: { icon: Smile, color: 'text-emerald-500' },
    good: { icon: Smile, color: 'text-green-500' },
    okay: { icon: Meh, color: 'text-amber-500' },
    low: { icon: Frown, color: 'text-orange-500' },
    bad: { icon: Frown, color: 'text-rose-500' },
  };
  
  const { icon: Icon, color } = icons[mood] || icons.okay;
  return <Icon size={size} className={color} />;
}

function MuscleHeatmap({ muscleWork }: { muscleWork: any[] }) {
  const maxCount = Math.max(...muscleWork.map(m => m.count), 1);
  
  const upperBody = ['Chest', 'Back', 'Shoulders', 'Traps', 'Lats'];
  const arms = ['Biceps', 'Triceps', 'Forearms'];
  const core = ['Abs', 'Obliques'];
  const lowerBody = ['Quads', 'Hamstrings', 'Glutes', 'Calves'];
  const other = ['Cardio'];
  
  const groups = [
    { name: 'Upper Body', muscles: upperBody },
    { name: 'Arms', muscles: arms },
    { name: 'Core', muscles: core },
    { name: 'Lower Body', muscles: lowerBody },
    { name: 'Other', muscles: other },
  ];
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4">Muscle Groups Worked</h3>
      <div className="space-y-4">
        {groups.map((group) => {
          const groupMuscles = muscleWork.filter(m => group.muscles.includes(m.muscle));
          if (groupMuscles.length === 0 && !group.muscles.some(m => muscleWork.find(mw => mw.muscle === m))) {
            return null;
          }
          
          return (
            <div key={group.name}>
              <p className="text-sm text-muted-foreground mb-2">{group.name}</p>
              <div className="flex flex-wrap gap-2">
                {group.muscles.map((muscle) => {
                  const data = muscleWork.find(m => m.muscle === muscle);
                  const intensity = data ? data.count / maxCount : 0;
                  
                  return (
                    <div
                      key={muscle}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        intensity === 0 && 'bg-secondary/50 text-muted-foreground',
                        intensity > 0 && intensity <= 0.33 && 'bg-rose-500/20 text-rose-400',
                        intensity > 0.33 && intensity <= 0.66 && 'bg-rose-500/40 text-rose-300',
                        intensity > 0.66 && 'bg-rose-500 text-white'
                      )}
                    >
                      {muscle} {data ? `(${data.count})` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeightTrendChart({ data }: { data: any[] }) {
  if (data.length === 0) return null;
  
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights) - 0.5;
  const maxWeight = Math.max(...weights) + 0.5;
  
  const chartData = data.map(d => {
    const dateObj = new Date(d.date);
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: d.weight,
      fullDate: d.date,
    };
  });
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4">Weight Trend</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[minWeight, maxWeight]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}kg`}
              width={45}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value}kg`, 'Weight']}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullDate || _label}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ fill: '#22d3ee', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#22d3ee' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ExerciseSessionsChart({ data }: { data: any[] }) {
  // Only show days that have at least some activity in the period
  const filteredData = data.filter(d => d.sessions > 0);
  if (filteredData.length === 0) return null;
  
  const chartData = filteredData.map(d => {
    const dateObj = new Date(d.date);
    return {
      day: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: d.sessions,
      sets: d.sets,
      date: d.date,
    };
  });
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4">Workout Sessions</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={25}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value, name) => [
                name === 'sessions' ? `${value} exercises` : `${value} sets`,
                name === 'sessions' ? 'Exercises' : 'Sets'
              ]}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.date || _label}
            />
            <Bar 
              dataKey="sessions" 
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MoodChart({ data, distribution }: { data: any[]; distribution: Record<string, number> }) {
  const moodColors: Record<string, string> = {
    great: 'bg-emerald-500',
    good: 'bg-green-500',
    okay: 'bg-amber-500',
    low: 'bg-orange-500',
    bad: 'bg-rose-500',
  };
  
  const total = Object.values(distribution).reduce((acc, v) => acc + v, 0);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4">Mood Distribution</h3>
      
      {total > 0 ? (
        <>
          <div className="space-y-2 mb-4">
            {['great', 'good', 'okay', 'low', 'bad'].map((mood) => {
              const count = distribution[mood] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={mood} className="flex items-center gap-3">
                  <div className="w-16 flex items-center gap-1.5">
                    <MoodIcon mood={mood} size={14} />
                    <span className="text-xs capitalize">{mood}</span>
                  </div>
                  <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', moodColors[mood])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          
          {data.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Recent Days</p>
              <div className="flex gap-1 flex-wrap">
                {data.slice(-14).map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      moodColors[day.mood] + '/20'
                    )}
                    title={`${day.date}: ${day.mood}`}
                  >
                    <MoodIcon mood={day.mood} size={16} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">No mood data for this period</p>
      )}
    </div>
  );
}

function WorkoutStreakCard({ dailyExercise }: { dailyExercise: any[] }) {
  // Only consider days from first activity
  const firstActivityIndex = dailyExercise.findIndex(d => d.sessions > 0);
  const relevantDays = firstActivityIndex >= 0 ? dailyExercise.slice(firstActivityIndex) : [];
  
  let currentStreak = 0;
  const reversedData = [...relevantDays].reverse();
  
  for (const day of reversedData) {
    if (day.sessions > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  const totalWorkoutDays = relevantDays.filter(d => d.sessions > 0).length;
  const totalDays = relevantDays.length;
  const workoutPercentage = totalDays > 0 ? Math.round((totalWorkoutDays / totalDays) * 100) : 0;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-orange-500" />
        <h3 className="font-semibold">Workout Streak</h3>
      </div>
      
      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-3xl font-bold text-orange-500">{currentStreak}</p>
          <p className="text-sm text-muted-foreground">day streak</p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div>
          <p className="text-3xl font-bold">{totalWorkoutDays}/{totalDays}</p>
          <p className="text-sm text-muted-foreground">workout days ({workoutPercentage}%)</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {relevantDays.slice(-21).map((day, i) => (
          <div
            key={i}
            className={cn(
              'w-6 h-6 rounded flex items-center justify-center text-xs font-medium',
              day.sessions > 0 
                ? 'bg-orange-500/20 text-orange-500' 
                : 'bg-secondary text-muted-foreground'
            )}
            title={`${day.date}: ${day.sessions} exercises`}
          >
            {day.sessions > 0 ? '✓' : '·'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HealthReportClient({ initialData, initialPeriod }: HealthReportClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(`/reports/health?period=${newPeriod}`);
    });
  };

  const { summary, muscleWork, exercisesByType, weightLogs, moodDistribution, moodLogs, dailyExercise } = data;

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Health Report</h1>
            <p className="text-muted-foreground mt-1">
              Track your fitness journey and wellness
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ShareableHealthReport 
            data={data} 
            period={period} 
            periodLabel={PERIODS.find(p => p.value === period)?.label || period}
          />
        </div>
      </div>
      
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              period === p.value
                ? 'bg-rose-500 text-white'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-rose-500" />
            <span className="text-sm text-muted-foreground">Exercises</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalExerciseSessions}</p>
          {summary.sessionChange !== 0 && (
            <p className={cn(
              'text-xs flex items-center gap-1 mt-1',
              summary.sessionChange > 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {summary.sessionChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {summary.sessionChange > 0 ? '+' : ''}{summary.sessionChange} vs prev
            </p>
          )}
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={16} className="text-cyan-500" />
            <span className="text-sm text-muted-foreground">Current Weight</span>
          </div>
          <p className="text-2xl font-bold">
            {summary.currentWeight ? `${summary.currentWeight}kg` : 'N/A'}
          </p>
          {summary.weightChange !== 0 && (
            <p className={cn(
              'text-xs flex items-center gap-1 mt-1',
              summary.weightChange < 0 ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {summary.weightChange > 0 ? '+' : ''}{summary.weightChange}kg
            </p>
          )}
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smile size={16} className="text-amber-500" />
            <span className="text-sm text-muted-foreground">Avg Mood</span>
          </div>
          <p className="text-2xl font-bold">
            {summary.avgMood > 0 ? summary.avgMood.toFixed(1) : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">/5</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-emerald-500" />
            <span className="text-sm text-muted-foreground">Tasks Done</span>
          </div>
          <p className="text-2xl font-bold">{summary.healthTasksCompletionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">completion rate</p>
        </div>
      </div>

      {/* Workout Streak */}
      {dailyExercise && dailyExercise.length > 0 && (
        <WorkoutStreakCard dailyExercise={dailyExercise} />
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {dailyExercise && dailyExercise.length > 0 && (
          <ExerciseSessionsChart data={dailyExercise} />
        )}
        {weightLogs && weightLogs.length > 0 && (
          <WeightTrendChart data={weightLogs} />
        )}
      </div>

      {/* Muscle Heatmap & Mood */}
      <div className="grid md:grid-cols-2 gap-4">
        {muscleWork && muscleWork.length > 0 && (
          <MuscleHeatmap muscleWork={muscleWork} />
        )}
        <MoodChart data={moodLogs || []} distribution={moodDistribution || {}} />
      </div>

    </div>
  );
}
