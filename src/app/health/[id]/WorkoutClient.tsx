'use client';

import { useState, useEffect, useTransition, useRef, KeyboardEvent } from 'react';
import { 
  ArrowLeft, Plus, Dumbbell, History, X, Trash2, Edit2, 
  Check, GripVertical, Video, Calendar, MoreHorizontal, Settings, Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  createExercise, logExerciseSet, deleteSet, 
  updateSet, deleteExercise, updateExercise, reorderExercises 
} from '@/app/actions/health';
import MuscleMap from '@/components/MuscleMap';
import { cn } from '@/lib/utils';
import { formatDateForDisplay } from '@/lib/date-utils';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---

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

// --- Sub-components ---

// Separated Content Component for DragOverlay reuse
function ExerciseCardContent({
  ex,
  isLogging,
  onToggleLogging,
  showExerciseMenu,
  onToggleMenu,
  onEdit,
  onDelete,
  onViewTutorial,
  editingSetId,
  startEditingSet,
  editData,
  setEditData,
  onUpdateSet,
  onDeleteSet,
  onLogSet,
  logData,
  setLogData,
  isDragging
}: any) {
  const hasLogs = ex.todaysLog && ex.todaysLog.sets.length > 0;
  const lastSessionSets = ex.lastLog?.sets;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onLogSet(e);
      // Shift+Enter could potentially close the form or do something else, 
      // but for now both submit. User asked for options, we can refine if needed.
      if (e.shiftKey) {
        // defined behavior: maybe focus drag handle?
      }
    }
  };

  return (
    <div className={cn(
        "bg-card rounded-2xl border transition-all duration-300 overflow-hidden",
        isDragging ? "shadow-2xl border-primary/40 rotate-[2deg] scale-105 cursor-grabbing" : "border-border/40 hover:border-border/80",
        isLogging ? "ring-1 ring-primary/20 bg-secondary/5" : ""
      )}>
      {/* Header Row */}
      <div 
        className={cn(
          "flex items-center p-4 gap-3 cursor-pointer select-none",
          isLogging ? "pb-2" : ""
        )}
        onClick={onToggleLogging}
      >
        <div className="p-1.5 rounded-lg text-muted-foreground/30 hover:bg-secondary hover:text-foreground transition-colors cursor-grab active:cursor-grabbing touch-none">
          <GripVertical size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-medium truncate transition-colors flex items-center gap-2", hasLogs ? "text-emerald-500" : "text-foreground")}>
            {ex.title}
            {hasLogs && <Check size={14} className="text-emerald-500" />}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
             {ex.type !== 'reps' && <span className="uppercase text-[10px] tracking-wider font-semibold opacity-70 border border-border px-1 rounded-sm">{ex.type}</span>}
             {ex.targetMuscles?.length > 0 && <span className="truncate opacity-70">{ex.targetMuscles.join(', ')}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {ex.tutorials?.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewTutorial(ex); }}
              className="p-2 rounded-xl text-muted-foreground/50 hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
            >
              <Video size={18} />
            </button>
          )}

           {/* Context Menu */}
           <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMenu(ex._id); }}
              className="p-2 rounded-xl text-muted-foreground/50 hover:bg-secondary hover:text-foreground transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showExerciseMenu === ex._id && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onToggleMenu(null); }} />
                <div className="absolute right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 min-w-40 py-1 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(ex); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-secondary/50 transition-colors flex items-center gap-2">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(ex._id); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-rose-500/10 text-rose-500 transition-colors flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
           </div>

           <button 
             onClick={(e) => { e.stopPropagation(); onToggleLogging(); }}
             className={cn(
              "p-2 rounded-xl transition-all duration-300",
              isLogging 
                ? "bg-secondary text-foreground rotate-45" 
                : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
             )}
           >
             <Plus size={18} />
           </button>
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isLogging || hasLogs ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 space-y-4">
            
            {/* Info Bar: Recommendation & Last Log */}
            {isLogging && (
              <div className="flex flex-col gap-1.5 text-xs bg-secondary/20 -mx-4 px-4 py-2 border-y border-border/40">
                {/* Recommendation */}
                {(ex.recommendedWeight > 0 || ex.initialReps > 0) && (
                   <div className="flex items-center gap-2 text-sky-500">
                      <Target size={12} />
                      <span className="font-medium">Goal:</span>
                      <span>
                        {ex.initialSets ? `${ex.initialSets} sets` : ''} 
                        {ex.initialSets && (ex.initialReps || ex.recommendedWeight) ? ' of ' : ''}
                        {ex.recommendedWeight ? `${ex.recommendedWeight}kg` : ''}
                        {ex.recommendedWeight && ex.initialReps ? ' x ' : ''}
                        {ex.initialReps ? `${ex.initialReps} ${ex.type}` : ''}
                      </span>
                   </div>
                )}
                
                {/* Last Log */}
                <div className={cn("flex items-center gap-2", lastSessionSets ? "text-muted-foreground" : "text-muted-foreground/50 italic")}>
                   <History size={12} />
                   <span className="font-medium">Last:</span>
                   {lastSessionSets ? (
                     <span>{lastSessionSets.map((s: any) => `${s.reps}x${s.weight}`).join(', ')}</span>
                   ) : (
                     <span>No previous history</span>
                   )}
                </div>
              </div>
            )}

            {/* Existing Logs List */}
            {hasLogs && (
               <div className="space-y-2 mt-2">
                 {ex.todaysLog.sets.map((set: Set, idx: number) => (
                    <div 
                      key={set._id || idx} 
                      className="group flex items-center gap-3 text-sm p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold font-mono">
                        {idx + 1}
                      </div>

                      {editingSetId === set._id ? (
                         // Inline Edit Mode
                         <div className="flex-1 flex gap-2 items-center animate-in fade-in zoom-in-95">
                            <input autoFocus type="number" value={editData.weight} onChange={(e) => setEditData({...editData, weight: e.target.value})} className="w-16 bg-secondary/50 border border-transparent focus:border-primary rounded px-2 py-1 text-center font-mono" placeholder="kg" />
                            <span className="text-muted-foreground text-xs">kg</span>
                            <input type="number" value={editData.reps} onChange={(e) => setEditData({...editData, reps: e.target.value})} className="w-16 bg-secondary/50 border border-transparent focus:border-primary rounded px-2 py-1 text-center font-mono" placeholder="reps" />
                            <span className="text-muted-foreground text-xs">{ex.type}</span>
                            <button onClick={() => onUpdateSet(ex.todaysLog._id, set._id!)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg ml-auto"><Check size={16}/></button>
                            <button onClick={() => startEditingSet(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg"><X size={16}/></button>
                         </div>
                      ) : (
                         // Display Mode
                        <>
                          <div className="flex-1 flex items-baseline gap-1">
                             <span className="font-bold text-lg tabular-nums tracking-tight">{set.weight > 0 ? set.weight : 'BW'}</span>
                             <span className="text-muted-foreground text-xs font-medium mr-3">{set.weight > 0 ? 'kg' : ''}</span>
                             
                             <span className="text-border text-sm mr-3">✕</span>
                             
                             <span className="font-bold text-lg tabular-nums tracking-tight">{set.reps}</span>
                             <span className="text-muted-foreground text-xs font-medium">{ex.type}</span>
                          </div>
                          
                          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                             <button onClick={() => startEditingSet(set)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"><Edit2 size={14} /></button>
                             <button onClick={() => onDeleteSet(ex.todaysLog._id!, set._id!)} className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10"><Trash2 size={14} /></button>
                          </div>
                        </>
                      )}
                    </div>
                 ))}
               </div>
            )}

            {/* Logging Input Form */}
            {isLogging && (
               <div className="mt-3 pt-3 border-t border-border/30 flex gap-2 items-stretch animate-in slide-in-from-top-2 duration-200">
                 <div className="w-8 flex items-center justify-center text-xs text-muted-foreground font-mono bg-secondary/20 rounded-lg">
                   {(ex.todaysLog?.sets?.length || 0) + 1}
                 </div>
                 
                 <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="relative group">
                      <input 
                         type="number" inputMode="decimal" step="0.5"
                         placeholder={ex.recommendedWeight ? `${ex.recommendedWeight}` : "Weight"}
                         value={logData.weight}
                         onChange={(e) => setLogData({...logData, weight: e.target.value})}
                         onKeyDown={handleKeyDown}
                         className="w-full h-full bg-secondary/30 hover:bg-secondary/50 focus:bg-background border-2 border-transparent focus:border-primary/20 rounded-xl px-3 text-lg font-medium transition-all outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground pointer-events-none font-bold tracking-wider">kg</span>
                    </div>
                    <div className="relative group">
                      <input 
                         type="number" inputMode="decimal"
                         placeholder={ex.initialReps ? `${ex.initialReps}` : "Reps"}
                         value={logData.reps}
                         onChange={(e) => setLogData({...logData, reps: e.target.value})}
                         onKeyDown={handleKeyDown}
                         autoFocus={!hasLogs}
                         className="w-full h-full bg-secondary/30 hover:bg-secondary/50 focus:bg-background border-2 border-transparent focus:border-primary/20 rounded-xl px-3 text-lg font-medium transition-all outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground pointer-events-none font-bold tracking-wider">
                        {ex.type === 'duration' ? 's' : ex.type === 'distance' ? 'm' : 'reps'}
                      </span>
                    </div>
                 </div>

                 <button 
                   onClick={onLogSet}
                   className="w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm"
                 >
                   <Check size={24} />
                 </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableExerciseCard({ ex, ...props }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide original when dragging
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
       <ExerciseCardContent ex={ex} isDragging={false} {...props} />
    </div>
  );
}

// --- Main Component ---

export default function WorkoutClient({ initialData }: WorkoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exercises, setExercises] = useState<Exercise[]>(initialData.exercises);
  const [pageTitle, setPageTitle] = useState(initialData.page.title);
  
  // UI State
  const [muscleMapCollapsed, setMuscleMapCollapsed] = useState(true);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  
  // Logging State
  const [loggingExerciseId, setLoggingExerciseId] = useState<string | null>(null);
  const [logData, setLogData] = useState({ weight: '', reps: '' });
  
  // Edit/Menu State
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState<any>({ 
    title: '', type: 'reps', targetMuscles: [], initialSets: '', initialReps: '', recommendedWeight: '', tutorials: [] 
  });
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ weight: '', reps: '' });
  const [tutorialModal, setTutorialModal] = useState<{ title: string, tutorials: Tutorial[] } | null>(null);

  // New Exercise State
  const [newExercise, setNewExercise] = useState({ title: '', initialReps: '', initialSets: '', recommendedWeight: '' });
  const [isLoading, setIsLoading] = useState(false);

  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags on tap
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' },
      },
    }),
  };

  useEffect(() => { setExercises(initialData.exercises); }, [initialData.exercises]);

  const allMuscles = Array.from(new Set(exercises.flatMap(e => e.targetMuscles)));
  const totalVolume = exercises.reduce((acc, ex) => acc + (ex.todaysLog?.sets?.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0) || 0), 0);
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.todaysLog?.sets?.length || 0), 0);
  const activeExercise = activeId ? exercises.find(e => e._id === activeId) : null;

  // Handlers
  async function handleLogSet(e: React.FormEvent) {
    e.preventDefault();
    if (!loggingExerciseId || !logData.reps) return;
    
    const ex = exercises.find(e => e._id === loggingExerciseId);
    if (!ex) return;

    // Smart default: Last set weight -> Recommended weight -> 0
    let finalWeight = logData.weight ? parseFloat(logData.weight) : 0;
    if (!logData.weight) {
        if (ex.todaysLog?.sets?.length > 0) {
            finalWeight = ex.todaysLog.sets[ex.todaysLog.sets.length - 1].weight;
        } else if (ex.lastLog?.sets?.length) {
            finalWeight = ex.lastLog.sets[0].weight;
        } else if (ex.recommendedWeight) {
            finalWeight = ex.recommendedWeight;
        }
    }

    const reps = parseFloat(logData.reps);
    
    // Optimistic Update
    setExercises(current => current.map(e => e._id === loggingExerciseId ? {
        ...e,
        todaysLog: { ...e.todaysLog, sets: [...(e.todaysLog?.sets || []), { weight: finalWeight, reps }] }
    } : e));
    
    const submittedWeight = finalWeight; 
    setLogData(prev => ({ ...prev, reps: '', weight: submittedWeight > 0 ? submittedWeight.toString() : '' }));

    startTransition(async () => {
       try { await logExerciseSet(loggingExerciseId, { weight: finalWeight, reps }, initialData.date); } 
       catch (error) { console.error(error); }
    });
  }

  async function handleCreateExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExercise.title) return;
    setIsLoading(true);
    try {
      await createExercise({
        pageId: initialData.page._id, 
        title: newExercise.title,
        initialSets: newExercise.initialSets ? parseInt(newExercise.initialSets) : undefined,
        initialReps: newExercise.initialReps ? parseInt(newExercise.initialReps) : undefined,
        recommendedWeight: newExercise.recommendedWeight ? parseFloat(newExercise.recommendedWeight) : undefined
      });
      setNewExercise({ title: '', initialReps: '', initialSets: '', recommendedWeight: '' });
      setShowCreateOptions(false);
      router.refresh();
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }

  const handleDeleteExercise = async (id: string) => { if (confirm('Delete exercise?')) { await deleteExercise(id, initialData.page._id); router.refresh(); }};
  const handleUpdateSet = async (logId: string, setId: string) => {
      await updateSet(logId, setId, { weight: parseFloat(editData.weight), reps: parseFloat(editData.reps) }, initialData.page._id);
      setEditingSetId(null);
      router.refresh();
  };
  const handleDeleteSet = async (logId: string, setId: string) => {
      await deleteSet(logId, setId, initialData.page._id);
      router.refresh();
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragEnd = async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (active.id !== over?.id) {
          const oldIndex = exercises.findIndex((e) => e._id === active.id);
          const newIndex = exercises.findIndex((e) => e._id === over?.id);
          const newOrder = arrayMove(exercises, oldIndex, newIndex); 
          setExercises(newOrder); 
          await reorderExercises(initialData.page._id, newOrder.map(ex => ex._id));
      }
  };

  async function handleUpdateExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExerciseId) return;
    setIsLoading(true);
    try {
      await updateExercise(editingExerciseId, initialData.page._id, {
        title: editExercise.title, type: editExercise.type, targetMuscles: editExercise.targetMuscles,
        initialSets: editExercise.initialSets ? parseInt(editExercise.initialSets) : undefined,
        initialReps: editExercise.initialReps ? parseInt(editExercise.initialReps) : undefined,
        recommendedWeight: editExercise.recommendedWeight ? parseFloat(editExercise.recommendedWeight) : undefined,
        tutorials: editExercise.tutorials
      });
      setEditingExerciseId(null);
      router.refresh();
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }

  const toggleEditMuscle = (muscle: string) => {
    setEditExercise((prev: any) => ({ ...prev, targetMuscles: prev.targetMuscles?.includes(muscle) ? prev.targetMuscles.filter((m: string) => m !== muscle) : [...(prev.targetMuscles || []), muscle] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32 animate-in fade-in-0 duration-500">
      
      {/* Header */}
      <header className="flex h-14 items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-30 px-1 -mx-1 border-b border-border/5">
        <Link href="/health" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar size={10} />{formatDateForDisplay(initialData.date)}</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
               <Dumbbell size={12} /><span>{totalSets} sets</span>
            </div>
            <button onClick={() => setMuscleMapCollapsed(!muscleMapCollapsed)} className={cn("p-2 rounded-full transition-colors", !muscleMapCollapsed ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground")}>
              <ActivityIcon />
            </button>
        </div>
      </header>

      {/* Stats Panel */}
      <div className={cn("overflow-hidden transition-all duration-300 ease-in-out bg-card rounded-3xl border border-border/40", muscleMapCollapsed ? "max-h-0 border-none opacity-0" : "max-h-[500px] opacity-100")}>
         <div className="p-6">
            <div className="flex justify-center mb-4"><MuscleMap highlightedMuscles={allMuscles} className="h-48 w-auto" /></div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground border-t border-border/40 pt-4">
                <div><span className="block text-lg font-bold text-foreground">{exercises.length}</span>Exercises</div>
                <div><span className="block text-lg font-bold text-foreground">{totalSets}</span>Total Sets</div>
                <div><span className="block text-lg font-bold text-foreground">{Math.round(totalVolume)}</span>Vol (kg)</div>
            </div>
         </div>
      </div>

      {/* Exercise List with DragOverlay */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={exercises.map(e => e._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
             {exercises.map((ex) => (
                <SortableExerciseCard
                   key={ex._id}
                   ex={ex}
                   isLogging={loggingExerciseId === ex._id}
                   onToggleLogging={() => setLoggingExerciseId(loggingExerciseId === ex._id ? null : ex._id)}
                   showExerciseMenu={showExerciseMenu}
                   onToggleMenu={setShowExerciseMenu}
                   onEdit={(ex: Exercise) => {
                      setEditingExerciseId(ex._id);
                      setEditExercise({ title: ex.title, type: ex.type, targetMuscles: ex.targetMuscles || [], initialSets: ex.initialSets?.toString() || '', initialReps: ex.initialReps?.toString() || '', recommendedWeight: ex.recommendedWeight?.toString() || '', tutorials: ex.tutorials || [] });
                      setShowExerciseMenu(null);
                   }}
                   onDelete={handleDeleteExercise}
                   onViewTutorial={(ex: Exercise) => setTutorialModal({ title: ex.title, tutorials: ex.tutorials || [] })}
                   editingSetId={editingSetId}
                   startEditingSet={(set: Set | null) => { setEditingSetId(set?._id || null); if(set) setEditData({ weight: set.weight.toString(), reps: set.reps.toString() }); }}
                   editData={editData}
                   setEditData={setEditData}
                   onUpdateSet={handleUpdateSet}
                   onDeleteSet={handleDeleteSet}
                   onLogSet={handleLogSet}
                   logData={logData}
                   setLogData={setLogData}
                />
             ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={dropAnimation}>
           {activeExercise ? (
              <ExerciseCardContent 
                 ex={activeExercise}
                 isDragging={true}
                 isLogging={loggingExerciseId === activeExercise._id}
                 logData={logData} 
              /> 
           ) : null}
        </DragOverlay>
      </DndContext>

      {exercises.length === 0 && (
         <div className="py-12 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-16 h-16 rounded-full bg-secondary mb-4 flex items-center justify-center"><Dumbbell size={24} /></div>
            <h3 className="text-lg font-semibold">Empty Routine</h3>
            <p className="text-sm">Add your first exercise below</p>
         </div>
      )}

      {/* Quick Add */}
      <div className="bg-card rounded-2xl border border-border/50 p-3 shadow-sm">
         <form onSubmit={handleCreateExercise} className="flex gap-2">
            <input 
               value={newExercise.title} onChange={(e) => setNewExercise({...newExercise, title: e.target.value})}
               placeholder="Add new exercise..."
               className="flex-1 bg-secondary/30 hover:bg-secondary/50 focus:bg-background border-none rounded-xl px-4 py-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button type="submit" disabled={!newExercise.title || isLoading} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
              {isLoading ? '...' : <Plus size={20} />}
            </button>
            <button type="button" onClick={() => setShowCreateOptions(!showCreateOptions)} className={cn("p-3 rounded-xl transition-colors", showCreateOptions ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50")}>
               <Settings size={20} />
            </button>
         </form>
         {showCreateOptions && (
            <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-3 gap-3 animate-in slide-in-from-top-2">
               <div><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold ml-1">Sets</label><input type="number" placeholder="3" className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm mt-1" value={newExercise.initialSets} onChange={e => setNewExercise({...newExercise, initialSets: e.target.value})} /></div>
               <div><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold ml-1">Reps</label><input type="number" placeholder="10" className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm mt-1" value={newExercise.initialReps} onChange={e => setNewExercise({...newExercise, initialReps: e.target.value})} /></div>
               <div><label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold ml-1">Weight</label><input type="number" placeholder="kg" className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm mt-1" value={newExercise.recommendedWeight} onChange={e => setNewExercise({...newExercise, recommendedWeight: e.target.value})} /></div>
            </div>
         )}
      </div>
      
      {/* Edit Modal */}
      {editingExerciseId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-card w-full max-w-sm rounded-3xl border border-border/50 shadow-2xl overflow-hidden p-6 scale-100 animate-in zoom-in-95">
              <h3 className="font-bold text-lg mb-4">Edit Exercise</h3>
              <form onSubmit={handleUpdateExercise} className="space-y-4">
                  <input value={editExercise.title} onChange={e => setEditExercise({...editExercise, title: e.target.value})} className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm font-medium" placeholder="Name" />
                  <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl">
                      {['reps', 'duration', 'distance'].map(t => (
                        <button key={t} type="button" onClick={() => setEditExercise({...editExercise, type: t})} className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all", editExercise.type === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>{t}</button>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 min-h-[100px] max-h-[150px] overflow-y-auto bg-secondary/10 rounded-xl border border-border/30">
                     {MUSCLE_LIST.map(m => (
                       <button key={m} type="button" onClick={() => toggleEditMuscle(m)} className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors border", editExercise.targetMuscles.includes(m) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50")}>{m}</button>
                     ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setEditingExerciseId(null)} className="flex-1 py-3 bg-secondary rounded-xl text-sm font-medium">Cancel</button>
                     <button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Save Changes</button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {tutorialModal && (
         <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card z-10">
                   <h3 className="font-semibold">{tutorialModal.title}</h3>
                   <button onClick={() => setTutorialModal(null)} className="p-2 hover:bg-secondary rounded-full"><X size={18}/></button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                   {tutorialModal.tutorials.map((t, i) => (
                      <div key={i} className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                          {t.url.includes('youtu') ? <iframe src={`https://www.youtube.com/embed/${getYouTubeId(t.url)}`} className="w-full h-full" allowFullScreen /> : <img src={t.url} className="w-full h-full object-cover" alt="Tutorial" />}
                      </div>
                   ))}
                   {tutorialModal.tutorials.length === 0 && <p className="text-center text-muted-foreground py-8">No tutorials available.</p>}
                </div>
             </div>
         </div>
      )}
    </div>
  );
}

function ActivityIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> }

function getYouTubeId(url: string) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?\s]+)/);
    return match ? match[1] : '';
}
