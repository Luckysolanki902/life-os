'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// External store for loading state to avoid setState in useEffect
let isLoadingState = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return isLoadingState;
}

function setLoading(value: boolean) {
  isLoadingState = value;
  listeners.forEach(l => l());
}

// Export function to trigger loading immediately on click
export function triggerNavigationLoading() {
  setLoading(true);
  // Auto-hide after animation if route change hasn't triggered yet
  setTimeout(() => {
    setLoading(false);
  }, 600);
}

export default function NavigationLoader() {
  const isLoading = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // When route actually changes, hide the loader
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-in fade-in-0 duration-150"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 animate-pulse">
          <Image
            src="/penguin_logo.png"
            alt="Loading"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
