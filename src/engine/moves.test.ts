import { createGame } from './state';
import { getLegalMoves, applyMove } from './moves';
import type { GameState } from './types';

/**
 * Helper: advance game state to movement phase.
 * Goat places, then tiger moves (select first legal move each turn).
 */
function reachMovementPhase(): GameState {
  let s = createGame();
  while (s.phase === 'placement') {
    const moves = getLegalMoves(s);
    if (moves.length === 0) break;
    const r = applyMove(s, moves[0].move);
    if (r.error) break;
    s = r.state;
  }
  return s;
}

/**
 * Helper: create a state with all 3 tigers and some goats placed.
 * Tigers at 0, 10, 22. Goats at specified positions.
 */
function stateWithPieces(
  goatNodes: number[],
  overrides: Partial<GameState> = {}
): GameState {
  const board = Array(23).fill(null) as GameState['board'];
  board[0] = 'tiger';
  board[10] = 'tiger';
  board[22] = 'tiger';
  for (const n of goatNodes) board[n] = 'goat';
  return {
    ...createGame(),
    board,
    tigersInPool: 0,
    goatsInPool: 15 - goatNodes.length,
    currentTurn: 'tiger',
    ...overrides,
  };
}

// ENG-03: Move generation
describe('move generation', () => {
  it('placement phase: goat can place on any empty node (20 empty)', () => {
    const state = createGame();
    const moves = getLegalMoves(state);
    expect(moves.every(m => m.move.type === 'PLACE')).toBe(true);
    expect(moves).toHaveLength(20); // 23 - 3 tigers pre-placed
  });

  it('placement phase: goat cannot move pieces already on board', () => {
    const state = createGame();
    const moves = getLegalMoves(state);
    expect(moves.every(m => m.move.type !== 'MOVE')).toBe(true);
  });

  it('placement phase: tiger can move from Turn 1', () => {
    const s1 = applyMove(createGame(), { type: 'PLACE', to: 1 }).state;
    expect(s1.currentTurn).toBe('tiger');
    const tigerMoves = getLegalMoves(s1);
    expect(tigerMoves.some(m => m.move.type === 'MOVE')).toBe(true);
    expect(tigerMoves.every(m => m.move.type !== 'PLACE')).toBe(true);
  });

  it('placement phase: tiger can capture during placement', () => {
    // Tiger at 0 (pre-placed), goat at 2. JUMP_MAP['0,2']=8
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 2 }).state; // goat at 2
    const tigerMoves = getLegalMoves(s1);
    const captures = tigerMoves.filter(m => m.move.type === 'CAPTURE');
    expect(captures.length).toBeGreaterThan(0);
  });

  it('placement phase: tiger moves/captures with all tigers on board', () => {
    // Place all 3 tigers and 3 goats, then check tiger moves on next tiger turn
    const s = stateWithPieces([1, 5, 19], { currentTurn: 'goat', goatsInPool: 12 });
    // Goat places
    const s2 = applyMove(s, { type: 'PLACE', to: 7 }).state;
    // Tiger's turn: should get MOVE/CAPTURE
    const moves = getLegalMoves(s2);
    expect(moves.some(m => m.move.type === 'MOVE')).toBe(true);
  });

  it('movement phase: goat can move to adjacent empty node', () => {
    let s = reachMovementPhase();
    expect(s.phase).toBe('movement');
    // Ensure it's goat's turn
    if (s.currentTurn === 'tiger') {
      const tigerMoves = getLegalMoves(s);
      s = applyMove(s, tigerMoves[0].move).state;
    }
    const goatMoves = getLegalMoves(s);
    const moveMoves = goatMoves.filter(m => m.move.type === 'MOVE');
    expect(moveMoves.length).toBeGreaterThan(0);
  });

  it('movement phase: goat cannot place from pool', () => {
    const s = reachMovementPhase();
    expect(s.phase).toBe('movement');
    const moves = getLegalMoves(s);
    expect(moves.every(m => m.move.type !== 'PLACE')).toBe(true);
  });

  it('movement phase: tiger can move or capture', () => {
    let s = reachMovementPhase();
    expect(s.phase).toBe('movement');
    if (s.currentTurn === 'goat') {
      const goatMoves = getLegalMoves(s);
      s = applyMove(s, goatMoves[0].move).state;
    }
    expect(s.currentTurn).toBe('tiger');
    const tigerMoves = getLegalMoves(s);
    expect(tigerMoves.some(m => m.move.type === 'MOVE')).toBe(true);
  });
});

