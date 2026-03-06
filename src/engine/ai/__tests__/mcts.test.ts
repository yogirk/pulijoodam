import { createGame } from '../../state';
import { applyMove, getLegalMoves } from '../../moves';
import { mctsSearch } from '../mcts';
import type { GameState } from '../../types';

describe('mctsSearch — placement phase', () => {
  it('returns a legal PLACE move for goat on initial state', () => {
    const state = createGame();
    const move = mctsSearch(state, 200, 500, 'goat');

    expect(move.type).toBe('PLACE');

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => JSON.stringify(lm.move) === JSON.stringify(move)
    );
    expect(isLegal).toBe(true);
  });

  it('returns a legal MOVE or CAPTURE for tiger turn in placement', () => {
    // Place a goat first to get to tiger turn
    const initial = createGame();
    const { state } = applyMove(initial, { type: 'PLACE', to: 1 });
    expect(state.currentTurn).toBe('tiger');

    const move = mctsSearch(state, 200, 500, 'tiger');

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => JSON.stringify(lm.move) === JSON.stringify(move)
    );
    expect(isLegal).toBe(true);
  });

  it('completes with 2000 sims without crashing or timing out', () => {
    const state = createGame();
    const start = performance.now();
    const move = mctsSearch(state, 2000, 5000, 'goat');
    const elapsed = performance.now() - start;

    expect(move).toBeDefined();
    expect(move.type).toBe('PLACE');
    // Should complete, not hang
    expect(elapsed).toBeLessThan(10000);
  });

  it('completes within time budget (timeBudgetMs + 100ms tolerance)', () => {
    const state = createGame();
    const timeBudget = 300;
    const start = performance.now();
    mctsSearch(state, 100000, timeBudget, 'goat'); // huge sim count, but short time budget
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(timeBudget + 100);
  });

  it('handles chain-hop states (returns CAPTURE or END_CHAIN)', () => {
    // Set up chain-hop scenario: tiger at node 9, goat at 15, empty at 20
    const board = Array(23).fill(null) as GameState['board'];
    board[9] = 'tiger';
    board[0] = 'tiger';
    board[4] = 'tiger';
    board[15] = 'goat';
    // node 20 empty — tiger at 9 can capture 15 -> land on 20

    const state: GameState = {
      ...createGame(),
      board,
      phase: 'movement',
      goatsInPool: 0,
      currentTurn: 'tiger',
      chainJumpInProgress: 9,
      goatsCaptured: 1,
    };

    const move = mctsSearch(state, 100, 500, 'tiger');
    expect(['CAPTURE', 'END_CHAIN']).toContain(move.type);

    const legalMoves = getLegalMoves(state);
    const isLegal = legalMoves.some(
      lm => JSON.stringify(lm.move) === JSON.stringify(move)
    );
    expect(isLegal).toBe(true);
  });
});
