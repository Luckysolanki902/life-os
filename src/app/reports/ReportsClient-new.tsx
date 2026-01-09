'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BookOpen,
  Brain,
  CheckCircle,
  Trophy,
  Scale,
  Smile,
  Calendar,
  ArrowRight,
  Target,
  Flame,
  Zap,
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
  { value: 'thisYear', label: 'This Year' },
  { value: 'allTime', label: 'All Time' },
];

const COLORS = {
  primary: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
};

interface ReportsClientProps {
  initialData: {
    summary: {
      routineCompletionRate: number;
      routineChange: number;
      totalPoints: number;
      pointsChange: number;
      exerciseSessions: number;
      exerciseChange: number;
      weightChange: number;
      avgMood: number;
      booksCompleted: number;
      booksChange: number;
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
    }>;
  };
  initialPeriod: string;
}

function TrendBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
        <Minus size={10} /> Same
      </span>
    );
  }
  
  const isPositive = value > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
    )}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

// Custom tooltip for charts
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-card border border-border rounded-lg shadow-xl p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}: </span>
          {entry.value}{entry.name.includes('Rate') || entry.name.includes('%') ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

export default function ReportsClient({ initialData, initialPeriod }: ReportsClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(`/reports?period=${newPeriod}`);
    });
  };

  const { summary, domainBreakdown, dailyBreakdown } = data;

  // Process daily data for charts - only include days with some activity
  const firstActivityIndex = dailyBreakdown?.findIndex((day) => day.completed > 0 || day.rate > 0) ?? -1;
  const relevantDays = firstActivityIndex >= 0 ? dailyBreakdown?.slice(firstActivityIndex) : dailyBreakdown;
  
  const chartData = relevantDays?.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    shortDate: new Date(day.date).getDate().toString().padStart(2, '0'),
    rate: day.rate,
    completed: day.completed,
    total: day.total,
  })) || [];

  const moodLabels: Record<number, string> = {
    5: 'Great',
    4: 'Good',
    3: 'Okay',
    2: 'Low',
    1: 'Bad',
  };

  return (
    <div className={cn('space-y-6 pb-24', isPending && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and identify patterns
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                period === p.value
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Completion Rate - Featured */}
        <div className="col-span-2 lg:col-span-1 bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-primary/20">
              <Target size={18} className="text-primary" />
            </div>
            <TrendBadge value={summary.routineChange} suffix="%" />
          </div>
          <p className="text-4xl font-bold text-primary">{summary.routineCompletionRate}%</p>
          <p className="text-sm text-muted-foreground">Routine Completion</p>
        </div>

        {/* Points */}
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Trophy size={18} className="text-amber-500" />
            </div>
            <TrendBadge value={summary.pointsChange} />
          </div>
          <p className="text-2xl font-bold">{summary.totalPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </div>

        {/* Exercise */}
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <Activity size={18} className="text-rose-500" />
            </div>
            <TrendBadge value={summary.exerciseChange} />
          </div>
          <p className="text-2xl font-bold">{summary.exerciseSessions}</p>
          <p className="text-xs text-muted-foreground">Exercise Sessions</p>
        </div>

        {/* Learning */}
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Brain size={18} className="text-purple-500" />
            </div>
            <TrendBadge value={Math.round(summary.learningChange / 60 * 10) / 10} suffix="h" />
          </div>
          <p className="text-2xl font-bold">{Math.round(summary.learningMinutes / 60 * 10) / 10}h</p>
          <p className="text-xs text-muted-foreground">Learning Time</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Scale size={16} className="text-cyan-500" />
          </div>
          <div>
            <p className="font-semibold">
              {summary.weightChange > 0 ? '+' : ''}{summary.weightChange}kg
            </p>
            <p className="text-xs text-muted-foreground">Weight</p>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Smile size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold">
              {summary.avgMood > 0 ? moodLabels[Math.round(summary.avgMood)] : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Avg Mood</p>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold">{summary.booksCompleted}</p>
            <p className="text-xs text-muted-foreground">Books Done</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {chartData.length > 1 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Area Chart - Completion Rate */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                Daily Completion Rate
              </h3>
              <span className="text-xs text-muted-foreground">{chartData.length} days</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    name="Completion Rate"
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    fill="url(#colorRate)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Tasks Completed */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                Tasks Completed
              </h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis 
                    dataKey="shortDate" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="completed" 
                    name="Completed"
                    fill={COLORS.emerald} 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar 
                    dataKey="total" 
                    name="Total"
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Domain Performance */}
      <div className="bg-card border border-border/50 rounded-2xl p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap size={16} className="text-yellow-500" />
          Domain Performance
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {domainBreakdown?.map((domain) => {
            const colors: Record<string, { bg: string; text: string; bar: string; gradient: string }> = {
              health: { 
                bg: 'bg-rose-500/10', 
                text: 'text-rose-500', 
                bar: 'bg-rose-500',
                gradient: 'from-rose-500 to-rose-600'
              },
              learning: { 
                bg: 'bg-amber-500/10', 
                text: 'text-amber-500', 
                bar: 'bg-amber-500',
                gradient: 'from-amber-500 to-amber-600'
              },
            };
            const c = colors[domain.domain] || colors.health;
            const Icon = domain.domain === 'health' ? Activity : Brain;
            
            return (
              <Link
                key={domain.domain}
                href={`/reports/${domain.domain}?period=${period}`}
                className="group p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent hover:border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded-lg', c.bg)}>
                      <Icon size={16} className={c.text} />
                    </div>
                    <span className="font-medium capitalize">{domain.domain}</span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                
                <div className="space-y-3">
                  {/* Completion Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-medium">{domain.completionRate}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full rounded-full transition-all duration-700 bg-linear-to-r', c.gradient)}
                        style={{ width: `${domain.completionRate}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Points earned</span>
                    <span className="font-semibold text-sm">{domain.points}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          Detailed Reports
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { name: 'Routine', href: '/reports/routine', icon: Calendar, color: 'primary', bg: 'bg-primary/10' },
            { name: 'Health', href: '/reports/health', icon: Activity, color: 'rose', bg: 'bg-rose-500/10' },
            { name: 'Books', href: '/reports/books', icon: BookOpen, color: 'cyan', bg: 'bg-cyan-500/10' },
            { name: 'Learning', href: '/reports/learning', icon: Brain, color: 'amber', bg: 'bg-amber-500/10' },
          ].map((item) => {
            const colorMap: Record<string, string> = {
              primary: 'text-primary hover:border-primary/50',
              rose: 'text-rose-500 hover:border-rose-500/50',
              cyan: 'text-cyan-500 hover:border-cyan-500/50',
              amber: 'text-amber-500 hover:border-amber-500/50',
            };
            
            return (
              <Link
                key={item.name}
                href={`${item.href}?period=${period}`}
                className={cn(
                  'flex items-center gap-2 p-3 bg-card border border-border/50 rounded-xl transition-all group',
                  'hover:bg-secondary/30',
                  colorMap[item.color]
                )}
              >
                <div className={cn('p-1.5 rounded-lg', item.bg)}>
                  <item.icon size={14} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
