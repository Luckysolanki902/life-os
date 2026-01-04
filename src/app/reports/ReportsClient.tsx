'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BookOpen,
  Brain,
  Users,
  CheckCircle,
  Trophy,
  Scale,
  Smile,
  Calendar,
  ArrowRight,
  BarChart3,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'last6Months', label: 'Last 6 Months' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'allTime', label: 'All Time' },
];

interface ReportsClientProps {
  initialData: any;
  initialPeriod: string;
}

function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus size={12} /> No change
      </span>
    );
  }
  
  const isPositive = value > 0;
  return (
    <span className={cn(
      'flex items-center gap-1 text-xs font-medium',
      isPositive ? 'text-emerald-500' : 'text-rose-500'
    )}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  suffix = '',
  changeSuffix = '',
  color = 'primary',
  invertTrend = false,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  suffix?: string;
  changeSuffix?: string;
  color?: string;
  invertTrend?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    rose: 'text-rose-500 bg-rose-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    cyan: 'text-cyan-500 bg-cyan-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
  };

  const displayChange = invertTrend && change !== undefined ? -change : change;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5 hover:border-border transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-xl', colorClasses[color])}>
          <Icon size={18} />
        </div>
        {change !== undefined && <TrendIndicator value={displayChange!} suffix={changeSuffix} />}
      </div>
      <div className="space-y-1">
        <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}{suffix}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

function DomainCard({
  domain,
  href,
  icon: Icon,
  color,
  completionRate,
  points,
}: {
  domain: string;
  href: string;
  icon: any;
  color: string;
  completionRate: number;
  points: number;
}) {
  const colorClasses: Record<string, { bg: string; text: string; bar: string }> = {
    health: { bg: 'bg-rose-500/10', text: 'text-rose-500', bar: 'bg-rose-500' },
    learning: { bg: 'bg-amber-500/10', text: 'text-amber-500', bar: 'bg-amber-500' },
    social: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', bar: 'bg-emerald-500' },
  };

  const colors = colorClasses[domain] || colorClasses.health;

  return (
    <Link
      href={href}
      className="group bg-card border border-border/50 rounded-2xl p-4 md:p-5 hover:border-border hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-xl', colors.bg)}>
            <Icon size={18} className={colors.text} />
          </div>
          <span className="font-semibold capitalize">{domain}</span>
        </div>
        <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Points earned</span>
          <span className="font-medium">{points}</span>
        </div>
      </div>
    </Link>
  );
}

function DailyChart({ data }: { data: any[] }) {
  const maxRate = Math.max(...data.map(d => d.rate), 1);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4">Daily Completion Rate</h3>
      <div className="flex items-end gap-1 h-32">
        {data.slice(-14).map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-secondary rounded-t relative group" style={{ height: `${(day.rate / maxRate) * 100}%`, minHeight: day.rate > 0 ? '4px' : '0' }}>
              <div className={cn(
                'absolute inset-0 rounded-t transition-colors',
                day.rate >= 80 ? 'bg-emerald-500' : day.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              )} />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {day.rate}%
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{day.dayName || day.date.slice(-2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsClient({ initialData, initialPeriod }: ReportsClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(`/reports?period=${newPeriod}`);
    });
  };

  const { summary, domainBreakdown, dailyBreakdown } = data;

  const domainIcons: Record<string, any> = {
    health: Activity,
    learning: Brain,
    social: Users,
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and identify patterns
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {PERIODS.slice(0, 6).map((p) => (
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
          <select
            value={PERIODS.slice(6).some(p => p.value === period) ? period : ''}
            onChange={(e) => e.target.value && handlePeriodChange(e.target.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground cursor-pointer',
              PERIODS.slice(6).some(p => p.value === period) && 'bg-primary text-primary-foreground'
            )}
          >
            <option value="">More...</option>
            {PERIODS.slice(6).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Routine Completion"
          value={summary.routineCompletionRate}
          suffix="%"
          change={summary.routineChange}
          changeSuffix="%"
          icon={CheckCircle}
          color="primary"
        />
        <StatCard
          title="Points Earned"
          value={summary.totalPoints.toLocaleString()}
          change={summary.pointsChange}
          icon={Trophy}
          color="amber"
        />
        <StatCard
          title="Exercise Sessions"
          value={summary.exerciseSessions}
          change={summary.exerciseChange}
          icon={Activity}
          color="rose"
        />
        <StatCard
          title="Learning Time"
          value={Math.round(summary.learningMinutes / 60 * 10) / 10}
          suffix="h"
          change={Math.round((summary.learningChange) / 60 * 10) / 10}
          changeSuffix="h"
          icon={Brain}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Weight Change"
          value={summary.weightChange > 0 ? `+${summary.weightChange}` : summary.weightChange}
          suffix="kg"
          icon={Scale}
          color="cyan"
        />
        <StatCard
          title="Avg Mood"
          value={summary.avgMood > 0 ? moodLabels[Math.round(summary.avgMood)] || summary.avgMood : 'N/A'}
          icon={Smile}
          color="emerald"
        />
        <StatCard
          title="Books Completed"
          value={summary.booksCompleted}
          change={summary.booksChange}
          icon={BookOpen}
          color="cyan"
        />
        <StatCard
          title="Social Interactions"
          value={summary.interactions}
          change={summary.interactionsChange}
          icon={Users}
          color="emerald"
        />
      </div>

      {/* Daily Chart */}
      {dailyBreakdown && dailyBreakdown.length > 0 && (
        <DailyChart data={dailyBreakdown} />
      )}

      {/* Domain Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Domain Performance</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {domainBreakdown?.map((domain: any) => (
            <DomainCard
              key={domain.domain}
              domain={domain.domain}
              href={`/reports/${domain.domain}`}
              icon={domainIcons[domain.domain] || Activity}
              color={domain.domain}
              completionRate={domain.completionRate}
              points={domain.points}
            />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Detailed Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { name: 'Routine', href: '/reports/routine', icon: Calendar, color: 'primary' },
            { name: 'Health', href: '/reports/health', icon: Activity, color: 'rose' },
            { name: 'Books', href: '/reports/books', icon: BookOpen, color: 'cyan' },
            { name: 'Learning', href: '/reports/learning', icon: Brain, color: 'amber' },
            { name: 'Social', href: '/reports/social', icon: Users, color: 'emerald' },
          ].map((item) => {
            const colorClasses: Record<string, string> = {
              primary: 'hover:border-primary/50 hover:bg-primary/5',
              rose: 'hover:border-rose-500/50 hover:bg-rose-500/5',
              cyan: 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
              amber: 'hover:border-amber-500/50 hover:bg-amber-500/5',
              emerald: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
            };
            const iconColors: Record<string, string> = {
              primary: 'text-primary',
              rose: 'text-rose-500',
              cyan: 'text-cyan-500',
              amber: 'text-amber-500',
              emerald: 'text-emerald-500',
            };
            
            return (
              <Link
                key={item.name}
                href={`${item.href}?period=${period}`}
                className={cn(
                  'flex items-center gap-3 p-4 bg-card border border-border/50 rounded-xl transition-all group',
                  colorClasses[item.color]
                )}
              >
                <item.icon size={20} className={iconColors[item.color]} />
                <span className="font-medium">{item.name}</span>
                <ArrowRight size={14} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
