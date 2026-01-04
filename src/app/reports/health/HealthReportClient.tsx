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
  Dumbbell,
  Heart,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: 'today', label: 'Today' },
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
  
  // Group muscles by body area
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

function WeightChart({ data }: { data: any[] }) {
  if (data.length === 0) return null;
  
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights) - 1;
  const maxWeight = Math.max(...weights) + 1;
  const range = maxWeight - minWeight || 1;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4">Weight Trend</h3>
      <div className="flex items-end gap-1 h-32">
        {data.slice(-30).map((point, i) => {
          const height = ((point.weight - minWeight) / range) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div 
                className="w-full bg-cyan-500 rounded-t relative cursor-pointer hover:bg-cyan-400 transition-colors"
                style={{ height: `${height}%`, minHeight: '4px' }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                  <p className="font-medium">{point.weight}kg</p>
                  <p className="text-muted-foreground">{point.date}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{minWeight.toFixed(1)}kg</span>
        <span>{maxWeight.toFixed(1)}kg</span>
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
          {/* Distribution bars */}
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
          
          {/* Daily mood timeline */}
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

function ExerciseChart({ data }: { data: any[] }) {
  const maxSets = Math.max(...data.map(d => d.sets), 1);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4">Daily Exercise Volume</h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div 
              className="w-full bg-secondary rounded-t relative cursor-pointer"
              style={{ height: `${Math.max((day.sets / maxSets) * 100, 2)}%` }}
            >
              <div className={cn(
                'absolute inset-0 rounded-t transition-colors',
                day.sessions > 0 ? 'bg-rose-500' : 'bg-muted'
              )} />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                <p className="font-medium">{day.sessions} sessions</p>
                <p className="text-muted-foreground">{day.sets} sets</p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{day.dayName}</span>
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-rose-500" />
            <span className="text-sm text-muted-foreground">Workouts</span>
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

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {dailyExercise && dailyExercise.length > 0 && (
          <ExerciseChart data={dailyExercise} />
        )}
        {weightLogs && weightLogs.length > 0 && (
          <WeightChart data={weightLogs} />
        )}
      </div>

      {/* Muscle Heatmap & Mood */}
      <div className="grid md:grid-cols-2 gap-4">
        {muscleWork && muscleWork.length > 0 && (
          <MuscleHeatmap muscleWork={muscleWork} />
        )}
        <MoodChart data={moodLogs || []} distribution={moodDistribution || {}} />
      </div>

      {/* Top Exercises */}
      {exercisesByType && exercisesByType.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
          <h3 className="font-semibold mb-4">Top Exercises</h3>
          <div className="space-y-3">
            {exercisesByType.map((exercise: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <Dumbbell size={16} className="text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.count} sessions • {exercise.totalSets} sets • {exercise.totalReps} reps
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-500">{exercise.totalWeight}kg</p>
                  <p className="text-xs text-muted-foreground">total volume</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
