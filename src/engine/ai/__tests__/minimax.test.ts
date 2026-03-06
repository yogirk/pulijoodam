import { createGame } from '../../state';
import { getLegalMoves } from '../../moves';
import { minimaxSearch } from '../minimax';
import { zobristHash } from '../zobrist';
import { chooseMove } from '../index';
import { DIFFICULTY_CONFIGS } from '../types';
import type { GameState } from '../../types';

// Helper: create a mid-game movement phase state
function createMidGameState(): GameState {
  const board = Array(23).fill(null) as GameState['board'];
  // 3 tigers
  board[0] = 'tiger';
  board[3] = 'tiger';
  board[4] = 'tiger';
  // 12 goats on board (3 captured)
  board[1] = 'goat';
  board[7] = 'goat';
  board[8] = 'goat';
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

describe('minimaxSearch', () => {
  it('returns a legal move for movement phase states', () => {
    const state = createMidGameState();
    const move = minimaxSearch(state, 3, 2000, 'tiger');

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => JSON.stringify(lm.move) === JSON.stringify(move)
    );
    expect(isLegal).toBe(true);
  });

  it('finds an obvious capture at depth 2', () => {
    // Set up a state where a tiger can capture a goat
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; // apex, adj: 2,3,4,5
    board[3] = 'tiger';
    board[4] = 'tiger';
    // Place goat at node 2 (adj to tiger at 0), landing at 8 (must be empty)
    // Line: 0, 2, 8, 14, 19 -> tiger at 0 can jump over goat at 2 to land at 8
    board[2] = 'goat';
    // node 8 is empty -> capture is available

    // Place remaining goats elsewhere so it's a valid movement state
    board[13] = 'goat';
    board[14] = 'goat';
    board[15] = 'goat';
    board[16] = 'goat';
    board[17] = 'goat';
    board[19] = 'goat';
    board[20] = 'goat';
    board[21] = 'goat';
    board[22] = 'goat';

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      goatsInPool: 0,
      goatsCaptured: 3,
      currentTurn: 'tiger',
    };

    const move = minimaxSearch(state, 2, 2000, 'tiger');
    // Should find the capture
    expect(move.type).toBe('CAPTURE');
  });

  it('respects time budget (does not exceed timeBudgetMs + 200ms)', () => {
    const state = createMidGameState();
    const timeBudget = 300;
    const start = performance.now();
    minimaxSearch(state, 20, timeBudget, 'tiger'); // high depth, short time
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(timeBudget + 200);
  });
});

describe('zobristHash', () => {
  it('produces different hashes for different board states', () => {
    const state1 = createGame();
    const state2: GameState = {
      ...createGame(),
      board: (() => {
        const b = Array(23).fill(null) as GameState['board'];
        b[0] = 'tiger'; b[3] = 'tiger'; b[4] = 'tiger';
        b[1] = 'goat'; // Extra goat placed
        return b;
      })(),
      currentTurn: 'tiger',
    };

    const hash1 = zobristHash(state1);
    const hash2 = zobristHash(state2);
    expect(hash1).not.toBe(hash2);
  });

  it('produces same hash for identical states', () => {
    const state = createGame();
    const hash1 = zobristHash(state);
    const hash2 = zobristHash(state);
    expect(hash1).toBe(hash2);
  });

  it('produces a number (32-bit integer)', () => {
    const state = createGame();
    const hash = zobristHash(state);
    expect(typeof hash).toBe('number');
    expect(Number.isInteger(hash)).toBe(true);
  });
});

describe('chooseMove — dispatch', () => {
  it('dispatches to mctsSearch during placement phase', () => {
    const state = createGame();
    const config = DIFFICULTY_CONFIGS.easy;
    const move = chooseMove(state, config);

    // During placement, goat places
    expect(move.type).toBe('PLACE');

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => JSON.stringify(lm.move) === JSON.stringify(move)
    );
    expect(isLegal).toBe(true);
  });

  it('dispatches to minimaxSearch during movement phase', () => {
    const state = createMidGameState();
    const config = DIFFICULTY_CONFIGS.easy;
    const move = chooseMove(state, config);

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => JSON.stringify(lm.move) === JSON.stringify(move)
    );
    expect(isLegal).toBe(true);
  });
});
