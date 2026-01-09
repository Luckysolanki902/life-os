export default function HealthLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-rose-500/30 rounded-lg" />
            <div className="h-8 w-24 bg-secondary/50 rounded-lg" />
          </div>
          <div className="h-4 w-36 bg-secondary/30 rounded-lg" />
        </div>
        <div className="h-11 w-full sm:w-40 bg-secondary/50 rounded-xl" />
      </div>

      {/* Mood Tracker Skeleton */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4.5 w-4.5 bg-primary/30 rounded" />
          <div className="h-4 w-44 bg-secondary/50 rounded" />
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <div className="flex flex-wrap justify-center sm:justify-between gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-secondary/30 border-2 border-transparent flex-1 min-w-[70px] max-w-[100px]"
              >
                <div className="h-6 w-6 bg-secondary/50 rounded-full" />
                <div className="h-3 w-10 bg-secondary/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Habits Skeleton */}
      <section className="space-y-3">
        <div className="h-4 w-28 bg-secondary/50 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-card rounded-xl border border-border/50 flex items-center gap-3">
              <div className="h-5 w-5 bg-secondary/50 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-secondary/50 rounded mb-1" />
                <div className="h-3 w-20 bg-secondary/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weight Stats Skeleton */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 bg-secondary/50 rounded" />
            <div className="h-4 w-20 bg-secondary/50 rounded" />
          </div>
          <div className="h-8 w-20 bg-secondary/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="h-3 w-14 bg-secondary/50 rounded mb-2" />
              <div className="h-7 w-16 bg-secondary/50 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Workout Plans Skeleton */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-4.5 bg-secondary/50 rounded" />
            <div className="h-4 w-28 bg-secondary/50 rounded" />
          </div>
          <div className="h-8 w-8 bg-secondary/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 w-24 bg-secondary/50 rounded" />
                <div className="h-4 w-4 bg-secondary/30 rounded" />
              </div>
              <div className="h-3 w-16 bg-secondary/30 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
