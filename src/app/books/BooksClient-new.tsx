'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Plus, Upload, Table2, LayoutGrid, X, Calendar, Check, Edit2, 
  MoreVertical, Trash2, CheckCircle2, Pause, XCircle, Search
} from 'lucide-react';
import { 
  createBookDomain, updateBookDomain, deleteBookDomain,
  createBook, updateBook, deleteBook, checkInBook as checkInBookAction, bulkImportBooks, deleteBookLog
} from '@/app/actions/books';
import { cn } from '@/lib/utils';
import BooksTableView from './BooksTableView';

interface BooksClientProps {
  initialData: any;
  tableData: any;
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
  { value: 'to-read', label: 'To Read', icon: BookOpen, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  { value: 'reading', label: 'Reading', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { value: 'paused', label: 'Paused', icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/20' },
];

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getColorClasses(colorName: string) {
  return DOMAIN_COLORS.find(c => c.name === colorName) || DOMAIN_COLORS[0];
}

export default function BooksClient({ initialData, tableData }: BooksClientProps) {
  const router = useRouter();
  const { domains, books, recentLogs, stats } = initialData;
  
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modal States
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInBookData, setCheckInBookData] = useState<any>(null);
  
  // Form States
  const [newDomain, setNewDomain] = useState({ name: '', description: '', color: 'blue', icon: '📚' });
  const [newBook, setNewBook] = useState({ 
    domainId: '', 
    title: '', 
    author: '',
    subcategory: '',
    totalPages: 0,
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [editingBook, setEditingBook] = useState<any>(null);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportResult, setBulkImportResult] = useState<any>(null);
  const [checkInForm, setCheckInForm] = useState({ currentPage: 0, notes: '' });
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ type: string; id: string } | null>(null);

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
    if (!newBook.title.trim() || !newBook.domainId || !newBook.subcategory.trim()) return;
    await createBook(newBook);
    setNewBook({ 
      domainId: '', 
      title: '', 
      author: '',
      subcategory: '',
      totalPages: 0,
      startDate: new Date().toISOString().split('T')[0],
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

  async function handleCheckIn(bookId: string) {
    const book = books.find((b: any) => b._id === bookId);
    if (!book) return;
    
    setCheckInBookData(book);
    setCheckInForm({ 
      currentPage: book.currentPage || 0,
      notes: '' 
    });
    setIsCheckInModalOpen(true);
  }
  
  async function submitCheckIn() {
    if (!checkInBookData) return;
    
    await checkInBookAction(checkInBookData._id, checkInForm.currentPage, checkInForm.notes);
    setIsCheckInModalOpen(false);
    setCheckInBookData(null);
    setCheckInForm({ currentPage: 0, notes: '' });
    router.refresh();
  }
  
  async function handleDeleteLog(logId: string) {
    if (!confirm('Delete this reading log?')) return;
    await deleteBookLog(logId);
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

  // Bulk import handler
  async function handleBulkImport() {
    try {
      // Parse CSV or JSON
      const lines = bulkImportText.trim().split('\n');
      const booksData: any[] = [];
      
      // Check if it's CSV (has commas) or JSON
      if (bulkImportText.trim().startsWith('[')) {
        // JSON format
        const parsed = JSON.parse(bulkImportText);
        booksData.push(...parsed);
      } else {
        // CSV format: title,author,domain,subcategory,totalPages,status,notes
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const book: any = {};
          
          headers.forEach((header, index) => {
            if (header === 'totalpages' || header === 'pages') {
              book.totalPages = parseInt(values[index]) || 0;
            } else {
              book[header] = values[index];
            }
          });
          
          if (book.title) booksData.push(book);
        }
      }
      
      const result = await bulkImportBooks(booksData);
      setBulkImportResult(result);
      
      if (result.success > 0) {
        setTimeout(() => {
          setIsBulkImportOpen(false);
          setBulkImportText('');
          setBulkImportResult(null);
          router.refresh();
        }, 3000);
      }
    } catch (error: any) {
      setBulkImportResult({ success: 0, failed: 0, errors: [error.message] });
    }
  }

  // Get books grouped by domain
  const booksByDomain: Record<string, any[]> = {};
  books.forEach((book: any) => {
    if (!booksByDomain[book.domainId]) {
      booksByDomain[book.domainId] = [];
    }
    booksByDomain[book.domainId].push(book);
  });
  
  // Books currently reading (for quick check-in)
  const readingBooks = books.filter((b: any) => b.status === 'reading' || b.status === 'paused');

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="text-amber-500" size={28} />
            Books
          </h1>
          <p className="text-muted-foreground text-sm">Track your reading journey</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-80"
          >
            {viewMode === 'grid' ? <Table2 size={16} /> : <LayoutGrid size={16} />}
            {viewMode === 'grid' ? 'Table' : 'Grid'}
          </button>
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-80"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90"
          >
            <Plus size={16} />
            Add Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold">{stats.totalBooks}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Reading</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.reading}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-[10px] text-amber-400 uppercase tracking-wider">Paused</p>
          <p className="text-2xl font-bold text-amber-400">{stats.paused}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <p className="text-[10px] text-blue-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
        </div>
      </div>

      {/* Conditional View */}
      {viewMode === 'table' ? (
        <BooksTableView initialData={tableData} />
      ) : (
        <>
          {/* Quick Log Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen size={14} />
              Quick Log
            </h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setIsSearching(true);
                    const results = books.filter((b: any) => 
                      b.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
                      (b.author && b.author.toLowerCase().includes(e.target.value.toLowerCase()))
                    ).slice(0, 10);
                    setSearchResults(results);
                    setIsSearching(false);
                  } else {
                    setSearchResults([]);
                  }
                }}
                placeholder="Search book to log pages..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              
              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-[300px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No books found
                    </div>
                  ) : (
                    searchResults.map((book: any) => {
                      const colorClasses = book.domain ? getColorClasses(book.domain.color) : DOMAIN_COLORS[0];
                      
                      return (
                        <div 
                          key={book._id}
                          className="flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn("w-1 h-8 rounded-full", colorClasses.accent)} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{book.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {book.domain?.name} • p.{book.currentPage || 0}{book.totalPages ? `/${book.totalPages}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              handleCheckIn(book._id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                          >
                            Log Pages
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Currently Reading - Only show if has books */}
          {readingBooks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Check size={14} />
                Currently Reading ({readingBooks.length})
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {readingBooks.map((book: any) => {
                  const colorClasses = book.domain ? getColorClasses(book.domain.color) : DOMAIN_COLORS[0];
                  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
                  
                  return (
                    <div 
                      key={book._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("w-1.5 h-10 rounded-full", colorClasses.accent)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {book.totalPages > 0 ? `${book.currentPage}/${book.totalPages} pages` : book.domain?.name}
                          </p>
                          {book.totalPages > 0 && (
                            <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                              <div className={cn("h-full", colorClasses.accent)} style={{ width: `${progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckIn(book._id)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex-shrink-0 ml-2"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent Reading Logs */}
          {recentLogs && recentLogs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar size={14} />
                Recent Activity
              </h2>
              <div className="space-y-2">
                {recentLogs.map((log: any) => {
                  const colorClasses = log.domain ? getColorClasses(log.domain.color) : DOMAIN_COLORS[0];
                  
                  return (
                    <div 
                      key={log._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("w-1 h-8 rounded-full", colorClasses.accent)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{log.book.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatRelativeDate(log.date)}</span>
                            {log.currentPage > 0 && (
                              <>
                                <span>•</span>
                                <span>Page {log.currentPage}</span>
                              </>
                            )}
                            {log.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate">{log.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Domains & Books - Simplified List View */}
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
              <div className="space-y-2">
                {domains.map((domain: any) => {
                  const colorClasses = getColorClasses(domain.color);
                  const domainBooks = booksByDomain[domain._id] || [];
                  
                  return (
                    <div key={domain._id} className={cn(
                      "rounded-xl border overflow-hidden",
                      colorClasses.border,
                      "bg-card"
                    )}>
                      {/* Domain Header - Always visible */}
                      <div className="flex items-center justify-between p-3 border-b border-border/30">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{domain.icon}</span>
                          <span className="font-medium text-sm">{domain.name}</span>
                          <span className="text-xs text-muted-foreground">({domainBooks.length})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setNewBook({ ...newBook, domainId: domain._id }); setIsBookModalOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => setContextMenu({ type: 'domain', id: domain._id })}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Books List - Flat, no accordion */}
                      {domainBooks.length > 0 && (
                        <div className="p-2 space-y-1">
                          {domainBooks.map((book: any) => {
                            const statusInfo = STATUS_OPTIONS.find(s => s.value === book.status);
                            const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
                            
                            return (
                              <div 
                                key={book._id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                              >
                                {/* Status indicator */}
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  statusInfo?.color.replace('text-', 'bg-').replace('-400', '-500')
                                )} />
                                
                                {/* Book info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{book.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={cn("capitalize", statusInfo?.color)}>{book.status?.replace('-', ' ')}</span>
                                    {book.totalPages > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{progress}%</span>
                                      </>
                                    )}
                                    {book.author && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{book.author}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Quick actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {(book.status === 'reading' || book.status === 'paused' || book.status === 'to-read') && (
                                    <button
                                      onClick={() => handleCheckIn(book._id)}
                                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                      title="Log pages"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingBook(book);
                                      setIsEditBookModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div className="fixed top-20 right-4 z-50 w-48 bg-card border border-border rounded-xl shadow-lg p-2">
            <button
              onClick={() => {
                if (contextMenu.type === 'book') {
                  const book = books.find((b: any) => b._id === contextMenu.id);
                  setEditingBook(book);
                  setIsEditBookModalOpen(true);
                }
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 rounded-lg hover:bg-secondary text-left text-sm flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => handleDelete(contextMenu.type, contextMenu.id)}
              className="w-full px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-500 text-left text-sm flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
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
                <label className="text-xs font-medium text-muted-foreground ml-1">Domain *</label>
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
                <label className="text-xs font-medium text-muted-foreground ml-1">Title *</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Book title"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Subcategory *</label>
                <input
                  value={newBook.subcategory}
                  onChange={(e) => setNewBook({ ...newBook, subcategory: e.target.value })}
                  placeholder="e.g., Marketing, Validation, Leadership"
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
                    placeholder="Optional"
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
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
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
                  disabled={!newBook.domainId || !newBook.title || !newBook.subcategory}
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
                <label className="text-xs font-medium text-muted-foreground ml-1">Subcategory</label>
                <input
                  value={editingBook.subcategory || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, subcategory: e.target.value })}
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
                <div className="flex flex-wrap gap-2 mt-1">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditingBook({ ...editingBook, status: opt.value })}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all",
                          editingBook.status === opt.value
                            ? `${opt.bg} border-current ${opt.color}`
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        <Icon size={14} />
                        <span className="text-xs font-medium">{opt.label}</span>
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

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk Import Books</h3>
              <button onClick={() => setIsBulkImportOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-2">
                <p className="font-medium">Format: CSV or JSON</p>
                <p className="text-xs text-muted-foreground">
                  <strong>CSV:</strong> title,author,domain,subcategory,totalPages,status,notes
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>JSON:</strong> [{'{'}title, author, domain, subcategory, totalPages, status, notes{'}'}]
                </p>
                <p className="text-xs text-amber-400">Domain will be auto-created if it doesn&apos;t exist!</p>
              </div>
              
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="Paste your CSV or JSON data here..."
                rows={12}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              
              {bulkImportResult && (
                <div className={cn(
                  "p-3 rounded-lg",
                  bulkImportResult.success > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                )}>
                  <p className="font-medium">
                    {bulkImportResult.success} imported, {bulkImportResult.failed} failed
                  </p>
                  {bulkImportResult.errors.length > 0 && (
                    <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                      {bulkImportResult.errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkImportText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {isCheckInModalOpen && checkInBookData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Check In: {checkInBookData.title}</h3>
              <button onClick={() => setIsCheckInModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Current Page</label>
                <input
                  type="number"
                  value={checkInForm.currentPage}
                  onChange={(e) => setCheckInForm({ ...checkInForm, currentPage: Number(e.target.value) })}
                  placeholder="Where did you read up to?"
                  autoFocus
                  min={0}
                  max={checkInBookData.totalPages || undefined}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                {checkInBookData.totalPages > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Total pages: {checkInBookData.totalPages}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Notes (optional)</label>
                <textarea
                  value={checkInForm.notes}
                  onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                  placeholder="Any thoughts or highlights..."
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCheckIn}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Check In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
