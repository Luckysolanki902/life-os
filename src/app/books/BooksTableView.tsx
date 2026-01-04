'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpDown, ChevronUp, ChevronDown, BookOpen, Edit2, Trash2, 
  Check, X, Filter, Download 
} from 'lucide-react';
import { updateBook, deleteBook, getBooksTableData } from '@/app/actions/books';
import { cn } from '@/lib/utils';

interface BooksTableViewProps {
  initialData: any;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  reading: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Reading' },
  paused: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Paused' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Completed' },
  dropped: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Dropped' },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BooksTableView({ initialData }: BooksTableViewProps) {
  const router = useRouter();
  const { books: initialBooks, domains, pagination } = initialData;
  
  const [books, setBooks] = useState(initialBooks);
  const [sortField, setSortField] = useState('lastReadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDomain, setFilterDomain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBook, setEditingBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle sort
  async function handleSort(field: string) {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    
    setIsLoading(true);
    const data = await getBooksTableData(1, 50, field, newOrder, {
      status: filterStatus,
      domainId: filterDomain,
      search: searchQuery
    });
    setBooks(data.books);
    setIsLoading(false);
  }

  // Handle filter
  async function handleFilter() {
    setIsLoading(true);
    const data = await getBooksTableData(1, 50, sortField, sortOrder, {
      status: filterStatus,
      domainId: filterDomain,
      search: searchQuery
    });
    setBooks(data.books);
    setIsLoading(false);
  }

  // Export to CSV
  function exportToCSV() {
    const headers = ['Title', 'Author', 'Domain', 'Subcategory', 'Status', 'Pages', 'Current Page', 'Start Date', 'Last Read'];
    const rows = books.map((book: any) => [
      book.title,
      book.author || '',
      book.domain?.name || '',
      book.subcategory,
      book.status,
      book.totalPages || '',
      book.currentPage || '',
      formatDate(book.startDate),
      formatDate(book.lastReadDate)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row: (string | number)[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `books-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  // Quick edit
  async function handleQuickUpdate(bookId: string, field: string, value: any) {
    await updateBook(bookId, { [field]: value });
    router.refresh();
    handleFilter(); // Reload data
  }

  async function handleDelete(bookId: string) {
    if (!confirm('Delete this book?')) return;
    await deleteBook(bookId);
    router.refresh();
    handleFilter();
  }

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {label}
      {sortField === field ? (
        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      ) : (
        <ArrowUpDown size={14} className="opacity-30" />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          placeholder="Search books..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        
        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Domains</option>
          {domains.map((domain: any) => (
            <option key={domain._id} value={domain._id}>
              {domain.icon} {domain.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleFilter}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Filter size={16} />
        </button>
        
        <button
          onClick={exportToCSV}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 text-left">
                  <SortButton field="title" label="Title" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="author" label="Author" />
                </th>
                <th className="px-4 py-3 text-left">Domain</th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="subcategory" label="Subcategory" />
                </th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="totalPages" label="Pages" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="startDate" label="Started" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="lastReadDate" label="Last Read" />
                </th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No books found
                  </td>
                </tr>
              ) : (
                books.map((book: any) => {
                  const statusInfo = STATUS_COLORS[book.status] || STATUS_COLORS.reading;
                  
                  return (
                    <tr key={book._id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{book.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{book.author || '-'}</td>
                      <td className="px-4 py-3">
                        {book.domain && (
                          <span className="text-xs">
                            {book.domain.icon} {book.domain.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{book.subcategory}</td>
                      <td className="px-4 py-3">
                        <select
                          value={book.status}
                          onChange={(e) => handleQuickUpdate(book._id, 'status', e.target.value)}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium border-0 outline-none cursor-pointer",
                            statusInfo.bg,
                            statusInfo.text
                          )}
                        >
                          {Object.entries(STATUS_COLORS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {book.totalPages ? (
                          <span>{book.currentPage || 0}/{book.totalPages}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(book.startDate)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(book.lastReadDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingBook(book)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(book._id)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination info */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {books.length} of {pagination.totalBooks} books
      </div>
    </div>
  );
}
