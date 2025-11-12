# Screen Sync Debugging Guide

## Current Implementation

### How It Should Work

1. **Host starts game:**
   - `handleStartGame` creates game state with `currentScreen: 'questions'`
   - Saves to Supabase immediately (no debounce)
   - Host's screen updates immediately (optimistic)

2. **Supabase Realtime:**
   - Broadcasts UPDATE event to all subscribed players
   - All players receive the update via subscription

3. **Non-host receives update:**
   - `onGameStateUpdate` callback fires
   - Screen is updated to match `gameState.currentScreen`
   - Backup sync mechanism also watches for mismatches

### Fixes Applied

1. **Subscription Stability:**
   - ✅ Callbacks stored in refs (don't cause subscription recreation)
   - ✅ Subscription only depends on `roomId` and `isInitialized`
   - ✅ Initial game state fetch when subscription is set up

2. **Screen Updates:**
   - ✅ Force screen update when game state is received
   - ✅ Backup sync mechanism watches for screen mismatches
   - ✅ Screen syncs based on phase if screen is missing

3. **Game State Saving:**
   - ✅ Host saves immediately (no debounce for critical transitions)
   - ✅ `currentScreen` always included in saved state
   - ✅ Comprehensive logging

## Debugging Steps

### 1. Check Realtime Is Enabled

**CRITICAL:** Realtime MUST be enabled for screen syncing to work!

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Ensure `game_states` table has Realtime enabled
4. Also enable for `rooms` and `room_players` tables

### 2. Check Console Logs

**Host Side:**
- Should see: `"Host: Starting game - saving game state with screen: questions"`
- Should see: `"💾 Saving game state to Supabase"`
- Should see: `"Host: Game state saved successfully to Supabase"`

**Non-Host Side:**
- Should see: `"🔔 Game state subscription triggered for room: ..."`
- Should see: `"📥 Received game state update from Supabase"`
- Should see: `"✅ FORCING screen update to: questions"`
- Should see: `"🔄 BACKUP SYNC: Screen mismatch detected"` (if backup kicks in)

### 3. Check Subscription Status

Look for:
- `"Game state subscription status: SUBSCRIBED"`
- `"Successfully subscribed to game state changes for room: ..."`

If you see `"CLOSED"` repeatedly, the subscription is being recreated (this should be fixed now).

### 4. Verify Game State in Database

1. Go to Supabase Dashboard → Table Editor → `game_states`
2. Find the row for your room
3. Check the `state` JSONB column
4. Verify `currentScreen` is set to `"questions"` (or whatever screen it should be)

### 5. Test Flow

1. **Host:**
   - Create room
   - Start game
   - Check console for save confirmation

2. **Non-Host:**
   - Join room (should see initial game state fetch)
   - Wait for host to start game
   - Check console for subscription triggers
   - Verify screen updates

## Common Issues

### Issue: Screen not updating for non-host

**Possible causes:**
1. Realtime not enabled on `game_states` table
2. Subscription not receiving updates
3. Screen update logic not firing
4. Screen being overridden by something else

**Solutions:**
1. Enable Realtime in Supabase
2. Check console logs to see if subscription is receiving updates
3. Check if `currentScreen` is in the game state
4. Check backup sync mechanism logs

### Issue: Subscription closing/reopening

**Cause:** Callbacks changing on every render

**Solution:** Fixed by using refs for callbacks (already applied)

### Issue: Screen updates but then reverts

**Cause:** Something is forcing screen back to lobby

**Solution:** Check if any useEffect is overriding the screen

## Testing Checklist

- [ ] Realtime enabled on `game_states` table
- [ ] Host can start game
- [ ] Host sees "questions" screen
- [ ] Non-host receives subscription update
- [ ] Non-host screen updates to "questions"
- [ ] Screen doesn't revert to lobby
- [ ] Console shows all expected log messages

## Next Steps If Still Not Working

1. Check Supabase Realtime status in dashboard
2. Verify RLS policies allow reads (they should)
3. Check network tab for WebSocket connections
4. Verify game state is being saved correctly
5. Check if subscription is actually receiving updates

