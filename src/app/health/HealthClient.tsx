"use client";

import { useState } from "react";
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
} from "lucide-react";
import { logWeight, createHealthPage, saveMood } from "@/app/actions/health";
import TaskItem from "@/app/routine/TaskItem";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Task {
  _id: string;
  title: string;
  domainId: string;
  isCompleted?: boolean;
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
  delta: string | null;
  lastLogged?: Date;
}

interface HealthClientProps {
  initialData: {
    routine: Task[];
    weightStats: WeightStats;
    pages: HealthPage[];
    mood: MoodLog | null;
    date: string;
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
  const { routine, weightStats, pages, mood, date } = initialData;
  const currentDate = new Date(date).toISOString().split("T")[0];

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [pageTitle, setPageTitle] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(
    mood?.mood || null
  );
  const [isSavingMood, setIsSavingMood] = useState(false);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/health?date=${e.target.value}`);
  }

  async function handleLogWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!weightInput) return;
    await logWeight(Number(weightInput), new Date(weightDate));
    setIsWeightModalOpen(false);
    setWeightInput("");
    router.refresh();
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
    await saveMood(
      date,
      moodValue as "great" | "good" | "okay" | "low" | "bad"
    );
    setIsSavingMood(false);
    router.refresh();
  }

  // Format date for display in IST
  const displayDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const isToday = currentDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="text-rose-500" size={28} />
            Health
          </h1>
          <p className="text-muted-foreground text-sm">{displayDate}</p>
        </div>
        <input
          type="date"
          value={currentDate}
          onChange={handleDateChange}
          className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark w-full sm:w-auto"
        />
      </div>

      {/* Mood Tracker */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Smile size={18} className="text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {isToday ? "How are you feeling today?" : "Mood"}
          </h2>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <div className="flex flex-wrap justify-center sm:justify-between gap-2 sm:gap-3">
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedMood === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleMoodSelect(option.value)}
                  disabled={isSavingMood}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl transition-all flex-1 min-w-17.5 max-w-25",
                    "border-2 hover:scale-105 cursor-pointer",
                    isSelected
                      ? `${option.bg} ${option.border} ${option.color}`
                      : "border-transparent bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon
                    size={24}
                    className={cn(
                      "transition-all",
                      isSelected ? option.color : ""
                    )}
                  />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>

          {selectedMood && (
            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Mood logged</span>
              <span className="text-primary">•</span>
              <span>
                {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.label}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Today's Routine Tasks */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Today&apos;s Habits
        </h2>
        <div className="space-y-2">
          {routine.length > 0 ? (
            routine.map((task) => <TaskItem key={task._id} task={task} />)
          ) : (
            <div className="p-5 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
              No health habits scheduled for today.
            </div>
          )}
        </div>
      </section>

      {/* Weight Stats */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Scale size={16} />
            Body Weight
          </h2>
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Log
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Current
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold">
                {weightStats.current || "-"}
              </span>
              {weightStats.current > 0 && (
                <span className="text-xs text-muted-foreground">kg</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              BMI
            </p>
            <div className="mt-1">
              <span
                className={cn(
                  "text-xl sm:text-2xl font-bold",
                  !weightStats.bmi
                    ? "text-muted-foreground"
                    : Number(weightStats.bmi) < 18.5
                    ? "text-blue-400"
                    : Number(weightStats.bmi) < 25
                    ? "text-emerald-500"
                    : Number(weightStats.bmi) < 30
                    ? "text-yellow-500"
                    : "text-rose-500"
                )}
              >
                {weightStats.bmi || "-"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {!weightStats.bmi
                ? ""
                : Number(weightStats.bmi) < 18.5
                ? "Under"
                : Number(weightStats.bmi) < 25
                ? "Healthy"
                : Number(weightStats.bmi) < 30
                ? "Over"
                : "Obese"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              30d Δ
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={cn(
                  "text-xl sm:text-2xl font-bold",
                  !weightStats.delta
                    ? "text-muted-foreground"
                    : Number(weightStats.delta) > 0
                    ? "text-rose-500"
                    : "text-emerald-500"
                )}
              >
                {weightStats.delta
                  ? (Number(weightStats.delta) > 0 ? "+" : "") +
                    weightStats.delta
                  : "-"}
              </span>
              {weightStats.delta && (
                <span className="text-xs text-muted-foreground">kg</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Workout Pages */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Dumbbell size={16} />
            Workouts
          </h2>
          <button
            onClick={() => setIsPageModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pages.map((page) => (
            <Link
              key={page._id}
              href={`/health/${page._id}`}
              className={cn(
                "group p-4 rounded-xl transition-all flex items-center justify-between",
                page.cycleStatus === "current"
                  ? "bg-primary/10 border-2 border-primary shadow-md shadow-primary/10"
                  : page.cycleStatus === "done"
                  ? "bg-card/50 border border-border/30 opacity-60 hover:opacity-100"
                  : "bg-card border border-border/50 hover:border-primary/50 hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-3">
                {page.cycleStatus === "done" && (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-500 shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-medium transition-colors",
                        page.cycleStatus === "current"
                          ? "text-primary"
                          : "group-hover:text-primary"
                      )}
                    >
                      {page.title}
                    </h3>
                    {page.cycleStatus === "current" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                        Next
                      </span>
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
                size={18}
                className={cn(
                  "transition-transform",
                  page.cycleStatus === "current"
                    ? "text-primary"
                    : "text-muted-foreground group-hover:translate-x-1"
                )}
              />
            </Link>
          ))}

          {pages.length === 0 && (
            <button
              onClick={() => setIsPageModalOpen(true)}
              className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary col-span-full"
            >
              <Plus size={24} />
              <span className="text-sm font-medium">Create Workout Plan</span>
            </button>
          )}
        </div>
      </section>

      {/* Weight Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-semibold mb-4">Log Weight</h3>
            <form onSubmit={handleLogWeight} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Date
                </label>
                <input
                  type="date"
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="e.g. 75.5"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Page Modal */}
      {isPageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-semibold mb-4">New Workout Plan</h3>
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Plan Name
                </label>
                <input
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. Day A - Push"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
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
