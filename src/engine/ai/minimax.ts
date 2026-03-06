// Minimax with alpha-beta pruning, iterative deepening, and transposition table
// Used for movement phase where branching factor is lower and evaluation is more reliable.

import type { GameState, Move, Role } from '../types';
import { getLegalMoves, applyMove } from '../moves';
import { getGameStatus } from '../rules';
import { evaluate } from './eval';
import { zobristHash } from './zobrist';

// ─── Transposition Table ────────────────────────────────────────────────────

const TT_SIZE = 1 << 18; // 262144 entries
const TT_MASK = TT_SIZE - 1;

const enum TTFlag {
  EXACT = 0,
  LOWER = 1, // alpha cutoff (score >= beta)
  UPPER = 2, // failed low (score <= alpha)
}

interface TTEntry {
  hash: number;
  depth: number;
  score: number;
  flag: TTFlag;
  bestMove: Move | null;
}

let transpositionTable: (TTEntry | null)[] = [];

function clearTT(): void {
  transpositionTable = new Array(TT_SIZE).fill(null);
}

function ttProbe(hash: number): TTEntry | null {
  const entry = transpositionTable[hash & TT_MASK];
  if (entry !== null && entry.hash === hash) return entry;
  return null;
}

function ttStore(hash: number, depth: number, score: number, flag: TTFlag, bestMove: Move | null): void {
  // Replace-always strategy
  transpositionTable[hash & TT_MASK] = { hash, depth, score, flag, bestMove };
}

// ─── Timeout mechanism ──────────────────────────────────────────────────────

class TimeoutError extends Error {
  constructor() {
    super('Search timeout');
    this.name = 'TimeoutError';
  }
}

// ─── Move ordering ──────────────────────────────────────────────────────────

function orderMoves(_state: GameState, moves: Move[], ttBestMove: Move | null): Move[] {
  const scored: { move: Move; score: number }[] = [];

  for (const move of moves) {
    let score = 0;

    // TT best move gets highest priority
    if (ttBestMove !== null && JSON.stringify(move) === JSON.stringify(ttBestMove)) {
      score = 100000;
    } else if (move.type === 'CAPTURE') {
      // Captures get high priority
      score = 10000;
    } else if (move.type === 'END_CHAIN') {
      // End chain is low priority (prefer continuing captures)
      score = -100;
    } else if (move.type === 'MOVE') {
      // Lightweight heuristic: prefer central moves
      score = 0;
    } else {
      // PLACE
      score = 0;
    }

    scored.push({ move, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.move);
}

// ─── Negamax with alpha-beta ────────────────────────────────────────────────

let nodesSearched = 0;
let searchDeadline = 0;

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  role: Role, // the role whose perspective we're scoring from
): number {
  // Time check every 1000 nodes
  nodesSearched++;
  if (nodesSearched % 1000 === 0) {
    if (performance.now() >= searchDeadline) {
      throw new TimeoutError();
    }
  }

  // Terminal check
  const status = getGameStatus(state);
  if (status !== 'ongoing') {
    const raw = evaluate(state);
    return role === 'tiger' ? raw : -raw;
  }

  // Leaf node: evaluate
  if (depth <= 0) {
    const raw = evaluate(state);
    return role === 'tiger' ? raw : -raw;
  }

  // TT probe
  const hash = zobristHash(state);
  const ttEntry = ttProbe(hash);
  let ttBestMove: Move | null = null;

  if (ttEntry !== null && ttEntry.depth >= depth) {
    if (ttEntry.flag === TTFlag.EXACT) return ttEntry.score;
    if (ttEntry.flag === TTFlag.LOWER && ttEntry.score >= beta) return ttEntry.score;
    if (ttEntry.flag === TTFlag.UPPER && ttEntry.score <= alpha) return ttEntry.score;
  }
  if (ttEntry !== null) {
    ttBestMove = ttEntry.bestMove;
  }

  // Generate and order moves
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    const raw = evaluate(state);
    return role === 'tiger' ? raw : -raw;
  }

  const moves = orderMoves(state, legalMoves.map(lm => lm.move), ttBestMove);

  let bestScore = -Infinity;
  let bestMove: Move | null = null;
  let ttFlag: TTFlag = TTFlag.UPPER;

  for (const move of moves) {
    const result = applyMove(state, move);
    if (result.error) continue;

    let score: number;

    // Chain-hop handling: don't decrement depth for chain continuations
    const isChainContinuation = result.state.chainJumpInProgress !== null;

    if (isChainContinuation) {
      // Same player continues — don't flip perspective, don't reduce depth
      score = negamax(result.state, depth, alpha, beta, role);
    } else {
      // Turn switches — flip perspective and reduce depth
      const nextRole: Role = role === 'tiger' ? 'goat' : 'tiger';
      score = -negamax(result.state, depth - 1, -beta, -alpha, nextRole);
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    if (score > alpha) {
      alpha = score;
      ttFlag = TTFlag.EXACT;
    }

    if (alpha >= beta) {
      ttFlag = TTFlag.LOWER;
      break;
    }
  }

  ttStore(hash, depth, bestScore, ttFlag, bestMove);

  return bestScore;
}

// ─── Public: minimaxSearch ──────────────────────────────────────────────────

/**
 * Iterative-deepening negamax with alpha-beta pruning.
 *
 * @param state - Current game state
 * @param maxDepth - Maximum search depth
 * @param timeBudgetMs - Time budget in milliseconds
 * @param role - The role (tiger/goat) that the AI is playing
 * @returns The best move found
 */
export function minimaxSearch(
  state: GameState,
  maxDepth: number,
  timeBudgetMs: number,
  role: Role
): Move {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    throw new Error('No legal moves available');
  }
  if (legalMoves.length === 1) {
    return legalMoves[0].move;
  }

  clearTT();
  searchDeadline = performance.now() + timeBudgetMs;
  nodesSearched = 0;

  let bestMove: Move = legalMoves[0].move;

  // Iterative deepening: depth 1 to maxDepth
  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      const moves = legalMoves.map(lm => lm.move);
      const hash = zobristHash(state);
      const ttEntry = ttProbe(hash);
      const ttBestMove = ttEntry?.bestMove ?? null;
      const orderedMoves = orderMoves(state, moves, ttBestMove);

      let bestScoreAtDepth = -Infinity;
      let bestMoveAtDepth: Move = orderedMoves[0];
      let alpha = -Infinity;
      const beta = Infinity;

      for (const move of orderedMoves) {
        const result = applyMove(state, move);
        if (result.error) continue;

        let score: number;
        const isChainContinuation = result.state.chainJumpInProgress !== null;

        if (isChainContinuation) {
          score = negamax(result.state, depth, alpha, beta, role);
        } else {
          const nextRole: Role = role === 'tiger' ? 'goat' : 'tiger';
          score = -negamax(result.state, depth - 1, -beta, -alpha, nextRole);
        }

        if (score > bestScoreAtDepth) {
          bestScoreAtDepth = score;
          bestMoveAtDepth = move;
        }

        if (score > alpha) {
          alpha = score;
        }
      }

      // Completed this depth — update best move
      bestMove = bestMoveAtDepth;

      // Check time for next iteration
      if (performance.now() >= searchDeadline) break;

    } catch (e) {
      if (e instanceof TimeoutError) {
        // Time ran out mid-depth: use best from previous completed depth
        break;
      }
      throw e;
    }
  }

  return bestMove;
}
