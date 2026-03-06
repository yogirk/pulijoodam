// Heuristic evaluation function for Pulijoodam AI
// All scores from tiger's perspective: positive = tiger advantage, negative = goat advantage.

import type { GameState } from '../types';
import { NODES, JUMP_MAP } from '../board';
import { getGameStatus } from '../rules';

const TERMINAL_WIN = 10000;

// Weights for evaluation factors
const W_CAPTURES        = 100;   // goatsCaptured — dominant signal
const W_TIGER_MOBILITY  =  10;   // total legal moves for all tigers
const W_TRAPPED_TIGER   = -80;   // penalty per trapped tiger
const W_VULNERABLE_GOAT =  15;   // goats adjacent to tiger with empty landing
const W_GOAT_WALL       =  -5;   // goat pairs blocking tiger movement
const W_TIGER_CENTRALITY =  3;   // tigers on well-connected nodes

/**
 * Evaluate a game state from the tiger's perspective.
 * Terminal: tiger-wins = +10000, goat-wins = -10000, draw = 0.
 * Mid-game: weighted combination of positional factors.
 */
export function evaluate(state: GameState): number {
  const status = getGameStatus(state);

  switch (status) {
    case 'tiger-wins':      return TERMINAL_WIN;
    case 'goat-wins':       return -TERMINAL_WIN;
    case 'draw-repetition': return 0;
    case 'draw-50moves':    return 0;
  }

  // Mid-game evaluation
  return (
    state.goatsCaptured   * W_CAPTURES +
    tigerMobility(state)  * W_TIGER_MOBILITY +
    trappedTigers(state)  * W_TRAPPED_TIGER +
    vulnerableGoats(state) * W_VULNERABLE_GOAT +
    goatWallStrength(state) * W_GOAT_WALL +
    tigerCentrality(state) * W_TIGER_CENTRALITY
  );
}

/**
 * Count total legal moves for all tigers (slides + captures).
 */
function tigerMobility(state: GameState): number {
  let mobility = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'tiger') continue;
    for (const neighbor of NODES[i].adj) {
      // Slide moves
      if (state.board[neighbor] === null) {
        mobility++;
      }
      // Capture moves
      if (state.board[neighbor] === 'goat') {
        const landing = JUMP_MAP[`${i},${neighbor}`];
        if (landing !== undefined && state.board[landing] === null) {
          mobility++;
        }
      }
    }
  }
  return mobility;
}

/**
 * Count tigers with zero adjacent empty nodes and no capturable neighbors.
 */
function trappedTigers(state: GameState): number {
  let trapped = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'tiger') continue;
    let hasMove = false;
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] === null) {
        hasMove = true;
        break;
      }
      if (state.board[neighbor] === 'goat') {
        const landing = JUMP_MAP[`${i},${neighbor}`];
        if (landing !== undefined && state.board[landing] === null) {
          hasMove = true;
          break;
        }
      }
    }
    if (!hasMove) trapped++;
  }
  return trapped;
}

/**
 * Count goats adjacent to a tiger where the jump landing is empty.
 * These goats are vulnerable to capture.
 */
function vulnerableGoats(state: GameState): number {
  let count = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'goat') continue;
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] !== 'tiger') continue;
      // Tiger at `neighbor`, goat at `i` — check if tiger can jump over goat
      const landing = JUMP_MAP[`${neighbor},${i}`];
      if (landing !== undefined && state.board[landing] === null) {
        count++;
        break; // Count each goat at most once
      }
    }
  }
  return count;
}

/**
 * Count goat pairs that are adjacent to each other AND adjacent to a tiger.
 * These form blocking walls that restrict tiger movement.
 */
function goatWallStrength(state: GameState): number {
  let walls = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'goat') continue;
    // Check if this goat is adjacent to a tiger
    let adjToTiger = false;
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] === 'tiger') {
        adjToTiger = true;
        break;
      }
    }
    if (!adjToTiger) continue;
    // Count adjacent goats (only count pair once: when i < j)
    for (const neighbor of NODES[i].adj) {
      if (neighbor > i && state.board[neighbor] === 'goat') {
        walls++;
      }
    }
  }
  return walls;
}

/**
 * Sum centrality bonus for each tiger based on node adjacency count.
 * More connections = more central = more tactical options.
 */
function tigerCentrality(state: GameState): number {
  let centrality = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'tiger') continue;
    centrality += NODES[i].adj.length;
  }
  return centrality;
}
