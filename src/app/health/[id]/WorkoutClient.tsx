'use client';

import { useState, useEffect, useTransition } from 'react';
import { ArrowLeft, Plus, Upload, Dumbbell, History, Save, X, Trash2, Edit2, Check, ChevronDown, ChevronUp, MoreVertical, GripVertical, Video, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createExercise, bulkCreateExercises, logExerciseSet, deleteSet, updateSet, deleteExercise, updateExercise, reorderExercises, updateHealthPage, deleteHealthPage } from '@/app/actions/health';
import MuscleMap from '@/components/MuscleMap';
import { cn } from '@/lib/utils';
import { parseServerDate, formatDateForDisplay, getLocalDateString } from '@/lib/date-utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Tutorial {
  url: string;
  title?: string;
}

interface Set {
  _id?: string;
  reps: number;
  weight: number;
  duration?: number;
}

interface Exercise {
  _id: string;
  pageId: string;
  title: string;
  type: 'reps' | 'duration' | 'distance';
  targetMuscles: string[];
  tutorials?: Tutorial[];
  order: number;
  initialSets?: number;
  initialReps?: number;
  recommendedWeight?: number;
  todaysLog: {
    _id?: string;
    sets: Set[];
  };
  lastLog?: {
    date: Date;
    sets: Set[];
  };
}

interface HealthPage {
  _id: string;
  title: string;
  description?: string;
}

interface WorkoutClientProps {
  initialData: {
    page: HealthPage;
    exercises: Exercise[];
    date: string;
  };
}

const MUSCLE_LIST = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Obliques', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
  'Traps', 'Lats', 'Cardio'
];

// Helper to format last session sets like "2 × 20 (BW) + 2 × 21 (5kg)"
function formatLastSessionSets(sets: Set[], type: 'reps' | 'duration' | 'distance' = 'reps'): string {
  if (!sets || sets.length === 0) return '';
  
  const unit = type === 'duration' ? 'sec' : type === 'distance' ? 'm' : '';
  
  // Group sets by weight
  const groups: { weight: number; reps: number[] }[] = [];
  
  for (const set of sets) {
    const existingGroup = groups.find(g => g.weight === set.weight);
    if (existingGroup) {
      existingGroup.reps.push(set.reps);
    } else {
      groups.push({ weight: set.weight, reps: [set.reps] });
    }
  }
  
  return groups.map(g => {
    const weightLabel = g.weight > 0 ? `${g.weight}kg` : 'BW';
    const avgReps = Math.round(g.reps.reduce((a, b) => a + b, 0) / g.reps.length);
    return `${g.reps.length} × ${avgReps}${unit ? unit : ''} (${weightLabel})`;
  }).join(' + ');
}

