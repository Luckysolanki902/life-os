'use client';

import { useState, useTransition, useMemo } from 'react';
import { 
  Plus, Clock, Zap, ChevronRight, MoreHorizontal, X,
  Edit2, Trash2, BookOpen, Target, Flame, TrendingUp,
  Music, Code, Palette, Dumbbell, Brain, Sparkles, GraduationCap, Gamepad2,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocalDateString, dayjs } from '@/lib/date-utils';
import { 
  createArea, 
  createSkill, 
  createMedium,
  createLog,
  deleteArea,
  deleteSkill,
  deleteMedium
} from '../actions/learning';
import TaskItem from '@/app/routine/TaskItem';

// Types
interface RoutineTask {
  _id: string;
  title: string;
  domainId: string;
  basePoints: number;
  log?: { status: string } | null;
  [key: string]: unknown;
}

interface Log {
  _id: string;
  date: Date;
  duration: number;
  activities?: string;
  difficulty?: string;
  notes?: string;
  rating?: number;
}

interface Medium {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  logs: Log[];
  lastLog: { date: Date; duration: number; difficulty?: string } | null;
  totalSessions: number;
  totalMinutes: number;
}

interface Skill {
  _id: string;
  title: string;
  description?: string;
  mediums: Medium[];
}

interface Area {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  skills: Skill[];
  totalMinutes: number;
}

interface RecentLog extends Log {
  mediumTitle: string;
  mediumIcon?: string;
  areaTitle: string;
  areaColor?: string;
}

