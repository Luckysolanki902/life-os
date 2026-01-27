'use client';

import { useState, useEffect } from 'react';
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
  Clock,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBooksReport } from '../../actions/reports';

const PERIODS = [
  { value: 'last7Days', label: '7 Days' },
  { value: 'last14Days', label: '14 Days' },
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

function TrendBadge({ value }: { value: number }) {
  if (!value) return null;
  const isPositive = value > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-sm',
      isPositive 
        ? 'text-emerald-500 bg-emerald-500/5' 
        : 'text-rose-500 bg-rose-500/5'
    )}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(value)}
    </span>
  );
}

function MinimalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border text-popover-foreground rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
           <span className="text-muted-foreground capitalize">{entry.name}:</span>
           <span className="font-mono">{entry.value}</span>
        </div>
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
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:bg-secondary/20 transition-colors">
      <div className="w-10 h-14 rounded-md border border-border bg-secondary/50 flex items-center justify-center shrink-0 text-muted-foreground shadow-sm">
        <BookOpen size={16} />
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div>
           <p className="font-medium text-sm truncate leading-none">{book.title}</p>
           <p className="text-[11px] text-muted-foreground mt-1 truncate">{book.author}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500"
              style={{ width: `${book.progress || 0}%` }}
            />
          </div>
          <span className="text-[10px] font-medium tabular-nums">{book.progress}%</span>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-[10px] font-medium text-muted-foreground">{book.currentPage}/{book.totalPages} p</p>
        {daysAgo !== null && (
          <p className={cn(
            'text-[10px] mt-0.5',
            daysAgo <= 1 ? 'text-emerald-500' : 'text-muted-foreground/60'
          )}>
            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BooksReportClient() {
  const [period, setPeriod] = useState('last7Days');
  const [data, setData] = useState<BooksReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getBooksReport(period);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch books report:', error);
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
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-full bg-muted" />
           <div className="h-6 w-32 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="h-24 bg-muted rounded-xl" />
           <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-48 bg-muted rounded-xl" />
       </div>
    );
  }

  const { summary, booksCompleted, byDomain, currentlyReadingWithProgress, dailyReading } = data;

  // Chart data
  const chartData = dailyReading?.map((day) => ({
    date: day.dayName?.slice(0, 3) || new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sessions: day.sessions,
    minutes: day.minutes,
  })) || [];

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Books</h1>
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

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
           <div className="flex justify-between items-start mb-2">
             <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Completed</span>
             {summary.prevBooksCompleted !== summary.booksCompleted && (
              <TrendBadge value={summary.booksCompleted - summary.prevBooksCompleted} />
             )}
           </div>
           <div className="text-2xl font-bold">{summary.booksCompleted}</div>
           <div className="text-[10px] text-muted-foreground mt-1">
             {summary.booksCompleted === 1 ? 'Book' : 'Books'} finished
           </div>
         </div>

         <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
           <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Reading Time</div>
           <div className="text-2xl font-bold">{Math.round((summary.totalReadingMinutes || 0) / 60 * 10) / 10}<span className="text-sm font-normal text-muted-foreground ml-0.5">h</span></div>
            <div className="text-[10px] text-muted-foreground mt-1">
             {summary.totalReadingSessions} sessions
           </div>
         </div>
         
         <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
           <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Pages</div>
           <div className="text-2xl font-bold">{summary.totalPagesRead || 0}</div>
           <div className="text-[10px] text-muted-foreground mt-1">Total pages read</div>
         </div>
         
         <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
           <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Started</div>
           <div className="text-2xl font-bold">{summary.booksStarted}</div>
           <div className="text-[10px] text-muted-foreground mt-1">New books</div>
         </div>
      </div>

      {/* Reading Activity Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
          <div className="mb-6">
            <h3 className="font-semibold text-sm">Activity</h3>
            <p className="text-xs text-muted-foreground">Minutes read per day</p>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.5 }} />
                <Bar 
                  dataKey="minutes" 
                  name="Reading"
                  fill="var(--foreground)" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  opacity={0.8}
                  activeBar={{ opacity: 1 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Currently Reading */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">In Progress</h2>
        <div className="space-y-3">
          {currentlyReadingWithProgress && currentlyReadingWithProgress.length > 0 ? (
            currentlyReadingWithProgress.map((book) => (
              <BookProgressCard key={book._id} book={book} />
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
               <p className="text-sm text-muted-foreground">No books currently in progress</p>
            </div>
          )}
        </div>
      </div>

      {/* By Domain */}
      {byDomain && byDomain.length > 0 && (
        <div>
           <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">By Topic</h2>
           <div className="grid grid-cols-1 gap-2">
              {byDomain.map((domain) => (
                <div key={domain._id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-8 rounded-full" style={{ backgroundColor: domain.color }} />
                     <span className="font-medium text-sm">{domain.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                     <span className="text-muted-foreground">{domain.reading} active</span>
                     <span className="font-semibold">{domain.totalBooks} total</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Completed Books List */}
      {booksCompleted && booksCompleted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Completed</h2>
          <div className="space-y-2">
            {booksCompleted.map((book) => (
              <div key={book._id} className="flex items-center justify-between p-3 border border-border/30 rounded-xl hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <BookMarked size={14} className="text-emerald-500" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                   </div>
                </div>
                {book.rating && (
                   <div className="shrink-0 px-2 py-0.5 rounded bg-secondary text-xs font-medium">
                      {book.rating}/5
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
