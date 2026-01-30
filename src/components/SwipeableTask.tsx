'use client';

import { useRef, useState, useCallback } from 'react';
import { hapticTaskComplete, hapticTaskSkip } from '@/lib/haptics';

interface SwipeableTaskProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;  // Complete
  onSwipeRight: () => void; // Skip
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80; // Minimum distance to trigger action
const VELOCITY_THRESHOLD = 0.5; // Minimum velocity to trigger action

export default function SwipeableTask({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  disabled = false 
}: SwipeableTaskProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    currentXRef.current = 0;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    currentXRef.current = diff;
    
    // Apply resistance at edges
    const resistance = 0.5;
    const resistedDiff = diff > 0 
      ? Math.min(diff * resistance, 100) 
      : Math.max(diff * resistance, -100);
    
    setTranslateX(resistedDiff);
  }, [isDragging, disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    
    const diff = currentXRef.current;
    const duration = Date.now() - startTimeRef.current;
    const velocity = Math.abs(diff) / duration;
    
    // Check if swipe is significant enough
    const isSwipe = Math.abs(diff) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;
    
    if (isSwipe) {
      if (diff > 0) {
        // Swipe right = Skip
        hapticTaskSkip();
        onSwipeRight();
      } else {
        // Swipe left = Complete
        hapticTaskComplete();
        onSwipeLeft();
      }
    }
    
    // Reset position
    setTranslateX(0);
    setIsDragging(false);
  }, [isDragging, disabled, onSwipeLeft, onSwipeRight]);

  // Calculate background indicator colors
  const showLeftIndicator = translateX < -20;
  const showRightIndicator = translateX > 20;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background indicators */}
      <div 
        className="absolute inset-0 flex items-center justify-start px-4 bg-emerald-500/20 transition-opacity duration-150 pointer-events-none z-0"
        style={{ opacity: showLeftIndicator ? 1 : 0 }}
      >
        <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider drop-shadow-lg">Done</span>
      </div>
      <div 
        className="absolute inset-0 flex items-center justify-end px-4 bg-amber-500/20 transition-opacity duration-150 pointer-events-none z-0"
        style={{ opacity: showRightIndicator ? 1 : 0 }}
      >
        <span className="text-amber-500 text-sm font-bold uppercase tracking-wider drop-shadow-lg">Skip</span>
      </div>
      
      {/* Main content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        className="relative z-20 touch-pan-y bg-card"
      >
        {children}
      </div>
    </div>
  );
}