// Constants
const AREA_COLORS = [
  { name: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-400', accent: 'bg-purple-500', border: 'border-purple-500/30' },
  { name: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-400', accent: 'bg-blue-500', border: 'border-blue-500/30' },
  { name: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', accent: 'bg-emerald-500', border: 'border-emerald-500/30' },
  { name: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-400', accent: 'bg-orange-500', border: 'border-orange-500/30' },
  { name: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-400', accent: 'bg-rose-500', border: 'border-rose-500/30' },
  { name: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-400', accent: 'bg-cyan-500', border: 'border-cyan-500/30' },
];

const AREA_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  music: Music,
  code: Code,
  art: Palette,
  fitness: Dumbbell,
  mind: Brain,
  creative: Sparkles,
  academic: GraduationCap,
  gaming: Gamepad2,
};

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'text-emerald-400' },
  { value: 'moderate', label: 'Medium', color: 'text-yellow-400' },
  { value: 'challenging', label: 'Hard', color: 'text-orange-400' },
  { value: 'intense', label: 'Intense', color: 'text-rose-400' },
];

// Helpers
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatRelativeDate = (dateStr: string) => {
  const date = dayjs(dateStr).tz('Asia/Kolkata');
  const now = dayjs().tz('Asia/Kolkata');
  const diffDays = now.startOf('day').diff(date.startOf('day'), 'day');
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const getAreaColor = (colorName?: string) => {
  return AREA_COLORS.find(c => c.name === colorName) || AREA_COLORS[0];
};

// Component
export default function LearningClient({ 
  areas: initialAreas,
  recentActivity = [],
  routine = []
}: { 
  areas: Area[];
  recentActivity?: RecentLog[];
  routine?: RoutineTask[];
}) {
  const [areas] = useState(initialAreas);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isMediumModalOpen, setIsMediumModalOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState<(Log & { mediumTitle: string; mediumIcon?: string }) | null>(null);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ type: string; id: string; areaId?: string; skillId?: string; x: number; y: number } | null>(null);

  // Selected IDs for creating nested items
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // Form states
  const [newArea, setNewArea] = useState({ title: '', description: '', color: 'purple', icon: 'mind' });
  const [newSkill, setNewSkill] = useState({ title: '', description: '' });
  const [newMedium, setNewMedium] = useState({ title: '', icon: '' });
  
  // Quick Log states
  const [quickLogData, setQuickLogData] = useState({ mediumId: '', duration: 30, difficulty: 'moderate' });
  const [mediumSearch, setMediumSearch] = useState('');
  const [isMediumDropdownOpen, setIsMediumDropdownOpen] = useState(false);

  // Get all mediums flattened for quick log
  const allMediums = useMemo(() => {
    return areas.flatMap(area => 
      area.skills.flatMap(skill => 
        skill.mediums.map(medium => ({
          ...medium,
          skillId: skill._id,
          skillTitle: skill.title,
          areaId: area._id,
          areaTitle: area.title,
          areaColor: area.color
        }))
      )
    );
  }, [areas]);

  const filteredMediums = useMemo(() => {
    if (!mediumSearch) return allMediums;
    const search = mediumSearch.toLowerCase();
    return allMediums.filter(m => 
      m.title.toLowerCase().includes(search) || 
      m.areaTitle.toLowerCase().includes(search) ||
      m.skillTitle.toLowerCase().includes(search)
    );
  }, [allMediums, mediumSearch]);

  const selectedMedium = allMediums.find(m => m._id === quickLogData.mediumId);

  // Get active/recent mediums (practiced in last 7 days)
  const activeMediums = useMemo(() => {
    const sevenDaysAgo = dayjs().tz('Asia/Kolkata').subtract(7, 'day').toDate();
    
    return allMediums
      .filter(m => m.lastLog && new Date(m.lastLog.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.lastLog!.date).getTime() - new Date(a.lastLog!.date).getTime());
  }, [allMediums]);

  // Total stats
  const totalStats = useMemo(() => {
    const totalMinutes = areas.reduce((sum, a) => sum + a.totalMinutes, 0);
    const totalSessions = allMediums.reduce((sum, m) => sum + m.totalSessions, 0);
    const totalMediums = allMediums.length;
    return { totalMinutes, totalSessions, totalMediums };
  }, [areas, allMediums]);

  // Handlers
  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.title.trim()) return;
    
    startTransition(async () => {
      await createArea(newArea);
      setNewArea({ title: '', description: '', color: 'purple', icon: 'mind' });
      setIsAreaModalOpen(false);
    });
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.title.trim() || !selectedAreaId) return;
    
    startTransition(async () => {
      await createSkill({ ...newSkill, areaId: selectedAreaId });
      setNewSkill({ title: '', description: '' });
      setIsSkillModalOpen(false);
      setSelectedAreaId(null);
    });
  };

  const handleCreateMedium = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedium.title.trim() || !selectedSkillId) return;
    
    startTransition(async () => {
      await createMedium({ ...newMedium, skillId: selectedSkillId });
      setNewMedium({ title: '', icon: '' });
      setIsMediumModalOpen(false);
      setSelectedSkillId(null);
    });
  };

  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogData.mediumId) return;
    
    startTransition(async () => {
      await createLog({
        mediumId: quickLogData.mediumId,
        date: getLocalDateString(),
        duration: quickLogData.duration,
        difficulty: quickLogData.difficulty
      });
      setQuickLogData({ mediumId: '', duration: 30, difficulty: 'moderate' });
      setIsQuickLogOpen(false);
      setMediumSearch('');
    });
  };

  const handleLogMedium = (mediumId: string) => {
    setQuickLogData({ ...quickLogData, mediumId });
    setIsQuickLogOpen(true);
  };

  const handleDelete = (type: string, id: string) => {
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    
    startTransition(async () => {
      if (type === 'area') await deleteArea(id);
      if (type === 'skill') await deleteSkill(id);
      if (type === 'medium') await deleteMedium(id);
      setContextMenu(null);
    });
  };

  const openAddSkill = (areaId: string) => {
    setSelectedAreaId(areaId);
    setIsSkillModalOpen(true);
  };

  const openAddMedium = (skillId: string) => {
    setSelectedSkillId(skillId);
    setIsMediumModalOpen(true);
  };

  return (
    <div className="min-h-screen p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning</h1>
          <p className="text-sm text-muted-foreground">Track your practice & progress</p>
        </div>
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
        >
          <Zap size={18} />
          Quick Log
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock size={14} />
            <span className="text-xs">Total Time</span>
          </div>
          <p className="text-xl font-bold">{formatDuration(totalStats.totalMinutes)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame size={14} />
            <span className="text-xs">Sessions</span>
          </div>
          <p className="text-xl font-bold">{totalStats.totalSessions}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target size={14} />
            <span className="text-xs">Mediums</span>
          </div>
          <p className="text-xl font-bold">{totalStats.totalMediums}</p>
        </div>
      </div>

      {/* Today's Learning Tasks */}
      {routine.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ListChecks size={18} className="text-amber-400" />
              Today&apos;s Learning Tasks
            </h2>
            <span className="text-xs text-muted-foreground">
              {routine.filter(t => t.log?.status === 'completed').length}/{routine.length} done
            </span>
          </div>
          <div className="space-y-2">
            {routine.map((task) => (
              <TaskItem key={task._id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Currently Practicing */}
      {activeMediums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Currently Practicing
            </h2>
            <span className="text-xs text-muted-foreground">{activeMediums.length} active</span>
          </div>
          <div className="space-y-2">
            {activeMediums.slice(0, 5).map((medium) => {
              const color = getAreaColor(medium.areaColor);
              return (
                <div
                  key={medium._id}
                  className={cn(
                    "bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors",
                    "flex items-center gap-3"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg", color.bg)}>
                    {medium.icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{medium.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {medium.skillTitle} • {medium.areaTitle}
                    </p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium">{formatDuration(medium.totalMinutes)}</p>
                    <p className="text-xs text-muted-foreground">
                      {medium.lastLog ? formatRelativeDate(medium.lastLog.date.toString()) : 'No logs'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLogMedium(medium._id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      color.bg, color.text, "hover:opacity-80"
                    )}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Learning Areas */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            Learning Areas
          </h2>
          <button
            onClick={() => setIsAreaModalOpen(true)}
            className="text-sm text-primary flex items-center gap-1 hover:underline"
          >
            <Plus size={14} />
            Add Area
          </button>
        </div>

        {areas.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-dashed border-border">
            <GraduationCap size={40} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">No learning areas yet</p>
            <button
              onClick={() => setIsAreaModalOpen(true)}
              className="text-primary font-medium hover:underline"
            >
              Create your first area
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {areas.map((area) => {
              const color = getAreaColor(area.color);
              const IconComponent = AREA_ICONS[area.icon || 'mind'] || Brain;
              
              return (
                <div key={area._id} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                  {/* Area Header */}
                  <div className={cn("p-4 border-b border-border/50", color.bg)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color.accent, "text-white")}>
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{area.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {area.skills.length} skills • {formatDuration(area.totalMinutes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAddSkill(area._id)}
                          className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Add Skill"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={(e) => setContextMenu({ type: 'area', id: area._id, x: e.clientX, y: e.clientY })}
                          className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills & Mediums */}
                  <div className="divide-y divide-border/30">
                    {area.skills.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">No skills yet</p>
                        <button
                          onClick={() => openAddSkill(area._id)}
                          className="text-sm text-primary mt-1 hover:underline"
                        >
                          Add a skill
                        </button>
                      </div>
                    ) : (
                      area.skills.map((skill) => (
                        <div key={skill._id} className="p-3">
                          {/* Skill Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Target size={14} className={color.text} />
                              <span className="font-medium text-sm">{skill.title}</span>
                              <span className="text-xs text-muted-foreground">
                                ({skill.mediums.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openAddMedium(skill._id)}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="Add Medium"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                onClick={(e) => setContextMenu({ type: 'skill', id: skill._id, areaId: area._id, x: e.clientX, y: e.clientY })}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Mediums Grid */}
                          {skill.mediums.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-5">
                              {skill.mediums.map((medium) => (
                                <div
                                  key={medium._id}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                                  )}
                                >
                                  <span className="text-lg">{medium.icon || '📚'}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{medium.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {medium.totalSessions} sessions • {formatDuration(medium.totalMinutes)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleLogMedium(medium._id)}
                                    className={cn(
                                      "p-1.5 rounded-lg transition-all",
                                      "opacity-0 group-hover:opacity-100",
                                      color.bg, color.text
                                    )}
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => setContextMenu({ type: 'medium', id: medium._id, skillId: skill._id, x: e.clientX, y: e.clientY })}
                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground ml-5">
                              No practice mediums yet
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} className="text-blue-400" />
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 5).map((log) => {
              const color = getAreaColor(log.areaColor);
              return (
                <button
                  key={log._id}
                  onClick={() => setViewingLog({ ...log, mediumTitle: log.mediumTitle, mediumIcon: log.mediumIcon })}
                  className="w-full bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors flex items-center gap-3 text-left"
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-base", color.bg)}>
                    {log.mediumIcon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{log.mediumTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(log.date.toString())} • {formatDuration(log.duration)}
                      {log.difficulty && (
                        <span className={cn(
                          "ml-1",
                          log.difficulty === 'easy' && 'text-emerald-400',
                          log.difficulty === 'moderate' && 'text-yellow-400',
                          log.difficulty === 'challenging' && 'text-orange-400',
                          log.difficulty === 'intense' && 'text-rose-400'
                        )}>
                          • {log.difficulty}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div 
            className="fixed z-50 bg-card rounded-xl border border-border shadow-xl py-1 min-w-35 animate-in zoom-in-95"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 160), top: contextMenu.y }}
          >
            <button
              onClick={() => {
                setContextMenu(null);
                // TODO: Open edit modal
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => handleDelete(contextMenu.type, contextMenu.id)}
              className="w-full px-3 py-2 text-sm text-left hover:bg-secondary text-rose-400 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Create Area Modal */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Learning Area</h3>
              <button onClick={() => setIsAreaModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateArea} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Area Name</label>
                <input
                  value={newArea.title}
                  onChange={(e) => setNewArea({ ...newArea, title: e.target.value })}
                  placeholder="e.g. Music, Programming, Fitness"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Description (optional)</label>
                <input
                  value={newArea.description}
                  onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Color</label>
                <div className="flex gap-2 mt-1">
                  {AREA_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewArea({ ...newArea, color: color.name })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.accent,
                        newArea.color === color.name ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                      )}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.entries(AREA_ICONS).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewArea({ ...newArea, icon: key })}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        newArea.icon === key ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Skill Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Skill</h3>
              <button onClick={() => setIsSkillModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Skill Name</label>
                <input
                  value={newSkill.title}
                  onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })}
                  placeholder="e.g. Rhythm Control, Pattern Recognition"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Description (optional)</label>
                <input
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="What capability is being trained?"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Medium Modal */}
      {isMediumModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Practice Medium</h3>
              <button onClick={() => setIsMediumModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMedium} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Medium Name</label>
                <input
                  value={newMedium.title}
                  onChange={(e) => setNewMedium({ ...newMedium, title: e.target.value })}
                  placeholder="e.g. Guitar, Pandas, Boxing Drills"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon (emoji)</label>
                <input
                  value={newMedium.icon}
                  onChange={(e) => setNewMedium({ ...newMedium, icon: e.target.value })}
                  placeholder="🎸"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMediumModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} />
                Quick Log
              </h3>
              <button onClick={() => { setIsQuickLogOpen(false); setMediumSearch(''); setIsMediumDropdownOpen(false); }} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleQuickLog} className="space-y-4">
              <div className="relative">
                <label className="text-xs font-medium text-muted-foreground ml-1">What did you practice?</label>
                
                <div 
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-within:ring-2 focus-within:ring-primary/20 cursor-pointer"
                  onClick={() => setIsMediumDropdownOpen(true)}
                >
                  {isMediumDropdownOpen ? (
                    <input
                      type="text"
                      value={mediumSearch}
                      onChange={(e) => setMediumSearch(e.target.value)}
                      placeholder="Search mediums..."
                      autoFocus
                      className="w-full bg-transparent outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : selectedMedium ? (
                    <div className="flex items-center gap-2">
                      <span>{selectedMedium.icon || '📚'}</span>
                      <span className="font-medium">{selectedMedium.title}</span>
                      <span className="text-muted-foreground text-xs">({selectedMedium.areaTitle})</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Search or select medium...</span>
                  )}
                </div>
                
                {isMediumDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => { setIsMediumDropdownOpen(false); setMediumSearch(''); }} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                      {filteredMediums.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          No mediums found
                        </div>
                      ) : (
                        filteredMediums.map((medium) => (
                          <button
                            key={medium._id}
                            type="button"
                            onClick={() => {
                              setQuickLogData({ ...quickLogData, mediumId: medium._id });
                              setIsMediumDropdownOpen(false);
                              setMediumSearch('');
                            }}
                            className={cn(
                              "w-full px-3 py-2.5 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2",
                              quickLogData.mediumId === medium._id && "bg-primary/10"
                            )}
                          >
                            <span className="text-base">{medium.icon || '📚'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{medium.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {medium.skillTitle} • {medium.areaTitle}
                                {medium.lastLog && (
                                  <span className="ml-1">• {formatRelativeDate(medium.lastLog.date.toString())}</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Duration</label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-1">
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setQuickLogData({ ...quickLogData, duration: mins })}
                      className={cn(
                        "py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
                        quickLogData.duration === mins 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Difficulty</label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-1">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuickLogData({ ...quickLogData, difficulty: opt.value })}
                      className={cn(
                        "py-2.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all",
                        quickLogData.difficulty === opt.value 
                          ? `${opt.color} bg-current/10 ring-1 ring-current` 
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickLogOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickLogData.mediumId || isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {viewingLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{viewingLog.mediumIcon || '📚'}</span>
                <h3 className="text-lg font-semibold">{viewingLog.mediumTitle}</h3>
              </div>
              <button onClick={() => setViewingLog(null)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span className="font-medium">
                  {new Date(viewingLog.date).toLocaleDateString('en-IN', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata'
                  })}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                  <p className="text-lg font-bold">{formatDuration(viewingLog.duration)}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Difficulty</p>
                  <p className={cn(
                    "text-lg font-bold capitalize",
                    viewingLog.difficulty === 'easy' ? "text-emerald-400" :
                    viewingLog.difficulty === 'moderate' ? "text-yellow-400" :
                    viewingLog.difficulty === 'challenging' ? "text-orange-400" :
                    "text-rose-400"
                  )}>
                    {viewingLog.difficulty || '-'}
                  </p>
                </div>
              </div>
              
              {viewingLog.activities && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">What was practiced</p>
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm">
                    {viewingLog.activities}
                  </div>
                </div>
              )}
              
              {viewingLog.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                    {viewingLog.notes}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setViewingLog(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
