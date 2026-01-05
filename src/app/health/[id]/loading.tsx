export default function WorkoutLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
          <div className="h-10 w-10 bg-secondary/50 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-7 w-48 bg-secondary/50 rounded-lg" />
            <div className="h-4 w-32 bg-secondary/30 rounded-lg" />
          </div>
        </div>
        <div className="h-10 w-32 bg-secondary/50 rounded-xl" />
      </div>

      {/* Muscle Map Skeleton */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <div className="h-4 w-40 bg-secondary/50 rounded mb-4" />
        <div className="h-32 bg-secondary/30 rounded-xl" />
      </div>

      {/* Add Exercise Form Skeleton */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 h-12 bg-secondary/50 rounded-xl" />
          <div className="flex gap-2 shrink-0">
            <div className="w-20 h-12 bg-secondary/50 rounded-xl" />
            <div className="w-12 h-12 bg-secondary/50 rounded-xl" />
          </div>
        </div>
        <div className="h-3 w-64 bg-secondary/30 rounded" />
      </div>

      {/* Exercise List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-secondary/50 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-secondary/50 rounded" />
                <div className="h-3 w-24 bg-secondary/30 rounded" />
              </div>
              <div className="h-8 w-8 bg-secondary/50 rounded-lg" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="h-10 bg-secondary/30 rounded-lg" />
              ))}
            </div>
            <div className="h-10 bg-secondary/50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
