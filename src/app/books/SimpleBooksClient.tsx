'use client';

import { useState } from 'react';
import { 
  BookOpen, Plus, X, Search, Check, 
  Pause, CheckCircle2, Minus, ChevronRight, BookMarked, Play
} from 'lucide-react';
import { 
  createBookDomain,
  createBook, updateBook,
  checkInBook
} from '@/app/actions/books';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { dayjs } from '@/lib/date-utils';
import Link from 'next/link';

interface Domain {
  _id: string;
  name: string;
  color: string;
  icon: string;
  bookCount: number;
  readingCount: number;
  completedCount: number;
}

interface Book {
  _id: string;
  title: string;
  author?: string;
  status: 'to-read' | 'reading' | 'paused' | 'completed' | 'dropped';
  domainId: string;
  domain?: { name: string; color: string; icon: string };
  totalPages?: number;
  currentPage?: number;
  lastReadDate?: Date;
}

interface BookLog {
  _id: string;
  bookId: string;
  date: Date;
  pagesRead?: number;
  book: { title: string; author?: string };
  domain?: { name: string; color: string };
}

interface SimpleBooksClientProps {
  initialData: {
    domains: Domain[];
    books: Book[];
    recentLogs: BookLog[];
    stats: {
      totalBooks: number;
      reading: number;
      paused: number;
      completed: number;
    };
  };
}

