import { describe, it, expect } from 'vitest';
import { NODES } from '../../engine/board';
import type { Move, GameState, Piece, GameConfig } from '../../engine/types';
import {
  NODE_TO_NAME,
  NAME_TO_NODE,
  nodeToName,
  nameToNode,
  moveToAlgebraic,
  algebraicToMove,
  movesToAlgebraic,
  gameStateToPositionString,
  positionStringToPartial,
} from '../index';

// Helper to create a minimal GameState for testing algebraicToMove
function makeState(overrides: Partial<GameState> = {}): GameState {
  const config: GameConfig = { andhra: false };
  return {
    board: new Array(23).fill(null),
    phase: 'placement',
    currentTurn: 'goat',
    tigersInPool: 0,
    goatsInPool: 15,
    goatsCaptured: 0,
    moveHistory: [],
    stateHashes: {},
    capturelessMoves: 0,
    chainJumpInProgress: null,
    config,
    ...overrides,
  };
}

// ─── Node name mapping ───────────────────────────────────────────────────

describe('nodeNames', () => {
  it('maps all 23 nodes to unique names', () => {
    expect(NODE_TO_NAME).toHaveLength(23);
    const unique = new Set(NODE_TO_NAME);
    expect(unique.size).toBe(23);
  });

  it('every name maps back to the correct ID', () => {
    for (let id = 0; id < 23; id++) {
      const name = NODE_TO_NAME[id];
      expect(NAME_TO_NODE[name]).toBe(id);
    }
  });

  it('round-trips: id → name → id', () => {
    for (let id = 0; id < 23; id++) {
      expect(nameToNode(nodeToName(id))).toBe(id);
    }
  });

  it('round-trips: name → id → name', () => {
    for (const name of Object.keys(NAME_TO_NODE)) {
      expect(nodeToName(nameToNode(name))).toBe(name);
    }
  });

  it('names follow row-letter + column-number pattern', () => {
    for (const name of Object.keys(NAME_TO_NODE)) {
      expect(name).toMatch(/^[a-z]\d+$/);
    }
  });

  it('apex node (id 0, lowest Y) gets row letter "a"', () => {
    // Node 0 has the smallest Y coordinate (30), so it should be in row "a"
    expect(NODE_TO_NAME[0]).toMatch(/^a/);
  });

  it('nodes within same Y row get consecutive column numbers', () => {
    // Nodes 1-6 are all at y=110 (row b), sorted by X
    // Node 1 is leftmost (x=105), so should be b1
    expect(NODE_TO_NAME[1]).toBe('b1');
    // Node 6 is rightmost (x=495), 6th node, so b6
    expect(NODE_TO_NAME[6]).toBe('b6');
  });

  it('bottom row nodes get the last row letter', () => {
    // Nodes 19-22 at y=350 (bottom), should be row "e" (5th row, 0-indexed = 4 → 'e')
    expect(NODE_TO_NAME[19]).toMatch(/^e/);
    expect(NODE_TO_NAME[22]).toMatch(/^e/);
  });

  it('throws on invalid node ID', () => {
    expect(() => nodeToName(-1)).toThrow('Invalid node ID');
    expect(() => nodeToName(23)).toThrow('Invalid node ID');
    expect(() => nodeToName(1.5)).toThrow('Invalid node ID');
  });

  it('throws on invalid node name', () => {
    expect(() => nameToNode('z9')).toThrow('Invalid node name');
    expect(() => nameToNode('')).toThrow('Invalid node name');
    expect(() => nameToNode('a0')).toThrow('Invalid node name');
  });
});

// ─── Move notation ───────────────────────────────────────────────────────

describe('moveToAlgebraic', () => {
  it('encodes PLACE move', () => {
    const move: Move = { type: 'PLACE', to: 8 };
    const notation = moveToAlgebraic(move);
    // Node 8 is at y=190, sorted position within that row
    expect(notation).toBe(nodeToName(8));
  });

  it('encodes MOVE', () => {
    const move: Move = { type: 'MOVE', from: 9, to: 10 };
    const notation = moveToAlgebraic(move);
    expect(notation).toBe(`${nodeToName(9)}-${nodeToName(10)}`);
  });

  it('encodes CAPTURE with × symbol', () => {
    const move: Move = { type: 'CAPTURE', from: 1, over: 2, to: 3 };
    const notation = moveToAlgebraic(move);
    expect(notation).toBe(`${nodeToName(1)}\u00D7${nodeToName(3)}`);
    expect(notation).toContain('\u00D7');
  });

  it('encodes END_CHAIN as "."', () => {
    const move: Move = { type: 'END_CHAIN' };
    expect(moveToAlgebraic(move)).toBe('.');
  });
});

