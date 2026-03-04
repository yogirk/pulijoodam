// ENG-02: Initial game state
import { createGame } from './state';
import { TIGER_START_NODES } from './board';

describe('createGame', () => {
  it('returns board of length 23', () => {
    const state = createGame();
    expect(state.board).toHaveLength(23);
  });

  it('board has 3 tigers pre-placed and 20 empty nodes', () => {
    const state = createGame();
    const tigers = state.board.filter(p => p === 'tiger');
    const empty = state.board.filter(p => p === null);
    expect(tigers).toHaveLength(3);
    expect(empty).toHaveLength(20);
  });

  it('tigers are placed at TIGER_START_NODES positions', () => {
    const state = createGame();
    for (const node of TIGER_START_NODES) {
      expect(state.board[node]).toBe('tiger');
    }
  });

  it('phase is placement', () => {
    expect(createGame().phase).toBe('placement');
  });

  it('currentTurn is goat', () => {
    expect(createGame().currentTurn).toBe('goat');
  });

  it('tigersInPool is 0', () => {
    expect(createGame().tigersInPool).toBe(0);
  });

  it('goatsInPool is 15', () => {
    expect(createGame().goatsInPool).toBe(15);
  });

  it('goatsCaptured is 0', () => {
    expect(createGame().goatsCaptured).toBe(0);
  });

  it('chainJumpInProgress is null', () => {
    expect(createGame().chainJumpInProgress).toBeNull();
  });

  it('stateHashes is empty object', () => {
    expect(createGame().stateHashes).toEqual({});
  });

  it('capturelessMoves is 0', () => {
    expect(createGame().capturelessMoves).toBe(0);
  });
});
