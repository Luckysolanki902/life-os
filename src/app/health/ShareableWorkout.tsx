'use client';

import { useState, useRef } from 'react';
import { Heart, Sparkles, Dumbbell, Scale, TrendingDown, TrendingUp, X, Flame, Leaf, Activity, Share2 } from 'lucide-react';
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

const MOOD_DATA: Record<string, { emoji: string; label: string; score: number }> = {
  great: { emoji: '🌟', label: 'Great', score: 5 },
  good: { emoji: '😊', label: 'Good', score: 4 },
  okay: { emoji: '😌', label: 'Okay', score: 3 },
  low: { emoji: '😔', label: 'Low', score: 2 },
  bad: { emoji: '😢', label: 'Bad', score: 1 }
};
const CUTE_MESSAGES = [
  "Look what I did today! 💪",
  "Crushed it! 🔥",
  "Getting stronger! 💖",
  "Workout complete! ✨",
  "Did my best today! 🌸",
  "I showed up and gave it my all 💕",
  "One step closer to my goals 🫶",
  "Your cheerleader worked hard today 😄",
  "Feeling proud of myself today 🌱",
  "Sweat, smiles, and progress ✨",
  "Another small win today 🏆",
  "Strong body, happy heart 💗",
  "Done for today, thinking of you 💭",
  "I didn’t skip, I did it 💪🌸",
  "Progress made, just for me and you 💖",
];


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
      // Dynamically import html2canvas to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      
      // Clone the element to apply export-specific styles
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        backgroundColor: '#fdf2f8',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        // Force simple colors - avoid oklab/lab
        onclone: (clonedDoc) => {
          // Replace any problematic CSS colors
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const style = window.getComputedStyle(el as Element);
            const bgColor = style.backgroundColor;
            const color = style.color;
            
            // Convert any lab/oklab to simple rgb
            if (bgColor.includes('lab') || bgColor.includes('oklab')) {
              (el as HTMLElement).style.backgroundColor = '#fdf2f8';
            }
            if (color.includes('lab') || color.includes('oklab')) {
              (el as HTMLElement).style.color = '#1a1a1a';
            }
          });
        }
      });
      
      document.body.removeChild(clone);
      
      // Use cross-platform share utility
      const filename = `workout-${new Date().toLocaleDateString('en-CA')}`;
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

  const randomMessage = CUTE_MESSAGES[Math.floor(Math.random() * CUTE_MESSAGES.length)];
  const formattedDate = summary ? new Date(summary.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : '';

  // Get mood data
  const moodInfo = summary?.mood ? MOOD_DATA[summary.mood] : null;

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleOpen}
        disabled={!canShare}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
          canShare 
            ? "bg-pink-500 text-white hover:bg-pink-600 shadow-lg"
            : "bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-50"
        )}
        title={!canShare ? `Need at least 5 exercises logged${!hasWeight ? ' and weight logged' : ''}` : 'Share your workout!'}
      >
        <Heart size={16} className={cn(canShare && "animate-pulse")} />
        Share
        {canShare && <Sparkles size={14} />}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border border-zinc-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Heart className="text-pink-500" size={20} />
                Share Your Workout
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-zinc-400">Loading your amazing workout...</p>
                </div>
              </div>
            )}

            {/* Shareable Card Preview */}
            {!isLoading && summary && (
              <>
                <div className="p-4">
                  {/* The actual shareable card - using inline styles for html2canvas compatibility */}
                  <div 
                    ref={cardRef}
                    style={{
                      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      color: '#1a1a1a',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    {/* Header with hearts */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px' }}>💪</span>
                        <span style={{ fontSize: '24px' }}>✨</span>
                        <span style={{ fontSize: '24px' }}>💖</span>
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#db2777', margin: 0 }}>
                        {randomMessage}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{formattedDate}</p>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #fce7f3' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <Dumbbell size={20} style={{ color: '#ec4899', margin: '0 auto' }} />
                        </div>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{summary.totalExercises}</p>
                        <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercises</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #fce7f3' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <Flame size={20} style={{ color: '#f97316', margin: '0 auto' }} />
                        </div>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{summary.totalSets}</p>
                        <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sets</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #fce7f3' }}>
                        <div style={{ marginBottom: '4px', fontSize: '20px' }}>
                          {moodInfo ? moodInfo.emoji : '💪'}
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {moodInfo ? `${moodInfo.label}` : 'Strong'}
                        </p>
                        <p style={{ fontSize: '10px', color: '#6b7280' }}>
                          {moodInfo ? `(${moodInfo.score}/5)` : 'Mood'}
                        </p>
                      </div>
                    </div>

                    {/* Weight Section */}
                    {summary.weight && (
                      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #fce7f3' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Scale size={18} style={{ color: 'white' }} />
                            </div>
                            <div>
                              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Today&apos;s Weight</p>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{summary.weight.toFixed(2)} kg</p>
                            </div>
                          </div>
                          {summary.weightDelta !== null && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              padding: '6px 12px', 
                              borderRadius: '9999px', 
                              fontSize: '14px', 
                              fontWeight: '500',
                              background: summary.weightDelta > 0 ? '#d1fae5' : '#fee2e2',
                              color: summary.weightDelta > 0 ? '#047857' : '#dc2626'
                            }}>
                              {summary.weightDelta < 0 ? (
                                <TrendingDown size={14} />
                              ) : (
                                <TrendingUp size={14} />
                              )}
                              {summary.weightDelta > 0 ? '+' : ''}{summary.weightDelta.toFixed(2)} kg
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Meditation Status */}
                    <div style={{ 
                      background: summary.meditationDone ? '#d1fae5' : 'rgba(255,255,255,0.8)', 
                      borderRadius: '12px', 
                      padding: '12px 16px', 
                      marginBottom: '20px', 
                      border: summary.meditationDone ? '1px solid #10b981' : '1px solid #fce7f3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <Leaf size={20} style={{ color: summary.meditationDone ? '#10b981' : '#9ca3af' }} />
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: summary.meditationDone ? '#047857' : '#6b7280' 
                      }}>
                        Meditation: {summary.meditationDone ? '✅ Done' : '❌ Not Done'}
                      </span>
                    </div>

                    {/* Muscles Worked */}
                    {Object.keys(summary.muscleCount).length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Activity size={12} style={{ color: '#ec4899' }} />
                          Muscles Worked
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Object.entries(summary.muscleCount)
                            .sort(([, a], [, b]) => b - a)
                            .map(([muscle, count]) => (
                              <span 
                                key={muscle}
                                style={{ 
                                  padding: '4px 10px', 
                                  borderRadius: '9999px', 
                                  fontSize: '11px', 
                                  fontWeight: '500',
                                  background: '#fce7f3',
                                  color: '#be185d'
                                }}
                              >
                                {muscle} ({count})
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Exercises List by Page */}
                    <div style={{ marginBottom: '16px' }}>
                      {Object.entries(summary.exercisesByPage).map(([pageName, exercises]) => (
                        <div key={pageName} style={{ marginBottom: '12px' }}>
                          <p style={{ fontSize: '11px', fontWeight: '600', color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
                            📋 {pageName}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {exercises.map((ex, i) => (
                              <div 
                                key={ex._id}
                                style={{ 
                                  background: 'rgba(255,255,255,0.8)', 
                                  borderRadius: '12px', 
                                  padding: '12px 16px', 
                                  border: '1px solid #f3e8ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, #ec4899, #a855f7)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: 'white', 
                                    fontSize: '11px', 
                                    fontWeight: 'bold' 
                                  }}>
                                    {i + 1}
                                  </span>
                                  <div>
                                    <p style={{ fontWeight: '500', color: '#1f2937', fontSize: '13px', margin: 0 }}>{ex.title}</p>
                                    <p style={{ fontSize: '10px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                                      {ex.targetMuscles.slice(0, 3).join(' • ')}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                                    {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                                  </p>
                                  <p style={{ fontSize: '10px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                                    {ex.type === 'duration' 
                                      ? `${ex.sets.reduce((a, s) => a + (s.duration || s.reps), 0)}s total`
                                      : `${ex.sets.reduce((a, s) => a + s.reps, 0)} reps`
                                    }
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(236, 72, 153, 0.2)', textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                        Made with 💖 in LifeOS
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <div className="p-4 border-t border-zinc-800">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-3 rounded-xl bg-pink-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-pink-600 transition-all shadow-lg disabled:opacity-70"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating your image...
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        Share with Bae 💕
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-zinc-500 mt-2">
                    Opens native share sheet
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
