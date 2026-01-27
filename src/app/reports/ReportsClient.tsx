'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
  Brain,
  Trophy,
  Scale,
  Smile,
  Calendar,
  ArrowRight,
  Target,
  Flame,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOverallReport } from '../actions/reports';

const PERIODS = [
  { value: 'last7Days', label: '7D' },
  { value: 'last14Days', label: '14D' },
  { value: 'thisWeek', label: 'Week' },
  { value: 'thisMonth', label: 'Month' },
  { value: 'last3Months', label: '3M' },
  { value: 'thisYear', label: 'Year' },
  { value: 'allTime', label: 'All' },
];

interface ReportData {
  summary: {
    routineCompletionRate: number;
    routineChange: number;
    totalPoints: number;
    pointsChange: number;
    exerciseDays: number;
    exerciseChange: number;
    currentWeight: number | null;
    weightChange: number;
    avgMood: number;
    booksCompleted: number;
    booksChange: number;
    pagesRead: number;
    pagesReadChange: number;
    learningMinutes: number;
    learningChange: number;
  };
  domainBreakdown: Array<{
    domain: string;
    completionRate: number;
    points: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    dayName?: string;
    completed: number;
    total: number;
    rate: number;
    learningMinutes?: number;
    pagesRead?: number;
  }>;
}

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

// Loading Skeleton Components
function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="w-12 h-4 bg-muted rounded" />
      </div>
      <div className="w-16 h-8 bg-muted rounded mb-1" />
      <div className="w-20 h-3 bg-muted rounded" />
    </div>
  );
}

function ChartSkeleton({ height = "h-24" }: { height?: string }) {
  return (
    <div className={cn("bg-muted/20 rounded-xl animate-pulse", height)} />
  );
}

