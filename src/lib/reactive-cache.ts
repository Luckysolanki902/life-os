'use client';

/**
 * Reactive Cache System for instant data sync
 * Updates cache in real-time when actions happen
 * Works like a lightweight RxDB for single-user multi-platform sync
 */

const CACHE_PREFIX = 'lifedash_cache_';
const CACHE_VERSION = 1;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

// Event emitter for reactive updates
type Listener<T> = (data: T) => void;
const listeners = new Map<string, Set<Listener<any>>>();

// Emit update event
function emit<T>(key: string, data: T) {
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach(listener => listener(data));
  }
}

// Subscribe to cache updates
export function subscribe<T>(key: string, listener: Listener<T>): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(listener);
  
  // Return unsubscribe function
  return () => {
    listeners.get(key)?.delete(listener);
  };
}

// Get cached data
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

// Set cache and notify subscribers
export function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    
    // Notify all subscribers
    emit(key, data);
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

// Update specific fields in cache (partial update)
export function updateCache<T>(key: string, updater: (prev: T | null) => T): void {
  const current = getCache<T>(key);
  const updated = updater(current);
  setCache(key, updated);
}

// Clear specific cache
export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + key);
  emit(key, null);
}

// Cache keys
export const CACHE_KEYS = {
  HOME_DATA: 'home_data',
  REPORTS_DATA: 'reports_data',
  DASHBOARD_STATS: 'dashboard_stats',
  HEALTH_DATA: 'health_data',
  WEIGHT_DATA: 'weight_data',
} as const;

// ============================================
// Task-specific cache update helpers
// ============================================

interface HomeData {
  incompleteTasks: Array<{
    _id: string;
    title: string;
    domainId: string;
    timeOfDay?: string;
    points: number;
    status: 'pending' | 'completed' | 'skipped';
    completedAt?: string;
  }>;
  domains: any[];
  todaysWeight: any;
  streakData: any;
  specialTasks: any[];
  totalPoints: number;
  last7DaysCompletion: any[];
}

// Update task status in cache (optimistic update)
export function updateTaskInCache(
  taskId: string, 
  newStatus: 'pending' | 'completed' | 'skipped',
  completedAt?: string
): void {
  updateCache<HomeData>(CACHE_KEYS.HOME_DATA, (prev) => {
    if (!prev) return prev as any;
    
    return {
      ...prev,
      incompleteTasks: prev.incompleteTasks.map(task => 
        task._id === taskId 
          ? { ...task, status: newStatus, completedAt }
          : task
      )
    };
  });
}

// Mark task as completed in cache
export function markTaskCompleted(taskId: string): void {
  updateTaskInCache(taskId, 'completed', new Date().toISOString());
}

// Mark task as skipped in cache
export function markTaskSkipped(taskId: string): void {
  updateTaskInCache(taskId, 'skipped');
}

// Mark task as pending (uncomplete/unskip) in cache
export function markTaskPending(taskId: string): void {
  updateTaskInCache(taskId, 'pending', undefined);
}

// Update weight in cache (optimistic)
export function updateWeightInCache(weight: number, weightData?: any): void {
  const weightEntry = weightData || { weight, date: new Date() };
  
  // Update HOME_DATA cache
  updateCache<HomeData>(CACHE_KEYS.HOME_DATA, (prev) => {
    if (!prev) return prev as any;
    
    return {
      ...prev,
      todaysWeight: weightEntry
    };
  });
  
  // Update HEALTH_DATA cache
  updateCache<any>(CACHE_KEYS.HEALTH_DATA, (prev) => {
    if (!prev) return prev as any;
    
    return {
      ...prev,
      weightStats: {
        ...prev.weightStats,
        todaysWeight: weightEntry
      }
    };
  });
  
  // Update standalone WEIGHT_DATA cache
  setCache(CACHE_KEYS.WEIGHT_DATA, weightEntry);
}

// Remove task from incomplete tasks (when completed)
export function removeTaskFromIncomplete(taskId: string): void {
  updateCache<HomeData>(CACHE_KEYS.HOME_DATA, (prev) => {
    if (!prev) return prev as any;
    
    return {
      ...prev,
      incompleteTasks: prev.incompleteTasks.filter(task => task._id !== taskId)
    };
  });
}

// Add task back to incomplete tasks (when uncompleted)
export function addTaskToIncomplete(task: any): void {
  updateCache<HomeData>(CACHE_KEYS.HOME_DATA, (prev) => {
    if (!prev) return prev as any;
    
    // Check if task already exists
    const exists = prev.incompleteTasks.some(t => t._id === task._id);
    if (exists) return prev;
    
    return {
      ...prev,
      incompleteTasks: [...prev.incompleteTasks, task]
    };
  });
}

// Update total points in cache
export function updateTotalPointsInCache(totalPoints: number): void {
  updateCache<HomeData>(CACHE_KEYS.HOME_DATA, (prev) => {
    if (!prev) return prev as any;
    
    return {
      ...prev,
      totalPoints
    };
  });
}

// ============================================
// React Hook for reactive cache
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useReactiveCache<T>(key: string, initialFetcher?: () => Promise<T>): {
  data: T | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setData: (data: T) => void;
} {
  const [data, setDataState] = useState<T | null>(() => getCache<T>(key));
  const [isLoading, setIsLoading] = useState(!data && !!initialFetcher);

  // Subscribe to cache updates
  useEffect(() => {
    const unsubscribe = subscribe<T>(key, (newData) => {
      setDataState(newData);
    });
    return unsubscribe;
  }, [key]);

  // Initial fetch if no cache
  useEffect(() => {
    if (!data && initialFetcher) {
      setIsLoading(true);
      initialFetcher()
        .then((result) => {
          setCache(key, result);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!initialFetcher) return;
    setIsLoading(true);
    try {
      const result = await initialFetcher();
      setCache(key, result);
    } catch (e) {
      console.error('Cache refresh failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [key, initialFetcher]);

  const setData = useCallback((newData: T) => {
    setCache(key, newData);
  }, [key]);

  return { data, isLoading, refresh, setData };
}
