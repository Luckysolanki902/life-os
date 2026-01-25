import { getIdentityMetric, getLast7DaysCompletion } from "./actions/stats";
import { getRoutine } from "./actions/routine";
import { getTodaysWeightData } from "./actions/health";
import { getStreakData, getSpecialTasks, getTotalPointsWithBonuses } from "./actions/streak";
import HomeClient from "./NewHomeClient";

// Force dynamic rendering since dashboard depends on current date/time
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [stats, routineData, todaysWeight, streakData, specialTasks, pointsData, last7DaysCompletion] = await Promise.all([
    getIdentityMetric(),
    getRoutine(),
    getTodaysWeightData(),
    getStreakData(),
    getSpecialTasks(),
    getTotalPointsWithBonuses(),
    getLast7DaysCompletion()
  ]);

  // Extract routine from the result object
  const routine = routineData.routine;

  // Get all incomplete tasks (not completed) - send all pending and skipped tasks
  const incompleteTasks = routine
    .filter((t) => t.log?.status !== 'completed')
    .map((t) => ({
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
      icon: "BookMarked",
      points: 0,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      id: "learning",
      name: "Learning",
      icon: "Brain",
      points: stats.domains.learning || 0,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section - X% Better Banner */}
      <section className="relative py-10 md:py-16 text-center space-y-3 overflow-hidden rounded-3xl glass border-none shadow-sm">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />

        <h1 className="relative text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          You are <span className="text-primary">{Math.floor(pointsData.totalPoints / 100)}%</span> better
          <br />
          <span className="text-xl md:text-2xl font-normal text-muted-foreground mt-2 block">
            version of yourself
          </span>
        </h1>

        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
          <span>Total Points: {pointsData.totalPoints.toLocaleString()}</span>
        </div>
      </section>

      {/* Client component for interactive features */}
      <HomeClient 
        incompleteTasks={incompleteTasks}
        domains={domains}
        todaysWeight={todaysWeight}
        streakData={streakData}
        specialTasks={specialTasks}
        totalPoints={pointsData.totalPoints}
        last7DaysCompletion={last7DaysCompletion}
      />
    </div>
  );
}
