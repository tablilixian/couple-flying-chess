import { Script } from '../../types';
import { coffeeShop } from './coffeeShop';
import { spaMassage } from './spaMassage';

export const BUILTIN_SCRIPTS: Script[] = [
  coffeeShop,
  spaMassage,
];

export function getScriptById(id: string): Script | undefined {
  return BUILTIN_SCRIPTS.find(s => s.id === id);
}

export function getScriptsByDifficulty(difficulty: number): Script[] {
  return BUILTIN_SCRIPTS.filter(s => s.difficulty === difficulty);
}
