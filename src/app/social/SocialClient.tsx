'use client';

import { useState } from 'react';
import { 
  Users, Plus, Clock, ChevronRight, ChevronDown, 
  MoreVertical, Edit2, Trash2, X, MessageCircle,
  Phone, Video, Calendar, Heart, Briefcase, Home, User
} from 'lucide-react';
import { 
  createRelation, updateRelation, deleteRelation,
  createPerson, updatePerson, deletePerson,
  createInteractionLog, deleteInteractionLog
} from '@/app/actions/social';
import TaskItem from '@/app/routine/TaskItem';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SocialClientProps {
  initialData: any;
}

const RELATION_COLORS = [
  { name: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500' },
  { name: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', accent: 'bg-purple-500' },
  { name: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
];

const CONTEXT_OPTIONS = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'chat', label: 'Chat', icon: MessageCircle },
  { value: 'meet', label: 'Meet', icon: Calendar },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Other', icon: User },
];

const EMOTIONAL_TONE_OPTIONS = [
  { value: 'happy', label: 'Happy', color: 'text-emerald-400', emoji: '😊' },
  { value: 'calm', label: 'Calm', color: 'text-blue-400', emoji: '😌' },
  { value: 'neutral', label: 'Neutral', color: 'text-gray-400', emoji: '😐' },
  { value: 'tense', label: 'Tense', color: 'text-orange-400', emoji: '😬' },
  { value: 'sad', label: 'Sad', color: 'text-indigo-400', emoji: '😢' },
  { value: 'frustrated', label: 'Frustrated', color: 'text-rose-400', emoji: '😤' },
  { value: 'excited', label: 'Excited', color: 'text-yellow-400', emoji: '🤩' },
];

const YOUR_BEHAVIOR_OPTIONS = [
  { value: 'present', label: 'Present', color: 'text-emerald-400' },
  { value: 'patient', label: 'Patient', color: 'text-blue-400' },
  { value: 'supportive', label: 'Supportive', color: 'text-purple-400' },
  { value: 'reactive', label: 'Reactive', color: 'text-orange-400' },
  { value: 'defensive', label: 'Defensive', color: 'text-rose-400' },
  { value: 'distracted', label: 'Distracted', color: 'text-gray-400' },
];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getColorClasses(colorName: string) {
  return RELATION_COLORS.find(c => c.name === colorName) || RELATION_COLORS[2];
}

export default function SocialClient({ initialData }: SocialClientProps) {
  const router = useRouter();
  const { relations, routine, recentInteractions } = initialData;
  
  // UI States
  const [expandedRelations, setExpandedRelations] = useState<Set<string>>(new Set(relations.map((r: any) => r._id)));
  const [expandedPeople, setExpandedPeople] = useState<Set<string>>(new Set());
  
  // Modal States
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // Form States
  const [newRelation, setNewRelation] = useState({ name: '', description: '', icon: '👤', color: 'blue' });
  const [newPerson, setNewPerson] = useState({ relationId: '', name: '', nickname: '', notes: '' });
  const [newLog, setNewLog] = useState({ 
    personId: '', 
    date: new Date().toISOString().split('T')[0], 
    context: 'chat',
    emotionalTone: 'neutral',
    yourBehavior: 'present',
    insight: '',
    nextIntention: ''
  });
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ type: string; id: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: string; id: string; name: string } | null>(null);
  const [viewingLog, setViewingLog] = useState<any | null>(null);
  const [viewingPerson, setViewingPerson] = useState<any | null>(null);

  // Toggle functions
  function toggleRelation(relationId: string) {
    setExpandedRelations(prev => {
      const next = new Set(prev);
      if (next.has(relationId)) next.delete(relationId);
      else next.add(relationId);
      return next;
    });
  }

  function togglePerson(personId: string) {
    setExpandedPeople(prev => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }

  // Handlers
  async function handleCreateRelation(e: React.FormEvent) {
    e.preventDefault();
    if (!newRelation.name.trim()) return;
    await createRelation(newRelation);
    setNewRelation({ name: '', description: '', icon: '👤', color: 'blue' });
    setIsRelationModalOpen(false);
    router.refresh();
  }

  async function handleCreatePerson(e: React.FormEvent) {
    e.preventDefault();
    if (!newPerson.name.trim() || !newPerson.relationId) return;
    await createPerson(newPerson);
    setNewPerson({ relationId: '', name: '', nickname: '', notes: '' });
    setIsPersonModalOpen(false);
    router.refresh();
  }

  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault();
    if (!newLog.personId) return;
    await createInteractionLog(newLog);
    setNewLog({ 
      personId: '', 
      date: new Date().toISOString().split('T')[0], 
      context: 'chat',
      emotionalTone: 'neutral',
      yourBehavior: 'present',
      insight: '',
      nextIntention: ''
    });
    setIsLogModalOpen(false);
    router.refresh();
  }

  async function handleDelete(type: string, id: string) {
    const confirmText = type === 'relation' ? 'This will delete all people and interactions within this relation.' 
      : type === 'person' ? 'This will delete all interactions with this person.'
      : 'Delete this interaction?';
    
    if (!confirm(`Are you sure? ${confirmText}`)) return;
    
    if (type === 'relation') await deleteRelation(id);
    else if (type === 'person') await deletePerson(id);
    else if (type === 'log') await deleteInteractionLog(id);
    
    setContextMenu(null);
    router.refresh();
  }

  async function handleRename(type: string, id: string, newName: string) {
    if (!newName.trim()) return;
    
    if (type === 'relation') await updateRelation(id, { name: newName });
    else if (type === 'person') await updatePerson(id, { name: newName });
    
    setEditingItem(null);
    router.refresh();
  }

  // Get all people for quick log
  const allPeople = relations.flatMap((relation: any) => 
    relation.people.map((person: any) => ({
      ...person,
      relationName: relation.name,
      relationColor: relation.color,
      relationIcon: relation.icon
    }))
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <Users className="text-emerald-500 shrink-0" size={24} />
              Social
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Reflect on meaningful interactions</p>
          </div>
          <button
            onClick={() => setIsRelationModalOpen(true)}
            className="px-3 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 hover:opacity-90 shrink-0 shadow-lg shadow-primary/20"
          >
            <Plus size={14} />
            <span className="hidden xs:inline">Add</span> Relation
          </button>
        </div>
      </div>

      {/* Today's Social Tasks */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s Social Habits</h2>
        <div className="space-y-2">
          {routine.length > 0 ? (
            routine.map((task: any) => (
              <TaskItem key={task._id} task={task} />
            ))
          ) : (
            <div className="p-5 rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm">
              No social habits scheduled for today.
            </div>
          )}
        </div>
      </section>

      {/* Relations */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Circle</h2>
        
        {relations.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center">
            <Users size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No relations yet</p>
            <button
              onClick={() => setIsRelationModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
            >
              Add Your First Relation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {relations.map((relation: any) => {
              const colorClasses = getColorClasses(relation.color);
              const isExpanded = expandedRelations.has(relation._id);
              
              return (
                <div key={relation._id} className={cn(
                  "rounded-2xl border overflow-hidden transition-all",
                  colorClasses.border,
                  colorClasses.bg
                )}>
                  {/* Relation Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleRelation(relation._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl text-xl", colorClasses.accent, "bg-opacity-20")}>
                        {relation.icon || '👤'}
                      </div>
                      {editingItem?.type === 'relation' && editingItem.id === relation._id ? (
                        <input
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename('relation', relation._id, editingItem.name);
                            if (e.key === 'Escape') setEditingItem(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="bg-transparent border-b border-primary font-semibold text-lg outline-none"
                        />
                      ) : (
                        <div>
                          <h3 className="font-semibold text-lg">{relation.name}</h3>
                          {relation.description && <p className="text-xs text-muted-foreground">{relation.description}</p>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-medium">
                        {relation.totalPeople} {relation.totalPeople === 1 ? 'person' : 'people'}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(contextMenu?.id === relation._id ? null : { type: 'relation', id: relation._id });
                          }}
                          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {contextMenu?.type === 'relation' && contextMenu.id === relation._id && (
                          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-10 min-w-[140px] overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewPerson({ ...newPerson, relationId: relation._id });
                                setIsPersonModalOpen(true);
                                setContextMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Plus size={14} /> Add Person
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({ type: 'relation', id: relation._id, name: relation.name });
                                setContextMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Edit2 size={14} /> Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('relation', relation._id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-rose-400"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>
                  
                  {/* People */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {relation.people.length === 0 ? (
                        <button
                          onClick={() => {
                            setNewPerson({ ...newPerson, relationId: relation._id });
                            setIsPersonModalOpen(true);
                          }}
                          className="w-full p-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Add a person
                        </button>
                      ) : (
                        relation.people.map((person: any) => {
                          const isPersonExpanded = expandedPeople.has(person._id);
                          
                          return (
                            <div key={person._id} className="bg-card/50 rounded-xl border border-border/30 overflow-hidden">
                              {/* Person Header */}
                              <div 
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors group"
                                onClick={() => togglePerson(person._id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", colorClasses.accent)}>
                                    {person.name.charAt(0).toUpperCase()}
                                  </div>
                                  {editingItem?.type === 'person' && editingItem.id === person._id ? (
                                    <input
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename('person', person._id, editingItem.name);
                                        if (e.key === 'Escape') setEditingItem(null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      autoFocus
                                      className="bg-transparent border-b border-primary font-medium text-sm outline-none"
                                    />
                                  ) : (
                                    <div>
                                      <span className="font-medium text-sm">{person.name}</span>
                                      {person.nickname && <span className="text-xs text-muted-foreground ml-2">({person.nickname})</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {person.lastInteraction && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <span>{EMOTIONAL_TONE_OPTIONS.find(e => e.value === person.lastInteraction.emotionalTone)?.emoji}</span>
                                      <span>{formatRelativeDate(person.lastInteraction.date)}</span>
                                    </div>
                                  )}
                                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    {person.totalInteractions} logs
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewLog({ ...newLog, personId: person._id });
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
                                        setContextMenu(contextMenu?.id === person._id ? null : { type: 'person', id: person._id });
                                      }}
                                      className="p-1 rounded hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                    {contextMenu?.type === 'person' && contextMenu.id === person._id && (
                                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-10 min-w-[140px] overflow-hidden">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingItem({ type: 'person', id: person._id, name: person.name });
                                            setContextMenu(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                                        >
                                          <Edit2 size={14} /> Rename
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete('person', person._id);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-rose-400"
                                        >
                                          <Trash2 size={14} /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {isPersonExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                              </div>
                              
                              {/* Interaction Logs */}
                              {isPersonExpanded && (
                                <div className="px-3 pb-3 space-y-1.5">
                                  {person.logs && person.logs.length > 0 ? (
                                    person.logs.map((log: any) => (
                                      <button 
                                        key={log._id}
                                        onClick={() => setViewingLog({ ...log, personName: person.name })}
                                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 text-xs transition-colors text-left"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">
                                            {EMOTIONAL_TONE_OPTIONS.find(e => e.value === log.emotionalTone)?.emoji || '😐'}
                                          </span>
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-medium capitalize">{log.context}</span>
                                              <span className="text-muted-foreground">
                                                {new Date(log.date).toLocaleDateString('en-IN', { 
                                                  day: 'numeric', 
                                                  month: 'short',
                                                  timeZone: 'Asia/Kolkata'
                                                })}
                                              </span>
                                            </div>
                                            {log.insight && (
                                              <p className="text-muted-foreground truncate max-w-[200px]">{log.insight}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                            YOUR_BEHAVIOR_OPTIONS.find(b => b.value === log.yourBehavior)?.color || 'text-gray-400',
                                            "bg-current/10"
                                          )}>
                                            {log.yourBehavior}
                                          </span>
                                          <ChevronRight size={12} className="text-muted-foreground" />
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="text-xs text-muted-foreground text-center py-2">
                                      No interactions logged yet
                                    </div>
                                  )}
                                  
                                  {/* Quick add log button */}
                                  <button
                                    onClick={() => {
                                      setNewLog({ ...newLog, personId: person._id });
                                      setIsLogModalOpen(true);
                                    }}
                                    className="w-full p-2 rounded-lg border border-dashed border-border/30 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Plus size={12} /> Log interaction
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
            })}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentInteractions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock size={14} />
            Recent Interactions
          </h2>
          <div className="space-y-2">
            {recentInteractions.slice(0, 5).map((log: any) => {
              const colorClasses = getColorClasses(log.relation.color);
              return (
                <button 
                  key={log._id}
                  onClick={() => setViewingLog({ ...log, personName: log.person.name })}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-card border border-border/50 hover:bg-secondary/30 transition-colors text-left gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn("w-1 h-8 rounded-full shrink-0", colorClasses.accent)} />
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-base sm:text-lg shrink-0">
                        {EMOTIONAL_TONE_OPTIONS.find(e => e.value === log.emotionalTone)?.emoji || '😐'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate">{log.person.name}</span>
                          <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">{log.relation.name}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{log.context}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-[10px] sm:text-xs font-medium capitalize",
                      YOUR_BEHAVIOR_OPTIONS.find(b => b.value === log.yourBehavior)?.color || 'text-gray-400'
                    )}>
                      {log.yourBehavior}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{formatRelativeDate(log.date)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Modals */}
      {/* Create Relation Modal */}
      {isRelationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Relation Type</h3>
              <button onClick={() => setIsRelationModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRelation} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Relation Name</label>
                <input
                  value={newRelation.name}
                  onChange={(e) => setNewRelation({ ...newRelation, name: e.target.value })}
                  placeholder="e.g. Partner, Family, Friend, Colleague"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Description (optional)</label>
                <input
                  value={newRelation.description}
                  onChange={(e) => setNewRelation({ ...newRelation, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Icon (emoji)</label>
                <input
                  value={newRelation.icon}
                  onChange={(e) => setNewRelation({ ...newRelation, icon: e.target.value })}
                  placeholder="❤️"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Color</label>
                <div className="flex gap-2 mt-1">
                  {RELATION_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewRelation({ ...newRelation, color: color.name })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color.accent,
                        newRelation.color === color.name ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRelationModalOpen(false)}
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

      {/* Create Person Modal */}
      {isPersonModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Person</h3>
              <button onClick={() => setIsPersonModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePerson} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                <input
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                  placeholder="e.g. Sunshine, Co-founder"
                  autoFocus
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Nickname (optional)</label>
                <input
                  value={newPerson.nickname}
                  onChange={(e) => setNewPerson({ ...newPerson, nickname: e.target.value })}
                  placeholder="How you call them"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Notes (optional)</label>
                <textarea
                  value={newPerson.notes}
                  onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                  placeholder="Any personal notes..."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPersonModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Interaction Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Interaction</h3>
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
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Context</label>
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mt-1">
                  {CONTEXT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewLog({ ...newLog, context: opt.value })}
                        className={cn(
                          "px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5",
                          newLog.context === opt.value 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span className="hidden xs:inline sm:inline">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Emotional Tone</label>
                <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mt-1">
                  {EMOTIONAL_TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewLog({ ...newLog, emotionalTone: opt.value })}
                      className={cn(
                        "px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5",
                        newLog.emotionalTone === opt.value 
                          ? `${opt.color} bg-current/10 ring-1 ring-current` 
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="text-sm sm:text-base">{opt.emoji}</span>
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Your Behavior</label>
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mt-1">
                  {YOUR_BEHAVIOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewLog({ ...newLog, yourBehavior: opt.value })}
                      className={cn(
                        "px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-center",
                        newLog.yourBehavior === opt.value 
                          ? `${opt.color} bg-current/10 ring-1 ring-current` 
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Insight (what went well/wrong)</label>
                <textarea
                  value={newLog.insight}
                  onChange={(e) => setNewLog({ ...newLog, insight: e.target.value })}
                  placeholder="Felt defensive during call, interrupted her..."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1">Next Intention</label>
                <textarea
                  value={newLog.nextIntention}
                  onChange={(e) => setNewLog({ ...newLog, nextIntention: e.target.value })}
                  placeholder="Need to listen fully next time..."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
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

      {/* View Log Detail Modal */}
      {viewingLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-3xl shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {EMOTIONAL_TONE_OPTIONS.find(e => e.value === viewingLog.emotionalTone)?.emoji || '😐'}
                </span>
                <h3 className="text-lg font-semibold">{viewingLog.personName}</h3>
              </div>
              <button onClick={() => setViewingLog(null)} className="p-1 rounded-lg hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Date & Context */}
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
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-secondary/50">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Context</p>
                  <p className="text-sm sm:text-lg font-bold capitalize truncate">{viewingLog.context}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-secondary/50">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Tone</p>
                  <p className={cn(
                    "text-sm sm:text-lg font-bold capitalize truncate",
                    EMOTIONAL_TONE_OPTIONS.find(e => e.value === viewingLog.emotionalTone)?.color || 'text-gray-400'
                  )}>
                    {viewingLog.emotionalTone}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-secondary/50">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">You were</p>
                  <p className={cn(
                    "text-sm sm:text-lg font-bold capitalize truncate",
                    YOUR_BEHAVIOR_OPTIONS.find(b => b.value === viewingLog.yourBehavior)?.color || 'text-gray-400'
                  )}>
                    {viewingLog.yourBehavior}
                  </p>
                </div>
              </div>
              
              {/* Insight */}
              {viewingLog.insight && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Insight</p>
                  <div className="p-3 rounded-xl bg-secondary/30 text-sm">
                    {viewingLog.insight}
                  </div>
                </div>
              )}
              
              {/* Next Intention */}
              {viewingLog.nextIntention && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Next Intention</p>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                    {viewingLog.nextIntention}
                  </div>
                </div>
              )}
              
              {/* No details message */}
              {!viewingLog.insight && !viewingLog.nextIntention && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No additional details logged for this interaction.
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
