

### 1. Voting Logic

When the host clicks "Start Voting" on the discussion screen, the game transitions to a dedicated voting screen.

*   **Immediate Voting**: Unlike the standard mode, there is no discussion timer on the voting screen in randomize mode. The voting interface is available immediately.
*   **Single Vote**: Each player gets to cast only **one vote** for who they suspect is the impostor.
*   **Bot Behavior**: Bots cast their votes instantly and automatically as soon as the voting screen loads.
*   **Submission**: Once a player has selected another player to vote for, they can submit their vote. The game then waits for all non-eliminated, non-spectator players to submit their votes before proceeding.

### 2. Tie-Breaker Logic

If the vote results in a tie for the most votes, a tie-breaker round is automatically initiated.

*   **No Elimination**: No one is eliminated from the initial tied vote.
*   **Stay on Voting Screen**: The game remains on the voting screen. The UI will update to indicate that it's a tie-breaker round.
*   **Restricted Voting**: Players can now only vote for one of the players who were part of the tie.
*   **Resolution**: This process repeats until the tie is broken and a single player receives the most votes. If there's a tie again, another tie-breaker round begins with the newly tied players.

### 3. Screen Flow

The sequence of screens is designed to support the multi-round nature of randomize mode.

1.  **Lobby (`LobbyScreen`)**: The host enables "Randomize" mode here.
2.  **Word & Role **: The game starts, role (if impostor) and the word is assigned, and players read their words and press continue to discussion, after pressing the button they are transfered to the discussion screen.
3.  **Discussion (`DiscussionScreen`)**: Players give clues one by one and on the top of the screen there is the "Starting Player". The host has a "Start Voting" button.
4.  **Voting (`VotingScreen`)**: Clicking "Start Voting" transitions everyone to this screen.
5.  **Vote Results (`VoteResultsScreen`)**: After voting concludes (including any tie-breakers), the player with the most votes is eliminated. This screen shows who was eliminated and displays two crucial buttons for the host:
    *   **Continue Game**: This starts a new round of discussion and voting.
    *   **Finish Game**: This ends the game and proceeds to the final results.
6.  **Loop or End**:
    *   If "Continue Game" is chosen, the flow goes back to the **`DiscussionScreen`** to begin a new round of discussion with the remaining players.
    *   If "Finish Game" is chosen, the flow moves to the **`ResultsScreen`**.
7.  **Results (`ResultsScreen`)**: This screen announces the winners (either Innocents or Impostors) and ends the game.

### 4. Win-Draw-Loss Logic

In randomize mode, the game does not end automatically after a single vote. The host's decision to "Finish Game" is the primary way the game ends.

*   **Host-Controlled Ending**: When the host clicks "Finish Game" on the `VoteResultsScreen`, the winner is determined based on the players still in the game:
    *   **Impostors Win**: If at least one Impostor is still in the game, the Impostors win.
    *   **Innocents Win**: If all Impostors have been eliminated, the Innocents win.
*   **Automatic Ending**: The game can also end automatically under specific conditions, without the host needing to click "Finish Game":
   
    *   **Too Few Players**: If the number of remaining players drops to two, the game ends, and the Impostors win (as it's impossible for the Innocents to win a vote).



### 5. Multiple Round Logic

Randomize mode is designed to be played over multiple rounds of voting and elimination.

*   After each elimination is revealed on the `VoteResultsScreen`, the host's choice to "Continue Game" drives the multi-round system.
*   When a new round begins, the game state is reset for another cycle of discussion and voting. Player votes from the previous round are cleared.
*   This loop of **Discussion -> Voting -> Elimination -> Continue** allows players to gather more information and strategically eliminate suspects over time.

### 6. Screen UI Logic

The UI of each screen is tailored to support the specific logic of randomize mode.

*   **`LobbyScreen`**: A toggle switch allows the host to enable "Randomize" mode. This toggle is disabled if there are fewer than five players, as the mode is designed for larger groups.
*   **`VotingScreen`**:
    *   The UI is simplified to reflect that only one vote is needed.
    *   The discussion timer is hidden, as voting starts immediately.
    *   In a tie-breaker, a prominent "TIE-BREAKER ROUND" banner appears, and the player cards of non-tied players are disabled to prevent incorrect votes.
*   **`VoteResultsScreen`**: This screen is the central hub for randomize mode's flow. In addition to showing who was voted out, it exclusively features the "Continue Game" and "Finish Game" buttons for the host, putting them in control of the game's progression.