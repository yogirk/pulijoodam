// Pulijoodam engine types
// All types are JSON-serializable — no Map, no Set anywhere in GameState.
// Required for Web Worker postMessage and localStorage serialization.

export type Piece = 'tiger' | 'goat';
export type Phase = 'placement' | 'movement';
export type Role = 'tiger' | 'goat';
export type GameStatus =
  | 'ongoing'
  | 'tiger-wins'
  | 'goat-wins'
  | 'draw-repetition'
  | 'draw-50moves';

export interface GameConfig {
  /** true = chain-hops allowed, 10-capture tiger win threshold (Andhra rules) */
  andhra: boolean;
}

/**
 * Immutable contract: engine functions always return new state objects, never mutate.
 * All fields must be JSON-serializable (no Map, no Set).
 */
export interface GameState {
  board: (Piece | null)[];         // length 23; index = node id
  phase: Phase;
  currentTurn: Role;
  tigersInPool: number;            // 0–3
  goatsInPool: number;             // 0–15
  goatsCaptured: number;           // 0–15
  moveHistory: Move[];             // chronological
  /**
   * Plain object (not Map) for JSON-serializable state.
   * Required for Web Worker postMessage and localStorage.
   * boardHash → count; draw by repetition when any value >= 3
   */
  stateHashes: Record<string, number>;
  capturelessMoves: number;        // resets on capture; draw at 50
  chainJumpInProgress: number | null; // tiger node id if mid-chain, else null
  config: GameConfig;
}

export type Move =
  | { type: 'PLACE'; to: number }                               // goat places from pool
  | { type: 'MOVE'; from: number; to: number }                  // piece slides to adjacent node
  | { type: 'CAPTURE'; from: number; over: number; to: number } // tiger jumps over goat
  | { type: 'END_CHAIN' };                                      // tiger voluntarily ends chain-hop

export interface LegalMove {
  move: Move;
  from?: number; // convenience: source node (undefined for PLACE/END_CHAIN)
  to?: number;   // convenience: destination node (undefined for END_CHAIN)
}

export type GameEvent =
  | { type: 'PIECE_MOVED'; from: number; to: number; piece: Piece }
  | { type: 'GOAT_CAPTURED'; over: number; landedAt: number }
  | { type: 'GOAT_PLACED'; at: number }
  | { type: 'PHASE_CHANGED'; newPhase: Phase }
  | { type: 'GAME_OVER'; status: GameStatus }
  | { type: 'CHAIN_JUMP_AVAILABLE'; tigerAt: number }
  | { type: 'CHAIN_JUMP_ENDED'; tigerAt: number };

export interface MoveResult {
  state: GameState;
  events: GameEvent[];
  error?: string; // present when move was rejected; state is unchanged input state
}
