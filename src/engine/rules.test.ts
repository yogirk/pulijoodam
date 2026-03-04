import { createGame } from './state';
import { applyMove } from './moves';
import { getGameStatus } from './rules';
import type { GameState } from './types';

// ENG-07: Tiger win
describe('tiger win detection', () => {
  it('tiger wins when goatsCaptured reaches 10', () => {
    const state = createGame();
    // Create state with goatsCaptured = 10
    const winState: GameState = {
      ...state,
      goatsCaptured: 10,
    };
    expect(getGameStatus(winState)).toBe('tiger-wins');
  });

  it('no tiger win when goatsCaptured is 9', () => {
    const state = createGame();
    const nineState: GameState = {
      ...state,
      goatsCaptured: 9,
      // Put some goats on board so goat-wins doesn't trigger
      board: (() => {
        const b = state.board.slice() as GameState['board'];
        b[4] = 'goat';
        return b;
      })(),
    };
    expect(getGameStatus(nineState)).not.toBe('tiger-wins');
  });

  it('GAME_OVER event emitted with status tiger-wins', () => {
    // Build a state where the 10th capture happens
    // Create a state where goatsCaptured is 9 and a tiger can capture one more
    const state = createGame();
    const setupState: GameState = {
      ...state,
      board: (() => {
        const b = Array(23).fill(null) as GameState['board'];
        b[0] = 'tiger'; // tiger at 0
        b[6] = 'tiger'; // tiger at 6
        b[7] = 'tiger'; // tiger at 7
        b[5] = 'goat';  // goat at 5 (adjacent to tiger at 6, jump 6→5→4 valid)
        return b;
      })(),
      phase: 'movement',
      currentTurn: 'tiger',
      goatsInPool: 0,
      goatsCaptured: 9, // one more capture = tiger wins
    };
    const result = applyMove(setupState, { type: 'CAPTURE', from: 6, over: 5, to: 4 });
    expect(result.error).toBeUndefined();
    expect(result.state.goatsCaptured).toBe(10);
    expect(result.events.some(e => e.type === 'GAME_OVER' && e.status === 'tiger-wins')).toBe(true);
  });
});

// ENG-08: Goat win
describe('goat win detection', () => {
  it('goat wins when all 3 tigers have zero legal moves', () => {
    // Create a state where all tigers are completely surrounded by goats
    // Tiger at 4 (adj=[5,9]): if 5 and 9 are goats and no jump landings are empty
    // Tiger at 19 (adj=[14,20]): if 14 and 20 are goats
    // Tiger at 22 (adj=[17,21]): if 17 and 21 are goats
    const state = createGame();
    const trappedState: GameState = {
      ...state,
      board: (() => {
        const b = Array(23).fill(null) as GameState['board'];
        // Tigers in corners
        b[4] = 'tiger';
        b[19] = 'tiger';
        b[22] = 'tiger';
        // Block tiger at 4: adj=[5,9]
        b[5] = 'goat';
        b[9] = 'goat';
        // No jump available from 4: JUMP_MAP['4,5']=6 (check if 6 is empty), JUMP_MAP['4,9']=14
        // Fill 6 and 14 to block jumps too
        b[6] = 'goat';
        b[14] = 'goat';
        // Block tiger at 19: adj=[14,20], 14 already blocked
        b[20] = 'goat';
        // Jump from 19: JUMP_MAP['19,14']=9 (9 is a goat), JUMP_MAP['19,20']=21
        b[9] = 'goat';
        b[21] = 'goat';
        // Block tiger at 22: adj=[17,21], 21 already blocked
        b[17] = 'goat';
        // Jump from 22: JUMP_MAP['22,17']=12, JUMP_MAP['22,21']=20, 20 is goat ✓
        b[12] = 'goat';
        return b;
      })(),
      phase: 'movement',
      currentTurn: 'tiger',
      goatsInPool: 0,
    };
    expect(getGameStatus(trappedState)).toBe('goat-wins');
  });

  it('no goat win when at least one tiger has a legal move', () => {
    const state = createGame();
    // Tiger at 0 with one adjacent empty node
    const notTrappedState: GameState = {
      ...state,
      board: (() => {
        const b = Array(23).fill(null) as GameState['board'];
        b[0] = 'tiger';
        b[6] = 'tiger';
        b[7] = 'tiger';
        b[4] = 'goat'; // just some goats, tigers have free adj nodes
        return b;
      })(),
    };
    expect(getGameStatus(notTrappedState)).not.toBe('goat-wins');
  });

  it('GAME_OVER event emitted with status goat-wins', () => {
    // Set up: tigers are trapped AFTER a goat makes a move that seals them
    // Tigers at corners 4, 19, 22. Goat player's turn.
    // Pre-trap: tiger at 4 adj=[5,9], goat at 5 and 9 with jump paths blocked.
    // Tiger at 19 adj=[14,20], blocked. Tiger at 22 adj=[17,21], blocked.
    // For this test: the state already has tigers trapped, and we verify the
    // GAME_OVER event is emitted when applyMove checks status.
    //
    // Build a state where tigers ARE trapped and it's goat's turn.
    // After goat makes any move, status will be checked and GAME_OVER emitted.
    const board = Array(23).fill(null) as GameState['board'];
    // Tiger positions (corners with limited adj)
    board[4] = 'tiger';  // adj=[5,9]
    board[19] = 'tiger'; // adj=[14,20]
    board[22] = 'tiger'; // adj=[17,21]
    // Block all adj of tiger at 4 AND jump landings
    board[5] = 'goat';   // adj of 4; JUMP_MAP['4,5']=6 → need 6 occupied
    board[9] = 'goat';   // adj of 4; JUMP_MAP['4,9']=14 → need 14 occupied
    board[6] = 'goat';   // blocks jump 4→5→6
    board[14] = 'goat';  // blocks jump 4→9→14 AND adj of 19
    // Block tiger at 19: adj=[14,20], 14 already blocked
    board[20] = 'goat';  // adj of 19; JUMP_MAP['19,14']=9 (9 is goat ✓), JUMP_MAP['19,20']=21 → need 21 occupied
    board[21] = 'goat';  // blocks jump 19→20→21 AND adj of 22
    // Block tiger at 22: adj=[17,21], 21 already blocked
    board[17] = 'goat';  // adj of 22; JUMP_MAP['22,17']=12 → need 12 occupied, JUMP_MAP['22,21']=20 (20 is goat ✓)
    board[12] = 'goat';  // blocks jump 22→17→12

    // Goat at node 10 can move to 11 or 15 — neither frees a tiger
    board[10] = 'goat';

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      currentTurn: 'goat',
      goatsInPool: 0,
    };

    // Verify tigers are trapped before the move
    expect(getGameStatus(state)).toBe('goat-wins');

    // Make a specific goat move that keeps tigers trapped (10→15 doesn't free any tiger)
    // Node 10 adj=[5,9,11,15]: 5,9,11 are occupied; 15 is empty
    const result = applyMove(state, { type: 'MOVE', from: 10, to: 15 });
    expect(result.error).toBeUndefined();
    expect(result.events.some(e => e.type === 'GAME_OVER' && e.status === 'goat-wins')).toBe(true);
  });
});
