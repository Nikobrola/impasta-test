# Task List: Impasta Game Logic Implementation

## Task Progress

### Task 1: Fix Core Game Logic and Role Assignment
Correct the fundamental misunderstanding in the current implementation where voting logic and role-based content distribution is incorrect. Implement proper impostor vs innocent question/word assignment and fix win condition logic.

**Sub-tasks:**
- [x] Analyze current game logic implementation in `src/utils/gameLogic.ts` and `src/utils/gameUtils.ts`
- [x] Fix role assignment logic to properly assign impostor vs innocent roles
- [x] Correct question distribution: innocent players get one question, impostors get different question
- [x] Fix word distribution: innocent players get same word, impostors get "You are the Impasta" message
- [x] Update win condition logic to properly handle impostor elimination vs innocent elimination
- [x] Fix voting logic to represent "voting to eliminate suspected impostors" not "voting for innocent players"
- [x] Update bot voting behavior to vote for suspected impostors, not random innocent players
- [x] Test role assignment and content distribution with different player counts and game modes

### Task 2: Implement Questions Game Flow with Answer Display ✅
Build the complete Questions Game flow including answer submission, answer screen display during discussion, and proper question distribution based on player roles.

**Sub-tasks:**
- [x] Update `GameScreen.tsx` to show different questions based on player role (innocent vs impostor)
- [x] Implement answer submission validation (non-empty answers required)
- [x] Create new `AnswerDisplayScreen.tsx` component for showing innocent question and all answers
- [x] Modify `DiscussionScreen.tsx` to integrate with answer display screen
- [x] Update game state management to handle answer submission and display phases
- [x] Implement proper question selection from content packs based on player roles
- [x] Add role revelation modals after answer submission
- [x] Update navigation flow: Game → Answer Display → Discussion → Voting
- [x] Test complete Questions Game flow with multiple players and different roles

### Task 3: Implement Word Game Flow with Turn-Based Discussion
Create the Word Game flow with "I Understand" confirmation, turn-based discussion system, random starting player selection, and live discussion mechanics.

**Sub-tasks:**
- [x] Create new `RoleConfirmationScreen.tsx` component with "I Understand" button
- [x] Implement word assignment logic: innocent players get same word, impostors get "You are the Impasta" message
- [x] Create random starting player selection algorithm
- [x] Update `DiscussionScreen.tsx` to handle Word Game turn-based discussion
- [x] Implement turn indicator system showing current speaker and next player
- [x] Add visual indicators for starting player ("You are starting" vs "PlayerName is starting")
- [x] Create turn progression logic (clockwise around player circle)
- [x] Update game state to track discussion phase and turn order
- [x] Implement host controls for "Start Voting" during discussion
- [x] Test complete Word Game flow with turn-based discussion

### Task 4: Redesign Discussion and Voting Screens ✅
Modernize the discussion and voting screens with proper UI/UX design, clear visual indicators for turn order, and intuitive voting interface that correctly represents "voting to eliminate impostors."

**Sub-tasks:**
- [x] Redesign `DiscussionScreen.tsx` with modern UI/UX and clear turn indicators
- [x] Update `VotingScreen.tsx` to clearly indicate "Vote for Impostors" with proper messaging
- [x] Implement modern card-based design for player displays
- [x] Add visual feedback for current speaker and turn progression
- [x] Create responsive layout for different screen sizes
- [x] Implement smooth animations and transitions between phases
- [x] Add visual indicators for eliminated players
- [x] Update voting interface to show "Select suspected impostors to eliminate"
- [x] Implement proper voting validation based on impostor count
- [x] Add visual feedback for vote submission and waiting states
- [x] Test UI/UX across different devices and screen sizes

### Task 5: Fix Win Condition Logic and Results Display
Correct the win condition checking logic to properly handle impostor elimination vs innocent elimination, and update the results screen to accurately reflect game outcomes.

**Sub-tasks:**
- [x] Rewrite `checkWinConditions` function in `src/utils/gameLogic.ts` with correct logic
- [x] Fix win condition logic: impostors win if they avoid elimination, innocents win if impostors eliminated
- [x] Implement jester win condition: jester wins if voted out
- [x] Update `determineWinner` function to properly calculate winners based on eliminated players
- [x] Fix vote counting and elimination logic in `processVotes` function
- [x] Update `ResultsScreen.tsx` to display correct winner information and victory messages
- [x] Implement proper winner type detection (innocent/impostor/jester wins)
- [x] Add victory celebration UI with appropriate messaging for each winner type
- [x] Update game state management to properly track elimination and winner determination
- [x] Test win conditions with various scenarios (impostor elimination, innocent elimination, jester elimination)
- [x] Validate results display accuracy across all game modes and player counts

## Relevant Files

### Core Game Logic
- `src/utils/gameLogic.ts` - Core game logic functions (checkWinConditions, determineWinner, processVotes)
- `src/utils/gameUtils.ts` - Game utility functions (assignRoles, generateRoomCode)
- `src/utils/botUtils.ts` - Bot behavior and voting logic
- `src/types/index.ts` - TypeScript type definitions for game state

### Screen Components
- `src/components/GameScreen.tsx` - Main gameplay interface for both game modes
- `src/components/DiscussionScreen.tsx` - Discussion phase interface
- `src/components/VotingScreen.tsx` - Voting interface for eliminating players
- `src/components/ResultsScreen.tsx` - Game results and winner display
- `src/components/AnswerDisplayScreen.tsx` - **NEW** - Answer display during discussion (Questions Game)
- `src/components/RoleConfirmationScreen.tsx` - **NEW** - Role confirmation with "I Understand" button (Word Game)

### Main Application
- `src/App.tsx` - Main app component with game state management and navigation
- `src/components/LobbyScreen.tsx` - Room lobby with game configuration

### Content and Data
- `src/data/contentPacks.ts` - **NEW** - Content pack definitions for questions and words
- `src/utils/contentUtils.ts` - **NEW** - Content selection and distribution utilities

### Styling and UI
- `src/globals.css` - Global styles and theme variables
- `src/components/ui/` - **NEW** - Reusable UI components (cards, buttons, indicators)

## Implementation Notes

### Key Logic Corrections Needed:
1. **Role Assignment**: Currently assigns roles but doesn't properly distribute different content
2. **Voting Logic**: Currently treats voting as "select innocent players" instead of "eliminate impostors"
3. **Win Conditions**: Currently has incorrect logic for determining winners based on eliminations
4. **Content Distribution**: Questions/words not properly assigned based on player roles
5. **Discussion Flow**: Missing answer display for Questions Game and turn system for Word Game

### Modern UI/UX Requirements:
- Clean, pasta-themed design with gradient backgrounds
- Smooth animations and transitions
- Clear visual hierarchy and typography
- Responsive design for different screen sizes
- Intuitive navigation and user feedback
- Modern card-based layouts for player displays
