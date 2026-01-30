# Testing the Real-Time Sync System

## Quick Test Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Single Device (Instant Updates)

#### Test Task Completion
1. Open http://localhost:3000
2. Complete a task by tapping/clicking it
3. ✅ **Expected**: Task instantly marked as done
4. Refresh the page
5. ✅ **Expected**: Task still shows as completed (persisted)

#### Test Weight Logging
1. Click on the weight card
2. Enter a weight (e.g., 75.5)
3. Submit the form
4. ✅ **Expected**: Weight displays immediately
5. Refresh the page
6. ✅ **Expected**: Weight still shows (persisted)

#### Test Points Update
1. Note current points total
2. Complete a task
3. Wait ~1 second
4. ✅ **Expected**: Points total updates automatically (no refresh needed)

### 3. Test Multi-Device Sync

#### Setup
1. Open http://localhost:3000 in Chrome
2. Open http://localhost:3000 in Safari (or private/incognito)
3. Make sure you're logged in on both

#### Test Task Sync
1. **Device 1**: Complete a task
2. ✅ **Device 1**: Task marked instantly
3. **Device 2**: Wait up to 5 seconds
4. ✅ **Device 2**: Task automatically updates without refresh

#### Test Weight Sync
1. **Device 1**: Log a new weight
2. ✅ **Device 1**: Weight shows immediately
3. **Device 2**: Wait up to 5 seconds
4. ✅ **Device 2**: Weight updates automatically

### 4. Test Offline Behavior

#### Test Optimistic Updates
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Complete a task
4. ✅ **Expected**: Task marked as done in UI (optimistic)
5. Set throttling back to "Online"
6. Wait a moment
7. ✅ **Expected**: Change syncs to server

### 5. Test Error Recovery

#### Force an Error
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Complete a task (optimistic update shows)
4. Keep offline for 30 seconds
5. Set back to "Online"
6. ✅ **Expected**: Either syncs successfully or reverts with error message

## Monitoring

### Check Browser Console
Look for these logs:
```
[HomePageClient] Device ID: device_1234567890_abcdef
[SyncManager] Background sync started
[SyncManager] Update detected, syncing...
[SyncManager] Sync complete
```

### Check Network Tab
Look for these requests:
- `GET /api/home` - Fetching data
- `GET /api/sync/check-update?deviceId=...` - Checking for updates
- `POST /api/sync/notify-change` - Notifying other devices
- `POST /api/sync/mark-synced` - Marking sync complete

### Check localStorage
Open DevTools → Application → Local Storage → http://localhost:3000

Look for:
- `device_id` - Your unique device identifier
- `lifedash_cache_home_data` - Cached home data
- `lifedash_cache_dashboard_stats` - Cached stats

## Performance Checks

### Instant Feedback ⚡
- Task completion: **<50ms** (should feel instant)
- Weight update: **<50ms** (should feel instant)
- UI render: **<100ms** (smooth)

### Background Sync ⏱️
- Cross-device sync: **<5 seconds** (polling interval)
- Full data refresh: **<1 second** (after mutation)

### Cache Hit 🚀
- Page load with cache: **<100ms** (instant)
- Page load without cache: **<1 second** (first time)

## Common Issues & Solutions

### Issue: Updates not syncing to other devices
**Solution**: 
1. Check both devices have network connection
2. Verify MongoDB is running
3. Check browser console for errors
4. Verify device IDs are different (check localStorage)

### Issue: Data reverts after refresh
**Solution**:
1. Check MongoDB connection
2. Verify server actions are completing
3. Check for errors in server logs
4. Clear cache and try again

### Issue: Slow updates
**Solution**:
1. Check network throttling is off
2. Verify MongoDB connection is fast
3. Reduce sync interval (change from 5000ms to 3000ms)
4. Check database indexes are created

### Issue: "Device ID not found"
**Solution**:
1. Clear localStorage
2. Refresh page to generate new device ID

## Advanced Testing

### Load Testing
```bash
# Open multiple tabs
for i in {1..5}; do
  open http://localhost:3000
done
```

### Stress Testing
1. Complete 10+ tasks rapidly
2. ✅ All should sync correctly
3. ✅ No race conditions or conflicts

### Concurrent Updates
1. Open 2 devices
2. Complete different tasks at exactly the same time
3. ✅ Both should sync correctly
4. ✅ No data loss

## Debugging

### Enable Verbose Logging
Add to `sync-manager.ts`:
```typescript
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log('[Sync]', ...args);
}
```

### Monitor Sync State in MongoDB
```bash
# Connect to MongoDB
mongosh

# Switch to your database
use lifedashboard

# Check sync states
db.syncstates.find().pretty()

# Check specific device
db.syncstates.findOne({ deviceId: "device_xxx" })

# Clear all sync states (reset)
db.syncstates.deleteMany({})
```

### Test API Endpoints Directly
```bash
# Check update status
curl "http://localhost:3000/api/sync/check-update?deviceId=test_device"

# Mark needs update
curl -X POST http://localhost:3000/api/sync/mark-update \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test_device"}'

# Notify change
curl -X POST http://localhost:3000/api/sync/notify-change \
  -H "Content-Type: application/json" \
  -d '{"sourceDeviceId":"device1","collections":["all"]}'
```

## Success Criteria

✅ **All tests pass if:**
1. Single device updates are instant
2. Multi-device sync works within 5 seconds
3. Data persists after refresh
4. Offline changes sync when back online
5. No console errors during normal operation
6. Points and weight update automatically
7. No manual refresh needed anywhere

## Report Issues

If something doesn't work:
1. Check browser console for errors
2. Check server logs for errors
3. Verify MongoDB connection
4. Test with throttling off
5. Clear cache and try again
6. Check `SYNC_IMPLEMENTATION.md` for troubleshooting

---

**Happy Testing! 🚀**

The system is designed to be fast, reliable, and seamless. If it feels slow or clunky, something is wrong - it should feel instant!