// Minimal stat card
function StatCard({
  label,
  value,
  change,
  icon: Icon,
  suffix = '',
  changeSuffix = '',
  color,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  suffix?: string;
  changeSuffix?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    purple: 'text-purple-500',
    cyan: 'text-cyan-500',
    emerald: 'text-emerald-500',
  };
  
  const textColor = colorMap[color] || 'text-foreground';

  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 hover:border-border/80 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Icon size={16} className={cn("opacity-80", textColor)} />
        {change !== undefined && change !== 0 && (
          <TrendBadge value={change} suffix={changeSuffix} />
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}{suffix}</p>
      <p className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// Custom minimal tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>;
  label?: string;
}

function MinimalTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-popover border border-border/50 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-foreground mb-1 border-b border-border/30 pb-1">{label}</p>
      {payload.map((entry, i: number) => (
        <p key={i} className="text-[10px] text-muted-foreground flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
             {entry.name === 'rate' ? 'Rate' : entry.name}
          </span>
          <span className="font-mono font-medium text-foreground">
            {entry.value}{entry.name.includes('Rate') || entry.dataKey === 'rate' ? '%' : ''}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function ReportsClient() {
  const [period, setPeriod] = useState('last7Days');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getOverallReport(period);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
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
        <div className="flex flex-col gap-4">
          <div className="w-32 h-8 bg-muted rounded-lg" />
          <div className="flex gap-2">
             {[1,2,3,4,5,6].map(i => <div key={i} className="w-12 h-8 bg-muted rounded-lg" />)}
          </div>
        </div>
        <div className="h-48 bg-muted rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { summary, domainBreakdown, dailyBreakdown } = data;

  // Process chart data
  const chartData = dailyBreakdown?.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    shortDate: day.dayName || new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
    rate: day.rate,
    completed: day.completed,
    total: day.total,
    learningMinutes: day.learningMinutes || 0,
    pagesRead: day.pagesRead || 0,
  })) || [];

  const moodLabels: Record<number, string> = {
    5: 'Great', 4: 'Good', 3: 'Okay', 2: 'Low', 1: 'Bad'
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview
          </p>
        </div>
        
        {/* Period Pills */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit border border-border/40">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[10px] font-medium transition-all uppercase tracking-wide',
                period === p.value
                  ? 'bg-background text-foreground shadow-sm border border-border/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Completion Rate Card with Chart */}
      <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm relative overflow-hidden group">
       
        
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Routine Completion</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight">{summary.routineCompletionRate}%</span>
              <TrendBadge value={summary.routineChange} suffix="%" />
            </div>
          </div>
        </div>
        
        {chartData.length > 1 && (
          <div className="h-32 -mx-2 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="shortDate" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <Tooltip content={<MinimalTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#completionGradient)"
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats Grid - 4 Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Points"
          value={summary.totalPoints >= 1000 ? `${(summary.totalPoints/1000).toFixed(1)}k` : summary.totalPoints}
          change={summary.pointsChange}
          icon={Trophy}
          color="amber"
        />
        <StatCard
          label="Active Days"
          value={summary.exerciseDays}
          change={summary.exerciseChange}
          icon={Activity}
          color="rose"
        />
        <StatCard
          label="Learning"
          value={`${Math.round(summary.learningMinutes / 60 * 10) / 10}h`}
          change={Math.round(summary.learningChange / 60 * 10) / 10}
          changeSuffix="h"
          icon={Brain}
          color="purple"
        />
        <StatCard
          label="Read"
          value={summary.pagesRead || 0}
          change={summary.pagesReadChange}
          icon={BookOpen}
          color="cyan"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between hover:border-border/80 transition-colors">
          <div>
            <p className="text-lg font-bold">
              {summary.currentWeight ? `${summary.currentWeight}` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Weight (kg)</p>
          </div>
          {summary.weightChange !== 0 && summary.currentWeight && (
             <span className={cn(
                  'text-[10px] font-medium ml-1',
                  summary.weightChange > 0 ? 'text-amber-500' : 'text-emerald-500'
                )}>
                  {summary.weightChange > 0 ? '+' : ''}{summary.weightChange}
             </span>
          )}
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between hover:border-border/80 transition-colors">
           <div>
            <p className="text-lg font-bold">
              {summary.avgMood > 0 ? moodLabels[Math.round(summary.avgMood)] : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Avg Mood</p>
          </div>
          <Smile size={16} className="text-emerald-500/80" />
        </div>
        <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between hover:border-border/80 transition-colors">
           <div>
            <p className="text-lg font-bold">{summary.booksCompleted}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Books Done</p>
          </div>
          <BookOpen size={16} className="text-blue-500/80" />
        </div>
      </div>

      {/* Domain Performance */}
      <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="grid gap-2">
            {domainBreakdown.map((domain) => {
                const colors: Record<string, string> = {
                health: 'text-rose-500',
                learning: 'text-amber-500',
                social: 'text-emerald-500',
                career: 'text-blue-500',
                };
                const barColors: Record<string, string> = {
                 health: 'bg-rose-500',
                 learning: 'bg-amber-500',
                 social: 'bg-emerald-500',
                 career: 'bg-blue-500',
                };

                const c = colors[domain.domain] || colors.health;
                const b = barColors[domain.domain] || barColors.health;
                
                // Icon mapping
                const icons: Record<string, any> = {
                    health: Activity, learning: Brain, social: Smile, career: Target
                };
                const Icon = icons[domain.domain] || Activity;
                
                return (
                <Link
                    key={domain.domain}
                    href={`/reports/${domain.domain}?period=${period}`}
                    className="group flex flex-col p-4 bg-card border border-border/40 rounded-xl hover:border-border/80 transition-all"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <Icon size={16} className={c} />
                            <span className="font-medium capitalize text-sm">{domain.domain}</span>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                    
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{domain.points} pts</span>
                        <span className="text-lg font-bold">{domain.completionRate}%</span>
                    </div>

                    <div className="h-1 bg-secondary rounded-full overflow-hidden w-full">
                        <div 
                        className={cn('h-full rounded-full transition-all duration-700', b)}
                        style={{ width: `${domain.completionRate}%` }}
                        />
                    </div>
                </Link>
                );
            })}
            </div>
        </div>

        {/* Charts Column */}
         <div className="space-y-4">
             {/* Tasks Completed Bar Chart */}
            {chartData.length > 1 && (
                <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    Daily Tasks
                </h3>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis 
                        dataKey="shortDate" 
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        dy={5}
                        />
                        <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.4 }} />
                        <Bar 
                        dataKey="completed" 
                        fill="hsl(var(--primary))"
                        radius={[2, 2, 0, 0]}
                        activeBar={{ fill: 'hsl(var(--foreground))' }}
                        />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            )}

            {/* Learning Duration Chart */}
            {chartData.length > 1 && (
                <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Learning Minutes
                    </h3>
                </div>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                        <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(245, 158, 11)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="rgb(245, 158, 11)" stopOpacity={0} />
                        </linearGradient>
                        </defs>
                        <XAxis 
                        dataKey="shortDate" 
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        dy={5}
                        />
                        <Tooltip content={<MinimalTooltip />} />
                        <Area
                        type="monotone"
                        dataKey="learningMinutes"
                        stroke="rgb(245, 158, 11)"
                        strokeWidth={2}
                        fill="url(#learningGradient)"
                        name="Minutes"
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}
