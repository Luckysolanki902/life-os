import { Heart, Calendar, ShieldAlert } from 'lucide-react';

export default function RelationshipPage() {
  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Heart className="text-rose-500 fill-rose-500" />
          Relationship
        </h1>
        <p className="text-muted-foreground">Nurture your partnership.</p>
      </div>

      {/* Love Tank */}
      <section className="p-8 rounded-3xl glass border border-border/50 space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-semibold">Love Tank</h2>
          <span className="text-2xl font-bold text-rose-500">85%</span>
        </div>
        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-rose-500 w-[85%] rounded-full shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all duration-1000" />
        </div>
        <p className="text-sm text-muted-foreground">Last refill: Date Night (2 days ago)</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Date Log */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={20} />
              Recent Dates
            </h2>
            <button className="text-sm font-medium text-primary hover:underline">Log New</button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border/50 flex justify-between items-center">
                <div>
                  <p className="font-medium">Dinner at Mario's</p>
                  <p className="text-xs text-muted-foreground">Oct {10 + i}, 2025</p>
                </div>
                <span className="text-sm font-bold text-primary">+50 pts</span>
              </div>
            ))}
          </div>
        </section>

        {/* Conflict Resolution (Encrypted) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert size={20} />
              Conflict Log
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">AES-256 Encrypted</span>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
            <p className="text-sm text-muted-foreground">
              Reflect on disagreements privately. Writing it down helps process emotions objectively.
            </p>
            <button className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors">
              New Private Entry
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
