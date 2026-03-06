// AI type contracts for Pulijoodam engine
// All types are JSON-serializable for Web Worker postMessage.

import type { GameState, Move } from '../types';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AIConfig {
  difficulty: AIDifficulty;
  mctsSims: number;
  minimaxDepth: number;
  timeBudgetMs: number;
  /** Pick from top N moves for randomization (1 = deterministic best) */
  topN: number;
}

export interface AIRequest {
  type: 'COMPUTE_MOVE';
  state: GameState;
  config: AIConfig;
}

export interface AIResponse {
  type: 'MOVE_COMPUTED';
  move: Move;
  thinkTimeMs: number;
}

/** Default configs per difficulty level */
export const DIFFICULTY_CONFIGS: Record<AIDifficulty, AIConfig> = {
  easy:   { difficulty: 'easy',   mctsSims: 200,   minimaxDepth: 2, timeBudgetMs: 500,  topN: 3 },
  medium: { difficulty: 'medium', mctsSims: 2000,  minimaxDepth: 4, timeBudgetMs: 1000, topN: 1 },
  hard:   { difficulty: 'hard',   mctsSims: 10000, minimaxDepth: 6, timeBudgetMs: 2000, topN: 1 },
  expert: { difficulty: 'expert', mctsSims: 50000, minimaxDepth: 8, timeBudgetMs: 5000, topN: 1 },
};
