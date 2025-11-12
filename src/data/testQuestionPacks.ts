import { QuestionPack } from '../types';

export const testQuestionPacks: QuestionPack[] = [
  {
    id: 'party',
    name: 'Party',
    innocent: 'Who would you take with you on a deserted island out of these people on the party?',
    impostor: 'Who annoys you the most here from the people on the party?'
  },
  {
    id: 'spicy',
    name: 'Spicy',
    innocent: 'How old were you when you had your first kiss?',
    impostor: 'What is the average age to have sex?'
  },
  {
    id: 'normal',
    name: 'Normal',
    innocent: 'Which celebrity would you go on a deserted island with?',
    impostor: 'Which is your favorite celebrity?'
  }
];

export function getTestQuestionPack(id: string): QuestionPack | undefined {
  return testQuestionPacks.find(pack => pack.id === id);
}

export function getRandomTestQuestionPack(): QuestionPack {
  const randomIndex = Math.floor(Math.random() * testQuestionPacks.length);
  return testQuestionPacks[randomIndex];
}
