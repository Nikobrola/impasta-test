-- =====================================================
-- HOST-ONLY GAME CONTROL POLICIES
-- =====================================================
-- This script ensures only the host can control:
-- - Game flow and screen transitions
-- - Game settings (impostor count, randomize mode, jester mode)
-- - Starting game/voting buttons
-- - All game state updates
--
-- Players can only:
-- - Read game state and room data
-- - Update their own player data (answers, votes, connection status)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "rooms_select" ON rooms;
DROP POLICY IF EXISTS "rooms_insert" ON rooms;
DROP POLICY IF EXISTS "rooms_update" ON rooms;

DROP POLICY IF EXISTS "room_players_select" ON room_players;
DROP POLICY IF EXISTS "room_players_insert" ON room_players;
DROP POLICY IF EXISTS "room_players_update" ON room_players;
DROP POLICY IF EXISTS "room_players_delete" ON room_players;

DROP POLICY IF EXISTS "game_states_select" ON game_states;
DROP POLICY IF EXISTS "game_states_insert" ON game_states;
DROP POLICY IF EXISTS "game_states_update" ON game_states;
DROP POLICY IF EXISTS "game_states_all" ON game_states;

-- =====================================================
-- ROOMS TABLE POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can read rooms (to join by code)
CREATE POLICY "rooms_select" ON rooms
  FOR SELECT
  USING (true);

-- Only authenticated users can create rooms (they become host)
CREATE POLICY "rooms_insert" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Only the host can update room settings
-- This controls: impostor_count, has_jester, is_randomize_mode, selected_pack, is_active
CREATE POLICY "rooms_update" ON rooms
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- =====================================================
-- ROOM_PLAYERS TABLE POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Anyone can read room players (to see who's in the room)
CREATE POLICY "room_players_select" ON room_players
  FOR SELECT
  USING (true);

-- Players can add themselves OR host can add bots
CREATE POLICY "room_players_insert" ON room_players
  FOR INSERT
  WITH CHECK (
    -- Player adding themselves
    auth.uid() = player_id
    OR
    -- Host adding a bot
    (
      is_bot = true
      AND EXISTS (
        SELECT 1
        FROM rooms
        WHERE id = room_players.room_id
          AND host_id = auth.uid()
      )
    )
  );

-- Players can update their own data (answers, votes, connection status)
-- Host can update any player (for managing bots, etc.)
CREATE POLICY "room_players_update" ON room_players
  FOR UPDATE
  USING (
    -- Player updating themselves
    auth.uid() = player_id
    OR
    -- Host updating any player
    EXISTS (
      SELECT 1
      FROM rooms
      WHERE id = room_players.room_id
        AND host_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Player updating themselves
    auth.uid() = player_id
    OR
    -- Host updating any player
    EXISTS (
      SELECT 1
      FROM rooms
      WHERE id = room_players.room_id
        AND host_id = auth.uid()
    )
  );

-- Players can delete themselves OR host can delete any player
CREATE POLICY "room_players_delete" ON room_players
  FOR DELETE
  USING (
    -- Player deleting themselves
    auth.uid() = player_id
    OR
    -- Host deleting any player
    EXISTS (
      SELECT 1
      FROM rooms
      WHERE id = room_players.room_id
        AND host_id = auth.uid()
    )
  );

-- =====================================================
-- GAME_STATES TABLE POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Anyone in the room can READ game state (to see current game state)
CREATE POLICY "game_states_select" ON game_states
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM room_players rp
      WHERE rp.room_id = game_states.room_id
        AND rp.player_id = auth.uid()
    )
  );

-- Only the host can CREATE game state (when starting game)
CREATE POLICY "game_states_insert" ON game_states
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT host_id
      FROM rooms
      WHERE id = game_states.room_id
    )
  );

-- Only the host can UPDATE game state
-- This controls: screen flow, game phase, all game state changes
CREATE POLICY "game_states_update" ON game_states
  FOR UPDATE
  USING (
    auth.uid() = (
      SELECT host_id
      FROM rooms
      WHERE id = game_states.room_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT host_id
      FROM rooms
      WHERE id = game_states.room_id
    )
  );

-- =====================================================
-- VERIFICATION QUERIES (Optional - run these to verify)
-- =====================================================

-- Check if RLS is enabled on all tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('rooms', 'room_players', 'game_states');

-- Check all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('rooms', 'room_players', 'game_states')
-- ORDER BY tablename, policyname;

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Rooms: Host-only updates (settings control)
-- ✅ Room Players: Self-updates + Host can manage all
-- ✅ Game States: Host-only updates (game flow control)
-- ✅ All reads: Open to room members
-- ✅ Bot management: Host can create bots
-- =====================================================

