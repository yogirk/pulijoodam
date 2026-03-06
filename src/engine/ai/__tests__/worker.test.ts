import { createGame } from '../../state';
import { applyMove, getLegalMoves } from '../../moves';
import { chooseMove } from '../index';
import { DIFFICULTY_CONFIGS } from '../types';
import type { GameState } from '../../types';

const config = DIFFICULTY_CONFIGS.easy;

describe('chooseMove — placement phase', () => {
  it('returns a legal goat placement for initial state', () => {
    const state = createGame();
    const move = chooseMove(state, config);
    expect(move.type).toBe('PLACE');

    // Verify it's actually legal
    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => lm.move.type === move.type && 'to' in lm.move && 'to' in move && lm.move.to === move.to
    );
    expect(isLegal).toBe(true);
  });

  it('returns a legal tiger move during tiger turn in placement', () => {
    // Place a goat first to get to tiger's turn
    const initial = createGame();
    const { state } = applyMove(initial, { type: 'PLACE', to: 1 });
    expect(state.currentTurn).toBe('tiger');

    const move = chooseMove(state, config);
    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(lm => JSON.stringify(lm.move) === JSON.stringify(move));
    expect(isLegal).toBe(true);
  });
});

describe('chooseMove — movement phase', () => {
  it('returns a legal move in movement phase', () => {
    // Build a movement-phase state: all goats placed, some tigers moved
    const board = Array(23).fill(null) as GameState['board'];
    board[0] = 'tiger'; board[3] = 'tiger'; board[4] = 'tiger';
    // Place goats in various positions
    board[1] = 'goat'; board[6] = 'goat'; board[7] = 'goat';
    board[13] = 'goat'; board[14] = 'goat'; board[15] = 'goat';
    board[16] = 'goat'; board[17] = 'goat'; board[18] = 'goat';
    board[19] = 'goat'; board[20] = 'goat'; board[21] = 'goat';
    board[22] = 'goat'; board[8] = 'goat'; board[12] = 'goat';

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      goatsInPool: 0,
      currentTurn: 'tiger',
    };

    const move = chooseMove(state, config);
    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(lm => JSON.stringify(lm.move) === JSON.stringify(move));
    expect(isLegal).toBe(true);
  });
});

describe('chooseMove — chain-hop in progress', () => {
  it('returns a legal move when chain-hop is available', () => {
    // Set up a chain-hop scenario: tiger mid-capture with further captures available
    const board = Array(23).fill(null) as GameState['board'];
    // Tiger just captured and landed at node 9 (adj: 3, 8, 10, 15)
    board[9] = 'tiger';
    board[0] = 'tiger'; board[4] = 'tiger';
    // Place goat at 15 with empty landing at 20 (line: 0,3,9,15,20)
    board[15] = 'goat';
    // node 20 is empty — tiger at 9 can capture 15 and land on 20

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      goatsInPool: 0,
      currentTurn: 'tiger',
      chainJumpInProgress: 9,
      goatsCaptured: 1,
    };

    const move = chooseMove(state, config);
    // Should be either a CAPTURE or END_CHAIN
    expect(['CAPTURE', 'END_CHAIN']).toContain(move.type);

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(lm => JSON.stringify(lm.move) === JSON.stringify(move));
    expect(isLegal).toBe(true);
  });
});
