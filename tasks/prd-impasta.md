# Product Requirements Document: Impasta

## Introduction/Overview

**Impasta** is a social deduction mobile game where players try to identify impostors among them. The name combines "impostor" and "pasta" for a playful twist on the classic hidden role gameplay. Players can choose between Questions Game and Word Game modes, with both pre-made content packs and custom content creation options.

**Problem Solved:** Provides an engaging social deduction experience that can be played with friends remotely using simple room codes, with both structured content and creative freedom for custom games.

**Goal:** Create a polished, accessible social deduction game that works seamlessly across iOS and Android with minimal friction for players to start games.

## Goals

1. **Accessibility**: Enable 3-10 players to join games instantly via 6-digit room codes
2. **Engagement**: Provide diverse content through themed packs and custom creation
3. **Monetization**: Generate revenue through IAP pack sales and ad removal while keeping base game free
4. **Retention**: Achieve 25% day-1 retention and 70% completion rate from lobby to results
5. **Stability**: Maintain 98% room creation success rate with robust reconnection handling

## User Stories

### Normal Player Experience
- **As a player**, I want to join games quickly using a room code so that I can play with friends without complex setup
- **As a player**, I want to receive questions/words and participate in discussion so that I can blend in or identify impostors
- **As a player**, I want to vote on suspected impostors so that I can eliminate threats to my team
- **As a player**, I want to see clear results so that I can learn if my deductions were correct

### Impostor Experience
- **As an impostor**, I want to receive different questions or no word so that I can attempt to blend in without detection
- **As an impostor**, I want to survive elimination so that I can win the game for my team

### Host Experience
- **As a host**, I want to create rooms and share join codes so that I can organize games with friends
- **As a host**, I want to choose between content packs or create custom content so that I can customize the experience
- **As a host**, I want to manage game settings and rounds so that I can control the gameplay flow
- **As a host**, I want to spectate when using custom content so that I can still participate in the social aspect
- **As a host**, I want to skip the questions and voting screens to directly control game flow
- **As a host**, I want to see live vote results during voting so that I can monitor the game progress
- **As a host**, I want to control when discussion ends and voting begins so that I can manage game pacing
- **As a host**, I want to understand that I will only spectate (not play) when I create my own custom questions

### Jester Experience
- **As a jester**, I want to receive the same content as innocent players so that I can act suspiciously without being obvious
- **As a jester**, I want to get voted out so that I can win the game

## Functional Requirements

### Core Game Flow
1. The system must display a launch screen with the Impasta logo and "with pasta" tagline
2. The system must provide a home screen with profile section, game mode selection, and settings
3. The system must allow players to input usernames and upload avatar photos from camera or gallery
4. The system must support two game modes: Questions Game and Word Game
5. The system must provide room creation and joining via 6-digit numeric codes
6. The system must support 3-10 players per room with 1-3 impostors
7. The system must generate unique 6-digit room codes that expire after 5 minutes of inactivity

### Profile Management
8. The system must allow circular avatar uploads from camera or photo gallery
9. The system must provide username text input fields below avatars
10. The system must support optional avatar skipping for players who don't want to upload photos

### Game Modes and Content
11. The system must provide pre-made content packs for both Questions and Word games
12. The system must allow custom question creation with separate impostor and innocent questions
13. The system must allow custom word creation for Word Game mode
14. The system must limit custom content to 200 items per room with 80 character limits
15. The system must store custom content as room-only ephemeral data
16. The system must allow the host to participate in all game modes (both custom content and pre-made packs)
17. The system must show the host a note that they will participate in the game when using custom content

### Room Management
18. The system must display a lobby with all joined players showing avatars and usernames
19. The system must provide scrollable player lists when exceeding screen space
20. The system must allow hosts to set impostor count (1-3) with validation that impostors < half total players
21. The system must provide a "Randomize" option for automatic impostor count determination
22. The system must provide a "Jester" toggle (available for 5+ players only)
23. The system must prevent simultaneous use of "Jester" and "Randomize" options
24. The system must display a "Start Game" button at the bottom of the player list

### Questions Game Flow
25. The system must assign different questions to innocent players and impostors
26. The system must display questions prominently with text input boxes below
27. The system must require non-empty answers before submission
28. The system must show role revelation modals after answer submission with blurred background until player clicks "OK"
29. The system must provide jester hints to N/2 randomly selected non-impostor players when jester is enabled (where N = non-impostor player count)
30. The system must display an answer screen during discussion showing the innocent question and all submitted answers
31. The system must allow live discussion while players can see both the innocent question and all submitted answers
32. The system must show jester clues on the question screen before players submit their answers
33. The system must hide player answers during question submission phase and reveal them after all players submit
34. The system must automatically transition to role reveal after all players submit answers (no separate discussion screen)
35. The system must allow the host to skip the questions screen and go directly to answer display
36. The system must show the host a "Start Voting" button on the answer display screen to control game flow

