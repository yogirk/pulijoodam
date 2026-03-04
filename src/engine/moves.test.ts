import { createGame } from './state';
import { getLegalMoves, applyMove } from './moves';
import type { GameState } from './types';

/**
 * Helper: advance game state to movement phase by placing all 15 goats.
 * Interleaves tiger moves between goat placements; picks safe empty nodes
 * dynamically to avoid conflicts with tiger positions.
 */
function reachMovementPhase(): GameState {
  let s = createGame();
  let goatsPlaced = 0;
  let nodeId = 0;
  while (goatsPlaced < 15 && nodeId < 23) {
    if (s.board[nodeId] === null) {
      const r = applyMove(s, { type: 'PLACE', to: nodeId });
      if (!r.error) {
        s = r.state;
        goatsPlaced++;
        // Tiger's turn: make any valid move
        while (s.currentTurn === 'tiger' && s.phase === 'placement') {
          const moves = getLegalMoves(s);
          const moveMoves = moves.filter(m => m.move.type === 'MOVE' || m.move.type === 'CAPTURE');
          if (moveMoves.length === 0) break;
          s = applyMove(s, moveMoves[0].move).state;
        }
        if (s.phase === 'movement') break;
      }
    }
    nodeId++;
  }
  return s;
}

// ENG-03: Move generation
describe('move generation', () => {
  it('placement phase: goat can place on any empty node (20 empty nodes)', () => {
    const state = createGame();
    const moves = getLegalMoves(state);
    expect(moves.every(m => m.move.type === 'PLACE')).toBe(true);
    // 23 nodes - 3 tigers = 20 empty
    expect(moves).toHaveLength(20);
  });

  it('placement phase: goat cannot move pieces already on board', () => {
    const state = createGame();
    const moves = getLegalMoves(state);
    expect(moves.every(m => m.move.type !== 'MOVE')).toBe(true);
  });

  it('placement phase: tiger can move to adjacent empty node', () => {
    // After goat places, it's tiger's turn
    const state1 = applyMove(createGame(), { type: 'PLACE', to: 1 }).state;
    expect(state1.currentTurn).toBe('tiger');
    const tigerMoves = getLegalMoves(state1);
    // Should include MOVE moves (tigers can move to adjacent empty nodes)
    const moveMoves = tigerMoves.filter(m => m.move.type === 'MOVE');
    expect(moveMoves.length).toBeGreaterThan(0);
  });

  it('movement phase: goat can move to adjacent empty node', () => {
    let s = reachMovementPhase();
    expect(s.phase).toBe('movement');
    // After 15th goat placed, it's tiger's turn. Make tiger move first.
    if (s.currentTurn === 'tiger') {
      const tigerMoves = getLegalMoves(s);
      s = applyMove(s, tigerMoves[0].move).state;
    }
    expect(s.currentTurn).toBe('goat');
    const goatMoves = getLegalMoves(s);
    const moveMoves = goatMoves.filter(m => m.move.type === 'MOVE');
    expect(moveMoves.length).toBeGreaterThan(0);
  });

  it('movement phase: goat cannot place from pool', () => {
    const s = reachMovementPhase();
    expect(s.phase).toBe('movement');
    const goatMoves = getLegalMoves(s);
    expect(goatMoves.every(m => m.move.type !== 'PLACE')).toBe(true);
  });

  it('movement phase: tiger can move or capture', () => {
    let s = reachMovementPhase();
    // After 15th goat placed it's tiger's turn — verify tiger has moves
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
    const state = createGame(); // goat's turn, placement phase
    // Try to MOVE (slide) a goat piece — but there are no goats on board yet
    // Place a goat first, then try to move it on the NEXT goat turn
    const s1 = applyMove(state, { type: 'PLACE', to: 4 }).state; // goat placed at 4
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state; // tiger moves
    // Now it's goat turn in placement phase, try to MOVE goat at 4
    const result = applyMove(s2, { type: 'MOVE', from: 4, to: 5 });
    expect(result.error).toBeDefined();
    expect(result.state).toBe(s2); // state unchanged
  });

  it('applyMove returns error when piece moves to occupied node', () => {
    const state = createGame(); // tigers at 0,6,7
    // Try to move tiger to an occupied node — tigers at 0,6,7; 6 and 7 are adjacent
    const s1 = applyMove(state, { type: 'PLACE', to: 1 }).state; // goat's turn → place goat
    const result = applyMove(s1, { type: 'MOVE', from: 6, to: 7 }); // tiger at 6 → 7 (occupied)
    expect(result.error).toBeDefined();
  });

  it('applyMove returns error when capture landing is occupied', () => {
    // Set up: tiger at 4, goat at 5, tiger at 6 — attempt jump 4→5→6 where 6 is occupied
    const state = createGame();
    // Get to movement phase with specific setup
    // Place goat at 5 (tiger turn: move tiger from 0 to adjacent)
    // Place goat at 4 first (safe node, not blocking jump paths)
    const s2 = applyMove(state, { type: 'PLACE', to: 4 }).state; // goat at 4, tiger's turn
    // Now place goat at 5 on next goat turn; first tiger must move
    const tigerMove = getLegalMoves(s2).find(m => m.move.type === 'MOVE');
    const s3 = applyMove(s2, tigerMove!.move).state; // tiger moves
    const s4 = applyMove(s3, { type: 'PLACE', to: 5 }).state; // goat at 5, tiger's turn
    // Tiger at 7.adj=[2,6,8,12]. Goat at 5. JUMP_MAP['7,6'] needs to be checked
    // Actually let's try: tiger at node from which there's a goat adjacent and occupied landing
    // Node 7 adj=[2,6,8,12]. Goat at 6. Jump 7→6→5 (if 5 is occupied):
    // 5 is now occupied by a goat. Place goat at 5 — wait it's already there from s4
    // So jump tiger from 7 over goat at 6 to landing 5 (occupied): should error
    const result = applyMove(s4, { type: 'CAPTURE', from: 7, to: 5, over: 6 });
    expect(result.error).toBeDefined();
  });

  it('applyMove returns error for non-adjacent move without capture', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 1 }).state;
    // Tiger at 0 tries to move to node 4 (not adjacent: 0.adj=[1,2,3])
    const result = applyMove(s1, { type: 'MOVE', from: 0, to: 4 });
    expect(result.error).toBeDefined();
  });

  it('applyMove returns error when wrong player moves', () => {
    const state = createGame(); // goat's turn
    // Tiger tries to move when it's goat's turn
    const result = applyMove(state, { type: 'MOVE', from: 0, to: 1 });
    expect(result.error).toBeDefined();
  });
});

