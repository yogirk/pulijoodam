// AI entry point — chooseMove dispatcher
// Currently a random-move placeholder. Will be replaced by MCTS/minimax in Plan 02.

import type { GameState, Move } from '../types';
import type { AIConfig } from './types';
import { getLegalMoves } from '../moves';

/**
 * Choose a move for the current player given a game state and AI config.
 * Placeholder: picks a random legal move.
 */
export function chooseMove(state: GameState, _config: AIConfig): Move {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    throw new Error('No legal moves available');
  }
  const idx = Math.floor(Math.random() * legalMoves.length);
  return legalMoves[idx].move;
}
