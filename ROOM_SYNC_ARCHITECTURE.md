# Room Synchronization Architecture

## Overview

This document explains how multiplayer room synchronization works, including screen syncing, game state management, and real-time updates.

## Core Principles

1. **Host Controls Everything**: Only the host can change game flow, settings, and trigger screen transitions
2. **Real-Time Sync**: All players see the same screen and game state in real-time
3. **Optimistic Updates**: UI updates immediately, database syncs in background
4. **Single Source of Truth**: Supabase `game_states` table is the authoritative source

---

## How Screen Syncing Works

### 1. **Screen State Storage**

The current screen is stored in the `game_states.state` JSONB field:
```typescript
{
  currentScreen: 'lobby' | 'questions' | 'voting' | 'results' | ...
  // ... other game state
}
```

### 2. **Screen Transition Flow**

```
┌─────────────┐
│   Host      │
│  (Player 1) │
└──────┬──────┘
       │
       │ 1. Host clicks button (e.g., "Start Game")
       │ 2. Host updates local state
       │ 3. Host saves to Supabase (game_states table)
       ▼
┌──────────────────┐
│  Supabase        │
│  game_states     │
│  (Single Source) │
└──────┬───────────┘
       │
       │ 4. Real-time subscription triggers
       │ 5. All players receive update
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Player 2  │     │   Player 3  │     │   Player 4  │
│  (Non-Host) │     │  (Non-Host) │     │  (Non-Host) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                          │
                          │ 6. All players update local state
                          │ 7. All players render new screen
                          ▼
                   ┌──────────────┐
                   │ Same Screen  │
                   │ For Everyone │
                   └──────────────┘
```

### 3. **Implementation Details**

#### Host Side (Can Change Screens)
```typescript
// Host clicks "Start Game" button
const handleStartGame = () => {
  // 1. Update local state immediately (optimistic)
  setGameState(prev => ({
    ...prev,
    phase: 'questions',
    currentScreen: 'questions' // Screen stored in game state
  }));
  
  // 2. Navigate immediately
  setCurrentScreen('questions');
  
  // 3. Save to Supabase (only host can do this)
  if (currentUserId === gameState.hostId) {
    saveGameStateToSupabase(gameState);
  }
};
```

#### Player Side (Receives Updates)
```typescript
// Real-time subscription in useSupabaseRoom hook
useSupabaseRoom({
  roomId,
  onGameStateUpdate: (updatedState) => {
    // 1. Receive update from Supabase
    // 2. Update local state
    setGameState(updatedState);
    
    // 3. Sync screen from game state
    if (updatedState.currentScreen) {
      setCurrentScreen(updatedState.currentScreen);
    }
  }
});
```

---

## Game State Synchronization

### What Gets Synced

**Always Synced (All Players):**
- Current screen/phase
- Player list and their status
- Game settings (impostor count, jester mode, etc.)
- Current round number
- Eliminated players
- Winners and game results

**Player-Specific (Only That Player):**
- Player's answer (stored in `playerAnswers[playerId]`)
- Player's votes (stored in `votes[playerId]`)
- Player's role (stored in `playerRoles[playerId]`)

### State Update Flow

```
┌─────────────────────────────────────────┐
│  Host Action (e.g., "Start Voting")     │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  1. Update Local State                  │
│     setGameState({ phase: 'voting' })   │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  2. Save to Supabase                    │
│     saveGameState(roomId, gameState)    │
│     (Only host can write)               │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  3. Supabase Realtime Broadcast         │
│     All players subscribed receive update│
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  4. Players Update Local State          │
│     setGameState(updatedState)          │
│     setCurrentScreen(updatedScreen)     │
└─────────────────────────────────────────┘
```

---

## Screen Flow Examples

### Example 1: Starting a Game

```
Lobby Screen
    │
    │ Host clicks "Start Game"
    ▼
Host: Updates state → Saves to Supabase
    │
    │ Real-time sync (~100-500ms)
    ▼
All Players: Receive update → See "Questions" screen
```

### Example 2: Moving to Voting Phase

```
Discussion Screen
    │
    │ Host clicks "Start Voting"
    ▼
Host: Updates state → Saves to Supabase
    │
    │ Real-time sync
    ▼
All Players: Receive update → See "Voting" screen
```

### Example 3: Player Submits Answer

```
Questions Screen
    │
    │ Player types answer and submits
    ▼
Player: Updates own answer in state
    │
    │ (Only updates playerAnswers[playerId])
    ▼
Host: Receives update → Saves to Supabase
    │
    │ Real-time sync
    ▼
All Players: See updated answer count
```

---

## Real-Time Subscription Details

### How Subscriptions Work