// ENG-05: Capture mechanics
describe('capture mechanics', () => {
  it('tiger captures goat by jumping over to empty landing node', () => {
    const state = createGame();
    // Place goat at node 1 (adjacent to tiger at 0; jump 0→1→2 needs 2 empty)
    // 0.adj=[1,2,3], 1.adj=[0,2,6]. JUMP_MAP['0,1'] should be 2 (if collinear)
    // 0(300,50)→1(200,150) direction (-100,100). Candidate: (100,250)=? No node there
    // So no jump 0→1. Try node 2: 0→2, direction (0,100), candidate (300,250)=6, 6∉2.adj → no jump
    // Try tiger at 6: 6.adj=[1,5,7,11]. Goat at 5. JUMP_MAP['6,5']: 5(200,250)→6(300,250) direction
    // Wait, tiger is at 6, goat at 5. From 6(300,250)→5(200,250) direction (-100,0), candidate (100,250)=4. 4∈5.adj=[4,6,10] ✓
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state; // goat at 5
    const s2 = applyMove(s1, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(s2.board[5]).toBeNull(); // goat removed
    expect(s2.board[4]).toBe('tiger'); // tiger landed
    expect(s2.board[6]).toBeNull(); // tiger left
  });

  it('capture removes goat from board and increments goatsCaptured', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state;
    const s2 = applyMove(s1, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(s2.goatsCaptured).toBe(1);
    expect(s2.board[5]).toBeNull();
  });

  it('chain-hop: after capture, if further captures available, chainJumpInProgress is set', () => {
    // Set up so after tiger captures, another capture is available
    // Tiger at 6, goat at 5, goat at 14(for chain). JUMP_MAP['4,9']=14 (vertical jump)
    // Actually need: after landing at 4, can tiger capture from 4?
    // 4.adj=[5,9]. If goat at 9 and landing 14 empty: 4→9→14
    const state = createGame();
    // Place goat at 5 (first capture target)
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state; // goat at 5, tiger turn
    // Tiger moves (doesn't capture yet)
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state; // tiger 0→2
    // Place goat at 9 (second capture target for chain)
    const s3 = applyMove(s2, { type: 'PLACE', to: 9 }).state; // goat at 9, tiger turn
    // Tiger moves again
    const s4 = applyMove(s3, { type: 'MOVE', from: 2, to: 0 }).state; // tiger 2→0
    // Goat places somewhere safe
    const s5 = applyMove(s4, { type: 'PLACE', to: 3 }).state; // tiger turn
    // Now tiger at 6 captures goat at 5, lands at 4. From 4, goat at 9, land at 14 (empty)
    const captureResult = applyMove(s5, { type: 'CAPTURE', from: 6, over: 5, to: 4 });
    expect(captureResult.error).toBeUndefined();
    expect(captureResult.state.chainJumpInProgress).toBe(4);
  });

  it('chain-hop: tiger can continue jumping in same turn', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state;
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    const s3 = applyMove(s2, { type: 'PLACE', to: 9 }).state;
    const s4 = applyMove(s3, { type: 'MOVE', from: 2, to: 0 }).state;
    const s5 = applyMove(s4, { type: 'PLACE', to: 3 }).state;
    // Tiger 6→5→4 (first capture)
    const s6 = applyMove(s5, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(s6.chainJumpInProgress).toBe(4);
    // Continue chain: tiger 4→9→14 (second capture)
    const s7 = applyMove(s6, { type: 'CAPTURE', from: 4, over: 9, to: 14 }).state;
    expect(s7.board[14]).toBe('tiger');
    expect(s7.goatsCaptured).toBe(2);
  });

  it('chain-hop: chain ends when no further captures available', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state;
    // Tiger captures goat at 5 (no chain possible after)
    // Need to ensure no further captures from landing at 4
    // 4.adj=[5,9]. After capture, 5 is empty. 9 is empty. So no chain.
    const s2 = applyMove(s1, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(s2.chainJumpInProgress).toBeNull();
    expect(s2.currentTurn).toBe('goat'); // turn switches
  });

  it('chain-hop: player can end chain voluntarily', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state;
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    const s3 = applyMove(s2, { type: 'PLACE', to: 9 }).state;
    const s4 = applyMove(s3, { type: 'MOVE', from: 2, to: 0 }).state;
    const s5 = applyMove(s4, { type: 'PLACE', to: 3 }).state;
    const s6 = applyMove(s5, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(s6.chainJumpInProgress).toBe(4);
    // End chain voluntarily
    const s7 = applyMove(s6, { type: 'END_CHAIN' }).state;
    expect(s7.chainJumpInProgress).toBeNull();
    expect(s7.currentTurn).toBe('goat');
  });

  it('goat cannot capture', () => {
    const state = createGame();
    // Place a goat at node 1 (adjacent to tiger at 0)
    const s1 = applyMove(state, { type: 'PLACE', to: 1 }).state;
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    // Now it's goat's turn, try to have goat capture (should fail)
    // In movement phase: need to get there
    // Just test that CAPTURE move from goat is rejected
    const result = applyMove(s2, { type: 'CAPTURE', from: 1, over: 2, to: 3 });
    expect(result.error).toBeDefined();
  });

  it('tiger cannot jump over another tiger', () => {
    // Tigers at 0, 6, 7. Tiger at 6.adj=[1,5,7,11]. Tiger at 7.
    // Try to jump tiger from 6 over 7: JUMP_MAP['6,7'] = 8 (if valid)
    // 6(300,250)→7(400,250) direction (100,0), candidate (500,250)=8. 8∈7.adj=[2,6,8,12] ✓
    // So JUMP_MAP['6,7']=8. But 7 is a tiger, not a goat → should fail
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 1 }).state; // goat's turn, place goat
    const result = applyMove(s1, { type: 'CAPTURE', from: 6, over: 7, to: 8 });
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
    // Advance to 14 goats placed, then do one more placement
    let s = createGame();
    let placed = 0;
    let nodeId = 0;
    while (placed < 14 && nodeId < 23) {
      if (s.board[nodeId] === null) {
        const r = applyMove(s, { type: 'PLACE', to: nodeId });
        if (!r.error) {
          s = r.state;
          placed++;
          while (s.currentTurn === 'tiger' && s.phase === 'placement') {
            const moves = getLegalMoves(s).filter(m => m.move.type === 'MOVE' || m.move.type === 'CAPTURE');
            if (moves.length === 0) break;
            s = applyMove(s, moves[0].move).state;
          }
        }
      }
      nodeId++;
    }
    // Find an empty node for the 15th goat
    const lastNode = s.board.findIndex(p => p === null);
    expect(lastNode).toBeGreaterThanOrEqual(0);
    const result = applyMove(s, { type: 'PLACE', to: lastNode });
    expect(result.error).toBeUndefined();
    const phaseChanged = result.events.some(e => e.type === 'PHASE_CHANGED');
    expect(phaseChanged).toBe(true);
  });

  it('goats can move in movement phase', () => {
    const state = reachMovementPhase();
    const goatMoves = getLegalMoves(state);
    expect(goatMoves.some(m => m.move.type === 'MOVE')).toBe(true);
  });
});
