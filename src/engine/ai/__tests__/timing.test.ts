import { createGame } from '../../state';
import { chooseMove } from '../index';
import { DIFFICULTY_CONFIGS } from '../types';
import type { GameState } from '../../types';

// Create a mid-game movement-phase state for timing tests
function createTimingState(): GameState {
  const board = Array(23).fill(null) as GameState['board'];
  // 3 tigers at reasonable positions
  board[0] = 'tiger';
  board[9] = 'tiger';
  board[11] = 'tiger';
  // 12 goats on board (3 captured)
  board[1] = 'goat';
  board[2] = 'goat';
  board[7] = 'goat';
  board[13] = 'goat';
  board[14] = 'goat';
  board[15] = 'goat';
  board[16] = 'goat';
  board[17] = 'goat';
  board[19] = 'goat';
  board[20] = 'goat';
  board[21] = 'goat';
  board[22] = 'goat';

  return {
    ...createGame(),
    board,
    phase: 'movement',
    goatsInPool: 0,
    goatsCaptured: 3,
    currentTurn: 'tiger',
  };
}

describe('timing — difficulty configs', () => {
  it('Hard difficulty completes in under 2000ms', () => {
    const state = createTimingState();
    const start = performance.now();
    const move = chooseMove(state, DIFFICULTY_CONFIGS.hard);
    const elapsed = performance.now() - start;

    expect(move).toBeDefined();
    // 2000ms + 200ms tolerance for test framework overhead
    expect(elapsed).toBeLessThan(2200);
  });

  it('Expert difficulty completes in under 5000ms', () => {
    const state = createTimingState();
    const start = performance.now();
    const move = chooseMove(state, DIFFICULTY_CONFIGS.expert);
    const elapsed = performance.now() - start;

    expect(move).toBeDefined();
    // 5000ms + 200ms tolerance for test framework overhead
    expect(elapsed).toBeLessThan(5200);
  });
});
