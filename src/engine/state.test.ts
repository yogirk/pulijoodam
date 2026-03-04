// ENG-02: Initial game state
import { createGame } from './state';

describe('createGame', () => {
  it('returns board of length 23', () => {
    const state = createGame();
    expect(state.board).toHaveLength(23);
  });

  it('board starts completely empty', () => {
    const state = createGame();
    expect(state.board.every(p => p === null)).toBe(true);
  });

  it('phase is placement', () => {
    expect(createGame().phase).toBe('placement');
  });

  it('currentTurn is goat', () => {
    expect(createGame().currentTurn).toBe('goat');
  });

  it('tigersInPool is 3', () => {
    expect(createGame().tigersInPool).toBe(3);
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
