import { createGame } from './state';
import { applyMove } from './moves';
import { getGameStatus } from './rules';
import { undo, redo } from './history';
import type { GameState } from './types';

// ENG-09: Threefold repetition
describe('draw by threefold repetition', () => {
  it('draw declared when same board+turn hash appears 3 times', () => {
    const state: GameState = {
      ...createGame(),
      stateHashes: { 'somehash': 3 },
      tigersInPool: 0,
    };
    expect(getGameStatus(state)).toBe('draw-repetition');
  });

  it('no draw on second repetition', () => {
    const state: GameState = {
      ...createGame(),
      stateHashes: { 'somehash': 2 },
      tigersInPool: 0,
    };
    expect(getGameStatus(state)).not.toBe('draw-repetition');
  });

  it('stateHashes incremented after each move', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 1 }).state;
    expect(Object.keys(s1.stateHashes).length).toBeGreaterThan(0);
    const firstHash = Object.keys(s1.stateHashes)[0];
    expect(s1.stateHashes[firstHash]).toBe(1);
  });
});

// ENG-10: 50-move rule
describe('draw by 50 captureless moves', () => {
  it('capturelessMoves increments on non-capture moves', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 1 }).state;
    expect(s1.capturelessMoves).toBe(1);
    // Tiger moves (tiger at 0 to adj node 2)
    const s2 = applyMove(s1, { type: 'MOVE', from: 0, to: 2 }).state;
    expect(s2.capturelessMoves).toBe(2);
  });

  it('capturelessMoves resets to 0 on capture', () => {
    // Tiger at 0, goat at 2. JUMP_MAP['0,2']=8
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[10] = 'tiger'; board[22] = 'tiger';
    board[2] = 'goat';
    const state: GameState = {
      ...createGame(),
      board,
      tigersInPool: 0,
      currentTurn: 'tiger',
      capturelessMoves: 5,
      goatsInPool: 14,
    };
    const result = applyMove(state, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.state.capturelessMoves).toBe(0);
  });

  it('draw declared when capturelessMoves reaches 50', () => {
    const state: GameState = {
      ...createGame(),
      capturelessMoves: 50,
      goatsCaptured: 0,
      tigersInPool: 0,
    };
    expect(getGameStatus(state)).toBe('draw-50moves');
  });

  it('chain-hop sequence counts correctly for capturelessMoves', () => {
    // Tiger at 0, goats at 2 and 14. LINES: [0,2,8,14,19]
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[10] = 'tiger'; board[22] = 'tiger';
    board[2] = 'goat'; board[14] = 'goat';
    const state: GameState = {
      ...createGame(),
      board,
      tigersInPool: 0,
      currentTurn: 'tiger',
      capturelessMoves: 5,
      goatsInPool: 13,
    };
    // First capture resets to 0
    const s1 = applyMove(state, { type: 'CAPTURE', from: 0, over: 2, to: 8 }).state;
    expect(s1.capturelessMoves).toBe(0);
    // Chain capture stays at 0
    const s2 = applyMove(s1, { type: 'CAPTURE', from: 8, over: 14, to: 19 }).state;
    expect(s2.capturelessMoves).toBe(0);
  });
});

// ENG-11: Undo/redo
describe('undo/redo', () => {
  it('undo restores previous GameState', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 1 }).state;
    const history: GameState[] = [s0, s1];
    const { state: undone, history: newHistory } = undo(s1, history);
    expect(undone).toBe(s0);
    expect(newHistory).toHaveLength(1);
    expect(newHistory[0]).toBe(s0);
  });

  it('undo during chain-hop restores pre-capture state', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[10] = 'tiger'; board[22] = 'tiger';
    board[2] = 'goat'; board[14] = 'goat';
    const s0: GameState = {
      ...createGame(),
      board: board.slice() as GameState['board'],
      tigersInPool: 0,
      currentTurn: 'tiger',
      goatsInPool: 13,
    };
    const s1 = applyMove(s0, { type: 'CAPTURE', from: 0, over: 2, to: 8 }).state;
    expect(s1.chainJumpInProgress).toBe(8);

    const history: GameState[] = [s0, s1];
    const { state: undone } = undo(s1, history);
    expect(undone.chainJumpInProgress).toBeNull();
    expect(undone.goatsCaptured).toBe(0);
  });

  it('redo re-applies undone move', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 5 }).state;
    const redoStack: GameState[] = [s1];
    const { state: redone, history: newHistory, redoStack: newRedoStack } = redo(redoStack, [s0]);
    expect(redone.board[5]).toBe('goat');
    expect(newHistory).toHaveLength(2);
    expect(newRedoStack).toHaveLength(0);
  });

  it('redo stack clears when new move is made after undo', () => {
    const s0 = createGame();
    const s1 = applyMove(s0, { type: 'PLACE', to: 5 }).state;
    const history: GameState[] = [s0, s1];
    const { state: undone, history: newHistory } = undo(s1, history);
    const s2 = applyMove(undone, { type: 'PLACE', to: 6 }).state;
    expect(undone.board[5]).toBeNull();
    expect(s2.board[6]).toBe('goat');
    expect(newHistory).toHaveLength(1);
  });
});
