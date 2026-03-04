// ENG-09: Threefold repetition
describe('draw by threefold repetition', () => {
  it.todo('draw declared when same board+turn hash appears 3 times');
  it.todo('no draw on second repetition');
  it.todo('stateHashes incremented after each move');
});

// ENG-10: 50-move rule
describe('draw by 50 captureless moves', () => {
  it.todo('capturelessMoves increments on non-capture moves');
  it.todo('capturelessMoves resets to 0 on capture');
  it.todo('draw declared when capturelessMoves reaches 50');
  it.todo('chain-hop sequence counts as 1 move for the counter');
});

// ENG-11: Undo/redo
describe('undo/redo', () => {
  it.todo('undo restores previous GameState');
  it.todo('undo during chain-hop restores pre-capture state');
  it.todo('redo re-applies undone move');
  it.todo('redo stack clears when new move is made after undo');
});
