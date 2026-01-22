'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BookMarked,
  FileText,
  Star,
  Library,
  Target,
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

interface BooksReportClientProps {
  initialData: any;
  initialPeriod: string;
}

function ReadingChart({ data }: { data: any[] }) {
  const maxPages = Math.max(...data.map(d => d.pagesRead || 0), 1);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-semibold mb-4">Daily Pages Read</h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div 
              className="w-full bg-secondary rounded-t relative cursor-pointer"
              style={{ height: `${Math.max(((day.pagesRead || 0) / maxPages) * 100, 2)}%` }}
            >
              <div className={cn(
                'absolute inset-0 rounded-t transition-colors',
                (day.pagesRead || 0) > 0 ? 'bg-cyan-500' : 'bg-muted'
              )} />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                <p className="font-medium">{day.pagesRead || 0} pages</p>
                <p className="text-muted-foreground">{day.sessions} sessions</p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{day.dayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookProgressCard({ book }: { book: any }) {
  const daysAgo = book.lastReadDate 
    ? Math.floor((Date.now() - new Date(book.lastReadDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
      <div 
        className="w-10 h-14 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: book.domain?.color + '20' || 'var(--secondary)' }}
      >
        <BookOpen size={18} style={{ color: book.domain?.color || 'var(--foreground)' }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{book.title}</p>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        
        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-cyan-500"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium">{book.progress}%</span>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium">{book.currentPage}/{book.totalPages}</p>
        {daysAgo !== null && (
          <p className={cn(
            'text-xs',
            daysAgo <= 1 ? 'text-emerald-500' : daysAgo <= 3 ? 'text-amber-500' : 'text-muted-foreground'
          )}>
            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
          </p>
        )}
      </div>
    </div>
  );
}

function DomainBreakdown({ domains }: { domains: any[] }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4">By Domain</h3>
      <div className="space-y-3">
        {domains.map((domain) => (
          <div key={domain._id} className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: domain.color + '20' }}
            >
              <Library size={14} style={{ color: domain.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{domain.name}</p>
              <p className="text-xs text-muted-foreground">
                {domain.reading} reading • {domain.completed} completed • {domain.paused} paused
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{domain.totalBooks}</p>
              <p className="text-xs text-muted-foreground">books</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompletedBooks({ books }: { books: any[] }) {
  if (books.length === 0) return null;
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <BookMarked size={18} className="text-emerald-500" />
        Completed This Period
      </h3>
      <div className="space-y-3">
        {books.map((book) => (
          <div key={book._id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <BookOpen size={16} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{book.title}</p>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </div>
            {book.rating && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">{book.rating}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BooksReportClient({ initialData, initialPeriod }: BooksReportClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startTransition(() => {
      router.push(`/reports/books?period=${newPeriod}`);
    });
  };

  const { summary, booksCompleted, byDomain, currentlyReadingWithProgress, dailyReading } = data;

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Books Report</h1>
            <p className="text-muted-foreground mt-1">
              Track your reading habits and progress
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {PERIODS.slice(0, 6).map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                period === p.value
                  ? 'bg-cyan-500 text-white'
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
              PERIODS.slice(6).some(p => p.value === period) && 'bg-cyan-500 text-white'
            )}
          >
            <option value="">More...</option>
            {PERIODS.slice(6).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked size={16} className="text-emerald-500" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold">{summary.booksCompleted}</p>
          {summary.prevBooksCompleted !== summary.booksCompleted && (
            <p className={cn(
              'text-xs flex items-center gap-1 mt-1',
              summary.booksCompleted > summary.prevBooksCompleted ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {summary.booksCompleted > summary.prevBooksCompleted ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {summary.booksCompleted - summary.prevBooksCompleted > 0 ? '+' : ''}
              {summary.booksCompleted - summary.prevBooksCompleted} vs prev
            </p>
          )}
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-cyan-500" />
            <span className="text-sm text-muted-foreground">Reading Sessions</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalReadingSessions}</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-amber-500" />
            <span className="text-sm text-muted-foreground">Pages Read</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalPagesRead || 0}</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-purple-500" />
            <span className="text-sm text-muted-foreground">Currently Reading</span>
          </div>
          <p className="text-2xl font-bold">{summary.currentlyReading}</p>
        </div>
      </div>

      {/* Reading Chart */}
      {dailyReading && dailyReading.length > 0 && (
        <ReadingChart data={dailyReading} />
      )}

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Currently Reading */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-cyan-500" />
            Currently Reading
          </h3>
          <div className="space-y-3">
            {currentlyReadingWithProgress && currentlyReadingWithProgress.length > 0 ? (
              currentlyReadingWithProgress.map((book: any) => (
                <BookProgressCard key={book._id} book={book} />
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No books currently being read</p>
            )}
          </div>
        </div>

        {/* Domain Breakdown */}
        {byDomain && byDomain.length > 0 && (
          <DomainBreakdown domains={byDomain} />
        )}
      </div>

      {/* Completed Books */}
      {booksCompleted && booksCompleted.length > 0 && (
        <CompletedBooks books={booksCompleted} />
      )}
    </div>
  );
}
