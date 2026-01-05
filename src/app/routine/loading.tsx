export default function RoutineLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-secondary/50 rounded-lg" />
          <div className="h-4 w-48 bg-secondary/30 rounded-lg" />
        </div>
      </div>

      {/* Add Task Form Skeleton */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="h-12 bg-secondary/50 rounded-xl" />
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-secondary/50 rounded-xl" />
          <div className="w-24 h-10 bg-secondary/50 rounded-xl" />
        </div>
      </div>

      {/* Tasks List Skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 bg-card rounded-xl border border-border/50" />
        ))}
      </div>
    </div>
  );
}
