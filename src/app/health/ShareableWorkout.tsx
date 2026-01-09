'use client';

import { useState, useRef } from 'react';
import { Heart, Sparkles, Dumbbell, Scale, TrendingDown, TrendingUp, Download, X, Star, Flame, Trophy } from 'lucide-react';
import { getTodaysWorkoutSummary } from '@/app/actions/health';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

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
  totalExercises: number;
  totalSets: number;
  weight: number | null;
  weightDelta: string | null;
  mood: string | null;
}

const MOOD_EMOJIS: Record<string, string> = {
  great: '🌟',
  good: '😊',
  okay: '😌',
  low: '😔',
  bad: '😢'
};

const CUTE_MESSAGES = [
  "Look what I did today! 💪",
  "Crushed it! 🔥",
  "Getting stronger! 💖",
  "Workout complete! ✨",
  "Did my best today! 🌸"
];

interface ShareableWorkoutProps {
  canShare: boolean;
  exerciseCount: number;
  hasWeight: boolean;
}

export default function ShareableWorkout({ canShare, exerciseCount, hasWeight }: ShareableWorkoutProps) {
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
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#fff',
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `workout-${new Date().toLocaleDateString('en-CA')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  }

  const randomMessage = CUTE_MESSAGES[Math.floor(Math.random() * CUTE_MESSAGES.length)];
  const formattedDate = summary ? new Date(summary.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleOpen}
        disabled={!canShare}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
          canShare 
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
            : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
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
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Heart className="text-pink-500" size={20} />
                Share Your Workout
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading your amazing workout...</p>
                </div>
              </div>
            )}

            {/* Shareable Card Preview */}
            {!isLoading && summary && (
              <>
                <div className="p-4">
                  {/* The actual shareable card - light mode for export */}
                  <div 
                    ref={cardRef}
                    className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-2xl p-6 shadow-inner"
                    style={{ color: '#1a1a1a' }}
                  >
                    {/* Header with hearts */}
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-2xl">💪</span>
                        <span className="text-2xl">✨</span>
                        <span className="text-2xl">💖</span>
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {randomMessage}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm border border-pink-100">
                        <Dumbbell size={20} className="mx-auto mb-1 text-pink-500" />
                        <p className="text-2xl font-bold text-gray-800">{summary.totalExercises}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Exercises</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm border border-purple-100">
                        <Flame size={20} className="mx-auto mb-1 text-orange-500" />
                        <p className="text-2xl font-bold text-gray-800">{summary.totalSets}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Sets</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm border border-rose-100">
                        <Trophy size={20} className="mx-auto mb-1 text-yellow-500" />
                        <p className="text-2xl font-bold text-gray-800">{summary.mood ? MOOD_EMOJIS[summary.mood] : '💪'}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Mood</p>
                      </div>
                    </div>

                    {/* Weight Section */}
                    {summary.weight && (
                      <div className="bg-white/80 rounded-xl p-4 mb-5 shadow-sm border border-pink-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                              <Scale size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Today's Weight</p>
                              <p className="text-xl font-bold text-gray-800">{summary.weight} kg</p>
                            </div>
                          </div>
                          {summary.weightDelta && (
                            <div className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
                              Number(summary.weightDelta) < 0 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-rose-100 text-rose-700"
                            )}>
                              {Number(summary.weightDelta) < 0 ? (
                                <TrendingDown size={14} />
                              ) : (
                                <TrendingUp size={14} />
                              )}
                              {Math.abs(Number(summary.weightDelta))} kg
                              <span className="text-[10px] opacity-70">(30d)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exercises List */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" />
                        Today's Exercises
                      </p>
                      {summary.exercises.map((ex, i) => (
                        <div 
                          key={ex._id}
                          className="bg-white/80 rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{ex.title}</p>
                              <p className="text-[10px] text-gray-400">
                                {ex.targetMuscles.slice(0, 3).join(' • ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-700">
                              {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {ex.type === 'duration' 
                                ? `${ex.sets.reduce((a, s) => a + (s.duration || s.reps), 0)}s total`
                                : `${ex.sets.reduce((a, s) => a + s.reps, 0)} reps total`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-pink-200/50 text-center">
                      <p className="text-xs text-gray-400">
                        Made with 💖 in LifeOS
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <div className="p-4 border-t border-border">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium flex items-center justify-center gap-2 hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25 disabled:opacity-70"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating your image...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Download & Share with Bae 💕
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Downloads as a beautiful PNG image
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
