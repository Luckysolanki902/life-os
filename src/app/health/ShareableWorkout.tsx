'use client';

import { useState, useRef } from 'react';
import { Scale, X, Flame, Leaf, Share2, Check, Dumbbell } from 'lucide-react';
import { getTodaysWorkoutSummary } from '@/app/actions/health';
import { cn } from '@/lib/utils';
import { shareImage } from '@/lib/share';

interface WorkoutSummary {
  date: string;
  userName: string;
  exercises: Array<{
    _id: string;
    title: string;
    type: string;
    targetMuscles: string[];
    pageName: string;
    sets: Array<{
      weight: number;
      reps: number;
      duration?: number;
    }>;
  }>;
  exercisesByPage: Record<string, Array<{
    _id: string;
    title: string;
    type: string;
    targetMuscles: string[];
    pageName: string;
    sets: Array<{
      weight: number;
      reps: number;
      duration?: number;
    }>;
  }>>;
  muscleCount: Record<string, number>;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  weight: {
    current: number | null;
    deltaFromLast: number | null;
    deltaFromFirst: number | null;
    bmi: number | null;
    firstWeight: number | null;
  };
  mood: { mood: 'great' | 'good' | 'okay' | 'low' | 'bad'; note?: string } | null;
  meditationDone: boolean;
  streakData: {
    currentStreak: number;
    last7Days: { date: string; valid: boolean }[];
    todayValid: boolean;
    todayRoutineTasks: number;
  };
}

interface ShareableWorkoutProps {
  canShare: boolean;
  hasWeight: boolean;
}

// Format exercise for display: "Pushups (3x12x4kg)" or "Headstand (120s)"
function formatExercise(ex: { title: string; type: string; sets: Array<{ weight: number; reps: number; duration?: number }> }): string {
  const sets = ex.sets.length;
  if (ex.type === 'duration') {
    const totalDuration = ex.sets.reduce((acc, s) => acc + (s.duration || s.reps || 0), 0);
    return `${ex.title} (${totalDuration}s)`;
  }
  const avgReps = Math.round(ex.sets.reduce((acc, s) => acc + s.reps, 0) / sets);
  const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
  if (maxWeight > 0) {
    return `${ex.title} (${sets}x${avgReps}x${maxWeight}kg)`;
  }
  return `${ex.title} (${sets}x${avgReps})`;
}

// Get day abbreviation
function getDayAbbr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })[0];
}