// ENG-04: Move validation
describe('move validation', () => {
  it('applyMove returns error when goat tries to move during placement', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 1 }).state; // goat at 1
    // Tiger moves (e.g. tiger at 0 to node 2)
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    // Now goat's turn, placement phase: try to MOVE goat at 1
    const result = applyMove(s2, { type: 'MOVE', from: 1, to: 7 });
    expect(result.error).toBeDefined();
    expect(result.state).toBe(s2);
  });

  it('applyMove returns error when placing on occupied node (tiger)', () => {
    const s0 = createGame();
    // Try to place goat on node 0 which has a pre-placed tiger
    const result = applyMove(s0, { type: 'PLACE', to: 0 });
    expect(result.error).toBeDefined();
  });

  it('applyMove returns error for non-adjacent move', () => {
    // Tiger at 0, all tigers placed. 0.adj=[2,3,4,5], try to move to 1
    const s = stateWithPieces([19]);
    const result = applyMove(s, { type: 'MOVE', from: 0, to: 1 });
    expect(result.error).toBeDefined();
  });

  it('applyMove returns error when wrong player moves', () => {
    const state = createGame(); // goat's turn
    // Try tiger move on goat's turn
    const result = applyMove(state, { type: 'MOVE', from: 0, to: 2 });
    expect(result.error).toBeDefined();
  });

  it('applyMove returns error when capture landing is occupied', () => {
    // Tiger at 0, goat at 2, node 8 occupied. JUMP_MAP['0,2']=8
    const s = stateWithPieces([2, 8]); // goat at 2 (capture target) and 8 (blocks landing)
    const result = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.error).toBeDefined();
  });
});

// ENG-05: Capture mechanics
describe('capture mechanics', () => {
  it('tiger captures goat by jumping over to empty landing node', () => {
    // Tiger at 0, goat at 2. JUMP_MAP['0,2']=8
    const s = stateWithPieces([2]);
    const result = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.error).toBeUndefined();
    expect(result.state.board[2]).toBeNull();   // goat removed
    expect(result.state.board[8]).toBe('tiger'); // tiger landed
    expect(result.state.board[0]).toBeNull();   // tiger left
  });

  it('capture removes goat and increments goatsCaptured', () => {
    const s = stateWithPieces([2]);
    const result = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.state.goatsCaptured).toBe(1);
    expect(result.state.board[2]).toBeNull();
  });

  it('chain-hop: chainJumpInProgress set when further captures available', () => {
    // Tiger at 0, goat at 2 and 14. LINES: [0,2,8,14,19]
    // Capture 0→2→8, then from 8: goat at 14, landing 19 empty → chain
    const s = stateWithPieces([2, 14]);
    const result = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.error).toBeUndefined();
    expect(result.state.chainJumpInProgress).toBe(8);
  });

  it('chain-hop: tiger can continue jumping in same turn', () => {
    const s = stateWithPieces([2, 14]);
    const s1 = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 }).state;
    expect(s1.chainJumpInProgress).toBe(8);
    // Continue chain: 8→14→19
    const s2 = applyMove(s1, { type: 'CAPTURE', from: 8, over: 14, to: 19 }).state;
    expect(s2.board[19]).toBe('tiger');
    expect(s2.goatsCaptured).toBe(2);
  });

  it('chain-hop: chain ends when no further captures available', () => {
    // Tiger at 0, goat at 2 only. After capture 0→2→8, no more captures from 8
    const s = stateWithPieces([2]);
    const result = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.state.chainJumpInProgress).toBeNull();
    expect(result.state.currentTurn).toBe('goat');
  });

  it('chain-hop: player can end chain voluntarily', () => {
    const s = stateWithPieces([2, 14]);
    const s1 = applyMove(s, { type: 'CAPTURE', from: 0, over: 2, to: 8 }).state;
    expect(s1.chainJumpInProgress).toBe(8);
    const s2 = applyMove(s1, { type: 'END_CHAIN' }).state;
    expect(s2.chainJumpInProgress).toBeNull();
    expect(s2.currentTurn).toBe('goat');
  });

  it('goat cannot capture', () => {
    const s = stateWithPieces([2], { currentTurn: 'goat', phase: 'movement', goatsInPool: 0 });
    const result = applyMove(s, { type: 'CAPTURE', from: 2, over: 0, to: 8 });
    expect(result.error).toBeDefined();
  });

  it('tiger cannot jump over another tiger', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[1] = 'tiger';
    board[2] = 'tiger';
    board[22] = 'tiger';
    const s: GameState = {
      ...createGame(),
      board,
      tigersInPool: 0,
      currentTurn: 'tiger',
    };
    const result = applyMove(s, { type: 'CAPTURE', from: 1, over: 2, to: 3 });
    expect(result.error).toBeDefined();
  });
});

// ENG-06: Phase transition
describe('phase transition', () => {
  it('phase changes to movement after 15th goat is placed', () => {
    const state = reachMovementPhase();
    expect(state.phase).toBe('movement');
    expect(state.goatsInPool).toBe(0);
  });

  it('PHASE_CHANGED event emitted on transition', () => {
    let s = createGame();
    while (s.phase === 'placement') {
      const moves = getLegalMoves(s);
      if (moves.length === 0) break;
      const r = applyMove(s, moves[0].move);
      if (r.error) break;
      // Check for PHASE_CHANGED event on the move that transitions
      if (r.state.phase === 'movement') {
        expect(r.events.some(e => e.type === 'PHASE_CHANGED')).toBe(true);
        break;
      }
      s = r.state;
    }
  });

  it('goats can move in movement phase', () => {
    const state = reachMovementPhase();
    const moves = getLegalMoves(state);
    expect(moves.some(m => m.move.type === 'MOVE')).toBe(true);
  });
});
