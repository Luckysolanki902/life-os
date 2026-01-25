'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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

const PERIODS = [
  { value: 'last7Days', label: '7D' },
  { value: 'last14Days', label: '14D' },
  { value: 'thisWeek', label: 'Week' },
  { value: 'thisMonth', label: 'Month' },
  { value: 'last3Months', label: '3M' },
  { value: 'thisYear', label: 'Year' },
  { value: 'allTime', label: 'All' },
];

interface ReportsClientProps {
  initialData: {
    summary: {
      routineCompletionRate: number;
      routineChange: number;
      totalPoints: number;
      pointsChange: number;
      exerciseDays: number;
      exerciseChange: number;
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
  };
  initialPeriod: string;
}

function TrendBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  
  const isPositive = value > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold',
      isPositive ? 'text-emerald-500' : 'text-rose-500'
    )}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
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
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  };
  
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-4 hover:border-border/60 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-2 rounded-xl', c.bg)}>
          <Icon size={16} className={c.text} />
        </div>
        {change !== undefined && change !== 0 && (
          <TrendBadge value={change} suffix={changeSuffix} />
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}{suffix}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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
    <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="font-medium" style={{ color: entry.color }}>{entry.value}</span>
          {entry.name.includes('Rate') || entry.dataKey === 'rate' ? '%' : ''}
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
    <div className={cn('space-y-6 pb-24', isPending && 'opacity-50 pointer-events-none transition-opacity')}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Your progress at a glance
          </p>
        </div>
        
        {/* Period Pills */}
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl w-fit">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
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
      </div>

      {/* Main Completion Rate Card with Chart */}
      <div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={18} className="text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">{summary.routineCompletionRate}%</span>
              <TrendBadge value={summary.routineChange} suffix="%" />
            </div>
          </div>
        </div>
        
        {chartData.length > 1 && (
          <div className="h-24 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="shortDate" 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#completionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats Grid - 4 Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Points Earned"
          value={summary.totalPoints.toLocaleString()}
          change={summary.pointsChange}
          icon={Trophy}
          color="amber"
        />
        <StatCard
          label="Days with Exercise"
          value={summary.exerciseDays}
          change={summary.exerciseChange}
          icon={Activity}
          color="rose"
        />
        <StatCard
          label="Learning Time"
          value={`${Math.round(summary.learningMinutes / 60 * 10) / 10}h`}
          change={Math.round(summary.learningChange / 60 * 10) / 10}
          changeSuffix="h"
          icon={Brain}
          color="purple"
        />
        <StatCard
          label="Pages Read"
          value={summary.pagesRead || 0}
          change={summary.pagesReadChange}
          icon={FileText}
          color="cyan"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/50 border border-border/30 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Scale size={14} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {summary.weightChange > 0 ? '+' : ''}{summary.weightChange}kg
            </p>
            <p className="text-[10px] text-muted-foreground">Weight</p>
          </div>
        </div>
        <div className="bg-card/50 border border-border/30 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Smile size={14} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {summary.avgMood > 0 ? moodLabels[Math.round(summary.avgMood)] : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          </div>
        </div>
        <div className="bg-card/50 border border-border/30 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen size={14} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">{summary.booksCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Books Done</p>
          </div>
        </div>
      </div>

      {/* Tasks Completed Bar Chart */}
      {chartData.length > 1 && (
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Flame size={14} className="text-orange-500" />
            Tasks Completed
          </h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="shortDate" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Bar 
                  dataKey="completed" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Domain Performance */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Domain Performance</h3>
        <div className="grid gap-3">
          {domainBreakdown.slice(0, 1)?.map((domain) => {
            const colors: Record<string, { bg: string; text: string; bar: string }> = {
              health: { bg: 'bg-rose-500/10', text: 'text-rose-500', bar: 'bg-rose-500' },
              learning: { bg: 'bg-amber-500/10', text: 'text-amber-500', bar: 'bg-amber-500' },
            };
            const c = colors[domain.domain] || colors.health;
            const Icon = domain.domain === 'health' ? Activity : Brain;
            
            return (
              <Link
                key={domain.domain}
                href={`/reports/${domain.domain}?period=${period}`}
                className="group flex items-center gap-4 p-4 bg-card/50 border border-border/30 rounded-xl hover:border-border/60 hover:bg-card transition-all"
              >
                <div className={cn('p-2.5 rounded-xl', c.bg)}>
                  <Icon size={18} className={c.text} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium capitalize">{domain.domain}</span>
                    <span className={cn('text-sm font-semibold', c.text)}>{domain.completionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn('h-full rounded-full transition-all duration-700', c.bar)}
                      style={{ width: `${domain.completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{domain.points} points</p>
                </div>
                
                <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Learning Duration Chart */}
      {chartData.length > 1 && (
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain size={14} className="text-amber-500" />
              Learning Duration (minutes)
            </h3>
            <Link href={`/reports/learning?period=${period}`} className="text-xs text-amber-500 hover:underline">
              Details
            </Link>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(245, 158, 11)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="rgb(245, 158, 11)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="shortDate" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
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

      {/* Books Pages Read Chart */}
      {chartData.length > 1 && (
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen size={14} className="text-cyan-500" />
              Pages Read
            </h3>
            <Link href={`/reports/books?period=${period}`} className="text-xs text-cyan-500 hover:underline">
              Details
            </Link>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="booksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(6, 182, 212)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="rgb(6, 182, 212)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="shortDate" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pagesRead"
                  stroke="rgb(6, 182, 212)"
                  strokeWidth={2}
                  fill="url(#booksGradient)"
                  name="Pages"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { name: 'Routine', href: '/reports/routine', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
          { name: 'Health', href: '/reports/health', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { name: 'Books', href: '/reports/books', icon: BookOpen, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { name: 'Learning', href: '/reports/learning', icon: Brain, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((item) => (
          <Link
            key={item.name}
            href={`${item.href}?period=${period}`}
            className="flex items-center gap-2 p-3 bg-card/50 border border-border/30 rounded-xl hover:border-border/60 transition-all group"
          >
            <div className={cn('p-1.5 rounded-lg', item.bg)}>
              <item.icon size={14} className={item.color} />
            </div>
            <span className="text-sm font-medium">{item.name}</span>
            <ArrowRight size={12} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