### Word Game Flow
32. The system must assign the same word to all innocent players
33. The system must show "You are the Impasta" message to impostors
34. The system must provide an "I Understand" button after role assignment for each player
35. The system must display player cards during discussion phase without showing answers
36. The system must randomly select a starting player for discussion
37. The system must show the starting player "You are starting the game, the one on your left will continue"
38. The system must show other players "PlayerName is starting the game, the one on their left will continue"
39. The system must allow live discussion where players speak their answers out loud
40. The system must not display the innocent word during discussion (players must remember)

### Voting System
41. The system must display "Vote for Impastas" header with player cards and checkboxes
42. The system must enforce exact voting requirements (1 vote for 1 impostor mode, 2 for 2 impostor mode, etc.)
43. In Randomize mode, the system must limit players to voting for exactly one player per round.
44. The system must handle ties by requiring revotes among tied players only. In Randomize mode, this applies to ties for the most votes.
45. On the vote results screen in Randomize mode, the system must show "Continue Game" and "Finish Game" buttons to the host only. Other players will see a "Waiting for host..." message.
46. The system must support multiple elimination rounds in Randomize mode, with exactly one player (the one with the most votes) eliminated per round.
47. If the host chooses "Continue Game" in Randomize mode, the system must start a new round by returning to the answer display screen.
48. The system must change the role of an eliminated player to a non-controlling 'spectator' and visually blur their card on the answer and voting screens for all players in subsequent rounds.
49. The system must remove the 10-second timer from vote results screen
50. The system must prevent players from voting for themselves
51. The system must show vote results including who voted for whom and who got eliminated
52. The system must allow the host to skip the voting screen and go directly to vote results
53. The system must show live vote updates to the host during the voting phase
54. The system must display vote rankings (most votes, least votes, ties) on the vote results screen
55. The system must automatically submit votes for bots after a 2-second delay
56. The system must force submit remaining votes when the timer expires

### Tie-Breaking System
54. The system must detect ties when players outside the top N positions have the same vote count as the Nth elimination position (where N = impostor count)
55. The system must automatically eliminate M players who are in the top N positions before starting tie-breaking
56. The system must initiate tie-breaking rounds when X players have the same vote count as the Nth position, where some are in top N and others are outside top N
57. The system must display "TIE DETECTED - Vote Between Tied Players" messaging during tie-breaking rounds
58. The system must show only the X tied players as voting options during tie-breaking rounds
59. The system must require players to vote for (N-M) players during tie-breaking rounds (where N = impostor count, M = already eliminated players)
60. The system must continue tie-breaking rounds indefinitely until no ties remain among the tied players
61. The system must eliminate (N-M) players per tie-breaking round to reach the total of N eliminations
62. The system must handle multiple tie-breaking rounds where remaining tied players continue voting until (N-M) players are eliminated
63. The system must ensure total eliminations equal the impostor count (M automatic eliminations + (N-M) tie-breaking eliminations = N players)
64. The system must provide clear visual indicators distinguishing tie-breaking rounds from normal voting
65. The system must automatically start tie-breaking voting without requiring host intervention
66. The system must apply the same bot voting logic to tie-breaking rounds as normal voting

### Win Conditions
67. The system must award jester wins when the jester is voted out (game ends immediately)
68. The system must handle Randomize mode with multiple rounds and 1 elimination per round
69. The system must auto-win innocents if all impostors disconnect
70. The system must auto-end game if only 2 players remain
71. In Randomize mode: if players vote out 1 innocent + all impostors = tie game
72. In Randomize mode: if players vote out 2+ innocents + all impostors = impostors win
73. In Randomize mode: if players vote out only impostors = innocents win
74. The system must allow host to choose "Finish Game" only after voting results are shown

### Standard Mode Win Conditions (Single Round)
75. In standard mode: if impostor gets voted out = innocents win
76. In standard mode: if innocent gets voted out = impostor wins (impostor successfully blended in)
77. In standard mode: if no eliminations occur = game continues (should not happen in normal flow)
78. In standard mode: the impostor's mission is to survive the round and get an innocent voted out instead of themselves

### Results and Post-Game
79. The system must display winner avatars and names prominently
80. The system must show appropriate victory messages based on winner type
81. The system must provide "Restart Game" and "Leave Room" options
82. The system must randomly select new host if current host leaves
83. The system must display vote breakdown on the final results screen showing who voted for whom

### Reconnection and Disconnection Handling
84. The system must allow reconnection within 2 minutes of disconnection
85. The system must auto-transfer host to random player if host disconnects
86. The system must handle player disconnects during answer submission as "no answer"
87. The system must handle player disconnects during voting as "no vote"
88. The system must prevent late joiners after game start (spectate only)
89. The system must enforce minimum 3 players before allowing game start
90. The system must resume games if host app is backgrounded for ≤60 seconds

### Language and Localization
91. The system must support English, Russian, and Georgian languages
92. The system must provide language toggle on home screen
93. The system must use provided translations for English and Russian
94. The system must use machine translation with review for Georgian

### Safety and Moderation
95. The system must implement username profanity filtering
96. The system must not include in-app voice or text chat
97. The system must not require reporting or blocking systems

