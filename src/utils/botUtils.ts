import { Player } from '../types';
import { generatePlayerId } from './gameUtils';

export interface Bot extends Player {
  isBot: true;
  personality: 'aggressive' | 'cautious' | 'random' | 'helpful';
}


const BOT_AVATARS = [
  'bg-gradient-to-br from-red-500 to-pink-500',
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-green-500 to-emerald-500',
  'bg-gradient-to-br from-purple-500 to-violet-500'
];

const BOT_PERSONALITIES: Bot['personality'][] = ['aggressive', 'cautious', 'random', 'helpful'];

let botCounter = 0;

export function createBot(botNumber?: number): Bot {
  botCounter++;
  const botNum = botNumber || botCounter;
  return {
    id: `bot-${generatePlayerId()}`,
    username: `Bot_${botNum}`,
    avatar: BOT_AVATARS[(botNum - 1) % BOT_AVATARS.length],
    isHost: false,
    role: 'innocent',
    isConnected: true,
    answer: '',
    hasVoted: false,
    hasSubmittedAnswer: false,
    hasSeenRole: false,
    isEliminated: false,
    isBot: true,
    personality: BOT_PERSONALITIES[(botNum - 1) % BOT_PERSONALITIES.length]
  };
}

export function generateBotAnswer(): string {
  const answers = [
    "I love pizza!",
    "That's interesting...",
    "I'm not sure about that",
    "Sounds good to me",
    "I disagree",
    "Maybe, maybe not",
    "I think so",
    "Probably not",
    "Definitely!",
    "I'm confused",
    "That makes sense",
    "I don't know",
    "Could be",
    "I doubt it",
    "Seems right",
    "I'm not convinced",
    "That's possible",
    "I agree",
    "Not really",
    "I guess so"
  ];
  
  return answers[Math.floor(Math.random() * answers.length)];
}

export function generateBotVotes(
  botId: string,
  allPlayers: Player[],
  votesNeeded: number,
  personality: Bot['personality'],
  tiedPlayers?: string[],
  gameState?: { eliminatedPlayers: string[] }
): string[] {
  
  const eliminatedSet = new Set(gameState?.eliminatedPlayers || []);

  let eligiblePlayers = allPlayers.filter(
    p => p.id !== botId && p.role !== 'spectator' && !eliminatedSet.has(p.id)
  );

  // If in tie-breaker mode, only allow voting for tied players
  if (tiedPlayers && tiedPlayers.length > 0) {
    // Ensure tiedPlayers contains valid IDs by filtering out any undefined/null values
    const validTiedPlayers = tiedPlayers.filter(id => id && typeof id === 'string');

    eligiblePlayers = eligiblePlayers.filter(p => validTiedPlayers.includes(p.id) && p.id !== botId);
  }
  
  const votes: string[] = [];

  switch (personality) {
    case 'aggressive': {
      // Vote for random players but with a bias towards first players
      const shuffled = [...eligiblePlayers];
      // Fisher-Yates shuffle for true randomness
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
        votes.push(shuffled[i].id);
      }
      break;
    }
    
    case 'cautious': {
      // Vote for random players but avoid first player (might be host)
      const cautious = eligiblePlayers.slice(1);
      // Fisher-Yates shuffle for true randomness
      for (let i = cautious.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cautious[i], cautious[j]] = [cautious[j], cautious[i]];
      }
      for (let i = 0; i < Math.min(votesNeeded, cautious.length); i++) {
        if (!votes.includes(cautious[i].id)) {
          votes.push(cautious[i].id);
        }
      }
      break;
    }
    
    case 'random': {
      // Completely random voting
      const shuffled = [...eligiblePlayers];
      // Fisher-Yates shuffle for true randomness
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (let i = 0; i < Math.min(votesNeeded, shuffled.length); i++) {
        votes.push(shuffled[i].id);
      }
      break;
    }
    
    case 'helpful': {
      // Try to vote for players with suspicious answers (last players in list)
      const helpful = eligiblePlayers.slice(-votesNeeded);
      helpful.forEach(player => votes.push(player.id));
      break;
    }
  }

  const finalVotes = votes.slice(0, votesNeeded);
  return finalVotes;
}