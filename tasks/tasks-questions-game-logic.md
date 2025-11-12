# Task List: Questions Game Logic Implementation

## Task Progress

### Task 1: Update Game State Management and Types ✅ COMPLETED
Update TypeScript types and game state management to support the new Questions Game flow with proper phases, role assignments, and voting mechanics.

**Sub-tasks:**
- [x] Update `GameState` interface in `src/types/index.ts` to include new phases: 'questions', 'roleReveal', 'answerDisplay', 'discussion', 'voteResults'
- [x] Add new properties: `selectedQuestionPack`, `jesterCluePlayers`, `currentRound`, `isTieVote`, `tiedPlayers`, `eliminatedPlayers`, `gameEndReason`
- [x] Update `Player` interface to include `hasSubmittedAnswer`, `hasSeenRole`, `isEliminated` properties
- [x] Create new interfaces: `QuestionPack`, `VoteResult`, `GameEndCondition`
- [x] Update `App.tsx` game state initialization to include new properties with default values
- [x] Add phase transition logic in `App.tsx` to handle new game flow: lobby → questions → roleReveal → answerDisplay → discussion → voting → voteResults → results
- [x] Update game state management functions to handle new phases and properties
- [x] Test TypeScript compilation and ensure no type errors

### ✅ Task 2: Create Question Screen with Role-Based Content Distribution
Build the QuestionScreen component that displays different questions to innocent players vs impostors, includes jester clues, and handles answer submission with validation.

**Sub-tasks:**
- [x] Create new `QuestionScreen.tsx` component with pasta-themed design
- [x] Implement role-based question display: innocent players see innocent question, impostors see impostor question
- [x] Add jester clue logic: show "you might be a jester" to N/2 randomly selected non-impostor players (where N = non-impostor count)
- [x] Create question text input with validation (non-empty answers required)
- [x] Add submit answer functionality with proper validation
- [x] Implement answer submission tracking to prevent multiple submissions
- [x] Add loading states and visual feedback during submission
- [x] Create responsive design that works on different screen sizes
- [x] Add proper error handling for failed submissions
- [x] Test question display logic with different player counts and roles

### ✅ Task 3: Implement Role Reveal Modal System
Create a role reveal modal that appears after answer submission, shows the player's role with a blurred background, and requires clicking "OK" to proceed.

**Sub-tasks:**
- [x] Create `RoleRevealModal.tsx` component with blurred background overlay
- [x] Implement modal that shows player's role: "You are the Impostor", "You are Innocent", "You are the Jester"
- [x] Add "OK" button that dismisses modal and proceeds to next phase
- [x] Create smooth fade-in animation for modal appearance
- [x] Implement backdrop blur effect using CSS backdrop-filter
- [x] Add proper z-index layering to ensure modal appears above all content
- [x] Handle modal dismissal and phase transition logic
- [x] Add role-specific styling and messaging
- [x] Test modal functionality across different roles and screen sizes
- [x] Ensure modal is accessible and works with keyboard navigation

### ✅ Task 4: Build Answer Display and Discussion Screen
Create the AnswerDisplayScreen component that shows the innocent question and all submitted answers, allowing for live discussion before voting begins.

**Sub-tasks:**
- [x] Create `AnswerDisplayScreen.tsx` component with modern party game styling
- [x] Display the innocent question prominently at the top
- [x] Show all submitted answers in a clean, readable format with player avatars
- [x] Add discussion timer countdown (3 minutes) with color-coded urgency
- [x] Add "Start Voting" button for host to begin voting phase
- [x] Implement responsive design for different screen sizes
- [x] Add proper loading states and transitions with hover effects
- [x] Test answer display with different player counts and roles

### ✅ Task 5: Implement Voting System with Proper Rules
Update the voting system to enforce exact vote counts based on impostor count, handle ties with re-voting among tied players, and prevent self-voting.

**Sub-tasks:**
- [x] Update `VotingScreen.tsx` to display "Vote for Impastas" header
- [x] Implement exact vote count validation: 1 vote for 1 impostor, 2 votes for 2 impostors, etc.
- [x] Add self-vote prevention (players cannot vote for themselves)
- [x] Create tie detection logic when multiple players have same vote count
- [x] Implement re-voting system: when tied, ALL players can vote, but only for tied players
- [x] Add visual indicators for required vote count and current selections
- [x] Create vote submission validation and error handling
- [x] Add visual feedback for vote submission and waiting states
- [x] Implement vote counting and tie resolution logic
- [x] Test voting system with different impostor counts and tie scenarios

### Task 6: Create Vote Results Screen with Host Controls ✅ COMPLETED
Build the VoteResultsScreen component that shows voting details, eliminated players, and provides "Continue Game" vs "Finish Game" options for the host.

