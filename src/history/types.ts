import type { Move, Role, GameStatus } from '../engine';
import type { AIDifficulty } from '../engine/ai/types';

/** A game in progress (or recently completed), serialized to localStorage. */
export interface SavedGame {
  id: string;
  startedAt: string;        // ISO 8601
  lastPlayedAt: string;     // ISO 8601
  moveHistory: Move[];
  humanRole: Role;
  opponent: 'ai' | 'local';
  difficulty?: AIDifficulty;
  result?: GameStatus;
}

/** A completed game stored in the history list. */
export interface GameRecord extends SavedGame {
  result: GameStatus;
  duration: number;          // seconds from startedAt to lastPlayedAt
}

export const CURRENT_GAME_KEY = 'pulijoodam_current_game';
export const GAME_HISTORY_KEY = 'pulijoodam_history';
export const MAX_HISTORY = 50;
