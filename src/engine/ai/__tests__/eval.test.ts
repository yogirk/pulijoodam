import { createGame } from '../../state';
import { evaluate } from '../eval';
import type { GameState } from '../../types';

// Helper: create a state with specific board layout
function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createGame(), ...overrides };
}

describe('evaluate — terminal states', () => {
  it('returns large positive for tiger-wins (goatsCaptured >= 10)', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[3] = 'tiger'; board[4] = 'tiger';
    const state = stateWith({ board, goatsCaptured: 10 });
    expect(evaluate(state)).toBeGreaterThanOrEqual(10000);
  });

  it('returns large negative for goat-wins (all tigers trapped)', () => {
    // Place 3 tigers completely surrounded by goats with no empty adj or captures
    const board = Array(23).fill(null) as GameState['board'];
    // Tiger at node 19 (adj: 14, 20) — block both
    board[19] = 'tiger';
    board[14] = 'goat';
    board[20] = 'goat';
    // Tiger at node 13 (adj: 7, 14) — block both
    board[13] = 'tiger';
    board[7] = 'goat';
    // node 14 already occupied by goat
    // Tiger at node 22 (adj: 17, 21) — block both
    board[22] = 'tiger';
    board[17] = 'goat';
    board[21] = 'goat';
    const state = stateWith({
      board,
      phase: 'movement',
      goatsInPool: 0,
      tigersInPool: 0,
    });
    expect(evaluate(state)).toBeLessThanOrEqual(-10000);
  });

  it('returns 0 for draw by repetition', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[3] = 'tiger'; board[4] = 'tiger';
    const state = stateWith({
      board,
      stateHashes: { 'somehash': 3 },
    });
    expect(evaluate(state)).toBe(0);
  });

  it('returns 0 for draw by 50 captureless moves', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[3] = 'tiger'; board[4] = 'tiger';
    const state = stateWith({
      board,
      capturelessMoves: 50,
    });
    expect(evaluate(state)).toBe(0);
  });
});

describe('evaluate — mid-game scoring', () => {
  it('returns a reasonable mid-range score for initial state', () => {
    const state = createGame();
    const score = evaluate(state);
    // Initial position: tigers have some advantage (mobile, 0 captures)
    // Should be somewhere reasonable, not extreme
    expect(score).toBeGreaterThan(-10000);
    expect(score).toBeLessThan(10000);
  });

  it('more captures = higher score', () => {
    const board0 = Array(23).fill(null) as GameState['board'];
    board0[0] = 'tiger'; board0[3] = 'tiger'; board0[4] = 'tiger';
    // Place some goats so board isn't empty
    board0[1] = 'goat'; board0[6] = 'goat'; board0[7] = 'goat';
    board0[8] = 'goat'; board0[9] = 'goat';

    const board5 = board0.slice() as GameState['board'];

    const state0 = stateWith({ board: board0, goatsCaptured: 0, goatsInPool: 0, phase: 'movement' });
    const state5 = stateWith({ board: board5, goatsCaptured: 5, goatsInPool: 0, phase: 'movement' });

    expect(evaluate(state5)).toBeGreaterThan(evaluate(state0));
  });

  it('more tiger mobility = higher score', () => {
    // State with free tigers (high mobility)
    const boardFree = Array(23).fill(null) as GameState['board'];
    boardFree[0] = 'tiger'; boardFree[3] = 'tiger'; boardFree[4] = 'tiger';
    // Just a few goats, tigers are free
    boardFree[19] = 'goat'; boardFree[20] = 'goat';

    // State with constrained tigers (lower mobility)
    const boardConstrained = Array(23).fill(null) as GameState['board'];
    boardConstrained[0] = 'tiger'; boardConstrained[3] = 'tiger'; boardConstrained[4] = 'tiger';
    // Surround tigers with goats (but not fully trapped)
    boardConstrained[2] = 'goat';
    boardConstrained[5] = 'goat';
    boardConstrained[9] = 'goat';
    boardConstrained[10] = 'goat';
    boardConstrained[15] = 'goat';
    boardConstrained[16] = 'goat';

    const stateFree = stateWith({ board: boardFree, goatsInPool: 0, phase: 'movement' });
    const stateConstrained = stateWith({ board: boardConstrained, goatsInPool: 0, phase: 'movement' });

    expect(evaluate(stateFree)).toBeGreaterThan(evaluate(stateConstrained));
  });

  it('trapped tiger = lower score', () => {
    // One tiger trapped, two free
    const boardTrapped = Array(23).fill(null) as GameState['board'];
    boardTrapped[0] = 'tiger'; boardTrapped[3] = 'tiger';
    // Tiger at 19 trapped (adj 14, 20 blocked)
    boardTrapped[19] = 'tiger';
    boardTrapped[14] = 'goat';
    boardTrapped[20] = 'goat';

    // All three tigers free
    const boardFree = Array(23).fill(null) as GameState['board'];
    boardFree[0] = 'tiger'; boardFree[3] = 'tiger'; boardFree[4] = 'tiger';

    const stateTrapped = stateWith({ board: boardTrapped, goatsInPool: 0, phase: 'movement' });
    const stateFree = stateWith({ board: boardFree, goatsInPool: 0, phase: 'movement' });

    expect(evaluate(stateTrapped)).toBeLessThan(evaluate(stateFree));
  });
});
