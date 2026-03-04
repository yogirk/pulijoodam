// ENG-01: Board topology — 23 nodes, adjacency lists, LINES-based jump paths
import { NODES, EDGES, JUMP_MAP, LINES } from './board';

describe('board topology', () => {
  it('has exactly 23 nodes', () => {
    expect(NODES).toHaveLength(23);
  });

  it('node 0 (Apex) is adjacent to nodes 2, 3, 4, 5', () => {
    expect(NODES[0].adj).toEqual([2, 3, 4, 5]);
  });

  it('node 1 (L3_1) is adjacent to nodes 2 and 7 only', () => {
    expect(NODES[1].adj).toEqual([2, 7]);
  });

  it('node 18 (L1_6) is adjacent to nodes 12 and 17 only', () => {
    expect(NODES[18].adj).toEqual([12, 17]);
  });

  it('node 22 (L0_4) is adjacent to nodes 17 and 21 only', () => {
    expect(NODES[22].adj).toEqual([17, 21]);
  });

  it('derives jump paths from collinear LINES', () => {
    // Slant S1: [0,2,8,14,19]
    expect(JUMP_MAP['0,2']).toBe(8);
    expect(JUMP_MAP['8,2']).toBe(0);
    // Horizontal H3: [1,2,3,4,5,6]
    expect(JUMP_MAP['1,2']).toBe(3);
    expect(JUMP_MAP['6,5']).toBe(4);
    // Vertical left: [1,7,13]
    expect(JUMP_MAP['1,7']).toBe(13);
    expect(JUMP_MAP['13,7']).toBe(1);
  });

  it('slant jump: 0 over 3 lands on 9', () => {
    expect(JUMP_MAP['0,3']).toBe(9);
  });

  it('horizontal jump: 3 over 4 lands on 5', () => {
    expect(JUMP_MAP['3,4']).toBe(5);
  });

  it('base row jump: 19 over 20 lands on 21', () => {
    expect(JUMP_MAP['19,20']).toBe(21);
  });

  it('no jump path between non-collinear nodes', () => {
    // Node 0 is not adjacent to node 1
    expect(JUMP_MAP['0,1']).toBeUndefined();
    // Node 7 and 2 are not consecutive on any line
    expect(JUMP_MAP['7,2']).toBeUndefined();
  });

  it('all node coordinates are unique', () => {
    const coords = NODES.map(n => `${n.x},${n.y}`);
    const unique = new Set(coords);
    expect(unique.size).toBe(23);
  });

  it('all JUMP_MAP "from" nodes are adjacent to "over" nodes', () => {
    for (const key of Object.keys(JUMP_MAP)) {
      const [from, over] = key.split(',').map(Number);
      expect(NODES[from].adj).toContain(over);
    }
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

describe('LINES', () => {
  it('has 10 collinear lines', () => {
    expect(LINES).toHaveLength(10);
  });
});
