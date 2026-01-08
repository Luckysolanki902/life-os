import { getIdentityMetric } from "./actions/stats";
import { getRoutine } from "./actions/routine";
import { getLearningDashboardData } from "./actions/learning";
import Link from "next/link";
import {
  Heart,
  ArrowRight,
  Library,
  Brain,
} from "lucide-react";
import HomeClient from "./HomeClient";

export default async function Dashboard() {
  const [stats, routine, learningData] = await Promise.all([
    getIdentityMetric(),
    getRoutine(),
    getLearningDashboardData()
  ]);

  // Get next 3 incomplete tasks (already sorted by order from getRoutine)
  const incompleteTasks = routine
    .filter((t: any) => t.log?.status !== 'completed')
    .slice(0, 3)
    .map((t: any) => ({
      _id: t._id?.toString() || t._id,
      title: t.title,
      domainId: t.domainId,
      timeOfDay: t.timeOfDay,
      points: t.points
    }));

  // Get all mediums for quick learning log
  const allMediums: any[] = [];
  learningData.areas.forEach((area: any) => {
    area.skills.forEach((skill: any) => {
      skill.mediums.forEach((medium: any) => {
        allMediums.push({
          id: medium._id,
          title: medium.title,
          skill: skill.title,
          area: area.title,
          areaColor: area.color || '#8B5CF6'
        });
      });
    });
  });

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
      id: "learning",
      name: "Learning",
      icon: "Brain",
      points: stats.domains.learning,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
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
        allMediums={allMediums}
        domains={domains}
      />
    </div>
  );
}
