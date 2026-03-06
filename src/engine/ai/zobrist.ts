// Zobrist hashing for transposition table
// Uses deterministic seed values (not Math.random) for consistency across Worker instances.

import type { GameState } from '../types';

// ─── Deterministic pseudo-random number generator ───────────────────────────

/**
 * Simple xorshift32 PRNG with deterministic seed.
 * Produces 32-bit unsigned integers.
 */
function xorshift32(seed: number): () => number {
  let state = seed >>> 0; // ensure unsigned 32-bit
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

// ─── Zobrist table generation ───────────────────────────────────────────────

// 23 nodes x 3 states (empty=0, tiger=1, goat=2) = 69 entries + 2 turn hashes
const NUM_NODES = 23;
const NUM_STATES = 3; // empty, tiger, goat

const rng = xorshift32(0xDEAD_BEEF); // fixed seed for determinism

/**
 * ZOBRIST_TABLE[nodeId][stateIndex] where stateIndex: 0=empty, 1=tiger, 2=goat
 */
export const ZOBRIST_TABLE: number[][] = (() => {
  const table: number[][] = [];
  for (let i = 0; i < NUM_NODES; i++) {
    const row: number[] = [];
    for (let j = 0; j < NUM_STATES; j++) {
      row.push(rng());
    }
    table.push(row);
  }
  return table;
})();

/** Hash values for turn: index 0 = goat turn, index 1 = tiger turn */
export const TURN_HASH: [number, number] = [rng(), rng()];

// ─── Hash function ──────────────────────────────────────────────────────────

function pieceIndex(piece: 'tiger' | 'goat' | null): number {
  if (piece === null) return 0;
  if (piece === 'tiger') return 1;
  return 2; // goat
}

/**
 * Compute Zobrist hash for a game state.
 * XOR over all board positions + turn.
 */
export function zobristHash(state: GameState): number {
  let hash = 0;
  for (let i = 0; i < NUM_NODES; i++) {
    hash ^= ZOBRIST_TABLE[i][pieceIndex(state.board[i])];
  }
  hash ^= TURN_HASH[state.currentTurn === 'goat' ? 0 : 1];
  return hash;
}
