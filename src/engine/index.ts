// Public re-export surface — the only file other modules should import from.
// Zero UI imports anywhere in src/engine/. Safe for Web Worker and Rust port.

export type {
  GameState,
  Move,
  MoveResult,
  GameEvent,
  GameStatus,
  LegalMove,
  GameConfig,
  Piece,
  Phase,
  Role,
} from './types';

export { createGame } from './state';
export { applyMove, getLegalMoves } from './moves';
export { getGameStatus } from './rules';
export { undo, redo } from './history';
export { NODES, EDGES, JUMP_MAP } from './board';
