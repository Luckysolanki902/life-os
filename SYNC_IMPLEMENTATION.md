# Real-Time Sync Implementation

## Overview

This implementation provides a **local-first, real-time synchronization system** that ensures all updates are instantly visible across devices without requiring page refreshes.

## Architecture

### 1. **Reactive Cache System** (`src/lib/reactive-cache.ts`)
- Local storage-based cache with event emitters
- Automatically notifies all subscribers when data changes
- Provides optimistic updates for instant UI feedback
- React hooks for seamless integration

### 2. **Sync Manager** (`src/lib/sync-manager.ts`)
- Background polling (every 5 seconds) to check for updates
- Device ID tracking for multi-device support
- Automatic data refresh when changes are detected
- Notifies other devices when local changes occur

### 3. **MongoDB Sync State** (`src/models/SyncState.ts`)
- Tracks which devices need updates
- Stores last sync timestamp per device
- Collection-level change tracking

### 4. **Action Wrapper** (`src/lib/action-wrapper.ts`)
- Wraps server actions with:
  - Optimistic updates
  - Automatic sync notifications
  - Full data refresh after mutations
  - Error handling and rollback

## How It Works

### Data Flow

```
User Action
    ↓
Optimistic Update (instant UI)
    ↓
Reactive Cache Update (instant)
    ↓
Server Action
    ↓
MongoDB Update
    ↓
Notify Other Devices (via /api/sync/notify-change)
    ↓
Background Sync Detects Change (5s polling)
    ↓
Fetch Fresh Data
    ↓
Update Local Cache
    ↓
UI Auto-Updates (reactive)
```

### Key Features

✅ **Instant UI Updates** - Optimistic updates show changes immediately
✅ **No Page Refresh Needed** - All data syncs in background
✅ **Multi-Device Sync** - Changes sync across all devices automatically
✅ **Offline Support** - Local cache works offline, syncs when online
✅ **Automatic Rollback** - Failed operations revert UI automatically
✅ **Smooth UX** - No loading spinners for cached data

## API Endpoints

### `/api/sync/check-update` (GET)
Check if a device needs to fetch fresh data
- Query param: `deviceId`
- Returns: `{ needsUpdate: boolean, lastSync: Date }`

### `/api/sync/mark-update` (POST)
Mark a device as needing update
- Body: `{ deviceId: string }`

### `/api/sync/mark-synced` (POST)
Mark a device as synced (after fetching fresh data)
- Body: `{ deviceId: string }`

### `/api/sync/notify-change` (POST)
Notify all other devices that data changed
- Body: `{ sourceDeviceId: string, collections?: string[] }`

## Usage Examples

### In Components

```tsx
import { withFullRefresh } from '@/lib/action-wrapper';
import { markTaskCompleted, removeTaskFromIncomplete } from '@/lib/reactive-cache';

async function handleCompleteTask(taskId: string) {
  // 1. Optimistic update (instant UI)
  markTaskCompleted(taskId);
  removeTaskFromIncomplete(taskId);
  
  // 2. Execute server action with auto-sync
  await withFullRefresh(() => completeTask(taskId));
  
  // That's it! Everything else is automatic:
  // - Other devices get notified
  // - Background sync fetches fresh data
  // - Cache updates trigger UI refresh
}
```

### Using Reactive Cache Hook

```tsx
import { useReactiveCache, CACHE_KEYS } from '@/lib/reactive-cache';

function MyComponent() {
  const { data, isLoading, refresh } = useReactiveCache(
    CACHE_KEYS.HOME_DATA,
    fetchHomeData
  );
  
  // data automatically updates when cache changes!
  // No manual state management needed
}
```

## What's Updated Automatically

1. **Routine Tasks** - Complete/skip/uncomplete instantly syncs
2. **Weight Logs** - Weight updates reflect immediately
3. **Total Points** - Recalculated and updated in real-time
4. **Better Percentage** - Updates when tasks complete
5. **Weight Graph** - New weight entries appear instantly
6. **Streak Data** - Updates when tasks complete
7. **Dashboard Stats** - Refreshes in background

## Performance Optimizations

- **Polling Interval**: 5 seconds (configurable)
- **Debounced Updates**: Multiple changes batched together
- **Selective Refresh**: Only fetches changed collections
- **Cached Responses**: Shows cached data while fetching fresh
- **No Blocking**: All syncs happen in background

## Device ID Management

Each device gets a unique ID stored in localStorage:
```typescript
device_${timestamp}_${randomString}
```

This allows the system to track which devices have seen which updates.

## Error Handling

- Failed actions automatically revert optimistic updates
- Sync errors are logged but don't break the app
- Fallback to manual refresh if sync fails
- Toast notifications for user feedback

## Configuration

### Adjust Sync Interval

In `HomePageClient.tsx`:
```tsx
// Change from 5000ms (5s) to desired interval
startBackgroundSync(5000);
```

### Add New Sync Targets

In `sync-manager.ts` `startBackgroundSync()`:
```tsx
await Promise.all([
  syncData(CACHE_KEYS.HOME_DATA, fetchHomeData),
  syncData(CACHE_KEYS.HEALTH_DATA, fetchHealthData), // Add more
]);
```

## Testing

1. **Single Device**: Complete a task, verify instant update
2. **Multi-Device**: Open on phone + desktop, complete task on phone, verify desktop updates within 5 seconds
3. **Offline**: Disable network, complete task (shows optimistically), enable network, verify syncs
4. **Error Recovery**: Force an error, verify UI reverts correctly

## Future Enhancements

- [ ] WebSocket support for instant push (eliminate polling)
- [ ] Conflict resolution for simultaneous edits
- [ ] Offline queue for actions when network unavailable
- [ ] Compression for large data transfers
- [ ] Collection-specific sync intervals
- [ ] Exponential backoff for failed syncs

## Troubleshooting

**Data not syncing?**
- Check browser console for sync errors
- Verify MongoDB connection
- Check device ID in localStorage
- Test `/api/sync/check-update` endpoint

**UI not updating?**
- Verify component uses `useReactiveCache`
- Check cache keys match between reads/writes
- Ensure `setCache` is called after mutations

**Slow syncs?**
- Reduce polling interval
- Optimize API endpoint queries
- Add database indexes
- Enable response caching
