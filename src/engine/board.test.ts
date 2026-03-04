// ENG-01: Board topology — 23 nodes, adjacency lists, jump path derivation
import { NODES, EDGES, JUMP_MAP } from './board';

describe('board topology', () => {
  it('has exactly 23 nodes', () => {
    expect(NODES).toHaveLength(23);
  });

  it('node 0 (Apex) is adjacent to nodes 1, 2, 3', () => {
    expect(NODES[0].adj).toEqual([1, 2, 3]);
  });

  it('node 4 (G_R1_C1) is adjacent to nodes 5 and 9 only', () => {
    expect(NODES[4].adj).toEqual([5, 9]);
  });

  it('node 18 (G_R3_C5) is adjacent to nodes 13 and 17 only', () => {
    expect(NODES[18].adj).toEqual([13, 17]);
  });

  it('node 22 (G_R4_C4) is adjacent to nodes 17 and 21 only', () => {
    expect(NODES[22].adj).toEqual([17, 21]);
  });

  it('derives jump paths using adjacency guard (not coordinate distance)', () => {
    // 1 over 2 to 3: 1(200,150)→2(300,150)→3(400,150) — horizontal collinear, 3∈2.adj
    expect(JUMP_MAP['1,2']).toBe(3);
    // 4 over 5 to 6: grid horizontal
    expect(JUMP_MAP['4,5']).toBe(6);
    // All entries in JUMP_MAP must pass the adjacency guard
    for (const key of Object.keys(JUMP_MAP)) {
      const [, over] = key.split(',').map(Number);
      const landing = JUMP_MAP[key];
      const overNode = NODES[over];
      // Landing must be in over.adj (adjacency guard)
      expect(overNode.adj).toContain(landing);
    }
  });

  it('grid horizontal jump: tiger at 4 can jump over 5 to reach 6', () => {
    expect(JUMP_MAP['4,5']).toBe(6);
  });

  it('grid vertical jump: tiger at 4 can jump over 9 to reach 14', () => {
    expect(JUMP_MAP['4,9']).toBe(14);
  });

  it('triangle horizontal jump: tiger at 1 can jump over 2 to reach 3', () => {
    expect(JUMP_MAP['1,2']).toBe(3);
  });

  it('no false jump paths exist on triangle section (non-collinear nodes)', () => {
    // Node 0(300,50) over node 2(300,150): direction (0,100), candidate (300,250)=node6
    // Node 6 is NOT in 2.adj=[0,1,3,7] → no jump (adjacency guard rejects it)
    expect(JUMP_MAP['0,2']).toBeUndefined();
    // From 1(200,150) over 0(300,50): direction (100,-100), candidate (400,0) — no node there
    expect(JUMP_MAP['1,0']).toBeUndefined();
    expect(JUMP_MAP['3,0']).toBeUndefined();
  });

  it('all node coordinates are unique', () => {
    const coords = NODES.map(n => `${n.x},${n.y}`);
    const unique = new Set(coords);
    expect(unique.size).toBe(23);
  });
});

describe('EDGES', () => {
  it('each edge appears only once (nodeA.id < nodeB.id)', () => {
    const pairs = EDGES.map(([a, b]) => `${a},${b}`);
    const unique = new Set(pairs);
    expect(unique.size).toBe(EDGES.length);
    for (const [a, b] of EDGES) {
      expect(a).toBeLessThan(b);
    }
  });
});
