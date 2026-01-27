'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Clock, Trash2, X, Brain, Minus,
  Flame, ChevronRight, Pencil, Edit2, Play
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

// Minimal color system - thin accents only
const COLORS = [
  { name: 'violet', text: 'text-violet-500', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { name: 'blue', text: 'text-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { name: 'emerald', text: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { name: 'orange', text: 'text-orange-500', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { name: 'rose', text: 'text-rose-500', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { name: 'cyan', text: 'text-cyan-500', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { name: 'amber', text: 'text-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { name: 'pink', text: 'text-pink-500', bg: 'bg-pink-500', ring: 'ring-pink-500' },
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             <Brain className="text-primary" size={28} />
             Learning
          </h1>
          <p className="text-muted-foreground text-sm pl-1">Track your progress and skills</p>
        </div>
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          <span>Log Session</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={64} />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{formatDuration(todaysTotalMinutes)}</span>
              {todaysTotalMinutes > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={64} />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">This Week</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{formatDuration(weeklyTotalMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      {recentSkillStats.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground pl-1">Jump Back In</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentSkillStats.map((stat) => {
              const colors = getColorClasses(stat.categoryColor);
              const defaultDuration = getDefaultDuration(stat.skillId);
              return (
                <div
                  key={stat.skillId}
                  className="group relative p-4 rounded-2xl bg-card border border-border/40 hover:border-border/80 transition-all hover:shadow-md cursor-pointer flex items-center justify-between"
                  onClick={() => handleQuickAdd(stat)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-secondary/50", colors.text)}>
                      {stat.categoryIcon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {stat.skillName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(stat.totalMinutes)} total
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute right-4 bg-primary text-primary-foreground p-2 rounded-full shadow-lg scale-90 active:scale-95 transition-transform">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Today's Timeline */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground pl-1">Today's Sessions</h2>
        <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm">
          {todaysLogs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No learning logged today</h3>
              <p className="text-xs text-muted-foreground">Start a session to track your progress</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {todaysLogs.map((log) => {
                const colors = getColorClasses(log.categoryColor);
                return (
                  <div key={log._id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-secondary/30", colors.text)}>
                        {log.categoryIcon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{log.skillName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {log.categoryTitle}
                          <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                          {formatDuration(log.duration)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditLog(log)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Skills & Categories Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* All Skills */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-sm font-medium text-muted-foreground">My Skills</h2>
            <button onClick={() => setIsAddSkillOpen(true)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-2">
            {skills.map((skill) => {
              const colors = getColorClasses(skill.categoryColor);
              const stat = skillStats.find(s => s.skillId === skill._id);
              return (
                <div key={skill._id} className="p-3 rounded-xl bg-card border border-border/40 hover:border-border/80 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80">{skill.categoryIcon}</span>
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {stat && <span className="text-xs text-muted-foreground font-medium">{formatDuration(stat.totalMinutes)}</span>}
                    <button 
                      onClick={() => openEditSkill(skill)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground/60 hover:text-foreground transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            {skills.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center">
                 <p className="text-sm text-muted-foreground italic mb-3">No skills added yet</p>
                 <button onClick={() => setIsAddSkillOpen(true)} className="text-xs text-primary hover:underline">Add your first skill</button>
              </div>
            )}
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-sm font-medium text-muted-foreground">Categories</h2>
            <button onClick={() => setIsAddCategoryOpen(true)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const colors = getColorClasses(cat.color);
              const count = skills.filter(s => s.categoryId === cat._id).length;
              return (
                <div key={cat._id} className={cn("px-3 py-1.5 rounded-full border border-border/60 bg-card text-xs font-medium flex items-center gap-2 transition-colors hover:border-border cursor-default")}>
                  <span className={cn("w-2 h-2 rounded-full", colors.bg)} />
                  {cat.title}
                  <span className="text-muted-foreground/60 text-[10px] ml-0.5">{count}</span>
                </div>
              );
            })}
             {categories.length === 0 && (
              <div className="w-full p-8 rounded-2xl border border-dashed border-border/60 text-center">
                 <p className="text-sm text-muted-foreground italic mb-3">No categories added</p>
                 <button onClick={() => setIsAddCategoryOpen(true)} className="text-xs text-primary hover:underline">Add your first category</button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-center pt-8">
        <Link href="/reports/learning" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-5 py-2.5 rounded-full hover:bg-secondary/50 border border-transparent hover:border-border/30">
          View Detailed Reports <ChevronRight size={12} />
        </Link>
      </div>

      {/* Modals */}
      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">New Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                <input
                  value={newCategory.title}
                  onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                  placeholder="e.g. Design"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon</label>
                <input
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="🎨"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Color Tag</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, color: color.name })}
                      className={cn(
                        "w-6 h-6 rounded-full transition-all ring-offset-2 ring-offset-card",
                        color.bg,
                        newCategory.color === color.name ? "ring-2 ring-foreground scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity mt-2"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Skill Modal - Updated UI */}
      {isAddSkillOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">New Skill</h3>
              <button onClick={() => setIsAddSkillOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                <div className="relative">
                  <select
                    value={newSkill.categoryId}
                    onChange={(e) => setNewSkill({ ...newSkill, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.title}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" size={14} />
                  {categories.length === 0 && (
                     <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl">
                        <span className="text-xs text-muted-foreground">No categories available</span>
                     </div>
                  )}
                </div>
                {categories.length === 0 && (
                   <button type="button" onClick={() => { setIsAddSkillOpen(false); setIsAddCategoryOpen(true); }} className="text-xs text-primary hover:underline">Create a category first</button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill Name</label>
                <input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="e.g. Figma"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!newSkill.categoryId || !newSkill.name.trim()}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              >
                Add Skill
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Log Modal - Updated UI */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Log Session</h3>
              <button onClick={() => setIsQuickLogOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickLog} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Activity</label>
                <div className="relative">
                  <select
                    value={quickLogForm.skillId}
                    onChange={(e) => setQuickLogForm({ ...quickLogForm, skillId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none"
                  >
                    {skills.length === 0 ? (
                      <option value="">No skills available</option>
                    ) : (
                      skills.map((skill) => (
                        <option key={skill._id} value={skill._id}>
                          {skill.categoryIcon} {skill.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" size={14} />
                   {skills.length === 0 && (
                     <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl">
                        <span className="text-xs text-muted-foreground">No skills available</span>
                     </div>
                  )}
                </div>
                 {skills.length === 0 && (
                   <button type="button" onClick={() => { setIsQuickLogOpen(false); setIsAddSkillOpen(true); }} className="text-xs text-primary hover:underline">Add a skill first</button>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                   <div className="text-center">
                     <span className="text-5xl font-bold tracking-tighter text-foreground">{quickLogForm.duration}</span>
                     <span className="text-muted-foreground font-medium ml-1">min</span>
                   </div>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuickLogForm({ ...quickLogForm, duration: Math.max(5, quickLogForm.duration - 5) })}
                    className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex gap-2">
                     {[15, 30, 60].map(m => (
                       <button
                         key={m}
                         type="button"
                         onClick={() => setQuickLogForm({ ...quickLogForm, duration: m })}
                         className={cn(
                           "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                           quickLogForm.duration === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                         )}
                       >
                         {m}m
                       </button>
                     ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickLogForm({ ...quickLogForm, duration: quickLogForm.duration + 5 })}
                    className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!quickLogForm.skillId || skills.length === 0}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none mt-2"
              >
                Log Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Log Modal - Updated */}
       {isEditLogOpen && editingLog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Edit Session</h3>
              <button onClick={() => setIsEditLogOpen(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            
             <div className="text-center py-2">
                <div className="text-2xl mb-1">{editingLog.categoryIcon}</div>
                <h4 className="font-semibold">{editingLog.skillName}</h4>
                <p className="text-xs text-muted-foreground">{editingLog.categoryTitle}</p>
             </div>

            <form onSubmit={handleEditLog} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                   <div className="text-center">
                     <span className="text-5xl font-bold tracking-tighter text-foreground">{editingLog.duration}</span>
                     <span className="text-muted-foreground font-medium ml-1">min</span>
                   </div>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                   <button
                    type="button"
                    onClick={() => setEditingLog({ ...editingLog, duration: Math.max(5, editingLog.duration - 5) })}
                    className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingLog({ ...editingLog, duration: editingLog.duration + 5 })}
                    className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
       
       {/* Edit Skill Modal */}
      {isEditSkillOpen && editingSkill && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6 w-full max-w-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Edit Skill</h3>
              <button onClick={() => { setIsEditSkillOpen(false); setEditingSkill(null); }} className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSkill} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                <div className="relative">
                  <select
                    value={editingSkill.categoryId}
                    onChange={(e) => setEditingSkill({ ...editingSkill, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.title}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" size={14} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill Name</label>
                <input
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity mt-2"
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
