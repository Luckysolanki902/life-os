'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Clock, Trash2, X, Brain, Minus,
  Flame, ChevronRight, Pencil, Edit2
} from 'lucide-react';
import { 
  createCategory, 
  createSkill, updateSkill,
  addLearningLog, deleteLearningLog
} from '@/app/actions/simple-learning';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  _id: string;
  title: string;
  icon: string;
  color: string;
}

interface Skill {
  _id: string;
  name: string;
  categoryId: string;
  categoryTitle: string;
  categoryIcon: string;
  categoryColor: string;
}

interface SkillStat {
  skillId: string;
  skillName: string;
  categoryId: string;
  categoryTitle: string;
  categoryIcon: string;
  categoryColor: string;
  totalMinutes: number;
  sessionCount: number;
  lastPracticed: Date;
}

interface TodayLog {
  _id: string;
  categoryId: string;
  skillId: string;
  categoryTitle: string;
  categoryIcon: string;
  categoryColor: string;
  skillName: string;
  duration: number;
  date: Date;
}

interface SimpleLearningClientProps {
  initialData: {
    categories: Category[];
    skills: Skill[];
    skillStats: SkillStat[];
    todaysLogs: TodayLog[];
    todaysTotalMinutes: number;
    weeklyTotalMinutes: number;
  };
}