describe('algebraicToMove', () => {
  const state = makeState();

  it('parses PLACE notation', () => {
    const name = nodeToName(5);
    const move = algebraicToMove(name, state);
    expect(move).toEqual({ type: 'PLACE', to: 5 });
  });

  it('parses MOVE notation', () => {
    const notation = `${nodeToName(9)}-${nodeToName(10)}`;
    const move = algebraicToMove(notation, state);
    expect(move).toEqual({ type: 'MOVE', from: 9, to: 10 });
  });

  it('parses CAPTURE notation and derives over node', () => {
    // From LINES: [1,2,3,4,5,6] — jumping from 1 over 2 lands on 3
    const notation = `${nodeToName(1)}\u00D7${nodeToName(3)}`;
    const move = algebraicToMove(notation, state);
    expect(move).toEqual({ type: 'CAPTURE', from: 1, over: 2, to: 3 });
  });

  it('parses END_CHAIN', () => {
    const move = algebraicToMove('.', state);
    expect(move).toEqual({ type: 'END_CHAIN' });
  });

  it('round-trips PLACE', () => {
    const original: Move = { type: 'PLACE', to: 14 };
    const notation = moveToAlgebraic(original);
    const parsed = algebraicToMove(notation, state);
    expect(parsed).toEqual(original);
  });

  it('round-trips MOVE', () => {
    const original: Move = { type: 'MOVE', from: 15, to: 16 };
    const notation = moveToAlgebraic(original);
    const parsed = algebraicToMove(notation, state);
    expect(parsed).toEqual(original);
  });

  it('round-trips CAPTURE', () => {
    // Slant S2: [0,3,9,15,20] — jumping from 0 over 3 lands on 9
    const original: Move = { type: 'CAPTURE', from: 0, over: 3, to: 9 };
    const notation = moveToAlgebraic(original);
    const parsed = algebraicToMove(notation, state);
    expect(parsed).toEqual(original);
  });

  it('round-trips END_CHAIN', () => {
    const original: Move = { type: 'END_CHAIN' };
    const notation = moveToAlgebraic(original);
    const parsed = algebraicToMove(notation, state);
    expect(parsed).toEqual(original);
  });
});

// ─── Move list formatting ────────────────────────────────────────────────

describe('movesToAlgebraic', () => {
  it('formats simple goat-tiger pairs', () => {
    const moves: Move[] = [
      { type: 'PLACE', to: 8 },
      { type: 'MOVE', from: 3, to: 9 },
      { type: 'PLACE', to: 10 },
      { type: 'MOVE', from: 0, to: 4 },
    ];
    const result = movesToAlgebraic(moves);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^1\. /);
    expect(lines[1]).toMatch(/^2\. /);
  });

  it('handles odd number of tokens (last goat move unpaired)', () => {
    const moves: Move[] = [
      { type: 'PLACE', to: 8 },
      { type: 'MOVE', from: 3, to: 9 },
      { type: 'PLACE', to: 10 },
    ];
    const result = movesToAlgebraic(moves);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    // Last line should have goat move only
    expect(lines[1]).toMatch(/^2\. \S+$/);
  });

  it('merges consecutive captures into chain notation', () => {
    // Chain: tiger at 1 captures over 2 to 3, then from 3 captures over 4 to 5
    const moves: Move[] = [
      { type: 'PLACE', to: 8 }, // goat move
      { type: 'CAPTURE', from: 1, over: 2, to: 3 },
      { type: 'CAPTURE', from: 3, over: 4, to: 5 },
    ];
    const result = movesToAlgebraic(moves);
    const n1 = nodeToName(1);
    const n3 = nodeToName(3);
    const n5 = nodeToName(5);
    // Tiger's chain should be merged: b1×b3×b5
    expect(result).toContain(`${n1}\u00D7${n3}\u00D7${n5}`);
  });

  it('appends "." for END_CHAIN after captures', () => {
    const moves: Move[] = [
      { type: 'PLACE', to: 8 },
      { type: 'CAPTURE', from: 1, over: 2, to: 3 },
      { type: 'END_CHAIN' },
    ];
    const result = movesToAlgebraic(moves);
    const n1 = nodeToName(1);
    const n3 = nodeToName(3);
    expect(result).toContain(`${n1}\u00D7${n3}.`);
  });

  it('handles chain capture + END_CHAIN merged', () => {
    const moves: Move[] = [
      { type: 'PLACE', to: 8 },
      { type: 'CAPTURE', from: 1, over: 2, to: 3 },
      { type: 'CAPTURE', from: 3, over: 4, to: 5 },
      { type: 'END_CHAIN' },
    ];
    const result = movesToAlgebraic(moves);
    const n1 = nodeToName(1);
    const n3 = nodeToName(3);
    const n5 = nodeToName(5);
    expect(result).toContain(`${n1}\u00D7${n3}\u00D7${n5}.`);
  });

  it('returns empty string for no moves', () => {
    expect(movesToAlgebraic([])).toBe('');
  });
});

