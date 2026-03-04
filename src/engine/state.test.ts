// ENG-02: Initial game state
import { createGame } from './state';

describe('createGame', () => {
  it('returns board of length 23', () => {
    const state = createGame();
    expect(state.board).toHaveLength(23);
  });

  it('tigers start on nodes 0, 6, 7', () => {
    const state = createGame();
    expect(state.board[0]).toBe('tiger');
    expect(state.board[6]).toBe('tiger');
    expect(state.board[7]).toBe('tiger');
  });

  it('all other nodes are empty', () => {
    const state = createGame();
    const nonTigerNodes = state.board.filter((_, i) => i !== 0 && i !== 6 && i !== 7);
    expect(nonTigerNodes.every(p => p === null)).toBe(true);
  });

  it('phase is placement', () => {
    expect(createGame().phase).toBe('placement');
  });

  it('currentTurn is goat', () => {
    expect(createGame().currentTurn).toBe('goat');
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
    const state = createGame();
    expect(state.stateHashes).toEqual({});
  });

  it('capturelessMoves is 0', () => {
    expect(createGame().capturelessMoves).toBe(0);
  });
});
