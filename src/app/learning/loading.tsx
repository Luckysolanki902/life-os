export default function LearningLoading() {
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

      {/* Areas Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
            <div className="h-6 w-40 bg-secondary/50 rounded-lg" />
            <div className="h-4 w-32 bg-secondary/30 rounded" />
            <div className="space-y-2 mt-4">
              {[1, 2].map((j) => (
                <div key={j} className="h-10 bg-secondary/30 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