const COLORS = [
  { name: 'violet', bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', accent: 'bg-violet-500' },
  { name: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  { name: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500' },
  { name: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
  { name: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500' },
  { name: 'pink', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', accent: 'bg-pink-500' },
];

function getColorClasses(colorName: string) {
  return COLORS.find(c => c.name === colorName) || COLORS[0];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function SimpleLearningClient({ initialData }: SimpleLearningClientProps) {
  const router = useRouter();
  const { categories, skills, skillStats, todaysLogs, todaysTotalMinutes, weeklyTotalMinutes } = initialData;
  
  // Modal States
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isEditSkillOpen, setIsEditSkillOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isEditLogOpen, setIsEditLogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingLog, setEditingLog] = useState<TodayLog | null>(null);
  
  // Form States
  const [newCategory, setNewCategory] = useState({ title: '', icon: '📚', color: 'violet' });
  const [newSkill, setNewSkill] = useState({ categoryId: categories[0]?._id || '', name: '' });
  const [quickLogForm, setQuickLogForm] = useState({
    skillId: skills[0]?._id || '',
    duration: 30,
  });
  
  // Get recent skill stats for quick access (top 6 by last practiced)
  // Exclude skills that are already logged today
  const recentSkillStats = useMemo(() => {
    const todaySkillIds = new Set(todaysLogs.map(log => log.skillId));
    return skillStats.filter(stat => !todaySkillIds.has(stat.skillId)).slice(0, 6);
  }, [skillStats, todaysLogs]);
  
  // Helper to get default duration for a skill (last session or 15 mins)
  function getDefaultDuration(skillId: string): number {
    const skill = skillStats.find(s => s.skillId === skillId);
    if (skill?.lastPracticed) {
      // Find the last log for this skill from todaysLogs or use a reasonable default
      const lastLog = todaysLogs.find(log => log.skillId === skillId);
      return lastLog?.duration || 15;
    }
    return 15;
  }

  // Handlers
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.title.trim()) return;
    await createCategory(newCategory);
    setNewCategory({ title: '', icon: '📚', color: 'violet' });
    setIsAddCategoryOpen(false);
    router.refresh();
  }

  async function handleCreateSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkill.categoryId || !newSkill.name.trim()) return;
    await createSkill(newSkill);
    setNewSkill({ categoryId: categories[0]?._id || '', name: '' });
    setIsAddSkillOpen(false);
    router.refresh();
  }

  async function handleEditSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSkill) return;
    await updateSkill(editingSkill._id, { 
      name: editingSkill.name,
      categoryId: editingSkill.categoryId 
    });
    setEditingSkill(null);
    setIsEditSkillOpen(false);
    router.refresh();
  }

  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault();
    if (!quickLogForm.skillId || quickLogForm.duration <= 0) return;
    
    await addLearningLog({
      skillId: quickLogForm.skillId,
      duration: quickLogForm.duration,
    });
    
    setQuickLogForm({ skillId: skills[0]?._id || '', duration: 30 });
    setIsQuickLogOpen(false);
    router.refresh();
  }

  async function handleQuickAdd(skillStat: SkillStat) {
    const duration = getDefaultDuration(skillStat.skillId);
    await addLearningLog({
      skillId: skillStat.skillId,
      duration: duration,
    });
    router.refresh();
  }

  async function handleDeleteLog(logId: string) {
    if (!confirm('Delete this log?')) return;
    await deleteLearningLog(logId);
    router.refresh();
  }
  
  function openEditLog(log: TodayLog) {
    setEditingLog({ ...log });
    setIsEditLogOpen(true);
  }
  
  async function handleEditLog(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLog) return;
    
    // Delete old log and create new one with updated duration
    await deleteLearningLog(editingLog._id);
    await addLearningLog({
      skillId: editingLog.skillId,
      duration: editingLog.duration,
    });
    
    setEditingLog(null);
    setIsEditLogOpen(false);
    router.refresh();
  }

  function openEditSkill(skill: Skill) {
    setEditingSkill({ ...skill });
    setIsEditSkillOpen(true);
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="text-violet-500 shrink-0" size={24} />
            Learning
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Track your skills</p>
        </div>
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="px-3 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm flex items-center gap-1.5 hover:opacity-90 shadow-lg shadow-primary/20"
        >
          <Plus size={16} />
          Log
        </button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock size={14} />
            Today
          </div>
          <p className="text-2xl font-bold">{formatDuration(todaysTotalMinutes)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Flame size={14} />
            This Week
          </div>
          <p className="text-2xl font-bold">{formatDuration(weeklyTotalMinutes)}</p>
        </div>
      </div>

      {/* Quick Log Skills - Only show if there are skill stats */}
      {recentSkillStats.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Log</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentSkillStats.map((stat) => {
              const colors = getColorClasses(stat.categoryColor);
              const defaultDuration = getDefaultDuration(stat.skillId);
              return (
                <div
                  key={stat.skillId}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:scale-[1.02]",
                    colors.bg, colors.border
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{stat.categoryIcon} {stat.skillName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {stat.categoryTitle} • {formatDuration(stat.totalMinutes)} total
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        +{formatDuration(defaultDuration)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleQuickAdd(stat)}
                      className={cn(
                        "w-12 h-12 rounded-xl font-medium transition-all hover:scale-110 active:scale-95 shadow-lg",
                        colors.accent, "text-white"
                      )}
                      title={`Log ${formatDuration(defaultDuration)}`}
                    >
                      <Plus size={20} className="mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Today's Logs */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s Sessions</h2>
        {todaysLogs.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-border text-center text-muted-foreground text-sm">
            No learning logged today. Start tracking!
          </div>
        ) : (
          <div className="space-y-2">
            {todaysLogs.map((log) => {
              const colors = getColorClasses(log.categoryColor);
              return (
                <div
                  key={log._id}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:border-primary/30",
                    colors.bg, colors.border
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base">{log.categoryIcon} {log.skillName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{log.categoryTitle}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className={cn("text-sm font-semibold", colors.text)}>{formatDuration(log.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditLog(log)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit duration"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Skills Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skills</h2>
          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
        {skills.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
            No skills yet. Add one to start tracking!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {skills.map((skill) => {
              const colors = getColorClasses(skill.categoryColor);
              const stat = skillStats.find(s => s.skillId === skill._id);
              return (
                <div
                  key={skill._id}
                  className={cn(
                    "p-3 rounded-xl border transition-all group",
                    colors.bg, colors.border
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{skill.categoryIcon} {skill.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{skill.categoryTitle}</p>
                      {stat && (
                        <p className={cn("text-xs font-medium mt-1", colors.text)}>
                          {formatDuration(stat.totalMinutes)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openEditSkill(skill)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Categories</h2>
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
        {categories.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
            No categories yet. Add one to start!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const colors = getColorClasses(cat.color);
              const skillCount = skills.filter(s => s.categoryId === cat._id).length;
              return (
                <div
                  key={cat._id}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm flex items-center gap-2",
                    colors.bg, colors.border, colors.text
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                  <span className="text-xs opacity-70">({skillCount})</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reports Link */}
      <div className="pt-2">
        <Link 
          href="/reports/learning" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View Reports <ChevronRight size={14} />
        </Link>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                <input
                  value={newCategory.title}
                  onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                  placeholder="e.g., Music, Programming"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon</label>
                <input
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="📚"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, color: color.name })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.accent,
                        newCategory.color === color.name && "ring-2 ring-offset-2 ring-offset-card ring-white"
                      )}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {isAddSkillOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Skill</h3>
              <button onClick={() => setIsAddSkillOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                <select
                  value={newSkill.categoryId}
                  onChange={(e) => setNewSkill({ ...newSkill, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <button 
                      type="button" 
                      onClick={() => { setIsAddSkillOpen(false); setIsAddCategoryOpen(true); }} 
                      className="text-primary hover:underline"
                    >
                      Add a category first
                    </button>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill Name</label>
                <input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="e.g., Python, Guitar, Spanish"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!newSkill.categoryId || !newSkill.name.trim()}
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
              >
                Add Skill
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {isEditSkillOpen && editingSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Edit Skill</h3>
              <button onClick={() => { setIsEditSkillOpen(false); setEditingSkill(null); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSkill} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                <select
                  value={editingSkill.categoryId}
                  onChange={(e) => setEditingSkill({ ...editingSkill, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill Name</label>
                <input
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Log Learning</h3>
              <button onClick={() => setIsQuickLogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickLog} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill</label>
                <select
                  value={quickLogForm.skillId}
                  onChange={(e) => setQuickLogForm({ ...quickLogForm, skillId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm"
                >
                  {skills.length === 0 ? (
                    <option value="">No skills available</option>
                  ) : (
                    skills.map((skill) => (
                      <option key={skill._id} value={skill._id}>
                        {skill.categoryIcon} {skill.name} • {skill.categoryTitle}
                      </option>
                    ))
                  )}
                </select>
                {skills.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <button 
                      type="button" 
                      onClick={() => { setIsQuickLogOpen(false); setIsAddSkillOpen(true); }} 
                      className="text-primary hover:underline"
                    >
                      Add a skill first
                    </button>
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Duration (minutes)</label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setQuickLogForm({ ...quickLogForm, duration: Math.max(1, quickLogForm.duration - 5) })}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quickLogForm.duration}
                    onChange={(e) => setQuickLogForm({ ...quickLogForm, duration: parseInt(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm text-center"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => setQuickLogForm({ ...quickLogForm, duration: quickLogForm.duration + 5 })}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setQuickLogForm({ ...quickLogForm, duration: mins })}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        quickLogForm.duration === mins 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!quickLogForm.skillId || skills.length === 0}
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
              >
                Log Learning
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {isEditLogOpen && editingLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Edit Session</h3>
              <button onClick={() => setIsEditLogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditLog} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill</label>
                <div className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border text-sm">
                  {editingLog.categoryIcon} {editingLog.skillName}
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-1">{editingLog.categoryTitle}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Duration (minutes)</label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditingLog({ ...editingLog, duration: Math.max(1, editingLog.duration - 5) })}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={editingLog.duration}
                    onChange={(e) => setEditingLog({ ...editingLog, duration: parseInt(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary/50 text-sm text-center font-semibold"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingLog({ ...editingLog, duration: editingLog.duration + 5 })}
                    className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEditingLog({ ...editingLog, duration: mins })}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        editingLog.duration === mins 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
