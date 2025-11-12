# Supabase Realtime Setup

## Important: Enable Realtime for game_states table

For screen syncing to work, you **MUST** enable Realtime on the `game_states` table in Supabase.

### Steps:

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Find the `game_states` table
4. **Enable Realtime** for the `game_states` table
5. Also enable for `rooms` and `room_players` tables (if not already enabled)

### Why This Is Required

The real-time subscriptions use Supabase Realtime to broadcast changes. Without Realtime enabled:
- ❌ Screen changes won't sync between players
- ❌ Game state updates won't be received in real-time
- ❌ Players will see stale data

### Verify Realtime Is Working

After enabling, check the browser console when testing:
- You should see: `"Game state subscription status: SUBSCRIBED"`
- When host changes screen, you should see: `"Game state subscription triggered: UPDATE"`

If you don't see these messages, Realtime is not enabled or not working.

