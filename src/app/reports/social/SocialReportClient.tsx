'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  MessageCircle,
  Phone,
  Video,
  Coffee,
  Heart,
  AlertTriangle,
  Smile,
  UserCheck,
  UserX,
  Filter,
  ChevronDown,
  X,
  Calendar,
  Star,
  Activity,
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
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: '3 Months' },
  { value: 'last6Months', label: '6 Months' },
];

const CONTEXT_ICONS: Record<string, any> = {
  call: Phone,
  chat: MessageCircle,
  meet: Coffee,
  video: Video,
  other: Heart,
};

const CONTEXT_COLORS: Record<string, string> = {
  call: '#3b82f6',
  chat: '#10b981',
  meet: '#f59e0b',
  video: '#8b5cf6',
  other: '#f43f5e',
};

interface SocialReportClientProps {
  initialData: any;
  initialPeriod: string;
  initialRelationId?: string;
  initialPersonId?: string;
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
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
            style={{ backgroundColor: selected.color || '#10b981' }}
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
          <div className="absolute top-full mt-1 left-0 z-50 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
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
                  style={{ backgroundColor: option.color || '#10b981' }}
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

// People Cards Grid
function PeopleGrid({ people, onSelectPerson }: { people: any[]; onSelectPerson: (id: string) => void }) {
  if (!people || people.length === 0) return null;
  
  const maxInteractions = Math.max(...people.map(p => p.interactions || 0), 1);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users size={18} className="text-emerald-500" />
        Connection Overview
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {people.map((person) => {
          const intensity = (person.interactions || 0) / maxInteractions;
          const avgScore = person.avgBehaviorScore || 0;
          
          return (
            <button
              key={person._id}
              onClick={() => onSelectPerson(person._id)}
              className="text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent hover:border-emerald-500/30 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: `${person.relationColor || '#10b981'}20`,
                    color: person.relationColor || '#10b981'
                  }}
                >
                  {person.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{person.relationName}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{person.interactions || 0} interactions</span>
                {avgScore > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={10} className={cn(
                      avgScore >= 4 ? 'text-emerald-500 fill-emerald-500' :
                      avgScore >= 3 ? 'text-amber-500 fill-amber-500' :
                      'text-rose-500 fill-rose-500'
                    )} />
                    <span>{avgScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              <div className="h-1 bg-background rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${intensity * 100}%`,
                    backgroundColor: person.relationColor || '#10b981'
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Daily Interactions Area Chart
function DailyInteractionsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Activity size={18} className="text-emerald-500" />
        Daily Interactions
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="interactionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="interactions"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#interactionsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Context Distribution Pie Chart
function ContextPieChart({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((acc, v) => acc + v, 0);
  if (total === 0) return null;
  
  const data = Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .map(([context, count]) => ({
      name: context.charAt(0).toUpperCase() + context.slice(1),
      value: count,
      color: CONTEXT_COLORS[context] || '#888',
    }));
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <MessageCircle size={18} className="text-emerald-500" />
        Interaction Types
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry) => {
          const Icon = CONTEXT_ICONS[entry.name.toLowerCase()] || Heart;
          return (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs">
              <Icon size={12} style={{ color: entry.color }} />
              <span>{entry.name}</span>
              <span className="font-bold">{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Emotional Tone Radar Chart
function EmotionalRadarChart({ distribution }: { distribution: Record<string, number> }) {
  const data = [
    { emotion: 'Happy', value: distribution['happy'] || 0 },
    { emotion: 'Excited', value: distribution['excited'] || 0 },
    { emotion: 'Calm', value: distribution['calm'] || 0 },
    { emotion: 'Neutral', value: distribution['neutral'] || 0 },
    { emotion: 'Sad', value: distribution['sad'] || 0 },
    { emotion: 'Tense', value: distribution['tense'] || 0 },
  ];
  
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Smile size={18} className="text-amber-500" />
        Emotional Tone
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis 
              dataKey="emotion" 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar
              name="Tone"
              dataKey="value"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.4}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Relation Breakdown Bar Chart
function RelationBarChart({ relations }: { relations: any[] }) {
  if (!relations || relations.length === 0) return null;
  
  const data = relations.map(r => ({
    name: r.name,
    interactions: r.interactions,
    color: r.color || '#10b981',
  }));
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users size={18} className="text-purple-500" />
        By Relationship Type
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="interactions" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Recent Interactions Log
function RecentInteractions({ interactions }: { interactions: any[] }) {
  if (!interactions || interactions.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-cyan-500" />
        Recent Interactions
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {interactions.map((interaction, i) => {
          const Icon = CONTEXT_ICONS[interaction.context] || Heart;
          return (
            <div 
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${CONTEXT_COLORS[interaction.context] || '#888'}20` }}
              >
                <Icon size={18} style={{ color: CONTEXT_COLORS[interaction.context] || '#888' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{interaction.personName}</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${interaction.relationColor || '#888'}20`,
                      color: interaction.relationColor || '#888'
                    }}
                  >
                    {interaction.relationName}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{interaction.date}</span>
                  <span>•</span>
                  <span className="capitalize">{interaction.context}</span>
                  {interaction.emotionalTone && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{interaction.emotionalTone}</span>
                    </>
                  )}
                </div>
                {interaction.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{interaction.notes}</p>
                )}
              </div>
              {interaction.behaviorScore && (
                <div className="flex items-center gap-1 text-xs">
                  <Star size={12} className={cn(
                    interaction.behaviorScore >= 4 ? 'text-emerald-500 fill-emerald-500' :
                    interaction.behaviorScore >= 3 ? 'text-amber-500 fill-amber-500' :
                    'text-rose-500 fill-rose-500'
                  )} />
                  <span>{interaction.behaviorScore}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Neglected People Alert
function NeglectedAlert({ people }: { people: any[] }) {
  if (!people || people.length === 0) return null;
  
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
        <UserX size={18} />
        Need Your Attention ({people.length})
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        These people haven&apos;t been contacted this period
      </p>
      <div className="flex flex-wrap gap-2">
        {people.slice(0, 10).map((person) => (
          <div 
            key={person._id} 
            className="px-3 py-1.5 rounded-full bg-background text-sm flex items-center gap-2"
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: person.relationColor || '#888' }}
            />
            {person.name}
          </div>
        ))}
        {people.length > 10 && (
          <span className="px-3 py-1.5 text-sm text-amber-600">+{people.length - 10} more</span>
        )}
      </div>
    </div>
  );
}

export default function SocialReportClient({ 
  initialData, 
  initialPeriod,
  initialRelationId,
  initialPersonId
}: SocialReportClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [relationId, setRelationId] = useState(initialRelationId || '');
  const [personId, setPersonId] = useState(initialPersonId || '');
  const [data] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const buildUrl = (newPeriod?: string, newRelationId?: string, newPersonId?: string) => {
    const params = new URLSearchParams();
    params.set('period', newPeriod ?? period);
    if (newRelationId !== undefined ? newRelationId : relationId) params.set('relationId', newRelationId !== undefined ? newRelationId : relationId);
    if (newPersonId !== undefined ? newPersonId : personId) params.set('personId', newPersonId !== undefined ? newPersonId : personId);
    return `/reports/social?${params.toString()}`;
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(buildUrl(newPeriod));
    });
  };

  const handleRelationChange = (newRelationId: string) => {
    setRelationId(newRelationId);
    setPersonId('');
    startTransition(() => {
      router.push(buildUrl(undefined, newRelationId, ''));
    });
  };

  const handlePersonChange = (newPersonId: string) => {
    setPersonId(newPersonId);
    startTransition(() => {
      router.push(buildUrl(undefined, undefined, newPersonId));
    });
  };

  const clearFilters = () => {
    setRelationId('');
    setPersonId('');
    startTransition(() => {
      router.push(`/reports/social?period=${period}`);
    });
  };

  const { 
    summary, 
    byRelation, 
    contextDist, 
    emotionalDist, 
    behaviorDist, 
    neglectedPeople, 
    dailyInteractions,
    filters,
    peopleWithStats,
    avgBehaviorScore,
    recentInteractions
  } = data;

  // Filter people by selected relation
  const filteredPeople = useMemo(() => {
    if (!peopleWithStats) return [];
    if (!relationId) return peopleWithStats;
    return peopleWithStats.filter((p: any) => p.relationId === relationId);
  }, [peopleWithStats, relationId]);

  const hasActiveFilters = relationId || personId;

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Social Report</h1>
            <p className="text-muted-foreground mt-1">
              Track your relationships and interactions
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
                  ? 'bg-emerald-500 text-white'
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
              label="Relation"
              value={relationId}
              options={filters.relations || []}
              onChange={handleRelationChange}
            />
            
            <FilterDropdown
              label="Person"
              value={personId}
              options={relationId 
                ? (filters.people || []).filter((p: any) => p.relationId === relationId)
                : (filters.people || [])
              }
              onChange={handlePersonChange}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={16} className="text-emerald-500" />
            <span className="text-sm text-muted-foreground">Interactions</span>
          </div>
          <p className="text-2xl font-bold">{summary?.totalInteractions || 0}</p>
          {(summary?.interactionsChange || 0) !== 0 && (
            <p className={cn(
              'text-xs flex items-center gap-1 mt-1',
              summary?.interactionsChange > 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {summary?.interactionsChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {summary?.interactionsChange > 0 ? '+' : ''}{summary?.interactionsChange}
            </p>
          )}
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={16} className="text-blue-500" />
            <span className="text-sm text-muted-foreground">Contacted</span>
          </div>
          <p className="text-2xl font-bold">{summary?.uniquePeopleContacted || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">of {summary?.totalPeople || 0} people</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-500" />
            <span className="text-sm text-muted-foreground">Coverage</span>
          </div>
          <p className="text-2xl font-bold">
            {(summary?.totalPeople || 0) > 0 
              ? Math.round(((summary?.uniquePeopleContacted || 0) / summary.totalPeople) * 100) 
              : 0}%
          </p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-amber-500" />
            <span className="text-sm text-muted-foreground">Behavior Score</span>
          </div>
          <p className="text-2xl font-bold">{(avgBehaviorScore || 0).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 5</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm text-muted-foreground">Neglected</span>
          </div>
          <p className="text-2xl font-bold">{summary?.neglectedCount || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">not contacted</p>
        </div>
      </div>

      {/* Neglected People Alert */}
      {neglectedPeople && neglectedPeople.length > 0 && !personId && (
        <NeglectedAlert people={neglectedPeople} />
      )}

      {/* Daily Interactions Chart */}
      {dailyInteractions && dailyInteractions.length > 0 && (
        <DailyInteractionsChart data={dailyInteractions} />
      )}

      {/* People Grid */}
      {!personId && filteredPeople && filteredPeople.length > 0 && (
        <PeopleGrid people={filteredPeople} onSelectPerson={handlePersonChange} />
      )}

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {contextDist && <ContextPieChart distribution={contextDist} />}
        {byRelation && byRelation.length > 0 && <RelationBarChart relations={byRelation} />}
      </div>

      {/* Emotional & Behavior */}
      <div className="grid md:grid-cols-2 gap-4">
        {emotionalDist && <EmotionalRadarChart distribution={emotionalDist} />}
        {behaviorDist && (
          <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-blue-500" />
              Your Behavior
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(behaviorDist).filter(([_, count]) => (count as number) > 0).slice(0, 6).map(([behavior, count]) => (
                <div key={behavior} className="text-center">
                  <p className="text-xl font-bold">{count as number}</p>
                  <p className="text-xs text-muted-foreground capitalize">{behavior}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Interactions */}
      {recentInteractions && recentInteractions.length > 0 && (
        <RecentInteractions interactions={recentInteractions} />
      )}
    </div>
  );
}
