// AI entry point — chooseMove dispatcher
// Routes to MCTS for placement phase, minimax for movement phase.

import type { GameState, Move } from '../types';
import type { AIConfig } from './types';
import { mctsSearch } from './mcts';
import { minimaxSearch } from './minimax';

/**
 * Choose a move for the current player given a game state and AI config.
 *
 * Dispatch logic:
 * - Placement phase (or goatsInPool > 0): MCTS (handles high branching factor)
 * - Movement phase: Minimax with alpha-beta (more precise evaluation)
 * - Chain-hop in progress during movement: still minimax (mid-turn, phase is movement)
 */
export function chooseMove(state: GameState, config: AIConfig): Move {
  if (state.phase === 'placement' || state.goatsInPool > 0) {
    return mctsSearch(
      state,
      config.mctsSims,
      config.timeBudgetMs,
      state.currentTurn
    );
  }

  return minimaxSearch(
    state,
    config.minimaxDepth,
    config.timeBudgetMs,
    state.currentTurn
  );
}
