# Screen Flow for Questions Game (Standard Mode)

## Expected Flow

```
LOBBY → QUESTIONS → ROLE_REVEAL → ANSWERS → VOTING → VOTE_RESULTS → RESULTS
```

## Detailed Flow

### 1. LOBBY Screen
- **Who controls**: Host only
- **Action**: Host clicks "Start Game"
- **Transition**: `handleStartGame()` → saves immediately → all players sync to QUESTIONS

### 2. QUESTIONS Screen
- **Who controls**: All players submit their own answers
- **Action**: Each player submits answer
- **Transition trigger**: When ALL non-spectator players have submitted
- **Transition logic**: `useEffect` watching `submittedAnswers` → Host detects all submitted → saves with `currentScreen: 'roleReveal'` → all players sync

### 3. ROLE_REVEAL Screen
- **Who controls**: All players see their role, host controls transition
- **Action**: Players see role modal overlay, host clicks "Continue" or auto-continues
- **Transition**: `handleRoleConfirmed()` → saves with `currentScreen: 'answers'` → all players sync

### 4. ANSWERS Screen (AnswerDisplayScreen)
- **Who controls**: Host controls when to start voting
- **Action**: Host clicks "Start Voting" button
- **Transition**: `handleStartVotingPhase()` → saves with `currentScreen: 'voting'` → all players sync

### 5. VOTING Screen
- **Who controls**: All players vote
- **Action**: Each player submits votes
- **Transition trigger**: When ALL non-spectator players have voted
- **Transition logic**: `useEffect` watching `votes` → Host processes results → saves with `currentScreen: 'voteResults'` → all players sync

### 6. VOTE_RESULTS Screen
- **Who controls**: Host controls transition
- **Action**: Host clicks "Reveal Winners" or "Continue Game"
- **Transition**: Either to RESULTS (game ended) or back to QUESTIONS (next round)

### 7. RESULTS Screen
- **Who controls**: Game ended
- **Action**: Shows winners

## Critical Points

1. **All screen transitions must save to Supabase IMMEDIATELY** (no debounce)
2. **Only host can trigger screen transitions** (except individual player actions like submitting answers/votes)
3. **Real-time sync must update `currentScreen`** for all players
4. **Each player saves their own submissions** (answers, votes) but host controls screen flow

## Current Issues

1. ✅ Fixed: Game start transition - now saves immediately
2. ✅ Fixed: Answer submission transition to roleReveal - now saves immediately
3. ✅ Fixed: RoleReveal → Answers transition - now saves immediately
4. ✅ Fixed: Answers → Voting transition - now saves immediately
5. ⚠️ Monitor: Non-host players getting stuck - should be fixed by immediate saves

## Fixed Transitions

All critical screen transitions now save to Supabase IMMEDIATELY:
- `handleStartGame()` → saves immediately
- Answer submission → saves immediately when transitioning to roleReveal
- `handleRoleConfirmed()` → saves immediately
- `handleStartVotingPhase()` → saves immediately

## Screen Transition Functions

- `handleStartGame()` → QUESTIONS
- `handleRoleConfirmed()` → ANSWERS (or DISCUSSION for words game)
- `handleStartVotingPhase()` → VOTING
- `processVotingResults()` → VOTE_RESULTS or RESULTS
- `transitionToScreen()` → Generic transition (should save immediately for critical transitions)

