'use client';

import { useState } from 'react';
import { 
  BookOpen, Plus, X, Search, Check, 
  Pause, CheckCircle2, Minus, ChevronRight, BookMarked, Play, MoreHorizontal
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
  { name: 'blue', text: 'text-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { name: 'emerald', text: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { name: 'amber', text: 'text-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { name: 'rose', text: 'text-rose-500', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { name: 'violet', text: 'text-violet-500', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { name: 'cyan', text: 'text-cyan-500', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             <BookMarked className="text-primary" size={28} />
             Books
          </h1>
          <p className="text-muted-foreground text-sm pl-1">Track your reading journey</p>
        </div>
        <button
          onClick={() => setIsAddBookOpen(true)}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          <span>New Book</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
             <BookOpen size={48} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-emerald-500">{stats.reading}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Reading</span>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-5">
             <Pause size={48} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-amber-500">{stats.paused}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Paused</span>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-5">
             <CheckCircle2 size={48} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-blue-500">{stats.completed}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Done</span>
        </div>
      </div>

      {/* Currently Reading - Minimalist Cards */}
      {readingBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground pl-1">Currently Reading</h2>
          <div className="grid gap-3">
            {readingBooks.map((book) => {
              const colors = book.domain ? getColorClasses(book.domain.color) : COLORS[0];
              const progress = book.totalPages ? Math.round(((book.currentPage || 0) / book.totalPages) * 100) : 0;
              
              return (
                <div
                  key={book._id}
                  className="p-4 rounded-2xl bg-card border border-border/40 hover:border-border/80 transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Icon/Cover Placeholder */}
                    <div className={cn("hidden sm:flex w-16 h-24 rounded-lg items-center justify-center text-2xl shrink-0 bg-secondary/30", colors.text)}>
                      {book.domain?.icon || <BookOpen />}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                      <div>
                         <div className="flex items-start justify-between">
                            <div>
                               <h3 className="font-semibold text-lg leading-tight truncate pr-2">{book.title}</h3>
                               <p className="text-sm text-muted-foreground">{book.author}</p>
                            </div>
                            <div className={cn("sm:hidden w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-secondary/30", colors.text)}>
                               {book.domain?.icon || <BookOpen size={20} />}
                            </div>
                         </div>
                         <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className={cn("font-medium", colors.text)}>{book.domain?.name}</span>
                            <span>•</span>
                            <span>{book.currentPage || 0} / {book.totalPages || '?'} pages</span>
                         </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {book.totalPages && (
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-500", colors.bg.replace('/10', ''))} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-border/40 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                       <button
                        onClick={() => openQuickLog(book)}
                        className="flex-1 sm:flex-initial w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs flex items-center justify-center gap-1.5 hover:opacity-90 shadow-sm"
                      >
                        <Plus size={14} /> Log
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePauseBook(book._id)}
                          className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-amber-500 transition-colors"
                          title="Pause"
                        >
                          <Pause size={16} />
                        </button>
                         <button
                          onClick={() => handleCompleteBook(book._id)}
                          className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-emerald-500 transition-colors"
                          title="Complete"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Library Section */}
      <section className="space-y-4">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 bg-secondary/30 p-1 rounded-xl w-fit">
            {(['to-read', 'paused', 'completed'] as const).map((status) => (
               <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                     "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                     statusFilter === status 
                     ? "bg-background shadow-sm text-foreground" 
                     : "text-muted-foreground hover:text-foreground"
                  )}
               >
                  {status === 'to-read' ? 'Saved' : status}
               </button>
            ))}
             <button
                  onClick={() => setStatusFilter('')}
                  className={cn(
                     "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                     statusFilter === '' 
                     ? "bg-background shadow-sm text-foreground" 
                     : "text-muted-foreground hover:text-foreground"
                  )}
               >
                  All
               </button>
          </div>
          
           <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-border text-sm transition-all outline-none"
              />
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm">
           {filteredBooks.length === 0 ? (
               <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No books found</p>
               </div>
           ) : (
              <div className="divide-y divide-border/40">
                 {filteredBooks.map((book) => {
                     const colors = book.domain ? getColorClasses(book.domain.color) : COLORS[0];
                     return (
                        <div key={book._id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors group">
                           <div className="flex items-center gap-4 overflow-hidden">
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-secondary/30 shrink-0", colors.text)}>
                                 {book.domain?.icon || <BookOpen size={18} />}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-medium text-sm truncate">{book.title}</p>
                                 <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-3 shrink-0">
                              <span className={cn(
                                 "text-[10px] font-medium px-2 py-0.5 rounded-full border opacity-70",
                                 book.status === 'reading' ? "border-emerald-500 text-emerald-500" :
                                 book.status === 'completed' ? "border-blue-500 text-blue-500" :
                                 book.status === 'paused' ? "border-amber-500 text-amber-500" :
                                 "border-muted-foreground text-muted-foreground"
                              )}>
                                 {book.status}
                              </span>
                              
                              {book.status === 'to-read' && (
                                 <button onClick={() => handleStartReading(book._id)} className="p-1.5 rounded-lg hover:bg-secondary text-primary transition-colors">
                                    <Play size={14} />
                                 </button>
                              )}
                              
                              <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                                 <MoreHorizontal size={14} />
                              </button>
                           </div>
                        </div>
                     )
                 })}
              </div>
           )}
        </div>
      </section>

      <div className="flex justify-center pt-4">
         <Link href="/reports/books" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-4 py-2 rounded-full hover:bg-secondary/50">
            View Reading Reports <ChevronRight size={12} />
         </Link>
      </div>

      {/* Modals */}
      {/* Add Book Modal */}
      {isAddBookOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">New Book</h3>
              <button onClick={() => setIsAddBookOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="e.g. Atomic Habits"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Author</label>
                <input
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="e.g. James Clear"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
              <div className="flex gap-3">
                 <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1">Total Pages</label>
                    <input
                     type="number"
                     value={newBook.totalPages || ''}
                     onChange={(e) => setNewBook({ ...newBook, totalPages: parseInt(e.target.value) || 0 })}
                     placeholder="0"
                     className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    />
                 </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1">Domain</label>
                    <select
                     value={newBook.domainId}
                     onChange={(e) => setNewBook({ ...newBook, domainId: e.target.value })}
                     className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none"
                    >
                      {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                 </div>
              </div>

               <div className="pt-2">
                  <button
                  type="submit"
                  disabled={!newBook.title.trim() || !newBook.domainId}
                  className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                  Add to Library
                  </button>
                  <div className="text-center mt-3">
                     <button type="button" onClick={() => { setIsAddBookOpen(false); setIsAddDomainOpen(true); }} className="text-xs text-primary hover:underline">
                        Create new domain
                     </button>
                  </div>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {isAddDomainOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
           <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">New Domain</h3>
              <button onClick={() => setIsAddDomainOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDomain} className="space-y-4">
               <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                <input
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                  placeholder="e.g. Finance"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  autoFocus
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon</label>
                <input
                  value={newDomain.icon}
                  onChange={(e) => setNewDomain({ ...newDomain, icon: e.target.value })}
                  placeholder="💰"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Color Tag</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewDomain({ ...newDomain, color: color.name })}
                      className={cn(
                        "w-6 h-6 rounded-full transition-all ring-offset-2 ring-offset-card",
                        color.bg,
                        newDomain.color === color.name ? "ring-2 ring-foreground scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity mt-2"
              >
                Create Domain
              </button>
            </form>
           </div>
        </div>
      )}

      {/* Quick Log Modal */}
      {isQuickLogOpen && selectedBook && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Log Reading</h3>
              <button onClick={() => setIsQuickLogOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="text-center py-2">
                <h4 className="font-semibold text-lg leading-tight">{selectedBook.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-secondary/30 text-xs font-medium">
                   <span>Current: Page {selectedBook.currentPage || 0}</span>
                </div>
             </div>

            <form onSubmit={handleQuickLog} className="space-y-6">
               <div className="space-y-4">
                <div className="flex items-center justify-center">
                   <div className="text-center">
                     <span className="text-muted-foreground font-medium mr-2 text-sm">Read</span>
                     <span className="text-5xl font-bold tracking-tighter text-foreground">{logPages}</span>
                     <span className="text-muted-foreground font-medium ml-2 text-sm">pages</span>
                   </div>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setLogPages(Math.max(1, logPages - 1))}
                    className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                   <div className="flex gap-2">
                     {[5, 10, 20].map(p => (
                       <button
                         key={p}
                         type="button"
                         onClick={() => setLogPages(p)}
                         className={cn(
                           "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                           logPages === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                         )}
                       >
                         {p}p
                       </button>
                     ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogPages(logPages + 1)}
                    className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={logPages <= 0}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                Log Progress
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
