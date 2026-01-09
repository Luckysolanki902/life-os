'use client';

import { useState, useRef } from 'react';
import { 
  Share2, Download, X, Activity, Scale, Smile, Target, Flame, 
  TrendingUp, TrendingDown, Dumbbell, Calendar
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';

interface ShareableReportProps {
  data: any;
  period: string;
  periodLabel: string;
}

const PERIOD_LABELS: Record<string, string> = {
  'last7Days': 'Last 7 Days',
  'last14Days': 'Last 14 Days',
  'thisWeek': 'This Week',
  'lastWeek': 'Last Week',
  'thisMonth': 'This Month',
  'lastMonth': 'Last Month',
  'last3Months': 'Last 3 Months',
  'last6Months': 'Last 6 Months',
  'thisYear': 'This Year',
};

export default function ShareableHealthReport({ data, period, periodLabel }: ShareableReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { summary, muscleWork, exercisesByType, dailyExercise } = data;
  
  // Calculate workout days
  const totalWorkoutDays = dailyExercise?.filter((d: any) => d.sessions > 0).length || 0;
  const totalDays = dailyExercise?.length || 0;
  
  // Calculate streak
  let currentStreak = 0;
  if (dailyExercise) {
    const reversedData = [...dailyExercise].reverse();
    for (const day of reversedData) {
      if (day.sessions > 0) currentStreak++;
      else break;
    }
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
      link.download = `health-report-${period}-${new Date().toLocaleDateString('en-CA')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  }

  const displayLabel = PERIOD_LABELS[period] || periodLabel;

  return (
    <>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
      >
        <Share2 size={16} />
        Share Report
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Share Health Report</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Shareable Card Preview */}
            <div className="p-4">
              <div
                ref={cardRef}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
                }}
              >
                {/* Header */}
                <div className="p-5 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm mb-3">
                    <Activity size={14} className="text-rose-500" />
                    <span className="text-sm font-medium text-rose-700">Health Report</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{displayLabel}</h2>
                  <p className="text-sm text-gray-600 mt-1">LifeDashboard</p>
                </div>

                {/* Stats Grid */}
                <div className="px-5 pb-5 space-y-3">
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/70 rounded-xl p-4 text-center backdrop-blur-sm">
                      <div className="flex justify-center mb-2">
                        <Dumbbell size={20} className="text-rose-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{summary.totalExerciseSessions}</p>
                      <p className="text-xs text-gray-600">Exercises</p>
                    </div>
                    
                    <div className="bg-white/70 rounded-xl p-4 text-center backdrop-blur-sm">
                      <div className="flex justify-center mb-2">
                        <Calendar size={20} className="text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{totalWorkoutDays}/{totalDays}</p>
                      <p className="text-xs text-gray-600">Workout Days</p>
                    </div>
                    
                    <div className="bg-white/70 rounded-xl p-4 text-center backdrop-blur-sm">
                      <div className="flex justify-center mb-2">
                        <Flame size={20} className="text-orange-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{currentStreak}</p>
                      <p className="text-xs text-gray-600">Day Streak</p>
                    </div>
                    
                    <div className="bg-white/70 rounded-xl p-4 text-center backdrop-blur-sm">
                      <div className="flex justify-center mb-2">
                        <Target size={20} className="text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{summary.healthTasksCompletionRate}%</p>
                      <p className="text-xs text-gray-600">Task Rate</p>
                    </div>
                  </div>

                  {/* Weight Section */}
                  {summary.currentWeight && (
                    <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Scale size={20} className="text-cyan-500" />
                          <div>
                            <p className="text-lg font-bold text-gray-800">{summary.currentWeight}kg</p>
                            <p className="text-xs text-gray-600">Current Weight</p>
                          </div>
                        </div>
                        {summary.weightChange !== 0 && (
                          <div className={cn(
                            'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                            summary.weightChange < 0 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          )}>
                            {summary.weightChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            {summary.weightChange > 0 ? '+' : ''}{summary.weightChange}kg
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mood Section */}
                  {summary.avgMood > 0 && (
                    <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <Smile size={20} className="text-amber-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-800">{summary.avgMood.toFixed(1)}/5</p>
                          <p className="text-xs text-gray-600">Average Mood</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Muscles */}
                  {muscleWork && muscleWork.length > 0 && (
                    <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-xs text-gray-600 mb-2">Top Muscles Worked</p>
                      <div className="flex flex-wrap gap-1.5">
                        {muscleWork.slice(0, 6).map((muscle: any, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-medium"
                          >
                            {muscle.muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Activity Preview */}
                  {dailyExercise && dailyExercise.length > 0 && (
                    <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-xs text-gray-600 mb-2">Activity</p>
                      <div className="flex gap-1">
                        {dailyExercise.slice(-14).map((day: any, i: number) => (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 h-6 rounded',
                              day.sessions > 0 ? 'bg-rose-400' : 'bg-rose-100'
                            )}
                            title={`${day.date}: ${day.sessions} exercises`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
                  'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-90',
                  isExporting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Save as Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