// Mood configurations
const moodConfig = {
  great: { label: 'Feeling Great', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', emoji: '😁' },
  good: { label: 'Feeling Good', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', emoji: '😊' },
  okay: { label: 'Doing Okay', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', emoji: '😐' },
  low: { label: 'Feeling Low', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', emoji: '😔' },
  bad: { label: 'Rough Day', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', emoji: '😞' }
};

export default function ShareableWorkout({ canShare, hasWeight }: ShareableWorkoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleOpen() {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const data = await getTodaysWorkoutSummary();
      setSummary(data as WorkoutSummary);
    } catch (error) {
      console.error('Failed to load workout summary:', error);
    }
    setIsLoading(false);
  }

  async function handleExport() {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const style = window.getComputedStyle(el as Element);
            const bgColor = style.backgroundColor;
            const color = style.color;
            if (bgColor.includes('lab') || bgColor.includes('oklab')) {
              (el as HTMLElement).style.backgroundColor = '#0a0a0a';
            }
            if (color.includes('lab') || color.includes('oklab')) {
              (el as HTMLElement).style.color = '#ffffff';
            }
          });
        }
      });
      
      document.body.removeChild(clone);
      
      const filename = `lifeos-${new Date().toLocaleDateString('en-CA')}`;
      const result = await shareImage(canvas, filename);
      
      if (!result.success && result.error !== 'Share cancelled') {
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
    setIsExporting(false);
  }

  const formattedDate = summary ? new Date(summary.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  // Calculate improvement percentage (based on streak days as a simple metric)
  const improvementPercent = summary ? Math.min(summary.streakData.currentStreak * 2, 100) : 0;

  return (
    <>
      {/* Share Button - Minimal */}
      <button
        onClick={handleOpen}
        disabled={!canShare}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
          canShare 
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
        )}
        title={!canShare ? `Need at least 5 exercises logged${!hasWeight ? ' and weight logged' : ''}` : 'Share'}
      >
        <Share2 size={16} />
        Share
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-semibold">Share Summary</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            )}

            {/* Shareable Card Preview */}
            {!isLoading && summary && (
              <>
                <div className="p-4">
                  <div 
                    ref={cardRef}
                    style={{
                      background: '#0a0a0a',
                      borderRadius: '16px',
                      padding: '20px',
                      color: '#ffffff',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      border: '1px solid #27272a',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Weight Card */}
                    {summary.weight.current && (
                      <div style={{ 
                        background: '#18181b', 
                        borderRadius: '14px', 
                        padding: '16px',
                        marginBottom: '16px',
                        border: '1px solid #27272a'
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ 
                            display: 'inline-block',
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: 'rgba(59, 130, 246, 0.15)', 
                            textAlign: 'center',
                            lineHeight: '36px',
                            verticalAlign: 'middle',
                            marginRight: '12px'
                          }}>
                            <Scale size={18} style={{ color: '#3b82f6', verticalAlign: 'middle' }} />
                          </div>
                          <span style={{ 
                            display: 'inline-block',
                            fontSize: '28px', 
                            fontWeight: '700', 
                            color: '#ffffff', 
                            verticalAlign: 'middle',
                            lineHeight: '36px'
                          }}>
                            {summary.weight.current}
                          </span>
                          <span style={{ 
                            display: 'inline-block',
                            fontSize: '14px', 
                            fontWeight: '400', 
                            color: '#71717a', 
                            marginLeft: '4px',
                            verticalAlign: 'middle',
                            lineHeight: '36px'
                          }}>kg</span>
                        </div>
                        
                        <div style={{ lineHeight: '26px' }}>
                          {summary.weight.deltaFromLast !== null && (
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              marginRight: '8px',
                              background: summary.weight.deltaFromLast < 0 ? 'rgba(16, 185, 129, 0.15)' : summary.weight.deltaFromLast > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: summary.weight.deltaFromLast < 0 ? '#10b981' : summary.weight.deltaFromLast > 0 ? '#ef4444' : '#71717a',
                              verticalAlign: 'middle'
                            }}>
                              {summary.weight.deltaFromLast > 0 ? '+' : ''}{summary.weight.deltaFromLast} from last
                            </span>
                          )}
                          {summary.weight.deltaFromFirst !== null && summary.weight.firstWeight && (
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              marginRight: '8px',
                              background: summary.weight.deltaFromFirst < 0 ? 'rgba(16, 185, 129, 0.15)' : summary.weight.deltaFromFirst > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: summary.weight.deltaFromFirst < 0 ? '#10b981' : summary.weight.deltaFromFirst > 0 ? '#ef4444' : '#71717a',
                              verticalAlign: 'middle'
                            }}>
                              {summary.weight.deltaFromFirst > 0 ? '+' : ''}{summary.weight.deltaFromFirst} total
                            </span>
                          )}
                          {summary.weight.bmi && (
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: '#a855f7',
                              verticalAlign: 'middle'
                            }}>
                              BMI {summary.weight.bmi}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Streak Card */}
                    <div style={{ 
                      background: '#18181b', 
                      borderRadius: '14px', 
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #27272a'
                    }}>
                      {/* Streak Header */}
                      <div style={{ marginBottom: '14px', position: 'relative', height: '40px' }}>
                        <div style={{ 
                          display: 'inline-block',
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          background: summary.streakData.currentStreak > 0 ? '#f97316' : '#27272a',
                          textAlign: 'center',
                          lineHeight: '40px',
                          verticalAlign: 'top',
                          marginRight: '12px'
                        }}>
                          <Flame size={20} style={{ color: summary.streakData.currentStreak > 0 ? '#ffffff' : '#71717a', verticalAlign: 'middle' }} />
                        </div>
                        <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', lineHeight: '22px' }}>
                            {summary.streakData.currentStreak}
                          </div>
                          <div style={{ fontSize: '11px', color: '#71717a', lineHeight: '16px' }}>day streak</div>
                        </div>
                        <span style={{ 
                          position: 'absolute',
                          right: '0',
                          top: '8px',
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: summary.streakData.todayValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: summary.streakData.todayValid ? '#10b981' : '#f97316'
                        }}>
                          {summary.streakData.todayValid ? 'Complete ✓' : `${summary.streakData.todayRoutineTasks}/10`}
                        </span>
                      </div>
                      
                      {/* Last 7 Days */}
                      <div style={{ textAlign: 'center' }}>
                        {summary.streakData.last7Days.map((day, index) => (
                          <div key={day.date} style={{ 
                            display: 'inline-block', 
                            width: 'calc(100% / 7)', 
                            textAlign: 'center',
                            verticalAlign: 'top'
                          }}>
                            <div style={{ 
                              display: 'inline-block',
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              textAlign: 'center',
                              lineHeight: '28px',
                              background: day.valid ? '#f97316' : index === 6 ? 'transparent' : '#27272a',
                              border: index === 6 && !day.valid ? '2px dashed rgba(249, 115, 22, 0.4)' : 'none',
                              boxSizing: 'border-box'
                            }}>
                              {day.valid && <Flame size={12} style={{ color: '#ffffff', verticalAlign: 'middle' }} />}
                            </div>
                            <div style={{ fontSize: '9px', color: '#52525b', marginTop: '4px' }}>{getDayAbbr(day.date)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* X% Better Card */}
                    <div style={{ 
                      background: '#18181b', 
                      borderRadius: '14px', 
                      padding: '20px',
                      marginBottom: '16px',
                      border: '1px solid #27272a',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', lineHeight: '1.2' }}>
                        {summary.userName?.split(' ')[0] || 'Lucky'} is {improvementPercent}% better
                      </div>
                      <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>version of themselves</div>
                    </div>

                    {/* Mood Card */}
                    {summary.mood && summary.mood.mood && moodConfig[summary.mood.mood] && (
                      <div style={{ 
                        background: '#18181b',
                        borderRadius: '14px', 
                        padding: '16px',
                        marginBottom: '16px',
                        border: '1px solid #27272a'
                      }}>
                        <div style={{ 
                          display: 'inline-block',
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          background: moodConfig[summary.mood.mood].bgColor,
                          textAlign: 'center',
                          lineHeight: '44px',
                          fontSize: '24px',
                          verticalAlign: 'middle',
                          marginRight: '14px'
                        }}>
                          {moodConfig[summary.mood.mood].emoji}
                        </div>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: moodConfig[summary.mood.mood].color, lineHeight: '20px' }}>
                            {moodConfig[summary.mood.mood].label}
                          </div>
                          {summary.mood.note && (
                            <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px', fontStyle: 'italic', lineHeight: '16px' }}>
                              &quot;{summary.mood.note}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Today's Workout by Page */}
                    {Object.entries(summary.exercisesByPage).map(([pageName, exercises], pageIndex) => {
                      const pageColors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
                      const color = pageColors[pageIndex % pageColors.length];
                      const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
                      const totalReps = exercises.reduce((a, e) => a + e.sets.reduce((acc, s) => acc + s.reps, 0), 0);
                      
                      return (
                        <div key={pageName} style={{ 
                          background: '#18181b', 
                          borderRadius: '14px', 
                          padding: '14px 16px',
                          marginBottom: '10px',
                          border: '1px solid #27272a',
                          borderLeft: `3px solid ${color}`
                        }}>
                          {/* Page Header */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ 
                              display: 'inline-block',
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '8px', 
                              background: `${color}20`,
                              textAlign: 'center',
                              lineHeight: '28px',
                              verticalAlign: 'middle',
                              marginRight: '10px'
                            }}>
                              <Dumbbell size={14} style={{ color, verticalAlign: 'middle' }} />
                            </div>
                            <span style={{ 
                              display: 'inline-block',
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#ffffff', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.5px',
                              verticalAlign: 'middle',
                              lineHeight: '28px'
                            }}>
                              {pageName}
                            </span>
                          </div>
                          
                          {/* Stats Pills */}
                          <div style={{ marginBottom: '10px', lineHeight: '26px' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              background: '#27272a', 
                              fontSize: '11px', 
                              color: '#a1a1aa', 
                              marginRight: '6px',
                              verticalAlign: 'middle'
                            }}>
                              {exercises.length} exercises
                            </span>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              background: '#27272a', 
                              fontSize: '11px', 
                              color: '#a1a1aa', 
                              marginRight: '6px',
                              verticalAlign: 'middle'
                            }}>
                              {totalSets} sets
                            </span>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              background: '#27272a', 
                              fontSize: '11px', 
                              color: '#a1a1aa',
                              verticalAlign: 'middle'
                            }}>
                              {totalReps} reps
                            </span>
                          </div>
                          
                          {/* Exercise List */}
                          <div style={{ lineHeight: '28px' }}>
                            {exercises.map((ex, i) => (
                              <span key={i} style={{ 
                                display: 'inline-block',
                                fontSize: '11px', 
                                color: '#d4d4d8',
                                background: '#0a0a0a',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #27272a',
                                marginRight: '6px',
                                marginBottom: '6px',
                                verticalAlign: 'middle'
                              }}>
                                {formatExercise(ex)}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Meditation */}
                    <div style={{ 
                      background: '#18181b', 
                      borderRadius: '10px', 
                      padding: '12px 14px',
                      marginBottom: '16px',
                      border: '1px solid #27272a',
                      position: 'relative',
                      height: '20px'
                    }}>
                      <div style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: '20px' }}>
                        <Leaf size={14} style={{ color: summary.meditationDone ? '#10b981' : '#71717a', verticalAlign: 'middle', marginRight: '10px' }} />
                        <span style={{ fontSize: '13px', color: '#a1a1aa', verticalAlign: 'middle' }}>Meditation</span>
                      </div>
                      <span style={{ 
                        position: 'absolute',
                        right: '14px',
                        top: '12px',
                        display: 'inline-block',
                        padding: '3px 10px', 
                        borderRadius: '9999px', 
                        background: summary.meditationDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                        color: summary.meditationDone ? '#10b981' : '#71717a',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {summary.meditationDone ? '✓ Done' : 'Not done'}
                      </span>
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '1px solid #27272a', paddingTop: '12px', position: 'relative', height: '14px' }}>
                      <span style={{ fontSize: '11px', color: '#52525b' }}>LifeOS</span>
                      <span style={{ position: 'absolute', right: '0', fontSize: '10px', color: '#3f3f46' }}>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <div className="p-4 border-t border-border">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