**Sub-tasks:**
- [x] Create `VoteResultsScreen.tsx component with detailed vote display
- [x] Show complete voting breakdown: who voted for whom
- [x] Display eliminated player(s) with clear visual indicators
- [x] Add host-only controls: "Continue Game" and "Finish Game" buttons
- [x] Remove the existing 10-second timer from vote results
- [x] Implement vote result calculations and elimination logic
- [x] Add visual styling for eliminated players (grayed out, crossed out, etc.)
- [x] Create smooth animations for result reveal
- [x] Add proper error handling and edge case management
- [x] Test vote results display with various voting scenarios

### Task 7: Implement Win Condition Logic and Game Flow
Update the game logic to handle all win conditions (impostor, innocent, jester wins), support multiple rounds in Randomize mode, and implement proper game ending logic.

**Sub-tasks:**
- [x] Update `checkWinConditions` function in `src/utils/gameLogic.ts` with new logic
- [x] Implement jester win condition: jester wins immediately when voted out (game ends)
- [x] Add Randomize mode logic: multiple rounds, one impostor eliminated per round
- [x] Implement tie game logic: 1 innocent + all impostors eliminated = tie
- [x] Add impostor win logic: 2+ innocents + all impostors eliminated = impostors win
- [x] Create innocent win logic: only impostors eliminated = innocents win
- [x] Update `determineWinner` function to handle all win conditions
- [x] Implement game end detection and phase transition logic
- [x] Add proper winner calculation for surviving impostors
- [x] Test win conditions with various elimination scenarios

### Task 8: Create Test Content Packs and Integration ✅
Implement the three test question packs (Party, Spicy, Normal) and integrate pack selection into the existing room creation flow.

**Sub-tasks:**
- [x] Create `src/data/testQuestionPacks.ts` with three test packs
- [x] Implement Party pack: "who would you take with on a deserted island..." / "who annoys you the most..."
- [x] Implement Spicy pack: "how old were you when you had your first kiss" / "what is the average age to have sex?"
- [x] Implement Normal pack: "which celebrity would you go on a deserted island with?" / "which is your favorite celebrity"
- [x] Update pack selection screen to include test packs in addition to existing packs (SKIPPED)
- [x] Integrate pack selection into room creation flow (after create room, before lobby)
- [x] Add pack selection state management to game state
- [x] Create pack selection UI with proper styling and validation
- [x] Test pack selection and content distribution with different packs
- [x] Ensure pack selection persists through game flow

## Relevant Files

### Core Game Logic
- `src/types/index.ts` - Updated TypeScript type definitions for new game flow
- `src/utils/gameLogic.ts` - Updated win condition and game flow logic
- `src/utils/gameUtils.ts` - Game utility functions for role assignment and content distribution
- `src/utils/botUtils.ts` - Bot behavior and voting logic (existing)

### New Screen Components
- `src/components/QuestionScreen.tsx` - **NEW** - Question display and answer submission
- `src/components/RoleRevealModal.tsx` - **NEW** - Role revelation with blurred background
- `src/components/AnswerDisplayScreen.tsx` - **NEW** - Answer display during discussion
- `src/components/VoteResultsScreen.tsx` - **NEW** - Vote results with host controls

### Updated Components
- `src/components/VotingScreen.tsx` - Updated voting system with proper rules
- `src/components/GamePackScreen.tsx` - Enhanced pack selection UI with validation and loading states
- `src/App.tsx` - Updated game state management and phase transitions

### Content and Data
- `src/data/testQuestionPacks.ts` - **NEW** - Test question pack definitions
- `src/data/contentPacks.ts` - Updated to include test packs

### Styling and UI
- `src/globals.css` - Updated styles for new components and modals
- `src/components/ui/` - Reusable UI components for cards, buttons, modals

## Implementation Notes

### Key Logic Requirements:
1. **Role-Based Content**: Innocent players see innocent questions, impostors see impostor questions
2. **Jester Clues**: N/2 randomly selected non-impostor players see "you might be a jester" message
3. **Voting Rules**: Exact vote counts based on impostor count, tie handling with re-votes
4. **Win Conditions**: Jester wins immediately when eliminated, proper impostor/innocent win logic
5. **Randomize Mode**: Multiple rounds with one elimination per round, complex win conditions
6. **Host Controls**: Only host can start voting and choose continue/finish game options

### UI/UX Requirements:
- Modern pasta-themed design with gradient backgrounds
- Smooth animations and transitions between phases
- Clear visual hierarchy and typography
- Responsive design for different screen sizes
- Blurred background modals with proper z-indexing
- Visual indicators for eliminated players and game states

### Technical Considerations:
- Proper TypeScript typing for all new interfaces and components
- State management for complex game flow and phase transitions
- Error handling and edge case management
- Performance optimization for smooth animations
- Accessibility considerations for modals and interactions
