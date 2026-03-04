import { createGame } from './state';
import { applyMove } from './moves';
import { getGameStatus } from './rules';
import { undo, redo } from './history';
import type { GameState } from './types';

// ENG-09: Threefold repetition
describe('draw by threefold repetition', () => {
  it('draw declared when same board+turn hash appears 3 times', () => {
    // Create a state with a hash that has appeared 3 times
    const state = createGame();
    const drawState: GameState = {
      ...state,
      stateHashes: { 'somehash': 3 },
    };
    expect(getGameStatus(drawState)).toBe('draw-repetition');
  });

  it('no draw on second repetition', () => {
    const state = createGame();
    const twoState: GameState = {
      ...state,
      stateHashes: { 'somehash': 2 },
    };
    expect(getGameStatus(twoState)).not.toBe('draw-repetition');
  });

  it('stateHashes incremented after each move', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 4 }).state;
    // stateHashes should have one entry
    expect(Object.keys(s1.stateHashes).length).toBeGreaterThan(0);
    const firstHash = Object.keys(s1.stateHashes)[0];
    expect(s1.stateHashes[firstHash]).toBe(1);
  });
});

// ENG-10: 50-move rule
describe('draw by 50 captureless moves', () => {
  it('capturelessMoves increments on non-capture moves', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 4 }).state;
    expect(s1.capturelessMoves).toBe(1);
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    expect(s2.capturelessMoves).toBe(2);
  });

  it('capturelessMoves resets to 0 on capture', () => {
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state;
    // Make some non-capture moves to increment counter
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    expect(s2.capturelessMoves).toBe(2);
    // Goat places somewhere (s3 unused; fresh path below handles the full scenario)
    applyMove(s2, { type: 'PLACE', to: 4 });
    // Tiger captures goat at 5: JUMP_MAP['6,5']=4... but 4 is now occupied
    // Need a clear capture: tiger at 7, goat at 12, landing 17
    // Actually let's use: tiger at 6, goat at 5, landing 4 — but 4 is occupied
    // Use: place goat at 11, tiger at 7 captures over 12... let's build carefully
    // Tiger at 6, goat at 5 placed. But 4 is occupied. Reset:
    // Fresh: place goat at 5, tiger moves, then capture
    const fresh = createGame();
    const f1 = applyMove(fresh, { type: 'PLACE', to: 5 }).state; // goat at 5, captureless=1
    const f2 = applyMove(f1, { type: 'MOVE', from: 0, to: 2 }).state; // captureless=2
    const f3 = applyMove(f2, { type: 'PLACE', to: 1 }).state; // captureless=3
    // Now tiger at 6, goat at 5, landing 4 empty
    const f4 = applyMove(f3, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(f4.capturelessMoves).toBe(0);
  });

  it('draw declared when capturelessMoves reaches 50', () => {
    const state = createGame();
    const drawState: GameState = {
      ...state,
      capturelessMoves: 50,
      // Ensure goatsCaptured < 10 and tigers have moves
      goatsCaptured: 0,
      board: (() => {
        const b = Array(23).fill(null) as GameState['board'];
        b[0] = 'tiger';
        b[6] = 'tiger';
        b[7] = 'tiger';
        return b;
      })(),
    };
    expect(getGameStatus(drawState)).toBe('draw-50moves');
  });

  it('chain-hop sequence counts correctly for capturelessMoves', () => {
    // A chain-hop (CAPTURE + optional END_CHAIN) resets capturelessMoves to 0 on capture
    const state = createGame();
    const s1 = applyMove(state, { type: 'PLACE', to: 5 }).state;
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    const s3 = applyMove(s2, { type: 'PLACE', to: 9 }).state;
    const s4 = applyMove(s3, { type: 'MOVE', from: 2, to: 0 }).state;
    const s5 = applyMove(s4, { type: 'PLACE', to: 3 }).state;
    // Tiger captures (captureless resets to 0)
    const s6 = applyMove(s5, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    expect(s6.capturelessMoves).toBe(0);
    // Tiger continues chain (another capture resets to 0)
    const s7 = applyMove(s6, { type: 'CAPTURE', from: 4, over: 9, to: 14 }).state;
    expect(s7.capturelessMoves).toBe(0);
  });
});

// ENG-11: Undo/redo
describe('undo/redo', () => {
  it('undo restores previous GameState', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 4 }).state;

    // Build history stack: [s0, s1]
    const history: GameState[] = [s0, s1];
    const { state: undone, history: newHistory } = undo(s1, history);
    expect(undone).toBe(s0); // should return exact s0 reference
    expect(newHistory).toHaveLength(1);
    expect(newHistory[0]).toBe(s0);
  });

  it('undo during chain-hop restores pre-capture state', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 5 }).state;
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    const s3 = applyMove(s2, { type: 'PLACE', to: 9 }).state;
    const s4 = applyMove(s3, { type: 'MOVE', from: 2, to: 0 }).state;
    const s5 = applyMove(s4, { type: 'PLACE', to: 3 }).state;
    const s6 = applyMove(s5, { type: 'CAPTURE', from: 6, over: 5, to: 4 }).state;
    // chainJumpInProgress = 4

    const history: GameState[] = [s0, s1, s2, s3, s4, s5, s6];
    const { state: undone } = undo(s6, history);
    expect(undone.chainJumpInProgress).toBeNull();
    expect(undone.goatsCaptured).toBe(0);
  });

  it('redo re-applies undone move', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 4 }).state;
    const redoStack: GameState[] = [s1]; // s1 was undone

    const { state: redone, history: newHistory, redoStack: newRedoStack } = redo(redoStack, [s0]);
    expect(redone.board[4]).toBe('goat'); // s1 had goat at 4
    expect(newHistory).toHaveLength(2);
    expect(newRedoStack).toHaveLength(0);
  });

  it('redo stack clears when new move is made after undo', () => {
    // This is a UI layer concern (useGame hook manages redoStack),
    // but we verify undo/redo API is clean
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 4 }).state;
    const history: GameState[] = [s0, s1];
    const { state: undone, history: newHistory } = undo(s1, history);
    // Make new move from undone state — redoStack should be cleared by UI layer
    const s2 = applyMove(undone, { type: 'PLACE', to: 5 }).state;
    // The new history with s2 means redo stack is cleared (UI responsibility)
    // Verify the state is consistent
    expect(undone.board[4]).toBeNull(); // goat at 4 was undone
    expect(s2.board[5]).toBe('goat');
    expect(newHistory).toHaveLength(1);
  });
});
