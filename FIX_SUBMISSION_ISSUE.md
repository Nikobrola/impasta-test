# Fix for Answer Submission Issue

## Problem
- Non-host players cannot save their answer submissions to Supabase
- Error: `42501 - new row violates row-level security policy for table "game_states"`
- Host only sees 3 submissions, but there are 4 players (one submission is missing)
- Game gets stuck on "Waiting for other players to submit..."

## Root Cause
The RLS (Row Level Security) policy on `game_states` table only allows the HOST to update game state. Non-host players are blocked from saving their submissions.

## Solution

### Step 1: Run SQL File in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `SUPABASE_ALLOW_PLAYER_SUBMISSIONS.sql`
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify the Policy Was Updated

Run this query to verify:
```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'game_states' AND policyname = 'game_states_update';
```

You should see a policy that allows players in the room to update (not just the host).

### Step 3: Test the Fix

1. Refresh all browser tabs (host and non-host)
2. Start a new game
3. Have all players submit answers
4. The host should now see all 4 submissions
5. The game should automatically transition to the role reveal screen

## What This SQL Does

- **Drops** the old host-only update policy
- **Creates** a new policy that allows any player in the room to update `game_states`
- This allows non-host players to save their answer submissions
- Host-only control is still enforced in the application code for:
  - Screen transitions
  - Starting the game
  - Changing game settings
  - Adding/removing bots

## Important Notes

- ✅ Host-only control is still enforced in App.tsx (application logic)
- ✅ Non-host players can only update their own submissions (via application logic)
- ✅ Host is still the source of truth for game flow and screen transitions
- ✅ This only affects answer/vote submissions, not game flow control

## If It Still Doesn't Work

1. Check the Supabase logs to verify the policy was created
2. Verify all players are in the `room_players` table
3. Check the browser console for any remaining errors
4. Make sure Realtime is enabled on the `game_states` table

