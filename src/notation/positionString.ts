// Compact position string encoding for Pulijoodam game states.
// Format: rows/separated/by/slash activePlayer goatsInPool goatsCaptured phase
// T = tiger, G = goat, - = empty
// Rows are grouped by Y coordinate (matching the algebraic naming rows).

import type { Piece, Phase, Role, GameState } from '../engine/types';
import { NODES } from '../engine/board';

/** Compute row groupings from NODES, sorted by Y then X. */
function getRows(): number[][] {
  const rowMap = new Map<number, number[]>();
  for (const node of NODES) {
    const ids = rowMap.get(node.y) ?? [];
    ids.push(node.id);
    rowMap.set(node.y, ids);
  }

  const sortedYs = [...rowMap.keys()].sort((a, b) => a - b);
  return sortedYs.map(y => {
    const ids = rowMap.get(y)!;
    ids.sort((a, b) => NODES[a].x - NODES[b].x);
    return ids;
  });
}

const ROWS = getRows();

function pieceToChar(piece: Piece | null): string {
  if (piece === 'tiger') return 'T';
  if (piece === 'goat') return 'G';
  return '-';
}

function charToPiece(ch: string): Piece | null {
  if (ch === 'T') return 'tiger';
  if (ch === 'G') return 'goat';
  return null;
}

/**
 * Encode a GameState as a compact position string.
 * Example: "-/------/------/------/----  g 15 0 p"
 */
export function gameStateToPositionString(state: GameState): string {
  const rowStrings = ROWS.map(row =>
    row.map(id => pieceToChar(state.board[id])).join('')
  );

  const active = state.currentTurn === 'tiger' ? 't' : 'g';
  const phase = state.phase === 'placement' ? 'p' : 'm';

  return `${rowStrings.join('/')} ${active} ${state.goatsInPool} ${state.goatsCaptured} ${phase}`;
}

/**
 * Parse a position string back into partial game state fields.
 * Does not restore moveHistory, stateHashes, capturelessMoves, chainJumpInProgress, or config.
 */
export function positionStringToPartial(pos: string): {
  board: (Piece | null)[];
  currentTurn: Role;
  goatsInPool: number;
  goatsCaptured: number;
  phase: Phase;
} {
  const parts = pos.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid position string: expected 5 space-separated parts, got ${parts.length}`);
  }

  const [rowsPart, activePart, goatsInPoolPart, goatsCapturedPart, phasePart] = parts;
  const rowStrings = rowsPart.split('/');

  if (rowStrings.length !== ROWS.length) {
    throw new Error(
      `Invalid position string: expected ${ROWS.length} rows, got ${rowStrings.length}`
    );
  }

  const board: (Piece | null)[] = new Array(NODES.length).fill(null);

  for (let r = 0; r < ROWS.length; r++) {
    const row = ROWS[r];
    const chars = rowStrings[r];
    if (chars.length !== row.length) {
      throw new Error(
        `Invalid position string: row ${r} expected ${row.length} chars, got ${chars.length}`
      );
    }
    for (let c = 0; c < row.length; c++) {
      board[row[c]] = charToPiece(chars[c]);
    }
  }

  const currentTurn: Role = activePart === 't' ? 'tiger' : 'goat';
  const goatsInPool = parseInt(goatsInPoolPart, 10);
  const goatsCaptured = parseInt(goatsCapturedPart, 10);
  const phase: Phase = phasePart === 'p' ? 'placement' : 'movement';

  return { board, currentTurn, goatsInPool, goatsCaptured, phase };
}
