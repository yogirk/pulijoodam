// ENG-01: Board topology — 23 nodes, adjacency lists, jump path derivation
describe('board topology', () => {
  it.todo('has exactly 23 nodes');
  it.todo('node 0 (Apex) is adjacent to nodes 1, 2, 3');
  it.todo('node 4 (G_R1_C1) is adjacent to nodes 5 and 9 only');
  it.todo('node 18 (G_R3_C5) is adjacent to nodes 13 and 17 only');
  it.todo('node 22 (G_R4_C4) is adjacent to nodes 17 and 21 only');
  it.todo('derives jump paths using adjacency guard (not coordinate distance)');
  it.todo('tiger at 0 can jump over 2 to reach 7 (Apex → Row1_M → G_R1_C4)');
  it.todo('no false jump paths exist on triangle section');
  it.todo('all node coordinates are unique');
});
