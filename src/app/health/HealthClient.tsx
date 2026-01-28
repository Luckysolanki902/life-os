"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  Dumbbell,
  Plus,
  Activity,
  ChevronRight,
  Sparkles,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Calendar,
} from "lucide-react";
import { logWeight, createHealthPage, saveMood, updateWeight } from "@/app/actions/health";
import TaskItem from "@/app/routine/TaskItem";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getLocalDateString, parseServerDate, formatDateForDisplay } from "@/lib/date-utils";
import ShareableWorkout from "./ShareableWorkout";

interface Task {
  _id: string;
  title: string;
  domainId: string;
  log?: {
    status?: 'completed' | 'skipped';
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface MoodLog {
  mood: string;
  date?: Date;
  note?: string;
}

interface HealthPage {
  _id: string;
  title: string;
  description?: string;
  cycleStatus?: "current" | "done" | string;
}

interface WeightStats {
  current: number;
  bmi: string | null;
  delta: number | null;
  deltaLabel?: string | null;
  lastLogged?: Date;
  todaysWeight?: {
    _id: string;
    weight: number;
    date: Date;
  } | null;
}

interface HealthClientProps {
  initialData: {
    routine: Task[];
    weightStats: WeightStats;
    pages: HealthPage[];
    mood: MoodLog | null;
    date: string;
    todaysExerciseCount?: number;
    canBeRestDay?: boolean;
    yesterdayExerciseCount?: number;
  };
}

const MOOD_OPTIONS = [
  {
    value: "great",
    label: "Great",
    icon: Sparkles,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
  },
  {
    value: "good",
    label: "Good",
    icon: ThumbsUp,
    color: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500/50",
  },
  {
    value: "okay",
    label: "Okay",
    icon: Meh,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/50",
  },
  {
    value: "low",
    label: "Low",
    icon: Frown,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/50",
  },
  {
    value: "bad",
    label: "Bad",
    icon: ThumbsDown,
    color: "text-rose-400",
    bg: "bg-rose-500/20",
    border: "border-rose-500/50",
  },
] as const;

export default function HealthClient({ initialData }: HealthClientProps) {
  const router = useRouter();
  const { routine, weightStats, pages, mood, date, todaysExerciseCount = 0, canBeRestDay = false } = initialData;
  
  // Parse server date and get YYYY-MM-DD in local timezone (IST)
  const currentDate = parseServerDate(date);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(currentDate);
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(
    mood?.mood || null
  );
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [showSkippedTasks, setShowSkippedTasks] = useState(false);

  // Filter tasks into categories
  const { activeTasks, doneTasks, skippedTasks } = useMemo(() => {
    const active: Task[] = [];
    const done: Task[] = [];
    const skipped: Task[] = [];
    
    routine.forEach((task) => {
      const status = task.log?.status;
      if (status === 'skipped') {
        skipped.push(task);
      } else if (status === 'completed') {
        done.push(task);
      } else {
        active.push(task);
      }
    });
    
    return { activeTasks: active, doneTasks: done, skippedTasks: skipped };
  }, [routine]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/health?date=${e.target.value}`);
  }

  async function handleLogWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!weightInput) return;
    
    if (editingWeightId) {
      // Update existing weight
      await updateWeight(editingWeightId, Number(weightInput));
    } else {
      // Create new weight log with string date
      await logWeight(Number(weightInput), weightDate);
    }
    
    setIsWeightModalOpen(false);
    setWeightInput("");
    setEditingWeightId(null);
    router.refresh();
  }

  function openWeightModal(existingWeight?: { _id: string; weight: number }) {
    if (existingWeight) {
      setEditingWeightId(existingWeight._id);
      setWeightInput(existingWeight.weight.toString());
    } else {
      setEditingWeightId(null);
      setWeightInput("");
    }
    setWeightDate(currentDate);
    setIsWeightModalOpen(true);
  }

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    if (!pageTitle) return;
    await createHealthPage(pageTitle);
    setIsPageModalOpen(false);
    setPageTitle("");
    router.refresh();
  }

  async function handleMoodSelect(moodValue: string) {
    setSelectedMood(moodValue);
    setIsSavingMood(true);
    // Send currentDate (YYYY-MM-DD) which represents the user's local date
    await saveMood(
      currentDate,
      moodValue as "great" | "good" | "okay" | "low" | "bad"
    );
    setIsSavingMood(false);
    router.refresh();
  }

  // Format date for display using dayjs-based utility
  const displayDate = formatDateForDisplay(currentDate, { showTodayYesterday: false, format: 'long' });

  // Check if current date is today using dayjs-based utility
  const todayStr = getLocalDateString();
  const isToday = currentDate === todayStr;

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    Health & Fitness
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">{displayDate}</p>
            </div>
            {/* Share Button - Only show for today */}
            {isToday && (
                <ShareableWorkout 
                canShare={(todaysExerciseCount >= 5 || canBeRestDay) && !!weightStats.todaysWeight}
                hasWeight={!!weightStats.todaysWeight}
                isRestDay={canBeRestDay && todaysExerciseCount < 5}
                />
            )}
        </div>
        
        <div className="relative">
            <input
                type="date"
                value={currentDate}
                onChange={handleDateChange}
                className="w-full bg-card border border-border/40 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <Calendar size={16} />
            </div>
        </div>
      </div>

      {/* Mood Tracker */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {isToday ? "Daily Mood" : "Mood Log"}
        </h2>

        <div className="grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedMood === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleMoodSelect(option.value)}
                  disabled={isSavingMood}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all border",
                    isSelected
                      ? `${option.bg} ${option.border} ${option.color} ring-1 ring-inset`
                      : "bg-card border-border/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/80"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      "transition-all",
                      isSelected ? option.color : "opacity-70"
                    )}
                  />
                  <span className="text-[10px] font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
      </section>

      {/* Today's Routine Tasks */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Daily Habits
        </h2>
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden divide-y divide-border/40">
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
                <div key={task._id} className="p-1">
                    <TaskItem task={task} dateStr={currentDate} />
                </div>
            ))
          ) : routine.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No health habits scheduled.
            </div>
          ) : (
            <div className="p-6 text-center text-emerald-500 bg-emerald-500/5">
              <span className="text-sm font-medium">All habits completed! 🎉</span>
            </div>
          )}
        </div>
        
        {/* Toggle buttons for done/skipped tasks */}
        <div className="flex flex-wrap gap-2 px-1">
          {doneTasks.length > 0 && (
            <button
              onClick={() => setShowDoneTasks(!showDoneTasks)}
              className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border/40"
            >
              {showDoneTasks ? <EyeOff size={12} /> : <Eye size={12} />}
              {showDoneTasks ? "Hide" : "Show"} done ({doneTasks.length})
            </button>
          )}
          {skippedTasks.length > 0 && (
            <button
              onClick={() => setShowSkippedTasks(!showSkippedTasks)}
              className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border/40"
            >
              {showSkippedTasks ? <EyeOff size={12} /> : <Eye size={12} />}
              {showSkippedTasks ? "Hide" : "Show"} skipped ({skippedTasks.length})
            </button>
          )}
        </div>
        
        {/* Done/Skipped tasks lists */}
        {(showDoneTasks || showSkippedTasks) && (
            <div className="space-y-2 opacity-60">
                 {showDoneTasks && doneTasks.map((task) => <TaskItem key={task._id} task={task} dateStr={currentDate} />)}
                 {showSkippedTasks && skippedTasks.map((task) => <TaskItem key={task._id} task={task} dateStr={currentDate} />)}
            </div>
        )}
      </section>

      {/* Weight Stats */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
          <span>Body Metrics</span>
          {weightStats.todaysWeight && isToday && (
               <button onClick={() => openWeightModal(weightStats.todaysWeight!)} className="text-primary hover:underline text-[10px]">Edit Today</button>
          )}
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Current Weight Card */}
          <div className="p-4 rounded-xl bg-card border border-border/40 relative group overflow-hidden">
             
             {isToday && !weightStats.todaysWeight ? (
                 <div onClick={() => openWeightModal()} className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors z-10">
                     <Plus size={20} className="text-primary mb-1" />
                     <span className="text-xs font-medium text-primary">Log</span>
                 </div>
             ) : null}

            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Weight (kg)
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight">
                {weightStats.todaysWeight ? weightStats.todaysWeight.weight.toFixed(1) : (weightStats.current ? Number(weightStats.current).toFixed(1) : "-")}
              </span>
            </div>
             {weightStats.todaysWeight && isToday && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full show-ping" />
             )}
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/40">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              BMI
            </p>
            <div className="flex items-baseline gap-1">
                <span
                    className={cn(
                    "text-xl sm:text-2xl font-bold tracking-tight",
                    !weightStats.bmi
                        ? "text-muted-foreground"
                        : Number(weightStats.bmi) < 18.5
                        ? "text-blue-400"
                        : Number(weightStats.bmi) < 25
                        ? "text-emerald-500"
                        : Number(weightStats.bmi) < 30
                        ? "text-amber-500"
                        : "text-rose-500"
                    )}
                >
                    {weightStats.bmi || "-"}
                </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/40">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Trend
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-xl sm:text-2xl font-bold tracking-tight",
                  weightStats.delta === null
                    ? "text-muted-foreground"
                    : weightStats.delta > 0
                    ? "text-emerald-500" // Weight gain isn't always bad, but keeping simple
                    : "text-rose-500"
                )}
              >
                {weightStats.delta !== null
                  ? (weightStats.delta > 0 ? "+" : "") +
                    weightStats.delta.toFixed(1)
                  : "-"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Log for different date button */}
        {!isToday && !weightStats.todaysWeight && (
          <button
            onClick={() => openWeightModal()}
            className="w-full py-3 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-xs font-medium"
          >
            <Plus size={14} />
            <span>Log weight for {displayDate.split(',')[0]}</span>
          </button>
        )}
      </section>

      {/* Workout Pages */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Workouts
          </h2>
          <button
            onClick={() => setIsPageModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {pages.map((page) => (
            <Link
              key={page._id}
              href={`/health/${page._id}`}
              className={cn(
                "group p-4 rounded-xl transition-all flex items-center justify-between",
                page.cycleStatus === "today"
                  ? "bg-card border-l-4 border-l-primary border-y border-r border-border/40 shadow-sm"
                  : page.cycleStatus === "done"
                  ? "bg-secondary/30 border border-border/20 opacity-70 hover:opacity-100"
                  : "bg-card border border-border/40 hover:border-border/80"
              )}
            >
              <div className="flex items-center gap-3">
                {page.cycleStatus === "done" ? (
                   <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 size={16} />
                   </div>
                ) : (
                   <div className={cn("p-2 rounded-full bg-secondary text-muted-foreground", page.cycleStatus === 'today' && "bg-primary/10 text-primary")}>
                      <Dumbbell size={16} />
                   </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-medium text-sm",
                        page.cycleStatus === "today" ? "text-primary" : "text-foreground"
                      )}
                    >
                      {page.title}
                    </h3>
                    {page.cycleStatus === "today" && (
                         <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  {page.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {page.description}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          ))}

          {pages.length === 0 && (
            <button
              onClick={() => setIsPageModalOpen(true)}
              className="py-12 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary col-span-full"
            >
              <div className="p-3 rounded-full bg-secondary">
                  <Plus size={20} />
              </div>
              <span className="text-sm font-medium">Create Workout Plan</span>
            </button>
          )}
        </div>
      </section>

      {/* Weight Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xs p-6 rounded-2xl border border-border shadow-2xl animate-in zoom-in-95">
            <h3 className="text-md font-semibold mb-4 text-center">
              {editingWeightId ? "Update Weight" : "Log Weight"}
            </h3>
            <form onSubmit={handleLogWeight} className="space-y-4">
              {!editingWeightId && (
                <div>
                   <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none border border-transparent focus:border-primary/50"
                  />
                </div>
              )}
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="0.0"
                  autoFocus
                  className="w-full bg-secondary/50 rounded-lg px-3 py-4 text-center text-3xl font-bold outline-none border border-transparent focus:border-primary/50"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">kg</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsWeightModalOpen(false);
                    setEditingWeightId(null);
                    setWeightInput("");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  {editingWeightId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Page Modal */}
      {isPageModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xs p-6 rounded-2xl border border-border shadow-2xl animate-in zoom-in-95">
            <h3 className="text-md font-semibold mb-4 text-center">New Workout Plan</h3>
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <input
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Plan Name (e.g. Chest Day)"
                  autoFocus
                  className="w-full bg-secondary/50 rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-primary/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pageTitle}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
