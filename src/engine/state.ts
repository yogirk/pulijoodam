import type { GameState, GameConfig } from './types';
import { TIGER_START_NODES } from './board';

/**
 * Create a fresh initial game state.
 * Tigers are pre-placed on fixed positions. Goats are placed during the placement phase.
 * Goat player moves first.
 */
export function createGame(config?: Partial<GameConfig>): GameState {
  const board = Array<'tiger' | 'goat' | null>(23).fill(null);
  for (const node of TIGER_START_NODES) {
    board[node] = 'tiger';
  }

  return {
    board,
    phase: 'placement',
    currentTurn: 'goat',
    tigersInPool: 0,
    goatsInPool: 15,
    goatsCaptured: 0,
    moveHistory: [],
    stateHashes: {},
    capturelessMoves: 0,
    chainJumpInProgress: null,
    config: {
      andhra: true,
      ...config,
    },
  };
}