### Monetization
98. The system must provide base game free with sufficient packs for immediate play
99. The system must show interstitial ads after every 2-3 game rounds
100. The system must offer IAP to remove ads (one-time purchase)
101. The system must offer themed pack IAPs (Funny, Spicy, Gross, Holiday, Meme, etc.)
102. The system must gate NSFW/Spicy content behind age verification

### Testing and Development
103. The system must include 5 test bots with varied personalities (aggressive, cautious, random, helpful) for MVP testing
104. The system must allow single player to create room and test with bots
105. The system must remove bot functionality after testing phase
106. The system must provide realistic bot answers instead of static responses
107. The system must implement bot voting with different personality-based strategies

### Test Content Packs
108. The system must include three test question packs for initial testing:
    - "Party" pack: innocent question "who would you take with on a deserted island out of these people on the party", impostor question "who annoys you the most here from the people on the party"
    - "Spicy" pack: innocent question "how old were you when you had your first kiss", impostor question "what is the average age to have sex?"
    - "Normal" pack: innocent question "which celebrity would you go on a deserted island with?", impostor question "which is your favorite celebrity"
109. The system must allow host to select question pack before starting the game (after create room, before lobby)

### Technical Requirements
110. The system must be built using cross-platform technology (React Native/Flutter/Unity)
111. The system must support iOS and Android platforms
112. The system must use realtime server for rooms and sockets
113. The system must not require persistent user accounts
114. The system must implement basic analytics (DAU, session, room counts, win conditions)
115. The system must include crash reporting (Crashlytics/Sentry)
116. The system must request camera and photos permissions for avatar uploads
117. The system must target 13+ age rating with NSFW content gating

## Non-Goals (Out of Scope)

1. **Persistent User Accounts**: No registration, login, or user profiles beyond room sessions
2. **In-App Communication**: No voice chat, text chat, or messaging features
3. **Public Matchmaking**: Room code joining only, no public lobby browser
4. **Custom Content Storage**: No saving custom content beyond current room session
5. **Advanced Moderation**: No reporting, blocking, or content moderation systems
6. **Offline Play**: Online multiplayer only, no local pass-and-play
7. **Social Features**: No friend lists, achievements, or social integration
8. **Complex Analytics**: Basic metrics only, no advanced user behavior tracking
9. **Multiple Languages at Launch**: Only English, Russian, and Georgian supported initially
10. **Bot AI**: Simple test bots only, no intelligent AI opponents

## Design Considerations

- **Minimal UI**: Clean, pasta-themed design with circular avatars and simple navigation
- **Cross-Platform Consistency**: Identical experience across iOS and Android
- **Accessibility**: Large touch targets, clear typography, intuitive navigation
- **Pasta Theme**: Logo with pasta-shaped letters, playful "with pasta" tagline
- **Color Coding**: Clear visual distinction between player roles and game states
- **Responsive Layout**: Adapt to different screen sizes and orientations

## Technical Considerations

- **Cross-Platform Framework**: React Native, Flutter, or Unity for code sharing
- **Realtime Communication**: WebSocket or similar for live game updates
- **Room Management**: Server-side room state management with 6-digit code generation
- **Content Management**: Local storage for custom content, server for pack distribution
- **Analytics Integration**: Firebase Analytics or similar for basic metrics
- **Crash Reporting**: Crashlytics, Sentry, or similar for error tracking
- **IAP Integration**: Platform-specific in-app purchase systems
- **Ad Integration**: Interstitial ad network (AdMob, Unity Ads, etc.)

## Success Metrics

1. **Room Creation Success Rate**: ≥98% of room creation attempts succeed
2. **Game Completion Rate**: ≥70% of games started reach the results screen
3. **Day-1 Retention**: ≥25% of users return the day after first play
4. **Average Players per Room**: ≥5 players per active room
5. **IAP Conversion Rate**: ≥2% of users purchase remove-ads or content packs
6. **Ad View Rate**: ≥80% of games show interstitial ads as intended
7. **Reconnection Success**: ≥90% of reconnection attempts within 2 minutes succeed

## Resolved Design Decisions

1. **Content Pack Pricing**: Themed pack IAPs will be priced at $1.99
2. **Ad Frequency Optimization**: Yes, adjustable but simple at MVP:
   - First 2-3 games → no ads
   - Then → 1 ad per 2 games completed
   - Integrate AdMob interstitials with simple frequency cap
3. **Custom Content Limits**: 200 items and 80 characters are sufficient limits for custom content
4. **Bot Testing Duration**: Bot functionality will remain active until explicitly removed by development team
5. **Age Verification Method**: Simple age-gate modal with Yes/No buttons, store consent locally to avoid repeated prompts
6. **Analytics Granularity**: Track room/game flow, gameplay events, voting/winner events, and ad/IAP events first
7. **Room Code Security**: Use random 6-digit codes with expiration and host validation, optionally add rate limiting
8. **Cross-Platform Data**: Sync accounts, purchases, and custom content only. Skip syncing temporary game state
9. **Offline Fallback**: No offline functionality for viewing results or content
10. **Future Monetization**: Additional monetization features to be determined later
