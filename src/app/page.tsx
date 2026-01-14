import { getIdentityMetric } from "./actions/stats";
import { getRoutine } from "./actions/routine";
import { getTodaysWeightData } from "./actions/health";
import Link from "next/link";
import {
  Heart,
  ArrowRight,
  Library,
} from "lucide-react";
import HomeClient from "./HomeClient";

// Force dynamic rendering since dashboard depends on current date/time
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [stats, routine, todaysWeight] = await Promise.all([
    getIdentityMetric(),
    getRoutine(),
    getTodaysWeightData()
  ]);

  // Get next tasks: incomplete first (not completed, not skipped), then skipped
  const notCompletedTasks = routine.filter((t: any) => t.log?.status !== 'completed');
  const pendingTasks = notCompletedTasks.filter((t: any) => t.log?.status !== 'skipped');
  const skippedTasks = notCompletedTasks.filter((t: any) => t.log?.status === 'skipped');
  
  // Take first 3 pending tasks + all skipped tasks for the home view
  const incompleteTasks = [
    ...pendingTasks.slice(0, 3),
    ...skippedTasks
  ].map((t: any) => ({
    _id: t._id?.toString() || t._id,
    title: t.title,
    domainId: t.domainId,
    timeOfDay: t.timeOfDay,
    points: t.basePoints || t.points,
    status: t.log?.status || 'pending'
  }));

  const domains = [
    {
      id: "health",
      name: "Health",
      icon: "Heart",
      points: stats.domains.health,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      id: "books",
      name: "Books",
      icon: "Library",
      points: 0,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section - X% Better Banner */}
      <section className="relative py-10 md:py-16 text-center space-y-3 overflow-hidden rounded-3xl glass border-none shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <h1 className="relative text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          You are <span className="text-primary">{stats.percentage}%</span> better
          <br />
          <span className="text-xl md:text-2xl font-normal text-muted-foreground mt-2 block">
            version of yourself
          </span>
        </h1>

        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
          <span>Total Points: {stats.totalPoints.toLocaleString()}</span>
        </div>
      </section>

      {/* Client component for interactive features */}
      <HomeClient 
        incompleteTasks={incompleteTasks}
        domains={domains}
        todaysWeight={todaysWeight}
      />
    </div>
  );
}
