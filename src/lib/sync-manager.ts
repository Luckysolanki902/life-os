'use client';

/**
 * Sync Manager - Handles background synchronization with MongoDB
 * Local-first architecture with smooth real-time updates
 */

import { getCache, setCache, CACHE_KEYS } from './reactive-cache';

// Device ID for this client
let deviceId: string | null = null;

export function getDeviceId(): string {
  if (deviceId) return deviceId;
  
  if (typeof window === 'undefined') return '';
  
  // Get or create device ID
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_id', id);
  }
  
  deviceId = id;
  return id;
}

// Mark that this device needs update
export async function markNeedsUpdate(deviceId: string) {
  try {
    await fetch('/api/sync/mark-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
  } catch (error) {
    console.error('Failed to mark needs update:', error);
  }
}

// Check if needs update from server
export async function checkNeedsUpdate(deviceId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/sync/check-update?deviceId=${deviceId}`);
    const data = await response.json();
    return data.needsUpdate || false;
  } catch (error) {
    console.error('Failed to check update status:', error);
    return false;
  }
}

// Sync specific data type
export async function syncData(key: string, fetchFn: () => Promise<any>) {
  try {
    const freshData = await fetchFn();
    setCache(key, freshData);
    return freshData;
  } catch (error) {
    console.error(`Failed to sync ${key}:`, error);
    return null;
  }
}

// Background sync loop
let syncInterval: NodeJS.Timeout | null = null;

export function startBackgroundSync(intervalMs: number = 5000) {
  if (syncInterval) return; // Already running
  
  const deviceId = getDeviceId();
  
  syncInterval = setInterval(async () => {
    const needsUpdate = await checkNeedsUpdate(deviceId);
    
    if (needsUpdate) {
      console.log('[SyncManager] Update detected, syncing...');
      
      // Sync all critical data
      await Promise.all([
        syncData(CACHE_KEYS.HOME_DATA, async () => {
          const response = await fetch('/api/home', { cache: 'no-store' });
          return response.json();
        }),
        // Add more sync targets as needed
      ]);
      
      // Mark as synced
      await fetch('/api/sync/mark-synced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      
      console.log('[SyncManager] Sync complete');
    }
  }, intervalMs);
  
  console.log('[SyncManager] Background sync started');
}

export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[SyncManager] Background sync stopped');
  }
}

// Notify other devices that data changed
export async function notifyDataChanged(collections: string[] = ['all']) {
  const currentDeviceId = getDeviceId();
  
  try {
    await fetch('/api/sync/notify-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sourceDeviceId: currentDeviceId,
        collections 
      })
    });
  } catch (error) {
    console.error('Failed to notify data change:', error);
  }
}
