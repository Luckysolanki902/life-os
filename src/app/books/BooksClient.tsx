'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Clock, ChevronRight, ChevronDown, 
  MoreVertical, Edit2, Trash2, X, Search, Check, Circle,
  Pause, CheckCircle2, XCircle, Calendar, Star
} from 'lucide-react';
import { 
  createBookDomain, updateBookDomain, deleteBookDomain,
  createBook, updateBook, deleteBook,
  checkInBook, searchBooks
} from '@/app/actions/books';
import TaskItem from '@/app/routine/TaskItem';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getLocalDateString, parseServerDate, dayjs } from '@/lib/date-utils';

interface BooksClientProps {
  initialData: any;
}

const DOMAIN_COLORS = [
  { name: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', accent: 'bg-purple-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  { name: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500' },
  { name: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
  { name: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500' },
  { name: 'indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', accent: 'bg-indigo-500' },
];

const STATUS_OPTIONS = [
  { value: 'reading', label: 'Reading', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { value: 'paused', label: 'Paused', icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/20' },
];

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return 'Never';
  const date = dayjs(dateStr).tz('Asia/Kolkata');
  const now = dayjs().tz('Asia/Kolkata');
  const diffDays = now.startOf('day').diff(date.startOf('day'), 'day');
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.format('D MMM');
}

function getColorClasses(colorName: string) {
  return DOMAIN_COLORS.find(c => c.name === colorName) || DOMAIN_COLORS[0];
}

export default function BooksClient({ initialData }: BooksClientProps) {
  const router = useRouter();
  const { domains, books, scheduledBooks, recentBooks, routine, stats, pagination } = initialData;
  
  // UI States
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modal States
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Form States
  const [newDomain, setNewDomain] = useState({ name: '', description: '', color: 'blue', icon: '📚' });
  const [newBook, setNewBook] = useState({ 
    domainId: '', 
    title: '', 
    author: '',
    totalPages: 0,
    startDate: getLocalDateString(),
    notes: ''
  });
  const [editingBook, setEditingBook] = useState<any>(null);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ type: string; id: string } | null>(null);
  const [viewingBook, setViewingBook] = useState<any | null>(null);

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await searchBooks(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle functions
  function toggleDomain(domainId: string) {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }

  // Handlers
  async function handleCreateDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.name.trim()) return;
    await createBookDomain(newDomain);
    setNewDomain({ name: '', description: '', color: 'blue', icon: '📚' });
    setIsDomainModalOpen(false);
    router.refresh();
  }

  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.domainId) return;
    await createBook(newBook);
    setNewBook({ 
      domainId: '', 
      title: '', 
      author: '',
      totalPages: 0,
      startDate: getLocalDateString(),
      notes: ''
    });
    setIsBookModalOpen(false);
    router.refresh();
  }

  async function handleUpdateBook(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBook) return;
    await updateBook(editingBook._id, editingBook);
    setEditingBook(null);
    setIsEditBookModalOpen(false);
    router.refresh();
  }

  // async function handleToggleSchedule(bookId: string) {
  //   await toggleBookSchedule(bookId);
  //   router.refresh();
  // }

  async function handleCheckIn(bookId: string) {
    await checkInBook(bookId);
    router.refresh();
  }

  async function handleDelete(type: string, id: string) {
    const confirmText = type === 'domain' 
      ? 'This will delete all books in this domain.' 
      : 'Delete this book?';
    
    if (!confirm(`Are you sure? ${confirmText}`)) return;
    
    if (type === 'domain') await deleteBookDomain(id);
    else await deleteBook(id);
    
    setContextMenu(null);
    router.refresh();
  }

  // Get books grouped by domain
  const booksByDomain: Record<string, any[]> = {};
  books.forEach((book: any) => {
    if (!booksByDomain[book.domainId]) {
      booksByDomain[book.domainId] = [];
    }
    booksByDomain[book.domainId].push(book);
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <BookOpen className="text-amber-500 shrink-0" size={24} />
              Books
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Track your reading journey</p>
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-2.5 sm:px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:opacity-80"
            >
              <Calendar size={14} />
              <span className="hidden sm:inline">Schedule</span>
            </button>
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-2.5 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:opacity-90 shadow-lg shadow-primary/20"
            >
              <Plus size={14} />
              <span className="hidden xs:inline">Add</span> Book
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="p-2.5 sm:p-4 rounded-xl bg-card border border-border/50">
          <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-lg sm:text-2xl font-bold">{stats.totalBooks}</p>
        </div>
        <div className="p-2.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-wider">Reading</p>
          <p className="text-lg sm:text-2xl font-bold text-emerald-400">{stats.reading}</p>
        </div>
        <div className="p-2.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-[9px] sm:text-[10px] text-amber-400 uppercase tracking-wider">Paused</p>
          <p className="text-lg sm:text-2xl font-bold text-amber-400">{stats.paused}</p>
        </div>
        <div className="p-2.5 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <p className="text-[9px] sm:text-[10px] text-blue-400 uppercase tracking-wider">Done</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-400">{stats.completed}</p>
        </div>
      </div>

      {/* Today's Reading Tasks */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s Reading</h2>
        <div className="space-y-2">
          {routine.length > 0 ? (
            routine.map((task: any) => (
              <TaskItem key={task._id} task={task} />
            ))
          ) : (
            <div className="p-5 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
              No reading habits scheduled for today.
            </div>
          )}
        </div>
      </section>

      {/* Scheduled for Tomorrow */}
      {scheduledBooks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar size={14} />
            Scheduled for Tomorrow
          </h2>
          <div className="space-y-2">
            {scheduledBooks.map((book: any) => {
              const colorClasses = book.domain ? getColorClasses(book.domain.color) : DOMAIN_COLORS[0];
              const statusInfo = STATUS_OPTIONS.find(s => s.value === book.status);
              
              return (
                <div 
                  key={book._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCheckIn(book._id)}
                      className="p-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Check size={14} className="text-emerald-400" />
                    </button>
                    <div className={cn("w-1 h-8 rounded-full", colorClasses.accent)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{book.title}</span>
                        {book.author && <span className="text-xs text-muted-foreground">by {book.author}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {book.domain?.name} • Last read {formatRelativeDate(book.lastReadDate)}
                      </p>
                    </div>
                  </div>
                  <button
                    // onClick={() => handleToggleSchedule(book._id)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search & Quick Add */}
      <section className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books or add to tomorrow..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          
          {/* Search Results Dropdown */}
          {(searchQuery.length >= 2 || searchResults.length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-75 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No books found. <button onClick={() => setIsBookModalOpen(true)} className="text-primary hover:underline">Add new book?</button>
                </div>
              ) : (
                searchResults.map((book: any) => {
                  const colorClasses = book.domain ? getColorClasses(book.domain.color) : DOMAIN_COLORS[0];
                  
                  return (
                    <div 
                      key={book._id}
                      className="flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1 h-8 rounded-full", colorClasses.accent)} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{book.title}</span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded",
                              STATUS_OPTIONS.find(s => s.value === book.status)?.bg,
                              STATUS_OPTIONS.find(s => s.value === book.status)?.color
                            )}>
                              {book.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {book.author && `${book.author} • `}{book.domain?.name}
                          </p>
                        </div>
                      </div>
                      <button
                        // onClick={() => handleToggleSchedule(book._id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          book.scheduledForTomorrow 
                            ? "bg-primary/20 text-primary" 
                            : "hover:bg-secondary text-muted-foreground"
                        )}
                        title={book.scheduledForTomorrow ? "Remove from tomorrow" : "Add to tomorrow"}
                      >
                        {book.scheduledForTomorrow ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* Domains & Books */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Library</h2>
          <button
            onClick={() => setIsDomainModalOpen(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Add Domain
          </button>
        </div>
        
        {domains.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center">
            <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No book domains yet</p>
            <button
              onClick={() => setIsDomainModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
            >
              Create Your First Domain
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain: any) => {
              const colorClasses = getColorClasses(domain.color);
              const isExpanded = expandedDomains.has(domain._id);
              const domainBooks = booksByDomain[domain._id] || [];
              
              return (
                <div key={domain._id} className={cn(
                  "rounded-2xl border overflow-hidden transition-all",
                  colorClasses.border,
                  colorClasses.bg
                )}>
                  {/* Domain Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleDomain(domain._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl text-xl", colorClasses.accent, "bg-opacity-20")}>
                        {domain.icon || '📚'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">{domain.name}</h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                          <span>{domain.bookCount} books</span>
                          <span>•</span>
                          <span className="text-emerald-400">{domain.readingCount} reading</span>
                          <span>•</span>
                          <span className="text-blue-400">{domain.completedCount} done</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(contextMenu?.id === domain._id ? null : { type: 'domain', id: domain._id });
                          }}
                          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {contextMenu?.type === 'domain' && contextMenu.id === domain._id && (
                          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-10 min-w-35 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewBook({ ...newBook, domainId: domain._id });
                                setIsBookModalOpen(true);
                                setContextMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Plus size={14} /> Add Book
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('domain', domain._id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-rose-400"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>
                  
                  {/* Books List */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {domainBooks.length === 0 ? (
                        <button
                          onClick={() => {
                            setNewBook({ ...newBook, domainId: domain._id });
                            setIsBookModalOpen(true);
                          }}
                          className="w-full p-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Add a book
                        </button>
                      ) : (
                        domainBooks.map((book: any) => {
                          const statusInfo = STATUS_OPTIONS.find(s => s.value === book.status);
                          const StatusIcon = statusInfo?.icon || BookOpen;
                          
                          return (
                            <div 
                              key={book._id}
                              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-card/50 border border-border/30 group gap-2"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <button
                                  // onClick={() => handleToggleSchedule(book._id)}
                                  className={cn(
                                    "p-1 sm:p-1.5 rounded-full transition-colors shrink-0",
                                    book.scheduledForTomorrow 
                                      ? "bg-primary/20 text-primary" 
                                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {book.scheduledForTomorrow ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span className="font-medium text-xs sm:text-sm truncate">{book.title}</span>
                                    <span className={cn(
                                      "px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium shrink-0",
                                      statusInfo?.bg,
                                      statusInfo?.color
                                    )}>
                                      <StatusIcon size={8} className="inline mr-0.5" />
                                      {statusInfo?.label}
                                    </span>
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    {book.author && <span className="truncate">{book.author}</span>}
                                    {book.lastReadDate && (
                                      <>
                                        <span>•</span>
                                        <span>{formatRelativeDate(book.lastReadDate)}</span>
                                      </>
                                    )}
                                    {book.totalPages > 0 && book.currentPage > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{Math.round((book.currentPage / book.totalPages) * 100)}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                {book.status !== 'reading' && (
                                  <button
                                    onClick={() => handleCheckIn(book._id)}
                                    className="p-1.5 sm:p-1.5 rounded hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400"
                                    title="Resume reading"
                                  >
                                    <BookOpen size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingBook({ ...book });
                                    setIsEditBookModalOpen(true);
                                  }}
                                  className="p-1.5 sm:p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDelete('book', book._id)}
                                  className="p-1.5 sm:p-1.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentBooks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock size={14} />
            Recently Read
          </h2>
          <div className="space-y-2">
            {recentBooks.map((book: any) => {
              const colorClasses = book.domain ? getColorClasses(book.domain.color) : DOMAIN_COLORS[0];
              
              return (
                <div 
                  key={book._id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-card border border-border/50 gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={cn("w-1 h-8 rounded-full shrink-0", colorClasses.accent)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-medium text-xs sm:text-sm truncate">{book.title}</span>
                        <span className={cn(
                          "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded shrink-0",
                          STATUS_OPTIONS.find(s => s.value === book.status)?.bg,
                          STATUS_OPTIONS.find(s => s.value === book.status)?.color
                        )}>
                          {book.status}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {book.domain?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{formatRelativeDate(book.lastReadDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modals */}
      {/* Create Domain Modal */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Book Domain</h3>
              <button onClick={() => setIsDomainModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDomain} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Domain Name</label>
                <input
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                  placeholder="e.g., Psychology, Self-Help, Business"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Description (optional)</label>
                <input
                  value={newDomain.description}
                  onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon (emoji)</label>
                <input
                  value={newDomain.icon}
                  onChange={(e) => setNewDomain({ ...newDomain, icon: e.target.value })}
                  placeholder="📚"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Color</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {DOMAIN_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewDomain({ ...newDomain, color: color.name })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.accent,
                        newDomain.color === color.name ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDomainModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Book</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Domain</label>
                <select
                  value={newBook.domainId}
                  onChange={(e) => setNewBook({ ...newBook, domainId: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select domain...</option>
                  {domains.map((domain: any) => (
                    <option key={domain._id} value={domain._id}>{domain.icon} {domain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Book title"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Author</label>
                <input
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Author name"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground ml-1">Total Pages</label>
                  <input
                    type="number"
                    value={newBook.totalPages || ''}
                    onChange={(e) => setNewBook({ ...newBook, totalPages: Number(e.target.value) })}
                    placeholder="0"
                    min={0}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground ml-1">Start Date</label>
                  <input
                    type="date"
                    value={newBook.startDate}
                    onChange={(e) => setNewBook({ ...newBook, startDate: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Notes (optional)</label>
                <textarea
                  value={newBook.notes}
                  onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
                  placeholder="Why you want to read this..."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBook.domainId || !newBook.title}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {isEditBookModalOpen && editingBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Book</h3>
              <button onClick={() => setIsEditBookModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
                <input
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Author</label>
                <input
                  value={editingBook.author || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Status</label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mt-1">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditingBook({ ...editingBook, status: opt.value })}
                        className={cn(
                          "px-2.5 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5",
                          editingBook.status === opt.value 
                            ? `${opt.color} ${opt.bg} ring-1 ring-current` 
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon size={12} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground ml-1">Total Pages</label>
                  <input
                    type="number"
                    value={editingBook.totalPages || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, totalPages: Number(e.target.value) })}
                    min={0}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground ml-1">Current Page</label>
                  <input
                    type="number"
                    value={editingBook.currentPage || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, currentPage: Number(e.target.value) })}
                    min={0}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Start Date</label>
                <input
                  type="date"
                  value={editingBook.startDate ? new Date(editingBook.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingBook({ ...editingBook, startDate: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
                />
              </div>
              {editingBook.status === 'completed' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground ml-1">Completed Date</label>
                    <input
                      type="date"
                      value={editingBook.completedDate ? new Date(editingBook.completedDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingBook({ ...editingBook, completedDate: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground ml-1">Rating</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditingBook({ ...editingBook, rating: star })}
                          className={cn(
                            "p-1",
                            (editingBook.rating || 0) >= star ? "text-amber-400" : "text-muted-foreground"
                          )}
                        >
                          <Star size={20} fill={(editingBook.rating || 0) >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Notes</label>
                <textarea
                  value={editingBook.notes || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditBookModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal - Quick add books for tomorrow */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg p-6 rounded-3xl shadow-xl animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Schedule Tomorrow&apos;s Reading</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Select books you plan to read tomorrow. They&apos;ll appear at the top of your dashboard.
            </p>
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {books.filter((b: any) => b.status === 'reading' || b.status === 'paused').map((book: any) => {
                const colorClasses = book.domain ? getColorClasses(book.domain.color) : DOMAIN_COLORS[0];
                
                return (
                  <button
                    key={book._id}
                    // onClick={() => handleToggleSchedule(book._id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left",
                      book.scheduledForTomorrow 
                        ? "border-primary/50 bg-primary/10" 
                        : "border-border/50 bg-card hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1 h-8 rounded-full", colorClasses.accent)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{book.title}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded",
                            STATUS_OPTIONS.find(s => s.value === book.status)?.bg,
                            STATUS_OPTIONS.find(s => s.value === book.status)?.color
                          )}>
                            {book.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {book.domain?.name} • Last read {formatRelativeDate(book.lastReadDate)}
                        </p>
                      </div>
                    </div>
                    {book.scheduledForTomorrow ? (
                      <CheckCircle2 size={20} className="text-primary" />
                    ) : (
                      <Circle size={20} className="text-muted-foreground" />
                    )}
                  </button>
                );
              })}
              
              {books.filter((b: any) => b.status === 'reading' || b.status === 'paused').length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No books available. Add some books first!
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close context menus & search */}
      {(contextMenu || searchQuery.length >= 2) && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setContextMenu(null);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}
