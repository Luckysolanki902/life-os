export default function SocialLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-secondary/50 rounded-lg" />
          <div className="h-4 w-48 bg-secondary/30 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-secondary/50 rounded-xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-secondary/50 rounded-lg" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border/50 h-20" />
        ))}
      </div>
    </div>
  );
}
