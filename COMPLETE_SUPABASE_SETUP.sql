-- =====================================================
-- COMPLETE SUPABASE SETUP
-- =====================================================
-- This script includes:
-- 1. Table schemas (rooms, room_players, game_states)
-- 2. ALL RLS policies for all tables
-- 3. Policies that allow:
--    - Host to control game flow and settings
--    - Players to submit answers/votes
--    - Real-time syncing to work properly
-- 4. Bot support: Allows bots without requiring auth.users entries
--    - Foreign key constraint removed from player_id
--    - Trigger function validates player_id (UUID format for bots, auth.users check for real players)
--    - Migration script included to update existing databases
-- =====================================================

-- =====================================================
-- ROOMS TABLE
-- =====================================================

-- Create rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL,
  impostor_count INTEGER NOT NULL DEFAULT 1,
  has_jester BOOLEAN NOT NULL DEFAULT false,
  is_randomize_mode BOOLEAN NOT NULL DEFAULT false,
  selected_pack TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if table exists but columns are missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'has_jester'
  ) THEN
    ALTER TABLE rooms ADD COLUMN has_jester BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'is_randomize_mode'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_randomize_mode BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'selected_pack'
  ) THEN
    ALTER TABLE rooms ADD COLUMN selected_pack TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'impostor_count'
  ) THEN
    ALTER TABLE rooms ADD COLUMN impostor_count INTEGER NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'game_mode'
  ) THEN
    ALTER TABLE rooms ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'questions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);

-- =====================================================
-- ROOM_PLAYERS TABLE
-- =====================================================

-- Create room_players table if it doesn't exist
-- NOTE: player_id foreign key constraint is removed to allow bots without auth.users entries
-- A trigger function validates player_id instead (see validate_player_id function below)
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL, -- Foreign key removed - validated by trigger instead
  username TEXT NOT NULL,
  avatar TEXT,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

-- Add missing columns if table exists but columns are missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'is_bot'
  ) THEN
    ALTER TABLE room_players ADD COLUMN is_bot BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'is_connected'
  ) THEN
    ALTER TABLE room_players ADD COLUMN is_connected BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE room_players ADD COLUMN avatar TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE room_players ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_player_id ON room_players(player_id);

-- Note: Foreign key constraint on player_id was removed to allow bots without auth.users entries
-- The validate_player_id trigger function (defined below) enforces validation instead:
-- - Bots: Only UUID format validation (no auth.users check)
-- - Real players: Must exist in auth.users (enforced by trigger)

-- =====================================================
-- MIGRATION: Remove foreign key constraint if it exists
-- =====================================================
-- If you're updating an existing database, this will remove the old FK constraint
DO $$
BEGIN
  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'room_players_player_id_fkey' 
    AND table_name = 'room_players'
  ) THEN
    ALTER TABLE room_players DROP CONSTRAINT room_players_player_id_fkey;
    RAISE NOTICE 'Dropped existing foreign key constraint on player_id';
  END IF;
END $$;

-- =====================================================
-- GAME_STATES TABLE
-- =====================================================

-- Create game_states table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if table exists but columns are missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_states' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE game_states ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Create index on room_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_states_room_id ON game_states(room_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rooms table
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for room_players table
DROP TRIGGER IF EXISTS update_room_players_updated_at ON room_players;
CREATE TRIGGER update_room_players_updated_at
  BEFORE UPDATE ON room_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for game_states table
DROP TRIGGER IF EXISTS update_game_states_updated_at ON game_states;
CREATE TRIGGER update_game_states_updated_at
  BEFORE UPDATE ON game_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VALIDATION FUNCTION FOR PLAYER_ID
-- =====================================================
-- This function validates player_id:
-- - Bots: Only validates UUID format (no auth.users check)
-- - Real players: Must exist in auth.users
-- This allows bots to be created without requiring auth.users entries

-- CRITICAL: Use SECURITY DEFINER so the function runs with elevated permissions
-- This allows the function to check auth.users table even when RLS policies would block regular users
CREATE OR REPLACE FUNCTION validate_player_id()
RETURNS TRIGGER
SECURITY DEFINER -- Run with function owner's permissions (bypasses RLS on auth.users)
SET search_path = public -- Ensure we're using the public schema
AS $$
BEGIN
  -- If it's a bot, only validate UUID format
  IF NEW.is_bot = true THEN
    -- Validate UUID format (basic check)
    IF NEW.player_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Invalid UUID format for bot player_id: %', NEW.player_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- If it's not a bot, check if user exists in auth.users
  -- SECURITY DEFINER allows us to bypass RLS on auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.player_id) THEN
    RAISE EXCEPTION 'Player ID % does not exist in auth.users (non-bot players must have auth users)', NEW.player_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate player_id on insert/update
DROP TRIGGER IF EXISTS validate_player_id_trigger ON room_players;
CREATE TRIGGER validate_player_id_trigger
  BEFORE INSERT OR UPDATE ON room_players
  FOR EACH ROW
  EXECUTE FUNCTION validate_player_id();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Players can update their own data OR host can update any player
-- This allows host to manage bots and players to update their connection status
CREATE POLICY "room_players_update" ON room_players
  FOR UPDATE
  USING (
    -- Player updating themselves
    auth.uid() = player_id
    OR
    -- Host updating any player (for managing bots, etc.)
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
-- CRITICAL: Check host_id from rooms table directly (host might not be in room_players yet)
-- Note: INSERT policies can only have WITH CHECK, not USING
CREATE POLICY "game_states_insert" ON game_states
  FOR INSERT
  WITH CHECK (
    -- User must be the host of the room
    -- This works even if host hasn't been added to room_players yet
    EXISTS (
      SELECT 1
      FROM rooms
      WHERE id = game_states.room_id
        AND host_id = auth.uid()
    )
  );

-- IMPORTANT: Allow any player in the room to UPDATE game state
-- This is needed so non-host players can submit answers and votes
-- The application logic (App.tsx) enforces host-only for screen transitions
CREATE POLICY "game_states_update" ON game_states
  FOR UPDATE
  USING (
    -- Allow update if user is in the room_players table (any player in the room)
    EXISTS (
      SELECT 1
      FROM room_players rp
      WHERE rp.room_id = game_states.room_id
        AND rp.player_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for the new row
    EXISTS (
      SELECT 1
      FROM room_players rp
      WHERE rp.room_id = game_states.room_id
        AND rp.player_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND table_name IN ('rooms', 'room_players', 'game_states');

-- Verify all policies exist
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('rooms', 'room_players', 'game_states')
-- ORDER BY table_name, policyname;

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Rooms: Host-only updates (settings control)
-- ✅ Room Players: Self-updates + Host can manage all (bot management)
--    - Bots can be created with any valid UUID (no auth.users required)
--    - Real players must exist in auth.users (enforced by validate_player_id trigger)
--    - Foreign key constraint removed, replaced with trigger-based validation
-- ✅ Game States: 
--    - Host-only INSERT (starting game)
--    - Any player in room can UPDATE (answer/vote submissions)
--    - Any player in room can SELECT (view game state)
-- ✅ All reads: Open to room members or public (for joining)
-- ✅ Host-only control is enforced in App.tsx for screen transitions
-- ✅ Bot UUID validation: Trigger function validates UUID format for bots
-- =====================================================

