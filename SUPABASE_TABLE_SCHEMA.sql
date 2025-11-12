-- =====================================================
-- COMPLETE DATABASE SCHEMA SETUP
-- =====================================================
-- This script creates all required tables and columns
-- Run this FIRST before running the policies SQL
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
  -- Add has_jester if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'has_jester'
  ) THEN
    ALTER TABLE rooms ADD COLUMN has_jester BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add is_randomize_mode if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'is_randomize_mode'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_randomize_mode BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add selected_pack if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'selected_pack'
  ) THEN
    ALTER TABLE rooms ADD COLUMN selected_pack TEXT;
  END IF;

  -- Add is_active if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add impostor_count if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'impostor_count'
  ) THEN
    ALTER TABLE rooms ADD COLUMN impostor_count INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- Add game_mode if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'game_mode'
  ) THEN
    ALTER TABLE rooms ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'questions';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);

-- =====================================================
-- ROOM_PLAYERS TABLE
-- =====================================================

-- Create room_players table if it doesn't exist
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  -- Add is_bot if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'is_bot'
  ) THEN
    ALTER TABLE room_players ADD COLUMN is_bot BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add is_connected if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'is_connected'
  ) THEN
    ALTER TABLE room_players ADD COLUMN is_connected BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add avatar if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_players' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE room_players ADD COLUMN avatar TEXT;
  END IF;

  -- Add updated_at if missing
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
  -- Add updated_at if missing
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
-- VERIFICATION
-- =====================================================

-- Check if all tables exist and have correct columns
-- Run this to verify:
/*
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('rooms', 'room_players', 'game_states')
ORDER BY table_name, ordinal_position;
*/

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Creates all three tables if they don't exist
-- ✅ Adds missing columns to existing tables
-- ✅ Creates indexes for performance
-- ✅ Sets up triggers for automatic updated_at
-- ✅ Handles foreign key relationships
-- =====================================================

