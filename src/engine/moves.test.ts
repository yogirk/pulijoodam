// ENG-03: Move generation
describe('move generation', () => {
  it.todo('placement phase: goat can place on any empty node');
  it.todo('placement phase: goat cannot move pieces already on board');
  it.todo('placement phase: tiger can move to adjacent empty node');
  it.todo('movement phase: goat can move to adjacent empty node');
  it.todo('movement phase: goat cannot place from pool');
  it.todo('movement phase: tiger can move or capture');
});

// ENG-04: Move validation
describe('move validation', () => {
  it.todo('applyMove returns error when goat tries to move during placement');
  it.todo('applyMove returns error when piece moves to occupied node');
  it.todo('applyMove returns error when capture landing is occupied');
  it.todo('applyMove returns error for non-adjacent move without capture');
  it.todo('applyMove returns error when wrong player moves');
});

// ENG-05: Capture mechanics
describe('capture mechanics', () => {
  it.todo('tiger captures goat by jumping over to empty landing node');
  it.todo('capture removes goat from board and increments goatsCaptured');
  it.todo('chain-hop: after capture, if further captures available, chainJumpInProgress is set');
  it.todo('chain-hop: tiger can continue jumping in same turn');
  it.todo('chain-hop: chain ends when no further captures available');
  it.todo('chain-hop: player can end chain voluntarily');
  it.todo('goat cannot capture');
  it.todo('tiger cannot jump over another tiger');
});

// ENG-06: Phase transition
describe('phase transition', () => {
  it.todo('phase changes to movement after 15th goat is placed');
  it.todo('PHASE_CHANGED event emitted on transition');
  it.todo('goats can move in movement phase');
});
