import { createGame } from './state';
import { applyMove } from './moves';
import { getGameStatus } from './rules';
import type { GameState } from './types';

// ENG-07: Tiger win
describe('tiger win detection', () => {
  it('tiger wins when goatsCaptured reaches 10', () => {
    const state: GameState = {
      ...createGame(),
      goatsCaptured: 10,
      tigersInPool: 0,
    };
    expect(getGameStatus(state)).toBe('tiger-wins');
  });

  it('no tiger win when goatsCaptured is 9', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger';
    board[10] = 'tiger';
    board[22] = 'tiger';
    board[1] = 'goat';
    const state: GameState = {
      ...createGame(),
      board,
      goatsCaptured: 9,
      tigersInPool: 0,
    };
    expect(getGameStatus(state)).not.toBe('tiger-wins');
  });

  it('GAME_OVER event emitted with status tiger-wins', () => {
    // Tiger at 0, goat at 2. JUMP_MAP['0,2']=8. goatsCaptured=9 → 10th capture
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger';
    board[10] = 'tiger';
    board[22] = 'tiger';
    board[2] = 'goat';
    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      currentTurn: 'tiger',
      tigersInPool: 0,
      goatsInPool: 0,
      goatsCaptured: 9,
    };
    const result = applyMove(state, { type: 'CAPTURE', from: 0, over: 2, to: 8 });
    expect(result.error).toBeUndefined();
    expect(result.state.goatsCaptured).toBe(10);
    expect(result.events.some(e => e.type === 'GAME_OVER' && e.status === 'tiger-wins')).toBe(true);
  });
});

// ENG-08: Goat win
describe('goat win detection', () => {
  it('goat wins when all 3 tigers have zero legal moves', () => {
    // Tigers at corners with goats blocking all adj + jump landings
    // Tiger 13 (adj=[7,14]): jumps 13→7→1, 13→14→15
    // Tiger 18 (adj=[12,17]): jumps 18→12→6, 18→17→16
    // Tiger 19 (adj=[14,20]): jumps 19→14→8, 19→20→21
    const board = Array(23).fill(null) as GameState['board'];
    board[13] = 'tiger'; board[18] = 'tiger'; board[19] = 'tiger';
    // Block adjacencies
    board[7] = 'goat'; board[14] = 'goat'; board[12] = 'goat';
    board[17] = 'goat'; board[20] = 'goat';
    // Block jump landings
    board[1] = 'goat'; board[15] = 'goat'; board[6] = 'goat';
    board[16] = 'goat'; board[8] = 'goat'; board[21] = 'goat';

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      currentTurn: 'tiger',
      tigersInPool: 0,
      goatsInPool: 0,
    };
    expect(getGameStatus(state)).toBe('goat-wins');
  });

  it('no goat win when at least one tiger has a legal move', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[10] = 'tiger'; board[22] = 'tiger';
    board[1] = 'goat';
    const state: GameState = {
      ...createGame(),
      board,
      tigersInPool: 0,
    };
    expect(getGameStatus(state)).not.toBe('goat-wins');
  });

  it('no goat win when tigers still in pool', () => {
    // Even if no tigers on board, pool > 0 means tigers can still place
    const state: GameState = {
      ...createGame(),
      tigersInPool: 1,
    };
    expect(getGameStatus(state)).not.toBe('goat-wins');
  });

  it('GAME_OVER event emitted with status goat-wins', () => {
    const board = Array(23).fill(null) as GameState['board'];
    board[13] = 'tiger'; board[18] = 'tiger'; board[19] = 'tiger';
    board[7] = 'goat'; board[14] = 'goat'; board[12] = 'goat';
    board[17] = 'goat'; board[20] = 'goat';
    board[1] = 'goat'; board[15] = 'goat'; board[6] = 'goat';
    board[16] = 'goat'; board[8] = 'goat'; board[21] = 'goat';
    // Movable goat at 9 (adj=[3,8,10,15]) → can move to 3 (empty)
    board[9] = 'goat';

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      currentTurn: 'goat',
      tigersInPool: 0,
      goatsInPool: 0,
    };

    expect(getGameStatus(state)).toBe('goat-wins');
    // Goat moves 9→3 (doesn't free any tiger)
    const result = applyMove(state, { type: 'MOVE', from: 9, to: 3 });
    expect(result.error).toBeUndefined();
    expect(result.events.some(e => e.type === 'GAME_OVER' && e.status === 'goat-wins')).toBe(true);
  });
});
