'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Brain,
  Clock,
  Zap,
  Target,
  Star,
  BarChart3,
  Lightbulb,
  Filter,
  ChevronDown,
  BookOpen,
  Calendar,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarRadiusAxis,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

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

const CHART_COLORS = [
  '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e',
  '#3b82f6', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

interface LearningReportClientProps {
  initialData: any;
  initialPeriod: string;
  initialSkillId?: string;
  initialAreaId?: string;
}

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value} {p.name === 'minutes' ? 'min' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Filter Dropdown Component
function FilterDropdown({ 
  label, 
  value, 
  options, 
  onChange,
  placeholder = 'All'
}: { 
  label: string;
  value: string;
  options: { _id: string; name: string; color?: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o._id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm"
      >
        {selected && (
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: selected.color || '#f59e0b' }}
          />
        )}
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{selected?.name || placeholder}</span>
        <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full mt-1 left-0 z-50 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors',
                !value && 'bg-secondary'
              )}
            >
              All {label}s
            </button>
            {options.map((option) => (
              <button
                key={option._id}
                onClick={() => { onChange(option._id); setIsOpen(false); }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2',
                  value === option._id && 'bg-secondary'
                )}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: option.color || '#f59e0b' }}
                />
                {option.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Skills Grid Component
function SkillsGrid({ skills, onSelectSkill }: { skills: any[]; onSelectSkill: (id: string) => void }) {
  if (!skills || skills.length === 0) return null;
  
  const maxMinutes = Math.max(...skills.map(s => s.minutes), 1);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Target size={18} className="text-amber-500" />
        Skills Breakdown
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {skills.map((skill) => {
          const intensity = skill.minutes / maxMinutes;
          return (
            <button
              key={skill._id}
              onClick={() => onSelectSkill(skill._id)}
              className="text-left p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent hover:border-amber-500/30 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm truncate pr-2">{skill.name}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: `rgba(245, 158, 11, ${Math.max(intensity, 0.2)})`,
                    color: intensity > 0.5 ? 'white' : 'inherit'
                  }}
                >
                  {Math.floor(skill.minutes / 60)}h {skill.minutes % 60}m
                </span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${intensity * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{skill.sessions} sessions</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-500">
                  View details →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Weekly Trend Chart
function WeeklyTrendChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-500" />
        Weekly Trend
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="week" 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#minutesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Recent Sessions Log
function RecentSessions({ sessions }: { sessions: any[] }) {
  if (!sessions || sessions.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-cyan-500" />
        Recent Practice Sessions
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sessions.map((session, i) => (
          <div 
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{session.skillName}</span>
                {session.mediumName && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                    {session.mediumName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{session.date}</span>
                <span>•</span>
                <span className="font-medium text-foreground">{session.duration} min</span>
                {session.difficulty && (
                  <>
                    <span>•</span>
                    <span className={cn(
                      'capitalize',
                      session.difficulty === 'easy' && 'text-emerald-500',
                      session.difficulty === 'moderate' && 'text-amber-500',
                      session.difficulty === 'challenging' && 'text-orange-500',
                      session.difficulty === 'hard' && 'text-rose-500'
                    )}>
                      {session.difficulty}
                    </span>
                  </>
                )}
              </div>
              {session.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{session.notes}</p>
              )}
            </div>
            {session.rating && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: session.rating }).map((_, j) => (
                  <Star key={j} size={12} className="text-amber-500 fill-amber-500" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Daily Learning Bar Chart with Recharts
function DailyLearningChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-amber-500" />
        Daily Practice Time
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="dayName" 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="minutes" 
              fill="#f59e0b" 
              radius={[4, 4, 0, 0]}
              name="minutes"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Area Pie Chart
function AreaPieChart({ areas }: { areas: any[] }) {
  if (!areas || areas.length === 0) return null;
  
  const data = areas.map((area, i) => ({
    name: area.name,
    value: area.minutes,
    color: area.color || CHART_COLORS[i % CHART_COLORS.length]
  }));
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Brain size={18} className="text-purple-500" />
        Time by Area
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => {
                const v = value as number;
                return [`${Math.floor(v / 60)}h ${v % 60}m`, 'Time'];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Difficulty Radar Chart
function DifficultyRadarChart({ distribution }: { distribution: Record<string, number> }) {
  const data = [
    { subject: 'Easy', value: distribution['easy'] || 0, fullMark: 10 },
    { subject: 'Moderate', value: distribution['moderate'] || 0, fullMark: 10 },
    { subject: 'Challenging', value: distribution['challenging'] || 0, fullMark: 10 },
    { subject: 'Hard', value: distribution['hard'] || 0, fullMark: 10 },
  ];
  
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Zap size={18} className="text-amber-500" />
        Difficulty Distribution
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar
              name="Sessions"
              dataKey="value"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.4}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((d) => (
          <div key={d.subject} className="text-center">
            <p className="text-lg font-bold">{d.value}</p>
            <p className="text-xs text-muted-foreground">{d.subject}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Rating Stars Chart
function RatingStarsChart({ distribution }: { distribution: Record<number, number> }) {
  const total = Object.values(distribution).reduce((acc, v) => acc + v, 0);
  if (total === 0) return null;
  
  const avgRating = Object.entries(distribution).reduce((acc, [rating, count]) => {
    return acc + (Number(rating) * count);
  }, 0) / total;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Star size={18} className="text-amber-500" />
        Session Ratings
      </h3>
      
      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-amber-500">{avgRating.toFixed(1)}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={cn(
                i < Math.round(avgRating) 
                  ? 'text-amber-500 fill-amber-500' 
                  : 'text-muted'
              )} 
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Average Rating</p>
      </div>
      
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <div className="w-8 flex items-center justify-end gap-0.5">
                <span className="text-xs font-medium">{rating}</span>
                <Star size={10} className="text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Top Mediums List
function TopMediumsList({ mediums }: { mediums: any[] }) {
  if (!mediums || mediums.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lightbulb size={18} className="text-purple-500" />
        Top Practice Mediums
      </h3>
      <div className="space-y-2">
        {mediums.slice(0, 5).map((medium, i) => (
          <div 
            key={medium._id} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ 
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '30',
                color: CHART_COLORS[i % CHART_COLORS.length]
              }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{medium.name}</p>
              <p className="text-xs text-muted-foreground">{medium.sessions} sessions</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">
                {Math.floor(medium.minutes / 60)}h {medium.minutes % 60}m
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LearningReportClient({ 
  initialData, 
  initialPeriod,
  initialSkillId,
  initialAreaId 
}: LearningReportClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [areaId, setAreaId] = useState(initialAreaId || '');
  const [skillId, setSkillId] = useState(initialSkillId || '');
  const [data] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const buildUrl = (newPeriod?: string, newAreaId?: string, newSkillId?: string) => {
    const params = new URLSearchParams();
    params.set('period', newPeriod ?? period);
    if (newAreaId !== undefined ? newAreaId : areaId) params.set('areaId', newAreaId !== undefined ? newAreaId : areaId);
    if (newSkillId !== undefined ? newSkillId : skillId) params.set('skillId', newSkillId !== undefined ? newSkillId : skillId);
    return `/reports/learning?${params.toString()}`;
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(buildUrl(newPeriod));
    });
  };

  const handleAreaChange = (newAreaId: string) => {
    setAreaId(newAreaId);
    setSkillId(''); // Reset skill when area changes
    startTransition(() => {
      router.push(buildUrl(undefined, newAreaId, ''));
    });
  };

  const handleSkillChange = (newSkillId: string) => {
    setSkillId(newSkillId);
    startTransition(() => {
      router.push(buildUrl(undefined, undefined, newSkillId));
    });
  };

  const clearFilters = () => {
    setAreaId('');
    setSkillId('');
    startTransition(() => {
      router.push(`/reports/learning?period=${period}`);
    });
  };

  const { summary, byArea, bySkill, difficultyDist, ratingDist, topMediums, dailyLearning, weeklyTrend, recentSessions, filters } = data;

  // Filter skills by selected area
  const filteredSkills = useMemo(() => {
    if (!bySkill) return [];
    if (!areaId) return bySkill;
    return bySkill.filter((s: any) => s.areaId === areaId);
  }, [bySkill, areaId]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const hasActiveFilters = areaId || skillId;

  return (
    <div className={cn('space-y-6 pb-24', isPending && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/reports?period=${period}`}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Learning Report</h1>
            <p className="text-muted-foreground mt-1">
              Track your skill development and practice
            </p>
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
                  ? 'bg-amber-500 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {filters && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter size={16} />
              <span>Filter by:</span>
            </div>
            
            <FilterDropdown
              label="Area"
              value={areaId}
              options={filters.areas || []}
              onChange={handleAreaChange}
            />
            
            <FilterDropdown
              label="Skill"
              value={skillId}
              options={areaId 
                ? (filters.skills || []).filter((s: any) => s.areaId === areaId)
                : (filters.skills || [])
              }
              onChange={handleSkillChange}
            />
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-colors"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-sm text-muted-foreground">Total Time</span>
          </div>
          <p className="text-2xl font-bold">{formatTime(summary?.totalMinutes || 0)}</p>
          {summary?.minutesChange !== 0 && (
            <p className={cn(
              'text-xs flex items-center gap-1 mt-1',
              summary?.minutesChange > 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {summary?.minutesChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {summary?.minutesChange > 0 ? '+' : ''}{formatTime(Math.abs(summary?.minutesChange || 0))}
            </p>
          )}
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-purple-500" />
            <span className="text-sm text-muted-foreground">Sessions</span>
          </div>
          <p className="text-2xl font-bold">{summary?.totalSessions || 0}</p>
          {summary?.prevSessions !== summary?.totalSessions && (
            <p className={cn(
              'text-xs flex items-center gap-1 mt-1',
              (summary?.totalSessions || 0) > (summary?.prevSessions || 0) ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {(summary?.totalSessions || 0) > (summary?.prevSessions || 0) ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {(summary?.totalSessions || 0) - (summary?.prevSessions || 0) > 0 ? '+' : ''}
              {(summary?.totalSessions || 0) - (summary?.prevSessions || 0)}
            </p>
          )}
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-cyan-500" />
            <span className="text-sm text-muted-foreground">Avg Session</span>
          </div>
          <p className="text-2xl font-bold">{summary?.avgSessionLength || 0}m</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-emerald-500" />
            <span className="text-sm text-muted-foreground">Total Hours</span>
          </div>
          <p className="text-2xl font-bold">{summary?.totalHours || 0}</p>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      {weeklyTrend && weeklyTrend.length > 0 && (
        <WeeklyTrendChart data={weeklyTrend} />
      )}

      {/* Daily Chart */}
      {dailyLearning && dailyLearning.length > 0 && (
        <DailyLearningChart data={dailyLearning} />
      )}

      {/* Skills Grid - Main Focus */}
      {!skillId && filteredSkills && filteredSkills.length > 0 && (
        <SkillsGrid skills={filteredSkills} onSelectSkill={handleSkillChange} />
      )}

      {/* Area Pie Chart & Top Mediums */}
      <div className="grid md:grid-cols-2 gap-4">
        {byArea && byArea.length > 0 && <AreaPieChart areas={byArea} />}
        {topMediums && topMediums.length > 0 && <TopMediumsList mediums={topMediums} />}
      </div>

      {/* Difficulty & Rating */}
      <div className="grid md:grid-cols-2 gap-4">
        {difficultyDist && <DifficultyRadarChart distribution={difficultyDist} />}
        {ratingDist && <RatingStarsChart distribution={ratingDist} />}
      </div>

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <RecentSessions sessions={recentSessions} />
      )}
    </div>
  );
}