const COLORS = [
  { name: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500' },
  { name: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500' },
  { name: 'violet', bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', accent: 'bg-violet-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
];

const STATUS_OPTIONS = [
  { value: 'reading', label: 'Reading', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { value: 'paused', label: 'Paused', icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
];

function getColorClasses(colorName: string) {
  return COLORS.find(c => c.name === colorName) || COLORS[0];
}

function formatRelativeDate(date: Date | string | undefined): string {
  if (!date) return 'Never';
  const d = dayjs(date).tz('Asia/Kolkata');
  const now = dayjs().tz('Asia/Kolkata');
  const diffDays = now.startOf('day').diff(d.startOf('day'), 'day');
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.format('D MMM');
}

export default function SimpleBooksClient({ initialData }: SimpleBooksClientProps) {
  const router = useRouter();
  const { domains, books, stats } = initialData;
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('reading');
  
  // Modal States
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Form States
  const [newDomain, setNewDomain] = useState({ name: '', icon: '📚', color: 'blue' });
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    domainId: domains[0]?._id || '',
    totalPages: 0,
    subcategory: 'General',
  });
  const [logPages, setLogPages] = useState(5);

  // Filtered books
  const filteredBooks = books.filter((book) => {
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get currently reading books
  const readingBooks = books.filter(b => b.status === 'reading');

  // Handlers
  async function handleCreateDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.name.trim()) return;
    await createBookDomain(newDomain);
    setNewDomain({ name: '', icon: '📚', color: 'blue' });
    setIsAddDomainOpen(false);
    router.refresh();
  }

  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.domainId) return;
    await createBook({
      ...newBook,
      status: 'to-read',
    });
    setNewBook({
      title: '',
      author: '',
      domainId: domains[0]?._id || '',
      totalPages: 0,
      subcategory: 'General',
    });
    setIsAddBookOpen(false);
    router.refresh();
  }

  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || logPages <= 0) return;
    
    // Create a book log with pages read
    await checkInBook(
      selectedBook._id, 
      (selectedBook.currentPage || 0) + logPages
    );
    
    setSelectedBook(null);
    setIsQuickLogOpen(false);
    setLogPages(5);
    router.refresh();
  }

  async function handleStartReading(bookId: string) {
    await updateBook(bookId, { status: 'reading' });
    router.refresh();
  }

  async function handlePauseBook(bookId: string) {
    await updateBook(bookId, { status: 'paused' });
    router.refresh();
  }

  async function handleCompleteBook(bookId: string) {
    await updateBook(bookId, { status: 'completed' });
    router.refresh();
  }

  function openQuickLog(book: Book) {
    setSelectedBook(book);
    setLogPages(5);
    setIsQuickLogOpen(true);
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="text-amber-500 shrink-0" size={24} />
            Books
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Track your reading</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setIsAddBookOpen(true)}
            className="px-3 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm flex items-center gap-1.5 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            <Plus size={16} />
            Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Reading</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.reading}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-[10px] text-amber-400 uppercase tracking-wider">Paused</p>
          <p className="text-2xl font-bold text-amber-400">{stats.paused}</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
          <p className="text-[10px] text-blue-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
        </div>
      </div>

      {/* Quick Log - Currently Reading */}
      {readingBooks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Currently Reading</h2>
          <div className="space-y-2">
            {readingBooks.map((book) => {
              const colors = book.domain ? getColorClasses(book.domain.color) : COLORS[0];
              return (
                <div
                  key={book._id}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    colors.bg, colors.border
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {book.author && `${book.author} • `}
                        {book.domain?.name || 'Uncategorized'}
                        {book.totalPages && book.currentPage !== undefined && (
                          <> • {book.currentPage}/{book.totalPages} pages</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openQuickLog(book)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-medium text-sm transition-colors",
                          colors.accent, "text-white hover:opacity-90"
                        )}
                      >
                        <Check size={14} className="inline mr-1" />
                        Log
                      </button>
                      <button
                        onClick={() => handlePauseBook(book._id)}
                        className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-amber-500 transition-colors"
                        title="Pause"
                      >
                        <Pause size={14} />
                      </button>
                      <button
                        onClick={() => handleCompleteBook(book._id)}
                        className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-emerald-500 transition-colors"
                        title="Complete"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              !statusFilter ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            All ({stats.totalBooks})
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                statusFilter === status.value ? status.bg + " " + status.color : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <status.icon size={12} />
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {statusFilter ? STATUS_OPTIONS.find(s => s.value === statusFilter)?.label : 'All Books'}
          </h2>
          <Link href="/reports/books" className="text-xs text-primary hover:underline flex items-center gap-1">
            Reports <ChevronRight size={12} />
          </Link>
        </div>
        
        {filteredBooks.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No books found</p>
            <button
              onClick={() => setIsAddBookOpen(true)}
              className="mt-3 text-primary text-sm hover:underline"
            >
              Add your first book
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooks.map((book) => {
              const colors = book.domain ? getColorClasses(book.domain.color) : COLORS[0];
              const statusInfo = STATUS_OPTIONS.find(s => s.value === book.status);
              
              return (
                <div
                  key={book._id}
                  className={cn(
                    "p-3 rounded-xl border",
                    colors.bg, colors.border
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{book.title}</p>
                        {statusInfo && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded shrink-0",
                            statusInfo.bg, statusInfo.color
                          )}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {book.author && `${book.author} • `}
                        {book.domain?.name || 'Uncategorized'}
                        {book.totalPages && book.currentPage !== undefined && (
                          <> • {book.currentPage}/{book.totalPages} pages</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {book.status === 'to-read' && (
                        <button
                          onClick={() => handleStartReading(book._id)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 flex items-center gap-1"
                        >
                          <Play size={12} /> Start
                        </button>
                      )}
                      {book.status === 'paused' && (
                        <button
                          onClick={() => handleStartReading(book._id)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 flex items-center gap-1"
                        >
                          <Play size={12} /> Resume
                        </button>
                      )}
                      {book.status === 'reading' && (
                        <>
                          <button
                            onClick={() => openQuickLog(book)}
                            className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30"
                          >
                            Log
                          </button>
                          <button
                            onClick={() => handlePauseBook(book._id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            title="Pause"
                          >
                            <Pause size={14} />
                          </button>
                        </>
                      )}
                      {book.status === 'completed' && (
                        <span className="text-xs text-emerald-400">✓ Done</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Categories</h2>
          <button
            onClick={() => setIsAddDomainOpen(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        {domains.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
            No categories yet
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => {
              const colors = getColorClasses(domain.color);
              return (
                <div
                  key={domain._id}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm flex items-center gap-2",
                    colors.bg, colors.border, colors.text
                  )}
                >
                  <span>{domain.icon}</span>
                  <span>{domain.name}</span>
                  <span className="text-xs opacity-70">({domain.bookCount})</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Domain Modal */}
      {isAddDomainOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Category</h3>
              <button onClick={() => setIsAddDomainOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDomain} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                <input
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                  placeholder="e.g., Fiction, Business"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon</label>
                <input
                  value={newDomain.icon}
                  onChange={(e) => setNewDomain({ ...newDomain, icon: e.target.value })}
                  placeholder="📚"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewDomain({ ...newDomain, color: color.name })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.accent,
                        newDomain.color === color.name && "ring-2 ring-offset-2 ring-offset-card ring-white"
                      )}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {isAddBookOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Book</h3>
              <button onClick={() => setIsAddBookOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Book title"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Author</label>
                <input
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Author name"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                <select
                  value={newBook.domainId}
                  onChange={(e) => setNewBook({ ...newBook, domainId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                >
                  {domains.map((domain) => (
                    <option key={domain._id} value={domain._id}>
                      {domain.icon} {domain.name}
                    </option>
                  ))}
                </select>
                {domains.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <button type="button" onClick={() => { setIsAddBookOpen(false); setIsAddDomainOpen(true); }} className="text-primary hover:underline">
                      Add a category first
                    </button>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Total Pages (optional)</label>
                <input
                  type="number"
                  value={newBook.totalPages || ''}
                  onChange={(e) => setNewBook({ ...newBook, totalPages: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!newBook.title.trim() || !newBook.domainId}
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
              >
                Add Book
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      {isQuickLogOpen && selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Log Reading</h3>
              <button onClick={() => setIsQuickLogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30 border border-border">
              <p className="font-medium text-sm">{selectedBook.title}</p>
              {selectedBook.author && <p className="text-xs text-muted-foreground">{selectedBook.author}</p>}
              {selectedBook.totalPages && (
                <p className="text-xs text-muted-foreground mt-1">
                  Progress: {selectedBook.currentPage || 0}/{selectedBook.totalPages} pages
                </p>
              )}
            </div>
            <form onSubmit={handleQuickLog} className="space-y-4">
              {/* Pages Read */}
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Pages read this session
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setLogPages(Math.max(1, logPages - 5))}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={logPages}
                    onChange={(e) => setLogPages(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm text-center"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => setLogPages(logPages + 5)}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[5, 10, 20, 30].map((pages) => (
                    <button
                      key={pages}
                      type="button"
                      onClick={() => setLogPages(pages)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        logPages === pages 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      {pages}p
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={logPages <= 0}
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
              >
                Log {logPages} Pages
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
