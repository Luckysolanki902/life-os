export default function HealthLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-8 w-32 bg-secondary/50 rounded-lg" />
          <div className="h-4 w-48 bg-secondary/30 rounded-lg" />
        </div>
        <div className="h-11 w-full sm:w-40 bg-secondary/50 rounded-xl" />
      </div>

      {/* Mood Tracker Skeleton */}
      <section className="space-y-3">
        <div className="h-4 w-24 bg-secondary/50 rounded" />
        <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <div className="flex justify-center sm:justify-between gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 flex-1 min-w-17.5 max-w-25">
                <div className="h-6 w-6 bg-secondary/50 rounded-full" />
                <div className="h-3 w-12 bg-secondary/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Habits Skeleton */}
      <section className="space-y-3">
        <div className="h-4 w-32 bg-secondary/50 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card rounded-xl border border-border/50" />
          ))}
        </div>
      </section>

      {/* Weight Stats Skeleton */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-secondary/50 rounded" />
          <div className="h-4 w-12 bg-secondary/50 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="h-3 w-16 bg-secondary/50 rounded mb-2" />
              <div className="h-6 w-12 bg-secondary/50 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Workouts Skeleton */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-secondary/50 rounded" />
          <div className="h-6 w-6 bg-secondary/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50 h-20" />
          ))}
        </div>
      </section>
    </div>
  );
}