```typescript
// In useSupabaseRoom.ts
useEffect(() => {
  if (!roomId) return;

  // Subscribe to game state changes
  const gameStateSubscription = supabase
    .channel(`game_state:${roomId}`)
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'game_states',
      filter: `room_id=eq.${roomId}`
    }, (payload) => {
      // When game state changes in database
      const newState = payload.new.state as GameState;
      onGameStateUpdate(newState);
    })
    .subscribe();

  return () => {
    gameStateSubscription.unsubscribe();
  };
}, [roomId]);
```

### Subscription Events

- **INSERT**: When game state is first created (game starts)
- **UPDATE**: When game state changes (screen transitions, player actions)
- **DELETE**: When game ends and state is cleared (rare)

---

## Host-Only Controls

### What Only Host Can Do

✅ **Host Can:**
- Change screens (lobby → questions → voting → results)
- Start/stop the game
- Update game settings (impostor count, jester mode)
- Add/remove bots
- Control game flow buttons

❌ **Players Cannot:**
- Change screens
- Update game settings
- Trigger game flow actions
- Modify game state directly

### Implementation

```typescript
// In App.tsx
const handleStartGame = () => {
  // Check if user is host
  if (currentUserId !== gameState.hostId) {
    console.warn('Only host can start the game');
    return;
  }

  // Only host code executes
  // ... start game logic
};

// UI also hides buttons for non-hosts
{isHost && (
  <button onClick={handleStartGame}>Start Game</button>
)}
```

---

## Player Actions (Non-Host)

### What Players Can Do

✅ **Players Can:**
- Submit their answers
- Submit their votes
- Update their connection status
- Read all game state

### How Player Actions Sync

```
Player Action (e.g., Submit Answer)
    │
    │ 1. Update local state immediately
    ▼
Local State: playerAnswers[playerId] = "My answer"
    │
    │ 2. Update in Supabase (room_players table)
    ▼
Supabase: Updates player's answer
    │
    │ 3. Real-time sync
    ▼
Host: Receives player update
    │
    │ 4. Host aggregates and saves game state
    ▼
Game State: Updated with all player answers
    │
    │ 5. Real-time sync to all players
    ▼
All Players: See updated answer count
```

---

## Error Handling & Edge Cases

### Network Issues

**If host loses connection:**
- Host's changes won't sync
- Players won't see updates
- When reconnected, host's state will sync

**If player loses connection:**
- Player can't submit actions
- Other players continue normally
- When reconnected, player receives latest state

### Race Conditions

**Prevented by:**
- Host-only writes to game_states
- Debounced updates (500ms)
- JSON comparison before updating (prevents loops)

### State Conflicts

**Handled by:**
- Last-write-wins (host always wins)
- Timestamp-based conflict resolution
- Real-time subscriptions ensure consistency

---

## Performance Optimizations

### 1. Debouncing
```typescript
// Game state updates are debounced (500ms)
// Prevents too many database writes
setTimeout(() => {
  saveGameStateToSupabase(gameState);
}, 500);
```

### 2. Optimistic Updates
```typescript
// UI updates immediately, database syncs later
setCurrentScreen('lobby'); // Instant
saveGameStateToSupabase(state); // Background
```

### 3. Selective Updates
```typescript
// Only update if state actually changed
if (JSON.stringify(prev) !== JSON.stringify(updatedState)) {
  setGameState(updatedState);
}
```

### 4. Parallel Operations
```typescript
// Run multiple operations in parallel
await Promise.all([
  addPlayerToRoom(...),
  saveGameState(...)
]);
```

---

## Screen State Management

### Current Screen Storage

The current screen is stored in two places:

1. **React State** (`currentScreen`): For immediate UI rendering
2. **Game State** (`gameState.currentScreen`): For synchronization

### Screen Sync Logic

```typescript
// When game state updates from Supabase
onGameStateUpdate: (updatedState) => {
  setGameState(updatedState);
  
  // Sync screen from game state
  if (updatedState.currentScreen) {
    setCurrentScreen(updatedState.currentScreen);
  }
}
```

### Screen Transitions

**Host-initiated:**
```typescript
// Host changes screen
setGameState(prev => ({
  ...prev,
  currentScreen: 'voting'
}));
setCurrentScreen('voting');
saveGameStateToSupabase(gameState); // Syncs to all players
```

**Player-received:**
```typescript
// Player receives screen change
// (Handled automatically by subscription)
```

---

## Summary

### Key Points

1. **Host is the controller**: Only host can change screens and game flow
2. **Real-time sync**: Supabase Realtime keeps all players in sync
3. **Optimistic UI**: Screen changes immediately, database syncs in background
4. **Single source of truth**: `game_states` table is authoritative
5. **Player actions**: Players update their own data, host aggregates

### Flow Diagram

```
Host Action
    ↓
Local State Update (Instant)
    ↓
Save to Supabase (Background)
    ↓
Real-time Broadcast
    ↓
All Players Receive Update
    ↓
All Players Update Local State
    ↓
All Players See Same Screen
```

This architecture ensures smooth, synchronized multiplayer gameplay where all players see the same screen and game state in real-time, while maintaining host control over game flow.

