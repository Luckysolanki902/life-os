'use client';

/**
 * Action Wrapper - Wraps server actions with optimistic updates and sync
 * Provides seamless local-first experience
 */

import { notifyDataChanged } from './sync-manager';
import { setCache, updateCache, CACHE_KEYS } from './reactive-cache';

/**
 * Execute a server action with optimistic update and sync notification
 * @param action - The server action to execute
 * @param optimisticUpdate - Optional function to update cache optimistically before action completes
 * @param onSuccess - Optional callback after action succeeds
 * @param onError - Optional error handler
 */
export async function withSync<T>(
  action: () => Promise<T>,
  options?: {
    optimisticUpdate?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: any) => void;
    collections?: string[];
  }
): Promise<T> {
  try {
    // Apply optimistic update immediately
    if (options?.optimisticUpdate) {
      options.optimisticUpdate();
    }

    // Execute the actual server action
    const result = await action();

    // Notify other devices about the change
    await notifyDataChanged(options?.collections || ['all']);

    // Call success handler
    if (options?.onSuccess) {
      options.onSuccess(result);
    }

    return result;
  } catch (error) {
    console.error('Action failed:', error);
    
    // Call error handler
    if (options?.onError) {
      options.onError(error);
    }

    throw error;
  }
}

/**
 * Refresh all home data from server
 */
export async function refreshHomeData() {
  try {
    const response = await fetch('/api/home', { cache: 'no-store' });
    const data = await response.json();
    setCache(CACHE_KEYS.HOME_DATA, data);
    return data;
  } catch (error) {
    console.error('Failed to refresh home data:', error);
    throw error;
  }
}

/**
 * Helper to execute action with full data refresh after
 */
export async function withFullRefresh<T>(
  action: () => Promise<T>,
  optimisticUpdate?: () => void
): Promise<T> {
  return withSync(action, {
    optimisticUpdate,
    onSuccess: async () => {
      // Refresh home data in background (don't block)
      setTimeout(() => refreshHomeData(), 100);
    }
  });
}
