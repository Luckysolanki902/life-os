export default function HomeLoading() {
  return (
    <div className="space-y-4 pt-4 px-1">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-secondary/50 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-secondary/30 rounded-lg animate-pulse" />
        </div>
        <div className="h-8 w-16 bg-secondary/50 rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
        <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-6 w-24 bg-secondary/30 rounded-lg mb-2 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-card border border-border/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
