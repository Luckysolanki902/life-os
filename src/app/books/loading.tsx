export default function BooksLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-secondary/50 rounded-lg" />
          <div className="h-4 w-48 bg-secondary/30 rounded-lg" />
        </div>
        <div className="h-10 w-24 bg-secondary/50 rounded-xl" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
            <div className="h-3 w-16 bg-secondary/50 rounded mb-2" />
            <div className="h-6 w-12 bg-secondary/50 rounded" />
          </div>
        ))}
      </div>

      {/* Books List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border/50 h-24" />
        ))}
      </div>
    </div>
  );
}
