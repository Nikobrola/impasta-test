# Complete Supabase Setup Instructions

## Problem
After running the SQL, "Start Game" button and "Add Bot" aren't syncing. This is because:
1. **Missing RLS policies** for `rooms` and `room_players` tables
2. **Realtime might not be enabled** on all tables

## Solution

### Step 1: Run the Complete SQL File

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `COMPLETE_SUPABASE_SETUP.sql`
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

This SQL file includes:
- ✅ All table schemas (rooms, room_players, game_states)
- ✅ ALL RLS policies for all three tables
- ✅ Policies that allow:
  - Host to control game flow and settings
  - Players to submit answers/votes
  - Real-time syncing to work properly

### Step 2: Enable Realtime on All Tables

**CRITICAL**: Realtime must be enabled on all three tables for syncing to work!

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication** (or **Database** → **Realtime**)
3. Find these tables:
   - `rooms`
   - `room_players`
   - `game_states`
4. **Enable Realtime** for all three tables (toggle the switch ON)
5. Wait a few seconds for the changes to take effect

### Step 3: Verify the Setup

Run these queries in the SQL Editor to verify:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND table_name IN ('rooms', 'room_players', 'game_states');
```

All three tables should show `rowsecurity = true`.

```sql
-- Check all policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('rooms', 'room_players', 'game_states')
ORDER BY table_name, policyname;
```

You should see:
- **rooms**: `rooms_select`, `rooms_insert`, `rooms_update`
- **room_players**: `room_players_select`, `room_players_insert`, `room_players_update`, `room_players_delete`
- **game_states**: `game_states_select`, `game_states_insert`, `game_states_update`

### Step 4: Test the Fix

1. **Refresh all browser tabs** (host and non-host)
2. **Create a new room** (or use an existing one)
3. **Add a bot** - Non-host should see the bot appear
4. **Start the game** - Non-host should see the game start

### Step 5: Check Browser Console

If it still doesn't work, check the browser console:

1. **Host console should show**:
   - `✅ Host: Game state saved successfully to Supabase`
   - `🔔 Game state subscription triggered: UPDATE`

2. **Non-host console should show**:
   - `🔔 Game state subscription triggered for room: ...`
   - `📥 Received game state update from Supabase`
   - `📺 Screen update requested: questions`

If you see errors like `42501` or `403 Forbidden`, the RLS policies aren't set up correctly.

## What the Complete SQL Does

### Rooms Table
- ✅ Anyone can read (to join by code)
- ✅ Only host can create rooms
- ✅ Only host can update room settings (impostor count, jester mode, etc.)

### Room Players Table
- ✅ Anyone can read (to see who's in the room)
- ✅ Players can add themselves
- ✅ Host can add bots
- ✅ Players can update themselves
- ✅ Host can update any player (for managing bots)

### Game States Table
- ✅ Anyone in the room can read (to see current game state)
- ✅ Only host can create game state (when starting game)
- ✅ Any player in the room can update (for answer/vote submissions)
- ✅ Host-only control is enforced in App.tsx for screen transitions

## Troubleshooting

### Issue: "Start Game" doesn't sync
- ✅ Check Realtime is enabled on `game_states` table
- ✅ Check host console shows `✅ Game state saved successfully`
- ✅ Check non-host console shows `🔔 Game state subscription triggered`

### Issue: "Add Bot" doesn't sync
- ✅ Check Realtime is enabled on `room_players` table
- ✅ Check host console shows bot was added to database
- ✅ Check non-host console shows `Room updated:` or player list update

### Issue: RLS errors (42501, 403)
- ✅ Run the `COMPLETE_SUPABASE_SETUP.sql` file again
- ✅ Verify all policies exist (use verification queries above)
- ✅ Check that user is authenticated (check console for auth errors)

### Issue: Realtime not working
- ✅ Verify Realtime is enabled in Supabase Dashboard
- ✅ Check browser console for subscription status
- ✅ Try refreshing the page
- ✅ Check Supabase project status (not in maintenance mode)

## Important Notes

- ✅ **Host-only control** is still enforced in App.tsx for:
  - Screen transitions
  - Starting the game
  - Game settings changes
  - Adding/removing bots

- ✅ **Non-host players** can only:
  - Submit answers/votes (updates game_states)
  - Update their own connection status
  - Read game state and room data

- ✅ **Real-time syncing** works via Supabase Realtime subscriptions
- ✅ **All updates** are broadcast to all players in the room
- ✅ **Screen transitions** are controlled by the host and synced to all players

