'use client';

import { useState, useRef } from 'react';
import { Dumbbell, Scale, X, Flame, Leaf, Share2, Check } from 'lucide-react';
import { getTodaysWorkoutSummary } from '@/app/actions/health';
import { cn } from '@/lib/utils';
import { shareImage } from '@/lib/share';

interface WorkoutSummary {
  date: string;
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
  weight: number | null;
  weightDelta: number | null;
  mood: string | null;
  meditationDone: boolean;
}

interface ShareableWorkoutProps {
  canShare: boolean;
  hasWeight: boolean;
}

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

  // Calculate total reps
  const totalReps = summary?.exercises.reduce((acc, ex) => 
    acc + ex.sets.reduce((setAcc, s) => setAcc + s.reps, 0), 0
  ) || 0;

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

            {/* Shareable Card Preview - Dark Minimal Theme */}
            {!isLoading && summary && (
              <>
                <div className="p-4">
                  <div 
                    ref={cardRef}
                    style={{
                      background: '#0a0a0a',
                      borderRadius: '16px',
                      padding: '24px',
                      color: '#ffffff',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      border: '1px solid #27272a'
                    }}
                  >
                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        {formattedDate}
                      </p>
                      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                        Daily Summary
                      </h2>
                    </div>

                    {/* Stats Grid - 2x2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      {/* Exercises */}
                      <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px', border: '1px solid #27272a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Dumbbell size={14} style={{ color: '#f43f5e' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercises</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: 0 }}>{summary.totalExercises}</p>
                      </div>

                      {/* Sets */}
                      <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px', border: '1px solid #27272a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame size={14} style={{ color: '#f97316' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sets</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: 0 }}>{summary.totalSets}</p>
                      </div>

                      {/* Reps */}
                      <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px', border: '1px solid #27272a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#a855f7' }}>⚡</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reps</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: 0 }}>{totalReps}</p>
                      </div>

                      {/* Weight */}
                      <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px', border: '1px solid #27272a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Scale size={14} style={{ color: '#3b82f6' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                          {summary.weight ? `${summary.weight}` : '—'}
                          {summary.weight && <span style={{ fontSize: '14px', fontWeight: '400', color: '#71717a' }}> kg</span>}
                        </p>
                      </div>
                    </div>

                    {/* Meditation */}
                    <div style={{ 
                      background: '#18181b', 
                      borderRadius: '12px', 
                      padding: '14px 16px', 
                      marginBottom: '16px',
                      border: '1px solid #27272a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Leaf size={14} style={{ color: '#10b981' }} />
                        </div>
                        <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Meditation</span>
                      </div>
                      <div style={{ 
                        padding: '4px 12px', 
                        borderRadius: '9999px', 
                        background: summary.meditationDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                        color: summary.meditationDone ? '#10b981' : '#71717a',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {summary.meditationDone && <Check size={12} />}
                        {summary.meditationDone ? 'Done' : 'Not done'}
                      </div>
                    </div>

                    {/* Workout Pages */}
                    {Object.keys(summary.exercisesByPage).length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                          Today&apos;s Workout
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(summary.exercisesByPage).map(([pageName, exercises]) => (
                            <div 
                              key={pageName}
                              style={{ 
                                background: '#18181b', 
                                borderRadius: '10px', 
                                padding: '12px 14px',
                                border: '1px solid #27272a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '500' }}>{pageName}</span>
                              <span style={{ fontSize: '12px', color: '#71717a' }}>
                                {exercises.length} exercise{exercises.length > 1 ? 's' : ''} • {exercises.reduce((a, e) => a + e.sets.length, 0)} sets
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Muscles */}
                    {Object.keys(summary.muscleCount).length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                          Muscles Worked
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Object.entries(summary.muscleCount)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([muscle, count]) => (
                              <span 
                                key={muscle}
                                style={{ 
                                  padding: '5px 10px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
                                  fontWeight: '500',
                                  background: '#27272a',
                                  color: '#a1a1aa'
                                }}
                              >
                                {muscle} ({count})
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ paddingTop: '16px', borderTop: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#52525b' }}>LifeOS</span>
                      <span style={{ fontSize: '11px', color: '#3f3f46' }}>Track. Improve. Repeat.</span>
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
