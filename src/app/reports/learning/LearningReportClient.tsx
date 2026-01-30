'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Layers,
  Sparkles
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
import { getLearningReport } from '../../actions/reports';

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

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/50 px-3 py-2 rounded-lg shadow-xl text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/40 hover:bg-secondary/40 transition-colors text-xs font-medium"
      >
        {selected && (
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: selected.color || '#f59e0b' }}
          />
        )}
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-foreground">{selected?.name || placeholder}</span>
        <ChevronDown size={12} className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full mt-1 left-0 z-50 w-48 bg-popover border border-border/50 rounded-lg shadow-xl overflow-hidden py-1">
            <button
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={cn(
                'w-full px-3 py-1.5 text-left text-xs hover:bg-secondary/40 transition-colors',
                !value && 'bg-secondary/20 text-foreground font-medium'
              )}
            >
              All {label}s
            </button>
            {options.map((option) => (
              <button
                key={option._id}
                onClick={() => { onChange(option._id); setIsOpen(false); }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-xs hover:bg-secondary/40 transition-colors flex items-center gap-2',
                  value === option._id && 'bg-secondary/20 text-foreground font-medium'
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-sm">Skills Breakdown</h3>
         <Target size={14} className="text-muted-foreground" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skills.map((skill) => {
          const intensity = skill.minutes / maxMinutes;
          return (
            <button
              key={skill._id}
              onClick={() => onSelectSkill(skill._id)}
              className="text-left p-3 rounded-lg border border-border/40 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-xs truncate pr-2">{skill.name}</span>
                <span 
                  className="text-[10px] font-mono font-medium text-amber-600"
                >
                  {Math.floor(skill.minutes / 60)}h {skill.minutes % 60}m
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
                  style={{ width: `${intensity * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>{skill.sessions} sessions</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 font-medium flex items-center gap-0.5">
                  View <ArrowLeft className="rotate-180" size={8} />
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
         <h3 className="font-semibold text-sm">Trend</h3>
         <TrendingUp size={14} className="text-muted-foreground" />
      </div>
      <div className="h-48 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis 
              dataKey="week" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-sm">Recent Sessions</h3>
         <Calendar size={14} className="text-muted-foreground" />
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {sessions.map((session, i) => (
          <div 
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-amber-500/20 hover:bg-amber-500/5 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center shrink-0 text-amber-600">
              <BookOpen size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-foreground">{session.skillName}</span>
                {session.mediumName && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/30 text-muted-foreground">
                    {session.mediumName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="w-0.5 h-0.5 bg-muted-foreground rounded-full" />
                <span className="font-medium text-foreground">{session.duration} min</span>
                 {session.difficulty && (
                  <>
                    <span className="w-0.5 h-0.5 bg-muted-foreground rounded-full" />
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
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100">{session.notes}</p>
              )}
            </div>
            {session.rating && (
              <div className="flex gap-0.5 pt-1">
                 <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                   {session.rating}<Star size={8} className="fill-amber-500" />
                 </span>
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
         <h3 className="font-semibold text-sm">Daily Activity</h3>
         <BarChart3 size={14} className="text-muted-foreground" />
      </div>
      <div className="h-40 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="dayName" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              dy={5}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}m`}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.3 }} />
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
         <h3 className="font-semibold text-sm">Area Distribution</h3>
         <Layers size={14} className="text-muted-foreground" />
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              // label={({ name }) => name}
              // labelLine={false}
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
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2 w-full">
         {data.slice(0, 4).map((d, i) => (
             <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
             </div>
         ))}
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-sm">Complexity</h3>
         <Zap size={14} className="text-muted-foreground" />
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border)" opacity={0.5} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar
              name="Sessions"
              dataKey="value"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-sm">Quality</h3>
         <Star size={14} className="text-muted-foreground" />
      </div>
      
      <div className="flex items-end gap-3 mb-6">
        <span className="text-3xl font-bold tracking-tight text-foreground">{avgRating.toFixed(1)}</span>
        <div className="flex flex-col mb-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                key={i} 
                size={12} 
                className={cn(
                    i < Math.round(avgRating) 
                    ? 'text-amber-500 fill-amber-500' 
                    : 'text-border fill-border'
                )} 
                />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">Average rating</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-[10px] font-medium w-3">{rating}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-4 text-right">{count}</span>
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
    <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-sm">Top Skills</h3>
         <Lightbulb size={14} className="text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {mediums.slice(0, 5).map((medium, i) => (
          <div 
            key={medium._id} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors border border-transparent hover:border-border/50"
          >
            <div 
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ 
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '20',
                color: CHART_COLORS[i % CHART_COLORS.length]
              }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs truncate">{medium.name}</p>
              <p className="text-[10px] text-muted-foreground">{medium.sessions} sessions</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-medium">
                {Math.floor(medium.minutes / 60)}h {medium.minutes % 60}m
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LearningReportClient() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(searchParams.get('period') || 'last7Days');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [skillId, setSkillId] = useState(searchParams.get('skillId') || '');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getLearningReport(period, skillId || undefined, categoryId || undefined);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch learning report:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [period, skillId, categoryId]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleAreaChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    setSkillId(''); // Reset skill when category changes
  };

  const handleSkillChange = (newSkillId: string) => {
    setSkillId(newSkillId);
  };

  const clearFilters = () => {
    setCategoryId('');
    setSkillId('');
  };

  const { summary, byArea, bySkill, difficultyDist, ratingDist, topMediums, dailyLearning, weeklyTrend, recentSessions, filters } = data || {};

  // Filter skills by selected category
  const filteredSkills = useMemo(() => {
    if (!bySkill) return [];
    if (!categoryId) return bySkill;
    return bySkill.filter((s: any) => s.categoryId === categoryId);
  }, [bySkill, categoryId]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const hasActiveFilters = categoryId || skillId;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        <div className="flex justify-between items-center">
           <div className="w-32 h-8 bg-muted rounded-lg" />
           <div className="w-24 h-8 bg-muted rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-4">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Link
                href="/reports"
                className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Learning</h1>
            </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No learning data available for this period.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Link
                href="/reports"
                className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Learning</h1>
            </div>

            <div className="relative group">
                <select 
                    value={period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-sm font-medium hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors outline-none"
                >
                    {PERIODS.map(p => (
                    <option key={p.value} value={p.value} className="text-foreground bg-popover">{p.label}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
        </div>

        {/* Filters */}
        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            
            <FilterDropdown
              label="Area"
              value={categoryId}
              options={filters.areas || []}
              onChange={handleAreaChange}
            />
            
            <FilterDropdown
              label="Skill"
              value={skillId}
              options={categoryId 
                ? (filters.skills || []).filter((s: any) => s.areaId === categoryId)
                : (filters.skills || [])
              }
              onChange={handleSkillChange}
            />
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-rose-500/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors ml-auto"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Total Time</div>
          <div className="text-2xl font-bold">{formatTime(summary?.totalMinutes || 0).split(' ')[0]}<span className="text-sm font-normal text-muted-foreground ml-0.5">{formatTime(summary?.totalMinutes || 0).split(' ')[1]}</span></div>
          {summary?.minutesChange !== 0 && (
            <div className={cn(
              'text-[10px] flex items-center gap-1 mt-1 font-medium',
              summary?.minutesChange > 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {summary?.minutesChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {summary?.minutesChange > 0 ? '+' : ''}{formatTime(Math.abs(summary?.minutesChange || 0))}
            </div>
          )}
        </div>
        
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Sessions</div>
          <div className="text-2xl font-bold">{summary?.totalSessions || 0}</div>
          {summary?.prevSessions !== summary?.totalSessions && (
            <div className={cn(
              'text-[10px] flex items-center gap-1 mt-1 font-medium',
              (summary?.totalSessions || 0) > (summary?.prevSessions || 0) ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {(summary?.totalSessions || 0) > (summary?.prevSessions || 0) ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {(summary?.totalSessions || 0) - (summary?.prevSessions || 0) > 0 ? '+' : ''}
              {(summary?.totalSessions || 0) - (summary?.prevSessions || 0)}
            </div>
          )}
        </div>
        
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Average</div>
          <div className="text-2xl font-bold">{summary?.avgSessionLength || 0}<span className="text-sm font-normal text-muted-foreground ml-0.5">min</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">Per session</div>
        </div>
        
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Hours</div>
          <div className="text-2xl font-bold">{summary?.totalHours || 0}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Total accumulated</div>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyLearning && dailyLearning.length > 0 && (
        <DailyLearningChart data={dailyLearning} />
      )}
      
       {/* Weekly Trend Chart */}
      {weeklyTrend && weeklyTrend.length > 0 && (
        <WeeklyTrendChart data={weeklyTrend} />
      )}

      {/* Skills Grid - Main Focus */}
      {!skillId && filteredSkills && filteredSkills.length > 0 && (
        <SkillsGrid skills={filteredSkills} onSelectSkill={handleSkillChange} />
      )}

      {/* Selected Skill Detail View */}
      {skillId && filteredSkills && filteredSkills.length > 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            {(() => {
              const selectedSkill = filteredSkills.find((s: any) => s._id === skillId);
              return selectedSkill ? (
                <>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedSkill.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedSkill.categoryName}</p>
                  </div>
                  <button
                    onClick={() => handleSkillChange('')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear filter
                  </button>
                </>
              ) : null;
            })()}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(() => {
              const selectedSkill = filteredSkills.find((s: any) => s._id === skillId);
              return selectedSkill ? (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-500">{Math.floor(selectedSkill.minutes / 60)}h {selectedSkill.minutes % 60}m</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Total Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedSkill.sessions}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedSkill.avgSessionLength}m</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Avg Length</div>
                  </div>
                </>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Area Pie Chart & Top Mediums */}
      <div className="grid md:grid-cols-2 gap-4">
        {byArea && byArea.length > 0 && !skillId && <AreaPieChart areas={byArea} />}
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