// Sortable Exercise Card Component
function SortableExerciseCard({
  ex,
  loggingExerciseId,
  setLoggingExerciseId,
  showExerciseMenu,
  setShowExerciseMenu,
  setEditingExerciseId,
  setEditExercise,
  handleDeleteExercise,
  setTutorialModal,
  editingSetId,
  setEditingSetId,
  logType,
  setLogType,
  editData,
  setEditData,
  handleUpdateSet,
  handleDeleteSet,
  handleLogSet,
  logData,
  setLogData,
  openLogForExercise,
}: {
  ex: Exercise;
  loggingExerciseId: string | null;
  setLoggingExerciseId: (id: string | null) => void;
  showExerciseMenu: string | null;
  setShowExerciseMenu: (id: string | null) => void;
  setEditingExerciseId: (id: string | null) => void;
  setEditExercise: (ex: { title: string; type: string; targetMuscles: string[]; initialSets: string; initialReps: string; recommendedWeight: string; tutorials: Tutorial[] }) => void;
  handleDeleteExercise: (id: string) => void;
  setTutorialModal: (data: { title: string; tutorials: Tutorial[] } | null) => void;
  editingSetId: string | null;
  setEditingSetId: (id: string | null) => void;
  logType: 'weighted' | 'bodyweight';
  setLogType: (type: 'weighted' | 'bodyweight') => void;
  editData: { weight: string; reps: string };
  setEditData: (data: { weight: string; reps: string }) => void;
  handleUpdateSet: (logId: string, setId: string) => void;
  handleDeleteSet: (logId: string, setId: string) => void;
  handleLogSet: (e: React.FormEvent, moveToNext?: boolean) => void;
  logData: { weight: string; reps: string };
  setLogData: (data: { weight: string; reps: string }) => void;
  openLogForExercise: (exerciseId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ex._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-2xl border border-border/50 p-5 space-y-4",
        isDragging && "shadow-xl"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg hover:bg-secondary cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          >
            <GripVertical size={18} />
          </button>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{ex.title}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {ex.targetMuscles.map((m: string) => (
                <span key={m} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLoggingExerciseId(loggingExerciseId === ex._id ? null : ex._id)}
            className={cn(
              "p-2 rounded-xl transition-all",
              loggingExerciseId === ex._id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Plus size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExerciseMenu(showExerciseMenu === ex._id ? null : ex._id)}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            {showExerciseMenu === ex._id && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExerciseMenu(null)}
                />
                <div className="absolute right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20 min-w-35">
                  <button
                    onClick={() => {
                      setEditingExerciseId(ex._id);
                      const allowedTypes = ['reps', 'duration', 'distance'] as const;
                      const normalizedType = allowedTypes.includes(ex.type) ? ex.type : 'reps';
                      setEditExercise({ 
                        title: ex.title, 
                        type: normalizedType, 
                        targetMuscles: ex.targetMuscles || [],
                        initialSets: ex.initialSets?.toString() || '',
                        initialReps: ex.initialReps?.toString() || '',
                        recommendedWeight: ex.recommendedWeight?.toString() || '',
                        tutorials: ex.tutorials || []
                      });
                      setShowExerciseMenu(null);
                    }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {ex.tutorials && ex.tutorials.length > 0 && (
                    <button
                      onClick={() => {
                        setTutorialModal({ title: ex.title, tutorials: ex.tutorials || [] });
                        setShowExerciseMenu(null);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2 text-primary"
                    >
                      <Video size={14} />
                      Tutorials ({ex.tutorials.length})
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteExercise(ex._id)}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Log List - Today's/Selected Date's Sets */}
      {ex.todaysLog && ex.todaysLog.sets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-linear-to-r from-emerald-500/50 to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check size={12} />
              Logged Sets
            </span>
            <div className="h-px flex-1 bg-linear-to-l from-emerald-500/50 to-transparent" />
          </div>
          {ex.todaysLog.sets.map((set, i: number) => (
            <div key={set._id} className="group flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
              {editingSetId === set._id ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setLogType('weighted')}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                        logType === 'weighted' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      Weighted
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogType('bodyweight')}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                        logType === 'bodyweight' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      Bodyweight
                    </button>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground border border-border">
                      {i + 1}
                    </div>
                    {logType === 'weighted' && (
                      <>
                        <input 
                          type="number" 
                          placeholder="kg"
                          className="w-20 bg-background rounded-lg px-2 py-1 text-xs outline-none border border-input"
                          value={editData.weight}
                          onChange={e => setEditData({...editData, weight: e.target.value})}
                        />
                        <span className="text-muted-foreground">×</span>
                      </>
                    )}
                    <input 
                      type="number" 
                      placeholder={ex.type === 'duration' ? 'sec' : 'reps'}
                      className="w-16 bg-background rounded-lg px-2 py-1 text-xs outline-none border border-input"
                      value={editData.reps}
                      onChange={e => setEditData({...editData, reps: e.target.value})}
                    />
                    <div className="flex ml-auto gap-1">
                      <button 
                        onClick={() => handleUpdateSet(ex.todaysLog._id || '', set._id || '')}
                        className="p-1.5 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingSetId(null)}
                        className="p-1.5 hover:bg-secondary-foreground/10 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground border border-border">
                      {i + 1}
                    </span>
                    <span className="font-medium">
                      {set.weight > 0 ? `${set.weight}kg` : 'Bodyweight'} 
                      <span className="text-muted-foreground mx-1">×</span> 
                      {set.reps} {ex.type === 'duration' ? 'sec' : 'reps'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingSetId(set._id || null);
                        setEditData({ weight: set.weight.toString(), reps: set.reps.toString() });
                        setLogType(set.weight > 0 ? 'weighted' : 'bodyweight');
                      }}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSet(ex.todaysLog._id || '', set._id || '')}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Last Log Info (Reference) - Only show if no today's log but has previous log */}
      {(!ex.todaysLog || ex.todaysLog.sets.length === 0) && ex.lastLog && ex.lastLog.sets.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="flex items-center gap-2 mb-2">
            <History size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Previous Session</span>
            <span className="text-[10px] text-muted-foreground ml-auto px-2 py-0.5 rounded-full bg-secondary/50">
              {formatDateForDisplay(ex.lastLog.date, { month: 'short', day: 'numeric', showTodayYesterday: true })}
            </span>
          </div>
          <div className="text-sm font-medium text-foreground/90">
            {formatLastSessionSets(ex.lastLog.sets, ex.type)}
          </div>
        </div>
      )}

      {/* Compact Last Session Reference - Show when you have today's log but also have history */}
      {ex.todaysLog && ex.todaysLog.sets.length > 0 && ex.lastLog && ex.lastLog.sets.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 px-2 py-1.5 rounded-lg bg-secondary/30">
          <History size={11} className="text-amber-500/70" />
          <span>Prev: {formatLastSessionSets(ex.lastLog.sets, ex.type)}</span>
          <span className="opacity-50 ml-auto text-[10px]">
            {formatDateForDisplay(ex.lastLog.date, { month: 'short', day: 'numeric', showTodayYesterday: true })}
          </span>
        </div>
      )}

      {/* Initial Recommendation - Only show if NO log (today or past) AND has initial values set */}
      {(!ex.todaysLog || ex.todaysLog.sets.length === 0) && !ex.lastLog && (ex.initialSets || ex.initialReps) && (
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-3">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary">Recommended</span>
          </div>
          <div className="text-sm font-medium text-foreground/90">
            {ex.initialSets || '?'} × {ex.initialReps || '?'} {ex.type === 'duration' ? 'sec' : ex.type === 'distance' ? 'm' : 'reps'}
            {ex.recommendedWeight !== null && ex.recommendedWeight !== undefined && (
              <span className="text-muted-foreground"> @ {ex.recommendedWeight === 0 ? 'BW' : `${ex.recommendedWeight}kg`}</span>
            )}
          </div>
        </div>
      )}
      

      {/* Log Input Area */}
      {loggingExerciseId === ex._id ? (
        <form 
          onSubmit={(e) => handleLogSet(e, false)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              // Create a synthetic form event for submission
              const form = e.currentTarget;
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              // Call handleLogSet directly with moveToNext=true
              handleLogSet({ preventDefault: () => {} } as React.FormEvent, true);
            }
          }}
          className="flex flex-col gap-3 animate-in slide-in-from-top-2 bg-secondary/20 p-3 rounded-xl"
        >
          
          {/* Type Selector Chips */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLogType('weighted')}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                logType === 'weighted' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              Weighted
            </button>
            <button
              type="button"
              onClick={() => setLogType('bodyweight')}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                logType === 'bodyweight' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              Bodyweight
            </button>
          </div>

          <div className="flex items-end gap-2">
            {logType === 'weighted' && (
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Weight</label>
                <input 
                  type="number" 
                  placeholder="kg"
                  className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={logData.weight}
                  onChange={e => setLogData({...logData, weight: e.target.value})}
                  autoFocus
                />
              </div>
            )}
            
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">
                {ex.type === 'duration' ? 'Seconds' : 'Reps'}
              </label>
              <input 
                type="number" 
                placeholder="#"
                className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={logData.reps}
                onChange={e => setLogData({...logData, reps: e.target.value})}
                autoFocus={logType === 'bodyweight'}
              />
            </div>

            <button 
              type="submit"
              className="h-9.5 w-9.5 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              title="Enter to log another set, Shift+Enter to move to next exercise"
            >
              <Save size={18} />
            </button>
            <button 
              type="button"
              onClick={() => setLoggingExerciseId(null)}
              className="h-9.5 w-9.5 flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:opacity-80"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center">Enter = log another set • Shift+Enter = next exercise</p>
        </form>
      ) : (
        <button 
          onClick={() => openLogForExercise(ex._id)}
          className="w-full py-2 rounded-xl border border-dashed border-border hover:bg-secondary/50 hover:border-primary/50 text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Log Set
        </button>
      )}
    </div>
  );
}

export default function WorkoutClient({ initialData }: WorkoutClientProps) {
  const { page } = initialData;
  const router = useRouter();
  
  // Deep clone exercises to avoid circular references from MongoDB documents
  const [exercises, setExercises] = useState<Exercise[]>(() => 
    JSON.parse(JSON.stringify(initialData.exercises))
  );
  
  // Parse date and format as YYYY-MM-DD in IST timezone using dayjs
  const [date, setDate] = useState(() => parseServerDate(initialData.date));
  
  // Check if viewing today
  const todayStr = getLocalDateString();
  const isToday = date === todayStr;
  
  // Loading state for date changes using useTransition
  const [isPending, startTransition] = useTransition();

  // Sync exercises when initialData changes (e.g., after navigation)
  useEffect(() => {
    setExercises(JSON.parse(JSON.stringify(initialData.exercises)));
    setDate(parseServerDate(initialData.date));
  }, [initialData]);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [loggingExerciseId, setLoggingExerciseId] = useState<string | null>(null);
  const [muscleMapCollapsed, setMuscleMapCollapsed] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);

  // Form States
  const [newExercise, setNewExercise] = useState({ 
    title: '', 
    initialSets: '', 
    initialReps: '', 
    recommendedWeight: '' 
  });
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [editExercise, setEditExercise] = useState({ 
    title: '', 
    type: 'reps', 
    targetMuscles: [] as string[],
    initialSets: '' as string,
    initialReps: '' as string,
    recommendedWeight: '' as string,
    tutorials: [] as Tutorial[]
  });
  const [bulkCsv, setBulkCsv] = useState('');
  const [logData, setLogData] = useState({ weight: '', reps: '' });
  const [logType, setLogType] = useState<'weighted' | 'bodyweight'>('weighted');
  
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ weight: '', reps: '' });

  // Tutorial modal state - store only what we need to avoid circular refs
  const [tutorialModal, setTutorialModal] = useState<{ title: string; tutorials: Tutorial[] } | null>(null);

  // Page edit/delete states
  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [pageNameInput, setPageNameInput] = useState(page.title);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Derived state for muscle map
  const allMuscles = exercises.reduce((acc: string[], ex) => {
    return [...acc, ...(ex.targetMuscles || [])];
  }, []);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex((ex) => ex._id === active.id);
      const newIndex = exercises.findIndex((ex) => ex._id === over.id);
      
      const newOrder = arrayMove(exercises, oldIndex, newIndex);
      setExercises(newOrder);
      
      // Persist to database
      await reorderExercises(page._id, newOrder.map((ex) => ex._id));
    }
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    startTransition(() => {
      router.push(`/health/${page._id}?date=${newDate}`);
    });
  }

  function goToToday() {
    startTransition(() => {
      router.push(`/health/${page._id}`);
    });
  }

  async function handleSavePageName() {
    if (!pageNameInput.trim() || pageNameInput === page.title) {
      setIsEditingPageName(false);
      setPageNameInput(page.title);
      return;
    }
    await updateHealthPage(page._id, { title: pageNameInput.trim() });
    setIsEditingPageName(false);
    router.refresh();
  }

  async function handleDeletePage() {
    if (deleteConfirmInput !== 'Delete') return;
    await deleteHealthPage(page._id);
    router.push('/health');
  }

  async function handleCreateExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExercise.title.trim()) return;
    setIsLoading(true);
    await createExercise({
      pageId: page._id,
      title: newExercise.title.trim(),
      initialSets: newExercise.initialSets ? Number(newExercise.initialSets) : null,
      initialReps: newExercise.initialReps ? Number(newExercise.initialReps) : null,
      recommendedWeight: newExercise.recommendedWeight !== '' ? Number(newExercise.recommendedWeight) : null
    });
    setNewExercise({ title: '', initialSets: '', initialReps: '', recommendedWeight: '' });
    setShowCreateOptions(false);
    setIsLoading(false);
    router.refresh();
  }

  async function handleDeleteExercise(exerciseId: string) {
    if (confirm('Delete this exercise and all its logs?')) {
      await deleteExercise(exerciseId, page._id);
      setShowExerciseMenu(null);
      router.refresh();
    }
  }

  async function handleUpdateExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExerciseId) return;
    setIsLoading(true);
    await updateExercise(editingExerciseId, page._id, {
      title: editExercise.title,
      type: editExercise.type,
      targetMuscles: editExercise.targetMuscles,
      initialSets: editExercise.initialSets ? Number(editExercise.initialSets) : null,
      initialReps: editExercise.initialReps ? Number(editExercise.initialReps) : null,
      recommendedWeight: editExercise.recommendedWeight !== '' ? Number(editExercise.recommendedWeight) : null,
      tutorials: editExercise.tutorials.filter(t => t.url.trim())
    });
    setEditingExerciseId(null);
    setEditExercise({ title: '', type: 'reps', targetMuscles: [], initialSets: '', initialReps: '', recommendedWeight: '', tutorials: [] });
    setIsLoading(false);
    router.refresh();
  }

  function toggleEditMuscle(muscle: string) {
    setEditExercise(prev => {
      const exists = prev.targetMuscles.includes(muscle);
      return {
        ...prev,
        targetMuscles: exists
          ? prev.targetMuscles.filter(m => m !== muscle)
          : [...prev.targetMuscles, muscle]
      };
    });
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    await bulkCreateExercises(page._id, bulkCsv);
    setIsBulkModalOpen(false);
    setBulkCsv('');
    router.refresh();
  }

  async function handleDeleteSet(logId: string, setId: string) {
    if (confirm('Delete this set?')) {
      await deleteSet(logId, setId, page._id);
      router.refresh();
    }
  }

  async function handleUpdateSet(logId: string, setId: string) {
    await updateSet(logId, setId, {
      weight: logType === 'weighted' ? Number(editData.weight) : 0,
      reps: Number(editData.reps)
    }, page._id);
    setEditingSetId(null);
    router.refresh();
  }

  // Helper to get latest set for an exercise (from today or last session)
  function getLatestSet(exercise: Exercise): { weight: number; reps: number } | null {
    // First check today's log
    if (exercise.todaysLog?.sets && exercise.todaysLog.sets.length > 0) {
      const lastSet = exercise.todaysLog.sets[exercise.todaysLog.sets.length - 1];
      return { weight: lastSet.weight, reps: lastSet.reps };
    }
    // Then check last session
    if (exercise.lastLog && exercise.lastLog.sets && exercise.lastLog.sets.length > 0) {
      const lastSet = exercise.lastLog.sets[exercise.lastLog.sets.length - 1];
      return { weight: lastSet.weight, reps: lastSet.reps };
    }
    return null;
  }

  // Open log form with prefilled data from latest log or recommended values
  function openLogForExercise(exerciseId: string) {
    const exercise = exercises.find(ex => ex._id === exerciseId);
    if (!exercise) return;
    
    const latestSet = getLatestSet(exercise);
    
    if (latestSet) {
      // Prefill from latest log (today or previous session)
      setLogType(latestSet.weight > 0 ? 'weighted' : 'bodyweight');
      setLogData({ 
        weight: latestSet.weight > 0 ? latestSet.weight.toString() : '', 
        reps: latestSet.reps.toString() 
      });
    } else if (exercise.initialReps !== undefined || exercise.recommendedWeight !== undefined) {
      // No logs, prefill from recommended initial values
      const recWeight = exercise.recommendedWeight ?? 0;
      const recReps = exercise.initialReps ?? 0;
      const hasWeight = recWeight > 0;
      
      setLogType(hasWeight ? 'weighted' : 'bodyweight');
      setLogData({ 
        weight: hasWeight ? recWeight.toString() : '', 
        reps: recReps > 0 ? recReps.toString() : '' 
      });
    } else {
      // No logs and no recommendations, use defaults
      setLogType('bodyweight');
      setLogData({ weight: '', reps: '' });
    }
    
    setLoggingExerciseId(exerciseId);
  }

  async function handleLogSet(e: React.FormEvent, moveToNextExercise: boolean = false) {
    e.preventDefault();
    if (!loggingExerciseId) return;
    
    const currentExerciseId = loggingExerciseId;
    const currentWeight = logData.weight;
    const currentReps = logData.reps;
    
    const newSet = {
      _id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      weight: logType === 'weighted' ? Number(logData.weight) : 0,
      reps: Number(logData.reps)
    };
    
    // Optimistic update
    setExercises(prev => prev.map(ex => {
      if (ex._id === loggingExerciseId) {
        return {
          ...ex,
          todaysLog: {
            ...ex.todaysLog,
            sets: [...(ex.todaysLog?.sets || []), newSet]
          }
        };
      }
      return ex;
    }));
    
    if (moveToNextExercise) {
      // Find current exercise index and move to next
      const currentIndex = exercises.findIndex(ex => ex._id === currentExerciseId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < exercises.length) {
        // Move to next exercise with its prefilled data
        const nextExercise = exercises[nextIndex];
        const nextLatestSet = getLatestSet(nextExercise);
        
        if (nextLatestSet) {
          setLogType(nextLatestSet.weight > 0 ? 'weighted' : 'bodyweight');
          setLogData({ 
            weight: nextLatestSet.weight > 0 ? nextLatestSet.weight.toString() : '', 
            reps: nextLatestSet.reps.toString() 
          });
        } else if (nextExercise.initialReps !== undefined || nextExercise.recommendedWeight !== undefined) {
          // No logs, prefill from recommended initial values
          const recWeight = nextExercise.recommendedWeight ?? 0;
          const recReps = nextExercise.initialReps ?? 0;
          const hasWeight = recWeight > 0;
          
          setLogType(hasWeight ? 'weighted' : 'bodyweight');
          setLogData({ 
            weight: hasWeight ? recWeight.toString() : '', 
            reps: recReps > 0 ? recReps.toString() : '' 
          });
        } else {
          setLogType('bodyweight');
          setLogData({ weight: '', reps: '' });
        }
        setLoggingExerciseId(nextExercise._id);
      } else {
        // No more exercises, close form
        setLoggingExerciseId(null);
        setLogData({ weight: '', reps: '' });
      }
    } else {
      // Stay on same exercise, preserve weight and reps for quick repeated logging
      setLogData({ weight: currentWeight, reps: currentReps });
    }
    
    // Persist to server
    await logExerciseSet(currentExerciseId, {
      weight: newSet.weight,
      reps: newSet.reps
    }, date);
    
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
          <Link href="/health" className="p-2 rounded-full hover:bg-secondary transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            {isEditingPageName ? (
              <div className="flex items-center gap-2">
                <input
                  value={pageNameInput}
                  onChange={(e) => setPageNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePageName();
                    if (e.key === 'Escape') {
                      setIsEditingPageName(false);
                      setPageNameInput(page.title);
                    }
                  }}
                  autoFocus
                  className="text-xl font-bold tracking-tight bg-transparent border-b-2 border-primary outline-none py-1 w-full"
                />
                <button
                  onClick={handleSavePageName}
                  className="p-1.5 rounded-lg hover:bg-secondary text-emerald-500"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingPageName(false);
                    setPageNameInput(page.title);
                  }}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold tracking-tight truncate">{page.title}</h1>
                <button
                  onClick={() => setIsEditingPageName(true)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            {page.description && !isEditingPageName && (
              <p className="text-muted-foreground text-sm truncate">{page.description}</p>
            )}
          </div>
        </div>
        
        {/* Date Picker */}
        <div className="relative shrink-0 flex items-center gap-2">
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              Go to Today
            </button>
          )}
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input 
              type="date" 
              value={date}
              max={todayStr}
              onChange={handleDateChange}
              className={cn(
                "bg-card border rounded-xl pl-9 pr-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 scheme-dark transition-colors",
                isToday 
                  ? "border-border" 
                  : "border-amber-500/50 bg-amber-500/5"
              )}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay for Date Change */}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-rose-500">
              <Trash2 size={24} />
              <h3 className="text-lg font-semibold">Delete Workout Plan</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              This will permanently delete <strong className="text-foreground">{page.title}</strong> and all its exercises and logs. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground ml-1">
                Type <span className="text-rose-500 font-bold">Delete</span> to confirm
              </label>
              <input
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Delete"
                autoFocus
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 mt-1"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmInput('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePage}
                disabled={deleteConfirmInput !== 'Delete'}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Muscle Map Visualization - Collapsible */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <button
          onClick={() => setMuscleMapCollapsed(!muscleMapCollapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider my-3">Targeted Muscles</h3>
          {muscleMapCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
        {!muscleMapCollapsed && (
          <div className="px-6 pb-6 pt-2 flex justify-center">
            <MuscleMap highlightedMuscles={allMuscles} className="h-32" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleCreateExercise} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              value={newExercise.title}
              onChange={e => setNewExercise({ ...newExercise, title: e.target.value })}
              placeholder="Add exercise name"
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
            />
            <div className="flex gap-2 shrink-0">
              <button 
                type="submit"
                disabled={isLoading || !newExercise.title.trim()}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{isLoading ? 'Adding...' : 'Add'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                title="Bulk Import"
              >
                <Upload size={18} />
              </button>
            </div>
          </div>
          
          {/* Expandable Initial Values */}
          <button
            type="button"
            onClick={() => setShowCreateOptions(!showCreateOptions)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {showCreateOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showCreateOptions ? 'Hide' : 'Set initial'} recommendation (optional)
          </button>
          
          {showCreateOptions && (
            <div className="flex gap-2 animate-in slide-in-from-top-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground ml-1">Sets</label>
                <input
                  type="number"
                  value={newExercise.initialSets}
                  onChange={e => setNewExercise({ ...newExercise, initialSets: e.target.value })}
                  placeholder="3"
                  min="0"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground ml-1">Reps</label>
                <input
                  type="number"
                  value={newExercise.initialReps}
                  onChange={e => setNewExercise({ ...newExercise, initialReps: e.target.value })}
                  placeholder="10"
                  min="0"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground ml-1">Weight (kg)</label>
                <input
                  type="number"
                  value={newExercise.recommendedWeight}
                  onChange={e => setNewExercise({ ...newExercise, recommendedWeight: e.target.value })}
                  placeholder="0=BW"
                  min="0"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </form>
        <p className="text-xs text-muted-foreground">Type and muscles are auto-detected on create.</p>
      </div>

      {/* Exercise List */}
      {isPending ? (
        /* Skeleton Loading State */
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-secondary rounded" />
                <div className="flex-1">
                  <div className="h-5 bg-secondary rounded w-32 mb-2" />
                  <div className="flex gap-1">
                    <div className="h-4 w-12 bg-secondary rounded-full" />
                    <div className="h-4 w-14 bg-secondary rounded-full" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-secondary rounded-lg" />
                  <div className="w-8 h-8 bg-secondary rounded-lg" />
                </div>
              </div>
              <div className="h-16 bg-secondary/50 rounded-xl mb-3" />
              <div className="h-10 bg-secondary/30 rounded-xl border border-dashed border-border" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={exercises.map((ex) => ex._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {exercises.map((ex) => (
                <SortableExerciseCard
                  key={ex._id}
                  ex={ex}
                  loggingExerciseId={loggingExerciseId}
                  setLoggingExerciseId={setLoggingExerciseId}
                  showExerciseMenu={showExerciseMenu}
                  setShowExerciseMenu={setShowExerciseMenu}
                  setEditingExerciseId={setEditingExerciseId}
                  setEditExercise={setEditExercise}
                  handleDeleteExercise={handleDeleteExercise}
                  setTutorialModal={setTutorialModal}
                  editingSetId={editingSetId}
                  setEditingSetId={setEditingSetId}
                  logType={logType}
                  setLogType={setLogType}
                  editData={editData}
                  setEditData={setEditData}
                  handleUpdateSet={handleUpdateSet}
                  handleDeleteSet={handleDeleteSet}
                  handleLogSet={handleLogSet}
                  logData={logData}
                  setLogData={setLogData}
                  openLogForExercise={openLogForExercise}
                />
              ))}

              {exercises.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Dumbbell className="mx-auto mb-3 opacity-20" size={48} />
                  <p>No exercises yet.</p>
                  <p className="text-sm">Add one or import from CSV.</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-semibold mb-2">Bulk Import Exercises</h3>
            <div className="text-xs text-muted-foreground mb-4 space-y-2">
              <p><strong>Simple format</strong> (names only):</p>
              <code className="block bg-secondary/50 p-2 rounded-lg">Pull-ups, Bench Press, Squats</code>
              <p className="mt-2"><strong>Extended format</strong> (with type & values):</p>
              <code className="block bg-secondary/50 p-2 rounded-lg whitespace-pre text-[11px]">Pull-ups,reps,3,10,0{'\n'}Running,duration,1,30,0{'\n'}Bench Press,reps,4,8,60</code>
              <p className="opacity-70">Format: name,type,sets,reps,weight</p>
              <p className="opacity-70">Types: <span className="text-primary">reps</span>, <span className="text-primary">duration</span>, <span className="text-primary">distance</span> (0=bodyweight)</p>
            </div>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <textarea
                value={bulkCsv}
                onChange={(e) => setBulkCsv(e.target.value)}
                placeholder="Pull-ups, Bench Press, Squats...&#10;&#10;OR with type & values:&#10;Pull-ups,reps,3,10,0&#10;Surya Namaskar,duration,4,12,0"
                rows={8}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exercise Modal */}
      {editingExerciseId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm p-6 rounded-3xl shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Exercise</h3>
            <form onSubmit={handleUpdateExercise} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
                <input
                  value={editExercise.title}
                  onChange={(e) => setEditExercise({...editExercise, title: e.target.value})}
                  placeholder="e.g. Bench Press"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Type</label>
                <select
                  value={editExercise.type}
                  onChange={(e) => setEditExercise({...editExercise, type: e.target.value})}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="reps">Reps</option>
                  <option value="duration">Duration</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
              
              {/* Initial Recommended Values Section */}
              <div className="border border-dashed border-border rounded-xl p-3 space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">
                  Initial Recommendation <span className="opacity-50">(shown when no log exists)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground ml-1">Sets</label>
                    <input
                      type="number"
                      value={editExercise.initialSets}
                      onChange={(e) => setEditExercise({...editExercise, initialSets: e.target.value})}
                      placeholder="3"
                      min="0"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground ml-1">
                      {editExercise.type === 'duration' ? 'Seconds' : editExercise.type === 'distance' ? 'Meters' : 'Reps'}
                    </label>
                    <input
                      type="number"
                      value={editExercise.initialReps}
                      onChange={(e) => setEditExercise({...editExercise, initialReps: e.target.value})}
                      placeholder={editExercise.type === 'duration' ? '30' : editExercise.type === 'distance' ? '100' : '10'}
                      min="0"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground ml-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={editExercise.recommendedWeight}
                      onChange={(e) => setEditExercise({...editExercise, recommendedWeight: e.target.value})}
                      placeholder="0=BW"
                      min="0"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">0 for bodyweight, leave empty for none</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Target Muscles</label>
                  <span className="text-[11px] text-muted-foreground">AI suggested; adjust if needed</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_LIST.map(muscle => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => toggleEditMuscle(muscle)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        editExercise.targetMuscles.includes(muscle)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tutorials Section */}
              <div className="border border-dashed border-border rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Tutorial Links</label>
                  <button
                    type="button"
                    onClick={() => setEditExercise(prev => ({
                      ...prev,
                      tutorials: [...prev.tutorials, { url: '', title: '' }]
                    }))}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add Link
                  </button>
                </div>
                {editExercise.tutorials.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2">No tutorials added yet</p>
                ) : (
                  <div className="space-y-2">
                    {editExercise.tutorials.map((tutorial, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="url"
                          value={tutorial.url}
                          onChange={(e) => {
                            const newTutorials = [...editExercise.tutorials];
                            newTutorials[idx] = { ...newTutorials[idx], url: e.target.value };
                            setEditExercise(prev => ({ ...prev, tutorials: newTutorials }));
                          }}
                          placeholder="https://youtube.com/..."
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newTutorials = editExercise.tutorials.filter((_, i) => i !== idx);
                            setEditExercise(prev => ({ ...prev, tutorials: newTutorials }));
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">Add YouTube links or image URLs for exercise tutorials</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingExerciseId(null);
                    setEditExercise({ title: '', type: 'reps', targetMuscles: [], initialSets: '', initialReps: '', recommendedWeight: '', tutorials: [] });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !editExercise.title}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {tutorialModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card w-full max-w-3xl max-h-[95vh] overflow-y-auto p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-lg font-semibold truncate pr-2">{tutorialModal.title}</h3>
              <button
                onClick={() => setTutorialModal(null)}
                className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {tutorialModal.tutorials.map((tutorial, idx) => {
                const isYouTube = tutorial.url.includes('youtube.com') || tutorial.url.includes('youtu.be');
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(tutorial.url);
                
                // Extract YouTube video ID
                let youtubeId = '';
                if (isYouTube) {
                  const match = tutorial.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?\s]+)/);
                  youtubeId = match ? match[1] : '';
                }
                
                return (
                  <div key={idx} className="rounded-xl border border-border overflow-hidden">
                    {isYouTube && youtubeId ? (
                      <div className="aspect-9/16 sm:aspect-video w-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}?loop=1&playlist=${youtubeId}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : isImage ? (
                      <img src={tutorial.url} alt={tutorial.title || 'Tutorial'} className="w-full" />
                    ) : (
                      <a
                        href={tutorial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <ExternalLink size={18} className="text-primary shrink-0" />
                        <span className="text-sm truncate">{tutorial.title || tutorial.url}</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
