// MCTS (Monte Carlo Tree Search) for Pulijoodam placement phase
// Uses UCB1 selection, heuristic-weighted rollouts, and time-budgeted search.

import type { GameState, Move, Role } from '../types';
import { getLegalMoves, applyMove } from '../moves';
import { getGameStatus } from '../rules';
import { evaluate } from './eval';

// ─── MCTS Node ──────────────────────────────────────────────────────────────

interface MCTSNode {
  state: GameState;
  move: Move | null;       // move that led to this node (null for root)
  parent: MCTSNode | null;
  children: MCTSNode[];
  visits: number;
  value: number;           // cumulative normalized score
  untriedMoves: Move[];
}

function createNode(state: GameState, move: Move | null, parent: MCTSNode | null): MCTSNode {
  const legalMoves = getLegalMoves(state);
  return {
    state,
    move,
    parent,
    children: [],
    visits: 0,
    value: 0,
    untriedMoves: legalMoves.map(lm => lm.move),
  };
}

// ─── UCB1 Selection ─────────────────────────────────────────────────────────

const UCB1_C = 1.4;

function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  const exploitation = node.value / node.visits;
  const exploration = UCB1_C * Math.sqrt(Math.log(parentVisits) / node.visits);
  return exploitation + exploration;
}

function selectChild(node: MCTSNode): MCTSNode {
  let best: MCTSNode = node.children[0];
  let bestScore = -Infinity;
  for (const child of node.children) {
    const score = ucb1(child, node.visits);
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }
  return best;
}

// ─── Heuristic-Weighted Random Move ─────────────────────────────────────────

function weightedRandomMove(state: GameState): Move {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    throw new Error('No legal moves in rollout');
  }
  if (legalMoves.length === 1) {
    return legalMoves[0].move;
  }

  const weights: number[] = [];

  for (const lm of legalMoves) {
    const m = lm.move;
    if (state.currentTurn === 'tiger' || state.chainJumpInProgress !== null) {
      // Tiger weighting
      if (m.type === 'CAPTURE') {
        weights.push(5);
      } else if (m.type === 'END_CHAIN') {
        weights.push(1);
      } else if (m.type === 'MOVE') {
        // Weight moves toward goats higher
        let nearGoat = false;
        const { board } = state;
        const { adj } = getNodeAdj(m.to);
        for (const neighbor of adj) {
          if (board[neighbor] === 'goat') {
            nearGoat = true;
            break;
          }
        }
        weights.push(nearGoat ? 2 : 1);
      } else {
        weights.push(1);
      }
    } else {
      // Goat weighting
      if (m.type === 'PLACE') {
        // Weight placements adjacent to tigers higher (blocking)
        const { board } = state;
        const { adj } = getNodeAdj(m.to);
        let adjToTiger = false;
        let adjToGoat = false;
        for (const neighbor of adj) {
          if (board[neighbor] === 'tiger') adjToTiger = true;
          if (board[neighbor] === 'goat') adjToGoat = true;
        }
        if (adjToTiger) {
          weights.push(3);
        } else if (adjToGoat) {
          weights.push(2);
        } else {
          weights.push(1);
        }
      } else if (m.type === 'MOVE') {
        // Similar logic for goat movement
        const { board } = state;
        const { adj } = getNodeAdj(m.to);
        let adjToTiger = false;
        for (const neighbor of adj) {
          if (board[neighbor] === 'tiger') {
            adjToTiger = true;
            break;
          }
        }
        weights.push(adjToTiger ? 3 : 1);
      } else {
        weights.push(1);
      }
    }
  }

  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return legalMoves[i].move;
  }
  return legalMoves[legalMoves.length - 1].move;
}

// Cached adjacency lookup helper to avoid importing NODES in hot path
import { NODES } from '../board';

function getNodeAdj(nodeId: number): { adj: number[] } {
  return NODES[nodeId];
}

// ─── Rollout ────────────────────────────────────────────────────────────────

