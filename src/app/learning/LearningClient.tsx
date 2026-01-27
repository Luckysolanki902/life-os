'use client';

import { useState, useMemo } from 'react';
import { 
  BookOpen, Plus, Clock, ChevronRight, ChevronDown, Play, 
  Target, Zap, MoreVertical, Edit2, Trash2, X,
  Brain, Music, Code, Palette, Dumbbell, Languages, Eye, EyeOff
} from 'lucide-react';
import { 
  createArea, updateArea, deleteArea,
  createSkill, updateSkill, deleteSkill,
  createMedium, updateMedium, deleteMedium,
  createLog, quickLog
} from '@/app/actions/learning';
import TaskItem from '@/app/routine/TaskItem';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getLocalDateString, dayjs } from '@/lib/date-utils';

interface Task {
  _id: string;
  title: string;
  log?: {
    status?: 'completed' | 'skipped';
    [key: string]: unknown;
  };
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
  icon?: string;
  totalSessions: number;
  totalMinutes: number;
  logs: Log[];
  lastLog?: {
    date: Date;
    duration: number;
    difficulty?: string;
  } | null;
}

interface Skill {
  _id: string;
  title: string;
  mediums: Medium[];
}

interface Area {
  _id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  totalMinutes: number;
  skills: Skill[];
}

interface EnrichedLog {
  _id: string;
  date: Date;
  duration: number;
  medium: { title: string; icon?: string };
  skill: { title: string };
  area: { title: string; color?: string };
  activities?: string;
  difficulty?: string;
  notes?: string;
  rating?: number;
  mediumTitle?: string;
  mediumIcon?: string;
  mediumId?: string;
  [key: string]: unknown;
}

interface LearningClientProps {
  initialData: {
    areas: Area[];
    routine: Task[];
    recentLogs: (EnrichedLog | null)[];
  };
}

