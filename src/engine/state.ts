import type { GameState, GameConfig } from './types';

/**
 * Create a fresh initial game state.
 * Board starts empty — both tigers and goats are placed during the placement phase.
 * Goat player moves first.
 */
export function createGame(config?: Partial<GameConfig>): GameState {
  const board = Array<'tiger' | 'goat' | null>(23).fill(null);

  return {
    board,
    phase: 'placement',
    currentTurn: 'goat',
    tigersInPool: 3,
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
