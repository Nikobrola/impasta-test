-- =====================================================
-- UPDATE RLS POLICY TO ALLOW PLAYER ANSWER SUBMISSIONS
-- =====================================================
-- This allows non-host players to update game_states for answer/vote submissions
-- while still maintaining host-only control for screen transitions and game flow
-- The application logic (App.tsx) enforces host-only for critical operations

-- Drop the existing host-only update policy
DROP POLICY IF EXISTS "game_states_update" ON game_states;

-- Create new policy: Allow any player in the room to update game_states
-- This is needed so non-host players can submit answers and votes
-- The application logic will still enforce host-only for screen transitions
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
-- After running this, verify the policy:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'game_states' AND policyname = 'game_states_update';

-- =====================================================
-- NOTES
-- =====================================================
-- ✅ This allows non-host players to update game_states (for answer/vote submissions)
-- ✅ Host-only control is still enforced in App.tsx for:
--    - Screen transitions (transitionToScreen function)
--    - Starting game (handleStartGame)
--    - Game settings (handleImpostorCountChange, etc.)
-- ✅ Non-host players can only update their own submissions (via application logic)
-- ✅ Host is still the source of truth for game flow and screen transitions

