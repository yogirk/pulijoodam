// Pulijoodam board topology
// 23-node graph: apex at top, 4 slant lines radiating down through 4 horizontal levels.
// Levels: y=4 (apex, 1 node), y=3 (6 nodes), y=2 (6 nodes), y=1 (6 nodes), y=0 (4 nodes, base).
// Rectangle sides at x=-3 and x=3 between y=1 and y=3.
// SVG viewBox: 0 0 600 380

export interface NodeDef {
  id: number;
  label: string;
  x: number;
  y: number;
  adj: number[];
}

// Canonical node definitions — matches playground.html board exactly
export const NODES: NodeDef[] = [
  // Apex
  { id:  0, label: 'Apex',  x: 300,    y:  30, adj: [2, 3, 4, 5] },
  // Level 3 (y=3): 6 nodes
  { id:  1, label: 'L3_1',  x: 105,    y: 110, adj: [2, 7] },
  { id:  2, label: 'L3_2',  x: 251.25, y: 110, adj: [0, 1, 3, 8] },
  { id:  3, label: 'L3_3',  x: 283.75, y: 110, adj: [0, 2, 4, 9] },
  { id:  4, label: 'L3_4',  x: 316.25, y: 110, adj: [0, 3, 5, 10] },
  { id:  5, label: 'L3_5',  x: 348.75, y: 110, adj: [0, 4, 6, 11] },
  { id:  6, label: 'L3_6',  x: 495,    y: 110, adj: [5, 12] },
  // Level 2 (y=2): 6 nodes
  { id:  7, label: 'L2_1',  x:  88.75, y: 190, adj: [1, 8, 13] },
  { id:  8, label: 'L2_2',  x: 202.5,  y: 190, adj: [2, 7, 9, 14] },
  { id:  9, label: 'L2_3',  x: 267.5,  y: 190, adj: [3, 8, 10, 15] },
  { id: 10, label: 'L2_4',  x: 332.5,  y: 190, adj: [4, 9, 11, 16] },
  { id: 11, label: 'L2_5',  x: 397.5,  y: 190, adj: [5, 10, 12, 17] },
  { id: 12, label: 'L2_6',  x: 511.25, y: 190, adj: [6, 11, 18] },
  // Level 1 (y=1): 6 nodes
  { id: 13, label: 'L1_1',  x:  72.5,  y: 270, adj: [7, 14] },
  { id: 14, label: 'L1_2',  x: 153.75, y: 270, adj: [8, 13, 15, 19] },
  { id: 15, label: 'L1_3',  x: 251.25, y: 270, adj: [9, 14, 16, 20] },
  { id: 16, label: 'L1_4',  x: 348.75, y: 270, adj: [10, 15, 17, 21] },
  { id: 17, label: 'L1_5',  x: 446.25, y: 270, adj: [11, 16, 18, 22] },
  { id: 18, label: 'L1_6',  x: 527.5,  y: 270, adj: [12, 17] },
  // Level 0 (base, y=0): 4 nodes
  { id: 19, label: 'L0_1',  x: 105,    y: 350, adj: [14, 20] },
  { id: 20, label: 'L0_2',  x: 235,    y: 350, adj: [15, 19, 21] },
  { id: 21, label: 'L0_3',  x: 365,    y: 350, adj: [16, 20, 22] },
  { id: 22, label: 'L0_4',  x: 495,    y: 350, adj: [17, 21] },
];

// Tiger starting positions (pre-placed at game start)
export const TIGER_START_NODES: readonly number[] = [0, 3, 4] as const;

// EDGES: unique undirected pairs for rendering board lines
export const EDGES: [number, number][] = (() => {
  const result: [number, number][] = [];
  for (const node of NODES) {
    for (const neighborId of node.adj) {
      if (node.id < neighborId) {
        result.push([node.id, neighborId]);
      }
    }
  }
  return result;
})();

// Collinear lines on the board framework — used for computing capture (jump) paths.
// Each line is an ordered sequence of node IDs along a straight path.
export const LINES: number[][] = [
  [0, 2, 8, 14, 19],      // S1: outer-left slant
  [0, 3, 9, 15, 20],      // S2: inner-left slant
  [0, 4, 10, 16, 21],     // S3: inner-right slant
  [0, 5, 11, 17, 22],     // S4: outer-right slant
  [1, 2, 3, 4, 5, 6],     // H3: y=3 horizontal
  [7, 8, 9, 10, 11, 12],  // H2: y=2 horizontal
  [13, 14, 15, 16, 17, 18], // H1: y=1 horizontal
  [19, 20, 21, 22],        // H0: y=0 horizontal (base)
  [1, 7, 13],              // V_left: left vertical
  [6, 12, 18],             // V_right: right vertical
];

// JUMP_MAP: Record<"tigerNode,goatNode", landingNode>
// Derived from LINES — each consecutive triple (a, b, c) in a line gives:
//   jump from a over b → land on c
//   jump from c over b → land on a
export const JUMP_MAP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const line of LINES) {
    for (let i = 0; i < line.length - 2; i++) {
      const [a, b, c] = [line[i], line[i + 1], line[i + 2]];
      map[`${a},${b}`] = c;
      map[`${c},${b}`] = a;
    }
  }
  return map;
})();

/**
 * Look up the landing node for a tiger jump.
 * @param from - tiger's current node
 * @param over - goat's node (must be adjacent to from)
 * @returns landing node id, or undefined if no valid jump exists
 */
export function getJumpLanding(from: number, over: number): number | undefined {
  return JUMP_MAP[`${from},${over}`];
}
