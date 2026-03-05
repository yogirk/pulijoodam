import type { GameState, GameStatus } from './types';
import { NODES, JUMP_MAP } from './board';

/**
 * Determine current game status.
 * Priority: tiger-wins > goat-wins > draw-repetition > draw-50moves > ongoing
 */
export function getGameStatus(state: GameState): GameStatus {
  // Tiger wins: 10 goats captured (v1 Andhra preset)
  if (state.goatsCaptured >= 10) return 'tiger-wins';

  // Goat wins: all tigers on board are immobilized
  if (!hasTigerMoves(state)) return 'goat-wins';

  // Draw by threefold repetition
  if (Object.values(state.stateHashes).some(count => count >= 3)) return 'draw-repetition';

  // Draw by 50 captureless moves
  if (state.capturelessMoves >= 50) return 'draw-50moves';

  return 'ongoing';
}

/**
 * Check if tigers have any legal moves (slide or capture).
 * Inlined here to avoid circular import with moves.ts.
 */
function hasTigerMoves(state: GameState): boolean {
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'tiger') continue;
    // Check slide moves
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] === null) return true;
    }
    // Check capture moves
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] !== 'goat') continue;
      const key = `${i},${neighbor}`;
      const landing = JUMP_MAP[key];
      if (landing !== undefined && state.board[landing] === null) return true;
    }
  }
  return false;
}
