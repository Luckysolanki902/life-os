'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BookMarked,
  FileText,
  Star,
  Library,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: 'last7Days', label: '7D' },
  { value: 'last14Days', label: '14D' },
  { value: 'thisMonth', label: 'Month' },
  { value: 'last3Months', label: '3M' },
  { value: 'thisYear', label: 'Year' },
  { value: 'allTime', label: 'All' },
];

interface BookData {
  _id: string;
  title: string;
  author: string;
  currentPage?: number;
  totalPages?: number;
  progress?: number;
  lastReadDate?: string;
  domain?: { name: string; color: string } | null;
  rating?: number;
  completedDate?: string;
}

interface DomainData {
  _id: string;
  name: string;
  color: string;
  totalBooks: number;
  reading: number;
  completed: number;
}

interface DayReading {
  date: string;
  dayName?: string;
  sessions: number;
  minutes: number;
  pagesRead?: number;
}

interface BooksReportData {
  summary: {
    booksCompleted: number;
    prevBooksCompleted: number;
    booksStarted: number;
    totalReadingSessions: number;
    totalReadingMinutes: number;
    totalPagesRead: number;
    currentlyReading: number;
  };
  booksCompleted: BookData[];
  byDomain: DomainData[];
  currentlyReadingWithProgress: BookData[];
  dailyReading: DayReading[];
}

interface BooksReportClientProps {
  initialData: BooksReportData;
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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
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
          {entry.name === 'minutes' ? ' min' : entry.name === 'sessions' ? ' sessions' : ''}
        </p>
      ))}
    </div>
  );
}

function BookProgressCard({ book }: { book: BookData }) {
  // Calculate days ago using dayjs for consistency
  const daysAgo = book.lastReadDate 
    ? Math.floor((new Date().getTime() - new Date(book.lastReadDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div 
        className="w-10 h-14 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: book.domain?.color + '20' || 'var(--secondary)' }}
      >
        <BookOpen size={18} style={{ color: book.domain?.color || 'var(--foreground)' }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{book.title}</p>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-cyan-500">{book.progress}%</span>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-xs font-medium">{book.currentPage}/{book.totalPages}</p>
        {daysAgo !== null && (
          <p className={cn(
            'text-[10px]',
            daysAgo <= 1 ? 'text-emerald-500' : daysAgo <= 3 ? 'text-amber-500' : 'text-muted-foreground'
          )}>
            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BooksReportClient({ initialData, initialPeriod }: BooksReportClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(`/reports/books?period=${newPeriod}`);
    });
  };

  const { summary, booksCompleted, byDomain, currentlyReadingWithProgress, dailyReading } = data;

  // Chart data
  const chartData = dailyReading?.map((day) => ({
    date: day.dayName?.slice(0, 2) || new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
    sessions: day.sessions,
    minutes: day.minutes,
    pages: day.pagesRead || 0,
  })) || [];

  return (
    <div className={cn('space-y-6 pb-24', isPending && 'opacity-50 pointer-events-none')}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/reports?period=${period}`}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Books Report</h1>
            <p className="text-sm text-muted-foreground">Reading habits & progress</p>
          </div>
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
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <BookMarked size={14} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{summary.booksCompleted}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
          {summary.prevBooksCompleted !== summary.booksCompleted && (
            <TrendBadge value={summary.booksCompleted - summary.prevBooksCompleted} />
          )}
        </div>
        
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <BookOpen size={14} className="text-cyan-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{summary.totalReadingSessions}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </div>
        
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <FileText size={14} className="text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{summary.totalPagesRead || 0}</p>
          <p className="text-xs text-muted-foreground">Pages Read</p>
        </div>
        
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Clock size={14} className="text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{Math.round((summary.totalReadingMinutes || 0) / 60 * 10) / 10}h</p>
          <p className="text-xs text-muted-foreground">Reading Time</p>
        </div>
      </div>

      {/* Reading Activity Chart */}
      {chartData.length > 0 && chartData.some((d) => d.sessions > 0) && (
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-cyan-500" />
            Reading Activity
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
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
                  dataKey="minutes" 
                  name="minutes"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Currently Reading */}
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-cyan-500" />
            Currently Reading
          </h3>
          <div className="space-y-2">
            {currentlyReadingWithProgress && currentlyReadingWithProgress.length > 0 ? (
              currentlyReadingWithProgress.map((book) => (
                <BookProgressCard key={book._id} book={book} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No books being read</p>
            )}
          </div>
        </div>

        {/* By Domain */}
        {byDomain && byDomain.length > 0 && (
          <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Library size={14} className="text-purple-500" />
              By Domain
            </h3>
            <div className="space-y-3">
              {byDomain.map((domain) => (
                <div key={domain._id} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: domain.color + '20' }}
                  >
                    <Library size={14} style={{ color: domain.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{domain.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {domain.reading} reading • {domain.completed} done
                    </p>
                  </div>
                  <p className="text-sm font-bold">{domain.totalBooks}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Completed Books */}
      {booksCompleted && booksCompleted.length > 0 && (
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookMarked size={14} className="text-emerald-500" />
            Completed This Period
          </h3>
          <div className="space-y-2">
            {booksCompleted.map((book) => (
              <div key={book._id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <BookOpen size={14} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                </div>
                {book.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{book.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
