import { getIdentityMetric } from "./actions/stats";
import { getOverallReport } from "./actions/reports";
import { getRoutine } from "./actions/routine";
import Link from "next/link";
import {
  Heart,
  Users,
  ArrowRight,
  Library,
  CheckCircle2,
  Circle,
  Activity,
  Brain,
  Scale,
  Calendar,
  TrendingUp,
  Zap,
  Clock,
  ChevronRight,
} from "lucide-react";

function CompletionRing({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{percentage}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const [stats, todayReport, routine] = await Promise.all([
    getIdentityMetric(),
    getOverallReport('today'),
    getRoutine()
  ]);

  const { summary, domainBreakdown } = todayReport;
  
  // Calculate today's stats
  const completedTasks = routine.filter((t: any) => t.log?.status === 'completed').length;
  const totalTasks = routine.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group routine by domain
  const routineByDomain = routine.reduce((acc: any, task: any) => {
    const domain = task.domainId || 'other';
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(task);
    return acc;
  }, {});

  const domains = [
    {
      id: "health",
      name: "Health",
      icon: Heart,
      points: stats.domains.health,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      gradient: "from-rose-500/10 to-rose-500/5",
    },
    {
      id: "learning",
      name: "Learning",
      icon: Brain,
      points: stats.domains.learning,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      gradient: "from-amber-500/10 to-amber-500/5",
    },
    {
      id: "books",
      name: "Books",
      icon: Library,
      points: 0,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      gradient: "from-cyan-500/10 to-cyan-500/5",
    },
    {
      id: "social",
      name: "Social",
      icon: Users,
      points: stats.domains.social,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      gradient: "from-emerald-500/10 to-emerald-500/5",
    },
  ];

  const domainStats = domainBreakdown?.reduce((acc: any, d: any) => {
    acc[d.domain] = d;
    return acc;
  }, {}) || {};

  // Format time helper
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-center space-y-4 overflow-hidden rounded-3xl glass border-none shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <h1 className="relative text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          You are <span className="text-primary">{stats.percentage}%</span>{" "}
          better
          <br />
          <span className="text-2xl md:text-3xl font-normal text-muted-foreground mt-2 block">
            version of yourself
          </span>
        </h1>

        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
          <span>Total Points: {stats.totalPoints.toLocaleString()}</span>
        </div>
      </section>

      {/* Today's Progress + Quick Stats */}
      <section className="grid gap-4 md:grid-cols-12">
        {/* Today's Progress Card */}
        <div className="md:col-span-4 bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Today&apos;s Progress</h2>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <Link href="/routine" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="flex items-center justify-center py-2">
            <CompletionRing percentage={completionRate} />
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span><span className="font-semibold">{completedTasks}</span> done</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle size={16} className="text-muted-foreground" />
              <span><span className="font-semibold">{totalTasks - completedTasks}</span> remaining</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl border border-border/50 p-4 hover:border-primary/30 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Zap size={14} className="text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Points Today</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalPoints}</p>
            {summary.pointsChange !== 0 && (
              <p className={`text-xs mt-1 ${summary.pointsChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {summary.pointsChange > 0 ? '+' : ''}{summary.pointsChange} vs yesterday
              </p>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-4 hover:border-rose-500/30 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10">
                <Activity size={14} className="text-rose-500" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Workouts</span>
            </div>
            <p className="text-2xl font-bold">{summary.exerciseSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">session{summary.exerciseSessions !== 1 ? 's' : ''} today</p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-4 hover:border-amber-500/30 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Clock size={14} className="text-amber-500" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Learning</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(summary.learningMinutes)}</p>
            <p className="text-xs text-muted-foreground mt-1">practiced today</p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-4 hover:border-emerald-500/30 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Users size={14} className="text-emerald-500" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Interactions</span>
            </div>
            <p className="text-2xl font-bold">{summary.interactions}</p>
            <p className="text-xs text-muted-foreground mt-1">connection{summary.interactions !== 1 ? 's' : ''} today</p>
          </div>
        </div>
      </section>

      {/* Today's Routine by Domain */}
      {totalTasks > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Today&apos;s Habits</h2>
            <Link href="/routine" className="text-sm text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="grid gap-3 md:grid-cols-3">
            {['health', 'learning', 'social'].map((domainId) => {
              const tasks = routineByDomain[domainId] || [];
              if (tasks.length === 0) return null;
              
              const domain = domains.find(d => d.id === domainId);
              if (!domain) return null;
              
              const Icon = domain.icon;
              const completed = tasks.filter((t: any) => t.log?.status === 'completed').length;
              
              return (
                <div key={domainId} className={`bg-card rounded-2xl border ${domain.border} overflow-hidden`}>
                  <div className={`px-4 py-3 bg-gradient-to-r ${domain.gradient} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={domain.color} />
                      <span className="font-medium text-sm capitalize">{domainId}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {completed}/{tasks.length}
                    </span>
                  </div>
                  
                  <div className="p-3 space-y-1.5">
                    {tasks.slice(0, 4).map((task: any) => {
                      const isCompleted = task.log?.status === 'completed';
                      return (
                        <div 
                          key={task._id} 
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                            isCompleted ? 'bg-emerald-500/10' : 'bg-secondary/30 hover:bg-secondary/50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          ) : (
                            <Circle size={16} className="text-muted-foreground shrink-0" />
                          )}
                          <span className={`text-sm truncate ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                      );
                    })}
                    {tasks.length > 4 && (
                      <Link 
                        href={`/${domainId}`}
                        className="block text-center text-xs text-muted-foreground hover:text-foreground py-1"
                      >
                        +{tasks.length - 4} more
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Domain Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your Domains</h2>
          <Link href="/reports" className="text-sm text-primary hover:underline flex items-center gap-1">
            Reports <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {domains.map((domain) => {
            const Icon = domain.icon;
            const domainData = domainStats[domain.id];
            const domainCompletionRate = domainData?.completionRate || 0;
            
            return (
              <Link
                key={domain.id}
                href={`/${domain.id}`}
                className={`group relative overflow-hidden p-4 rounded-2xl bg-card border ${domain.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${domain.bg} ${domain.color} mb-3`}>
                    <Icon size={20} />
                  </div>
                  
                  <h3 className="font-semibold mb-1">{domain.name}</h3>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {domain.points.toLocaleString()} pts
                    </span>
                    {domain.id !== 'books' && domainData && (
                      <span className={domainCompletionRate >= 80 ? 'text-emerald-500' : domainCompletionRate >= 50 ? 'text-amber-500' : 'text-muted-foreground'}>
                        {domainCompletionRate}%
                      </span>
                    )}
                  </div>
                  
                  {domain.id !== 'books' && domainData && (
                    <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          domainCompletionRate >= 80 ? 'bg-emerald-500' : domainCompletionRate >= 50 ? 'bg-amber-500' : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${domainCompletionRate}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <ArrowRight 
                  size={16} 
                  className="absolute bottom-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link 
          href="/routine"
          className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
        >
          <Calendar size={20} className="text-primary" />
          <div>
            <p className="font-medium text-sm">Daily Routine</p>
            <p className="text-xs text-muted-foreground">Manage habits</p>
          </div>
          <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </Link>
        
        <Link 
          href="/reports"
          className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
        >
          <TrendingUp size={20} className="text-amber-500" />
          <div>
            <p className="font-medium text-sm">Reports</p>
            <p className="text-xs text-muted-foreground">View analytics</p>
          </div>
          <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </Link>
        
        <Link 
          href="/health"
          className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all group"
        >
          <Scale size={20} className="text-rose-500" />
          <div>
            <p className="font-medium text-sm">Log Weight</p>
            <p className="text-xs text-muted-foreground">Track body</p>
          </div>
          <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </Link>
        
        <Link 
          href="/learning"
          className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
        >
          <Brain size={20} className="text-violet-500" />
          <div>
            <p className="font-medium text-sm">Quick Log</p>
            <p className="text-xs text-muted-foreground">Log practice</p>
          </div>
          <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </Link>
      </section>
    </div>
  );
}