const AREA_COLORS = [
  { name: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', accent: 'bg-purple-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  { name: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500' },
  { name: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
];

const AREA_ICONS: Record<string, typeof BookOpen> = {
  music: Music,
  code: Code,
  brain: Brain,
  art: Palette,
  fitness: Dumbbell,
  language: Languages,
  default: BookOpen
};

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'text-emerald-400' },
  { value: 'moderate', label: 'Moderate', color: 'text-yellow-400' },
  { value: 'challenging', label: 'Challenging', color: 'text-orange-400' },
  { value: 'hard', label: 'Hard', color: 'text-rose-400' },
];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatRelativeDate(dateStr: string): string {
  const date = dayjs(dateStr).tz('Asia/Kolkata');
  const now = dayjs().tz('Asia/Kolkata');
  const diffDays = now.startOf('day').diff(date.startOf('day'), 'day');
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.format('D MMM');
}

function getColorClasses(colorName: string) {
  return AREA_COLORS.find(c => c.name === colorName) || AREA_COLORS[0];
}

export default function LearningClient({ initialData }: LearningClientProps) {
  const router = useRouter();
  const { areas, routine, recentLogs: rawRecentLogs } = initialData;
  const recentLogs = rawRecentLogs.filter((log): log is EnrichedLog => log !== null);
  
  // UI States
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set(areas.map((a) => a._id)));
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [expandedMediums, setExpandedMediums] = useState<Set<string>>(new Set());
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
  
  // Modal States
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isMediumModalOpen, setIsMediumModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  
  // Form States
  const [newArea, setNewArea] = useState({ title: '', description: '', icon: 'default', color: 'blue' });
  const [newSkill, setNewSkill] = useState({ areaId: '', title: '', description: '' });
  const [newMedium, setNewMedium] = useState({ skillId: '', title: '', description: '', icon: '' });
  const [newLog, setNewLog] = useState({ 
    mediumId: '', 
    date: getLocalDateString(), 
    duration: 30, 
    activities: '', 
    difficulty: 'moderate',
    notes: ''
  });
  const [quickLogData, setQuickLogData] = useState({ mediumId: '', duration: 30, difficulty: 'moderate' });
  const [mediumSearch, setMediumSearch] = useState('');
  const [isMediumDropdownOpen, setIsMediumDropdownOpen] = useState(false);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ type: string; id: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: string; id: string; title: string } | null>(null);
  const [viewingLog, setViewingLog] = useState<EnrichedLog | null>(null);

  // Toggle functions
  function toggleArea(areaId: string) {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  function toggleSkill(skillId: string) {
    setExpandedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }

  function toggleMedium(mediumId: string) {
    setExpandedMediums(prev => {
      const next = new Set(prev);
      if (next.has(mediumId)) next.delete(mediumId);
      else next.add(mediumId);
      return next;
    });
  }

  // Handlers
  async function handleCreateArea(e: React.FormEvent) {
    e.preventDefault();
    if (!newArea.title.trim()) return;
    await createArea(newArea);
    setNewArea({ title: '', description: '', icon: 'default', color: 'blue' });
    setIsAreaModalOpen(false);
    router.refresh();
  }

  async function handleCreateSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkill.title.trim() || !newSkill.areaId) return;
    await createSkill(newSkill);
    setNewSkill({ areaId: '', title: '', description: '' });
    setIsSkillModalOpen(false);
    router.refresh();
  }

  async function handleCreateMedium(e: React.FormEvent) {
    e.preventDefault();
    if (!newMedium.title.trim() || !newMedium.skillId) return;
    await createMedium(newMedium);
    setNewMedium({ skillId: '', title: '', description: '', icon: '' });
    setIsMediumModalOpen(false);
    router.refresh();
  }

  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault();
    if (!newLog.mediumId || newLog.duration <= 0) return;
    await createLog(newLog);
    setNewLog({ 
      mediumId: '', 
      date: getLocalDateString(), 
      duration: 30, 
      activities: '', 
      difficulty: 'moderate',
      notes: ''
    });
    setIsLogModalOpen(false);
    router.refresh();
  }

  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault();
    if (!quickLogData.mediumId || quickLogData.duration <= 0) return;
    await quickLog(quickLogData.mediumId, quickLogData.duration, quickLogData.difficulty);
    setQuickLogData({ mediumId: '', duration: 30, difficulty: 'moderate' });
    setIsQuickLogOpen(false);
    router.refresh();
  }

  async function handleDelete(type: string, id: string) {
    const confirmText = type === 'area' ? 'This will delete all skills, mediums, and logs within this area.' 
      : type === 'skill' ? 'This will delete all mediums and logs within this skill.'
      : 'This will delete all logs for this medium.';
    
    if (!confirm(`Are you sure? ${confirmText}`)) return;
    
    if (type === 'area') await deleteArea(id);
    else if (type === 'skill') await deleteSkill(id);
    else if (type === 'medium') await deleteMedium(id);
    
    setContextMenu(null);
    router.refresh();
  }

  async function handleRename(type: string, id: string, newTitle: string) {
    if (!newTitle.trim()) return;
    
    if (type === 'area') await updateArea(id, { title: newTitle });
    else if (type === 'skill') await updateSkill(id, { title: newTitle });
    else if (type === 'medium') await updateMedium(id, { title: newTitle });
    
    setEditingItem(null);
    router.refresh();
  }

  // Get all mediums for quick log, sorted by last log date
  const allMediums = areas.flatMap((area) => 
    area.skills.flatMap((skill) => 
      skill.mediums.map((medium) => ({
        ...medium,
        skillTitle: skill.title,
        areaTitle: area.title,
        areaColor: area.color
      }))
    )
  ).sort((a, b) => {
    // Sort by last log date, most recent first. Items without logs go to the end.
    const aDate = a.lastLog?.date ? new Date(a.lastLog.date).getTime() : 0;
    const bDate = b.lastLog?.date ? new Date(b.lastLog.date).getTime() : 0;
    return bDate - aDate;
  });

  // Filter mediums based on search
  const filteredMediums = allMediums.filter((m) => 
    m.title.toLowerCase().includes(mediumSearch.toLowerCase()) ||
    m.areaTitle.toLowerCase().includes(mediumSearch.toLowerCase()) ||
    m.skillTitle.toLowerCase().includes(mediumSearch.toLowerCase())
  );

  // Get selected medium for display
  const selectedMedium = allMediums.find((m) => m._id === quickLogData.mediumId);

  return (
    <div className="space-y-6 pb-20">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning</h1>
          <p className="text-sm text-muted-foreground">Track your skills</p>
        </div>
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          + Log
        </button>
      </div>

      {/* Today's Learning Tasks - Minimal */}
      {routine.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Today</h2>
          <div className="space-y-2">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <TaskItem key={task._id} task={task} />
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-border/50 text-center text-sm">
                <p className="font-medium">All done! 🎉</p>
              </div>
            )}
          </div>
          
          {/* Show/hide completed tasks */}
          {doneTasks.length > 0 && (
            <button
              onClick={() => setShowDoneTasks(!showDoneTasks)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {showDoneTasks ? <EyeOff size={14} /> : <Eye size={14} />}
              {showDoneTasks ? "Hide" : "Show"} completed ({doneTasks.length})
            </button>
          )}
          {skippedTasks.length > 0 && (
            <button
              onClick={() => setShowSkippedTasks(!showSkippedTasks)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {showSkippedTasks ? <EyeOff size={14} /> : <Eye size={14} />}
              {showSkippedTasks ? "Hide" : "Show"} skipped ({skippedTasks.length})
            </button>
          )}
        
        {/* Done tasks (collapsed by default) */}
        {showDoneTasks && doneTasks.length > 0 && (
          <div className="space-y-2 opacity-60">
            {doneTasks.map((task) => <TaskItem key={task._id} task={task} />)}
          </div>
        )}
        
        {/* Skipped tasks (collapsed by default) */}
        {showSkippedTasks && skippedTasks.length > 0 && (
          <div className="space-y-2 opacity-60">
            {skippedTasks.map((task) => <TaskItem key={task._id} task={task} />)}
          </div>
        )}
        </section>
      )}

      {/* Learning Areas - Minimal */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Skills</h2>
          <button
            onClick={() => setIsAreaModalOpen(true)}
            className="text-sm text-primary hover:underline"
          >
            + Area
          </button>
        </div>
        
        {areas.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card border border-border/50 text-center space-y-3">
            <Target className="mx-auto text-muted-foreground" size={32} />
            <div>
              <p className="font-medium">No areas yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first learning area</p>
            </div>
            <button
              onClick={() => setIsAreaModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Create Area
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {areas.map((area) => {
              const IconComponent = AREA_ICONS[area.icon || 'default'] || AREA_ICONS.default;
              const isExpanded = expandedAreas.has(area._id);
              
              return (
                <div key={area._id} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                  {/* Area Header - Minimal */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => toggleArea(area._id)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={20} className="text-muted-foreground" />
                      <div className="flex-1">
                        {editingItem?.type === 'area' && editingItem.id === area._id ? (
                          <input
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename('area', area._id, editingItem.title);
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="bg-transparent border-b border-primary outline-none font-medium"
                          />
                        ) : (
                          <h3 className="font-semibold">{area.title}</h3>
                        )}
                        {area.totalMinutes > 0 && (
                          <p className="text-xs text-muted-foreground">{formatDuration(area.totalMinutes)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewSkill({ ...newSkill, areaId: area._id });
                          setIsSkillModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(contextMenu?.id === area._id ? null : { type: 'area', id: area._id });
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {contextMenu?.type === 'area' && contextMenu.id === area._id && (
                          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-10 min-w-35 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({ type: 'area', id: area._id, title: area.title });
                                setContextMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Edit2 size={14} /> Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('area', area._id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-rose-400"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                  
                  {/* Skills - Minimal */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {area.skills.length === 0 ? (
                        <button
                          onClick={() => {
                            setNewSkill({ ...newSkill, areaId: area._id });
                            setIsSkillModalOpen(true);
                          }}
                          className="w-full p-3 rounded-xl border border-dashed border-border/30 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Add skill
                        </button>
                      ) : (
                        area.skills.map((skill) => {
                          const isSkillExpanded = expandedSkills.has(skill._id);
                          
                          return (
                            <div key={skill._id} className="rounded-xl bg-secondary/30 overflow-hidden">
                              {/* Skill Header - Minimal */}
                              <div 
                                className="flex items-center justify-between p-2.5 hover:bg-secondary/50 cursor-pointer transition-colors"
                                onClick={() => toggleSkill(skill._id)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {editingItem?.type === 'skill' && editingItem.id === skill._id ? (
                                    <input
                                      value={editingItem.title}
                                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename('skill', skill._id, editingItem.title);
                                        if (e.key === 'Escape') setEditingItem(null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      autoFocus
                                      className="bg-transparent border-b border-primary font-medium text-sm outline-none"
                                    />
                                  ) : (
                                    <span className="font-medium text-sm">{skill.title}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{skill.mediums.length} mediums</span>
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setContextMenu(contextMenu?.id === skill._id ? null : { type: 'skill', id: skill._id });
                                      }}
                                      className="p-1 rounded hover:bg-secondary/50 text-muted-foreground"
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                    {contextMenu?.type === 'skill' && contextMenu.id === skill._id && (
                                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-10 min-w-35 overflow-hidden">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNewMedium({ ...newMedium, skillId: skill._id });
                                            setIsMediumModalOpen(true);
                                            setContextMenu(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                                        >
                                          <Plus size={14} /> Add Medium
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingItem({ type: 'skill', id: skill._id, title: skill.title });
                                            setContextMenu(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                                        >
                                          <Edit2 size={14} /> Rename
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete('skill', skill._id);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-rose-400"
                                        >
                                          <Trash2 size={14} /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {isSkillExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                              </div>
                              
                              {/* Mediums */}
                              {isSkillExpanded && (
                                <div className="px-3 pb-3 space-y-1.5">
                                  {skill.mediums.length === 0 ? (
                                    <button
                                      onClick={() => {
                                        setNewMedium({ ...newMedium, skillId: skill._id });
                                        setIsMediumModalOpen(true);
                                      }}
                                      className="w-full p-2 rounded-lg border border-dashed border-border/30 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Plus size={12} /> Add medium
                                    </button>
                                  ) : (
                                    skill.mediums.map((medium) => {
                                      const isMediumExpanded = expandedMediums.has(medium._id);
                                      
                                      return (
                                        <div 
                                          key={medium._id}
                                          className="rounded-lg bg-secondary/30 overflow-hidden"
                                        >
                                          {/* Medium Header */}
                                          <div 
                                            className="flex items-center justify-between p-2.5 hover:bg-secondary/50 transition-colors group cursor-pointer"
                                            onClick={() => toggleMedium(medium._id)}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="text-base">{medium.icon || '📚'}</span>
                                              {editingItem?.type === 'medium' && editingItem.id === medium._id ? (
                                                <input
                                                  value={editingItem.title}
                                                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename('medium', medium._id, editingItem.title);
                                                    if (e.key === 'Escape') setEditingItem(null);
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  autoFocus
                                                  className="bg-transparent border-b border-primary text-sm outline-none"
                                                />
                                              ) : (
                                                <span className="text-sm font-medium">{medium.title}</span>
                                              )}
                                              {medium.totalSessions > 0 && (
                                                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                  {medium.totalSessions} sessions
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {medium.lastLog && (
                                                <span className="text-xs text-muted-foreground">
                                                  {formatRelativeDate(medium.lastLog.date.toISOString())}
                                                </span>
                                              )}
                                              <span className="text-xs text-muted-foreground font-medium">
                                                {formatDuration(medium.totalMinutes)}
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNewLog({ ...newLog, mediumId: medium._id });
                                                  setIsLogModalOpen(true);
                                                }}
                                                className="p-1 rounded hover:bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Plus size={14} />
                                              </button>
                                              <div className="relative">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContextMenu(contextMenu?.id === medium._id ? null : { type: 'medium', id: medium._id });
                                                  }}
                                                  className="p-1 rounded hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <MoreVertical size={14} />
                                                </button>
                                                {contextMenu?.type === 'medium' && contextMenu.id === medium._id && (
                                                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-10 min-w-30 overflow-hidden">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingItem({ type: 'medium', id: medium._id, title: medium.title });
                                                        setContextMenu(null);
                                                      }}
                                                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                                                    >
                                                      <Edit2 size={14} /> Rename
                                                    </button>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete('medium', medium._id);
                                                      }}
                                                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-rose-400"
                                                    >
                                                      <Trash2 size={14} /> Delete
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                              {isMediumExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                          </div>
                                          
                                          {/* Logs List */}
                                          {isMediumExpanded && (
                                            <div className="px-2.5 pb-2.5 space-y-1">
                                              {medium.logs && medium.logs.length > 0 ? (
                                                medium.logs.map((log) => (
                                                  <button 
                                                    key={log._id}
                                                    onClick={() => setViewingLog({ ...log, mediumTitle: medium.title, mediumIcon: medium.icon } as EnrichedLog)}
                                                    className="w-full flex items-center justify-between p-2 rounded-md bg-background/50 hover:bg-background/80 text-xs transition-colors text-left"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <Clock size={12} className="text-muted-foreground" />
                                                      <span className="text-muted-foreground">
                                                        {new Date(log.date).toLocaleDateString('en-IN', { 
                                                          day: 'numeric', 
                                                          month: 'short',
                                                          timeZone: 'Asia/Kolkata'
                                                        })}
                                                      </span>
                                                      <span className="font-medium">{formatDuration(log.duration)}</span>
                                                      {log.activities && (
                                                        <span className="text-muted-foreground truncate max-w-37.5">
                                                          • {log.activities}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                        log.difficulty === 'easy' ? "bg-emerald-500/20 text-emerald-400" :
                                                        log.difficulty === 'moderate' ? "bg-yellow-500/20 text-yellow-400" :
                                                        log.difficulty === 'challenging' ? "bg-orange-500/20 text-orange-400" :
                                                        "bg-rose-500/20 text-rose-400"
                                                      )}>
                                                        {log.difficulty}
                                                      </span>
                                                      <ChevronRight size={12} className="text-muted-foreground" />
                                                    </div>
                                                  </button>
                                                ))
                                              ) : (
                                                <div className="text-xs text-muted-foreground text-center py-2">
                                                  No logs yet
                                                </div>
                                              )}
                                              
                                              {/* Quick add log button inside */}
                                              <button
                                                onClick={() => {
                                                  setNewLog({ ...newLog, mediumId: medium._id });
                                                  setIsLogModalOpen(true);
                                                }}
                                                className="w-full p-1.5 rounded-md border border-dashed border-border/30 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                                              >
                                                <Plus size={12} /> Log session
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock size={14} />
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentLogs.slice(0, 5).map((log) => {
              const colorClasses = getColorClasses(log.area.color || 'blue');
              return (
                <div 
                  key={log._id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-card border border-border/50 gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={cn("w-1 h-8 rounded-full shrink-0", colorClasses.accent)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="shrink-0">{log.medium.icon || '📚'}</span>
                        <span className="font-medium text-xs sm:text-sm truncate">{log.medium.title}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{log.skill.title} • {log.area.title}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-xs sm:text-sm">{formatDuration(log.duration)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{formatRelativeDate(log.date.toISOString())}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modals */}
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
                  placeholder="e.g. Music, Software Engineering"
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
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
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
                  placeholder="e.g. Rhythm Control, Pattern Recognition, Dayjs"
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
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
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
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Practice Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Practice Session</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Date</label>
                <input
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 scheme-dark"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={newLog.duration}
                  onChange={(e) => setNewLog({ ...newLog, duration: Number(e.target.value) })}
                  min={1}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">What did you practice?</label>
                <textarea
                  value={newLog.activities}
                  onChange={(e) => setNewLog({ ...newLog, activities: e.target.value })}
                  placeholder="Drills, topics, exercises..."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Difficulty</label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-1">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewLog({ ...newLog, difficulty: opt.value })}
                      className={cn(
                        "py-2.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all",
                        newLog.difficulty === opt.value 
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
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Log
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
                
                {/* Selected display / Search input */}
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
                
                {/* Dropdown */}
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
                                  <span className="ml-1">• {formatRelativeDate(medium.lastLog.date.toISOString())}</span>
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
                  disabled={!quickLogData.mediumId}
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
              {/* Date & Duration */}
              <div className="flex items-center gap-4">
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
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 sm:flex-1">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                  <p className="text-base sm:text-lg font-bold">{formatDuration(viewingLog.duration)}</p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 sm:flex-1">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Difficulty</p>
                  <p className={cn(
                    "text-base sm:text-lg font-bold capitalize",
                    viewingLog.difficulty === 'easy' ? "text-emerald-400" :
                    viewingLog.difficulty === 'moderate' ? "text-yellow-400" :
                    viewingLog.difficulty === 'challenging' ? "text-orange-400" :
                    "text-rose-400"
                  )}>
                    {viewingLog.difficulty}
                  </p>
                </div>
                {viewingLog.rating && (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 sm:flex-1 col-span-2 sm:col-span-1">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Rating</p>
                    <p className="text-base sm:text-lg font-bold">{viewingLog.rating}/5</p>
                  </div>
                )}
              </div>
              
              {/* Activities */}
              {viewingLog.activities && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">What was practiced</p>
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm">
                    {viewingLog.activities}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {viewingLog.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                    {viewingLog.notes}
                  </div>
                </div>
              )}
              
              {/* No details message */}
              {!viewingLog.activities && !viewingLog.notes && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No additional details logged for this session.
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

      {/* Click outside to close context menus */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
