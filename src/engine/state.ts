import type { GameState, GameConfig } from './types';

/**
 * Create a fresh initial game state.
 * Tigers start on nodes 0 (Apex), 6 (G_R1_C3), 7 (G_R1_C4).
 * Goat player moves first.
 */
export function createGame(config?: Partial<GameConfig>): GameState {
  const board = Array<'tiger' | 'goat' | null>(23).fill(null);
  // Place tigers on initial positions
  board[0] = 'tiger';
  board[6] = 'tiger';
  board[7] = 'tiger';

  return {
    board,
    phase: 'placement',
    currentTurn: 'goat',
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