const MAX_ROLLOUT_DEPTH = 60;
const TERMINAL_WIN = 10000;

/**
 * Heuristic rollout from a state. Returns normalized score in [0, 1]
 * from the perspective of `role`.
 */
function rollout(state: GameState, role: Role): number {
  let current = state;
  let depth = 0;

  while (depth < MAX_ROLLOUT_DEPTH) {
    const status = getGameStatus(current);
    if (status !== 'ongoing') {
      return normalizeScore(evaluate(current), role);
    }

    const legalMoves = getLegalMoves(current);
    if (legalMoves.length === 0) {
      return normalizeScore(evaluate(current), role);
    }

    const move = weightedRandomMove(current);
    const result = applyMove(current, move);
    if (result.error) {
      // Shouldn't happen with legal moves, but bail safely
      return normalizeScore(evaluate(current), role);
    }
    current = result.state;
    // Only count full turns (not chain continuations) towards depth
    if (current.chainJumpInProgress === null) {
      depth++;
    }
  }

  return normalizeScore(evaluate(current), role);
}

/**
 * Normalize evaluate() output to [0, 1] range for MCTS value averaging.
 * evaluate() returns score from tiger perspective.
 * We convert to `role` perspective and normalize.
 */
function normalizeScore(rawScore: number, role: Role): number {
  // rawScore is from tiger's perspective: positive = tiger advantage
  const perspectiveScore = role === 'tiger' ? rawScore : -rawScore;
  // Clamp to [-TERMINAL_WIN, +TERMINAL_WIN] and normalize to [0, 1]
  const clamped = Math.max(-TERMINAL_WIN, Math.min(TERMINAL_WIN, perspectiveScore));
  return (clamped + TERMINAL_WIN) / (2 * TERMINAL_WIN);
}

// ─── MCTS Search ────────────────────────────────────────────────────────────

/**
 * Run MCTS search from the given state.
 *
 * @param state - Current game state
 * @param maxSims - Maximum number of simulations
 * @param timeBudgetMs - Time budget in milliseconds
 * @param role - The role (tiger/goat) that the AI is playing
 * @returns The best move found
 */
export function mctsSearch(
  state: GameState,
  maxSims: number,
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

  const root = createNode(state, null, null);
  const deadline = performance.now() + timeBudgetMs;
  let simulations = 0;

  while (simulations < maxSims) {
    // Check time budget every 100 iterations
    if (simulations % 100 === 0 && simulations > 0) {
      if (performance.now() >= deadline) break;
    }

    // 1. SELECTION: Walk tree to a node with untried moves
    let node = root;
    while (node.untriedMoves.length === 0 && node.children.length > 0) {
      node = selectChild(node);
    }

    // 2. EXPANSION: Add a child for one untried move
    if (node.untriedMoves.length > 0) {
      const moveIdx = Math.floor(Math.random() * node.untriedMoves.length);
      const move = node.untriedMoves[moveIdx];
      node.untriedMoves.splice(moveIdx, 1);

      const result = applyMove(node.state, move);
      if (result.error) {
        // Skip invalid moves (shouldn't happen with getLegalMoves)
        simulations++;
        continue;
      }

      const child = createNode(result.state, move, node);
      node.children.push(child);
      node = child;
    }

    // 3. ROLLOUT: Simulate from the expanded node
    const score = rollout(node.state, role);

    // 4. BACKPROPAGATION: Update values up the tree
    let current: MCTSNode | null = node;
    while (current !== null) {
      current.visits++;
      current.value += score;
      current = current.parent;
    }

    simulations++;
  }

  // Select best move: child with most visits
  if (root.children.length === 0) {
    // Fallback: no children expanded (shouldn't happen normally)
    return legalMoves[0].move;
  }

  let bestChild = root.children[0];
  for (const child of root.children) {
    if (child.visits > bestChild.visits) {
      bestChild = child;
    }
  }

  return bestChild.move!;
}