// ─── Position string ─────────────────────────────────────────────────────

describe('positionString', () => {
  it('encodes an empty board with goats in pool', () => {
    const state = makeState();
    const pos = gameStateToPositionString(state);
    // Should have slashes separating rows, and metadata
    expect(pos).toMatch(/g 15 0 p$/);
    // All dashes (empty board)
    const rowsPart = pos.split(' ')[0];
    expect(rowsPart.replace(/\//g, '')).toMatch(/^-+$/);
    // Total dashes should be 23
    expect(rowsPart.replace(/\//g, '').length).toBe(23);
  });

  it('encodes tigers on the board', () => {
    const board: (Piece | null)[] = new Array(23).fill(null);
    board[0] = 'tiger';
    board[3] = 'tiger';
    board[4] = 'tiger';
    const state = makeState({ board });
    const pos = gameStateToPositionString(state);
    expect(pos).toContain('T');
    // Count Ts
    const tCount = (pos.match(/T/g) || []).length;
    expect(tCount).toBe(3);
  });

  it('encodes goats on the board', () => {
    const board: (Piece | null)[] = new Array(23).fill(null);
    board[8] = 'goat';
    board[15] = 'goat';
    const state = makeState({ board, goatsInPool: 13 });
    const pos = gameStateToPositionString(state);
    const gCount = (pos.match(/G/g) || []).length;
    expect(gCount).toBe(2);
    expect(pos).toContain('13');
  });

  it('round-trips: encode then decode preserves board state', () => {
    const board: (Piece | null)[] = new Array(23).fill(null);
    board[0] = 'tiger';
    board[3] = 'tiger';
    board[4] = 'tiger';
    board[8] = 'goat';
    board[10] = 'goat';
    board[15] = 'goat';

    const state = makeState({
      board,
      currentTurn: 'tiger',
      goatsInPool: 12,
      goatsCaptured: 0,
      phase: 'placement',
    });

    const pos = gameStateToPositionString(state);
    const partial = positionStringToPartial(pos);

    expect(partial.board).toEqual(state.board);
    expect(partial.currentTurn).toBe('tiger');
    expect(partial.goatsInPool).toBe(12);
    expect(partial.goatsCaptured).toBe(0);
    expect(partial.phase).toBe('placement');
  });

  it('encodes movement phase correctly', () => {
    const state = makeState({ phase: 'movement', goatsInPool: 0, currentTurn: 'tiger' });
    const pos = gameStateToPositionString(state);
    expect(pos).toMatch(/t 0 0 m$/);
  });

  it('round-trips with captures', () => {
    const board: (Piece | null)[] = new Array(23).fill(null);
    board[0] = 'tiger';
    board[3] = 'tiger';
    board[4] = 'tiger';

    const state = makeState({
      board,
      currentTurn: 'goat',
      goatsInPool: 10,
      goatsCaptured: 5,
      phase: 'placement',
    });

    const pos = gameStateToPositionString(state);
    const partial = positionStringToPartial(pos);

    expect(partial.goatsCaptured).toBe(5);
    expect(partial.goatsInPool).toBe(10);
  });

  it('throws on invalid position string format', () => {
    expect(() => positionStringToPartial('invalid')).toThrow();
    expect(() => positionStringToPartial('-/- g 15 0 p')).toThrow();
  });

  it('handles all nodes occupied', () => {
    const board: (Piece | null)[] = new Array(23).fill('goat' as Piece);
    board[0] = 'tiger';
    board[3] = 'tiger';
    board[4] = 'tiger';

    const state = makeState({
      board,
      goatsInPool: 0,
      goatsCaptured: 0,
      phase: 'movement',
      currentTurn: 'goat',
    });

    const pos = gameStateToPositionString(state);
    const partial = positionStringToPartial(pos);
    expect(partial.board).toEqual(state.board);
  });
});
