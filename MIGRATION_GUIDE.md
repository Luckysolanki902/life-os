# Migration Guide - Adding Sync to New Components

## Quick Start

Want to add real-time sync to a new component? Follow these steps:

## 1. Import Required Functions

```tsx
import { withFullRefresh } from '@/lib/action-wrapper';
import { setCache, updateCache, CACHE_KEYS } from '@/lib/reactive-cache';
```

## 2. Wrap Server Actions

### Before:
```tsx
async function handleSomeAction() {
  await someServerAction();
  router.refresh(); // Manual refresh
}
```

### After:
```tsx
async function handleSomeAction() {
  await withFullRefresh(() => someServerAction());
  // That's it! Automatic sync + refresh
}
```

## 3. Add Optimistic Updates (Optional but Recommended)

### Before:
```tsx
async function handleCompleteTask(taskId: string) {
  await completeTask(taskId);
  // Wait for server...
}
```

### After:
```tsx
import { markTaskCompleted } from '@/lib/reactive-cache';

async function handleCompleteTask(taskId: string) {
  // 1. Optimistic update (instant)
  markTaskCompleted(taskId);
  
  // 2. Server action with sync
  await withFullRefresh(() => completeTask(taskId));
}
```

## 4. Use Reactive Cache Hook

### Before:
```tsx
export default function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{data?.value}</div>;
}
```

### After:
```tsx
import { useReactiveCache, CACHE_KEYS } from '@/lib/reactive-cache';

export default function MyComponent() {
  const { data, isLoading, refresh } = useReactiveCache(
    CACHE_KEYS.HOME_DATA,
    fetchData
  );
  
  // Data automatically updates when cache changes!
  return <div>{data?.value}</div>;
}
```

## 5. Add Custom Cache Keys (If Needed)

```tsx
// In src/lib/reactive-cache.ts
export const CACHE_KEYS = {
  HOME_DATA: 'home_data',
  REPORTS_DATA: 'reports_data',
  DASHBOARD_STATS: 'dashboard_stats',
  HEALTH_DATA: 'health_data',
  MY_NEW_DATA: 'my_new_data', // Add your key here
} as const;
```

## 6. Create Custom Cache Updaters (Optional)

```tsx
// In src/lib/reactive-cache.ts

// For simple updates
export function updateMyDataInCache(newValue: any): void {
  updateCache<MyDataType>(CACHE_KEYS.MY_NEW_DATA, (prev) => {
    if (!prev) return prev as any;
    
    return {
      ...prev,
      myField: newValue
    };
  });
}
```

## Common Patterns

### Pattern 1: Simple Action with Auto-Refresh
```tsx
async function handleAction() {
  await withFullRefresh(() => myServerAction());
}
```

### Pattern 2: Action with Optimistic Update
```tsx
async function handleAction() {
  // Optimistic
  setLocalState(newValue);
  updateCacheHelper(newValue);
  
  try {
    await withFullRefresh(() => myServerAction());
  } catch (error) {
    // Revert on error
    setLocalState(oldValue);
  }
}
```

### Pattern 3: Action with Custom Logic
```tsx
import { withSync, notifyDataChanged } from '@/lib/action-wrapper';

async function handleAction() {
  await withSync(() => myServerAction(), {
    optimisticUpdate: () => {
      // Custom optimistic logic
    },
    onSuccess: (result) => {
      // Custom success logic
    },
    collections: ['tasks', 'points'] // Specific collections
  });
}
```

## Real Examples from Codebase

### Example 1: Task Completion (NewHomeClient.tsx)
```tsx
async function handleToggleTask(taskId: string) {
  const task = tasks.find(t => t._id === taskId);
  const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
  
  // 1. Update UI instantly
  setTasks(prev => prev.map(t => 
    t._id === taskId ? { ...t, status: nextStatus } : t
  ));
  
  // 2. Update cache
  if (nextStatus === 'completed') {
    markTaskCompleted(taskId);
    removeTaskFromIncomplete(taskId);
  } else {
    markTaskPending(taskId);
  }
  
  // 3. Server action with sync
  await withFullRefresh(
    () => toggleTaskStatus(taskId, task.status === 'completed')
  );
}
```

### Example 2: Weight Logging (NewHomeClient.tsx)
```tsx
async function handleLogWeight(e: React.FormEvent) {
  e.preventDefault();
  const weightValue = parseFloat(weight);
  
  // Optimistic update
  const optimisticWeight = { weight: weightValue, date: new Date() };
  setTodaysWeight(optimisticWeight);
  updateWeightInCache(weightValue, optimisticWeight);
  
  try {
    const result = await withFullRefresh(
      () => logWeight(weightValue, new Date().toISOString()),
      () => updateWeightInCache(weightValue, optimisticWeight)
    );
    
    setTodaysWeight(result);
  } catch (error) {
    // Revert on error
    setTodaysWeight(initialWeight);
  }
}
```

## Checklist for New Components

- [ ] Import sync utilities
- [ ] Wrap server actions with `withFullRefresh()`
- [ ] Add optimistic updates for instant feedback
- [ ] Use `useReactiveCache()` hook for data
- [ ] Add error handling and rollback
- [ ] Test on single device
- [ ] Test on multiple devices
- [ ] Test offline behavior

## Tips

✅ **DO:**
- Always use `withFullRefresh()` for mutations
- Add optimistic updates for better UX
- Handle errors gracefully
- Use reactive cache hooks

❌ **DON'T:**
- Call `router.refresh()` manually (use `withFullRefresh`)
- Forget error handling and rollback
- Skip optimistic updates (users will notice delay)
- Fetch data without caching

## Need Help?

- Check `SYNC_IMPLEMENTATION.md` for architecture details
- Look at `NewHomeClient.tsx` for complete examples
- Check `TaskItem.tsx` for reusable component patterns
- Read inline comments in `action-wrapper.ts` and `sync-manager.ts`

---

**Remember**: The goal is instant feedback + background sync. Always update UI immediately, then let the sync system handle the rest!
