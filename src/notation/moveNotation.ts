// Move notation for Pulijoodam: algebraic representation of game moves.
// PLACE: "c2"  |  MOVE: "c3-d3"  |  CAPTURE: "c1×c5"  |  END_CHAIN: "."

import type { Move, GameState } from '../engine/types';
import { NODES } from '../engine/board';
import { nodeToName, nameToNode } from './nodeNames';

const CAPTURE_SYMBOL = '\u00D7'; // × (multiplication sign)

/** Convert an engine Move to its algebraic notation string. */
export function moveToAlgebraic(move: Move): string {
  switch (move.type) {
    case 'PLACE':
      return nodeToName(move.to);
    case 'MOVE':
      return `${nodeToName(move.from)}-${nodeToName(move.to)}`;
    case 'CAPTURE':
      return `${nodeToName(move.from)}${CAPTURE_SYMBOL}${nodeToName(move.to)}`;
    case 'END_CHAIN':
      return '.';
  }
}

/**
 * Find the node that lies between `from` and `to` on the board graph.
 * This is the node that a tiger jumps over during a capture.
 * It must be adjacent to both `from` and `to`.
 */
function findMiddleNode(from: number, to: number): number {
  const fromAdj = NODES[from].adj;
  const toAdj = NODES[to].adj;
  for (const n of fromAdj) {
    if (toAdj.includes(n)) {
      return n;
    }
  }
  throw new Error(`No middle node found between ${from} and ${to}`);
}

/**
 * Parse an algebraic notation string back to an engine Move.
 * For CAPTURE moves, the `over` node is derived from the board topology.
 * The gameState is used to disambiguate PLACE vs MOVE for single-node notations
 * (PLACE only happens during placement phase).
 */
export function algebraicToMove(notation: string, gameState: GameState): Move {
  const trimmed = notation.trim();

  if (trimmed === '.') {
    return { type: 'END_CHAIN' };
  }

  // CAPTURE: "from×to"
  if (trimmed.includes(CAPTURE_SYMBOL)) {
    const parts = trimmed.split(CAPTURE_SYMBOL);
    const from = nameToNode(parts[0]);
    const to = nameToNode(parts[parts.length - 1]);
    const over = findMiddleNode(from, to);
    return { type: 'CAPTURE', from, over, to };
  }

  // MOVE: "from-to"
  if (trimmed.includes('-')) {
    const [fromStr, toStr] = trimmed.split('-');
    return { type: 'MOVE', from: nameToNode(fromStr), to: nameToNode(toStr) };
  }

  // PLACE: just a node name (single destination, during placement phase)
  return { type: 'PLACE', to: nameToNode(trimmed) };
}

/**
 * Format a full move list into numbered pairs.
 * Goat moves are on the left, tiger moves on the right.
 * Chain captures (consecutive CAPTURE moves from the same player) are merged:
 * e.g., CAPTURE c1→c5 + CAPTURE c5→e5 becomes "c1×c5×e5".
 * An END_CHAIN appends "." to the preceding capture sequence.
 */
export function movesToAlgebraic(moves: Move[]): string {
  // First, build a sequence of "turn tokens" — each token is the notation for
  // one player's action in a single turn. Chain captures are merged.
  const tokens: string[] = [];
  let i = 0;

  while (i < moves.length) {
    const move = moves[i];

    if (move.type === 'CAPTURE') {
      // Merge consecutive captures into a chain
      let chain = nodeToName(move.from) + CAPTURE_SYMBOL + nodeToName(move.to);
      let lastTo = move.to;
      i++;

      while (i < moves.length) {
        const next = moves[i];
        if (next.type === 'CAPTURE' && next.from === lastTo) {
          chain += CAPTURE_SYMBOL + nodeToName(next.to);
          lastTo = next.to;
          i++;
        } else if (next.type === 'END_CHAIN') {
          chain += '.';
          i++;
          break;
        } else {
          break;
        }
      }

      tokens.push(chain);
    } else if (move.type === 'END_CHAIN') {
      // Standalone END_CHAIN (shouldn't normally occur without preceding capture,
      // but handle gracefully)
      if (tokens.length > 0) {
        tokens[tokens.length - 1] += '.';
      }
      i++;
    } else {
      tokens.push(moveToAlgebraic(move));
      i++;
    }
  }

  // Pair tokens: odd-indexed tokens are goat (left), even-indexed are tiger (right).
  // In Pulijoodam, goat always moves first.
  const lines: string[] = [];
  for (let t = 0; t < tokens.length; t += 2) {
    const moveNum = Math.floor(t / 2) + 1;
    const goatMove = tokens[t];
    const tigerMove = t + 1 < tokens.length ? ` ${tokens[t + 1]}` : '';
    lines.push(`${moveNum}. ${goatMove}${tigerMove}`);
  }

  return lines.join('\n');
}
