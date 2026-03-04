// Pulijoodam board topology
// 23-node graph: triangle (nodes 0–3) over a 5×4 grid (nodes 4–22)
// Coordinates are in SVG viewBox 0 0 600 700

export interface NodeDef {
  id: number;
  label: string;
  x: number;
  y: number;
  adj: number[];
}

// Canonical node definitions — adjacency lists must match specs/board-graph.md exactly
export const NODES: NodeDef[] = [
  // Triangle section
  { id:  0, label: 'Apex',     x: 300, y:  50, adj: [1, 2, 3] },
  { id:  1, label: 'Row1_L',   x: 200, y: 150, adj: [0, 2, 6] },
  { id:  2, label: 'Row1_M',   x: 300, y: 150, adj: [0, 1, 3, 7] },
  { id:  3, label: 'Row1_R',   x: 400, y: 150, adj: [0, 2, 8] },
  // Grid row 1
  { id:  4, label: 'G_R1_C1',  x: 100, y: 250, adj: [5, 9] },
  { id:  5, label: 'G_R1_C2',  x: 200, y: 250, adj: [4, 6, 10] },
  { id:  6, label: 'G_R1_C3',  x: 300, y: 250, adj: [1, 5, 7, 11] },
  { id:  7, label: 'G_R1_C4',  x: 400, y: 250, adj: [2, 6, 8, 12] },
  { id:  8, label: 'G_R1_C5',  x: 500, y: 250, adj: [3, 7, 13] },
  // Grid row 2
  { id:  9, label: 'G_R2_C1',  x: 100, y: 350, adj: [4, 10, 14] },
  { id: 10, label: 'G_R2_C2',  x: 200, y: 350, adj: [5, 9, 11, 15] },
  { id: 11, label: 'G_R2_C3',  x: 300, y: 350, adj: [6, 10, 12, 16] },
  { id: 12, label: 'G_R2_C4',  x: 400, y: 350, adj: [7, 11, 13, 17] },
  { id: 13, label: 'G_R2_C5',  x: 500, y: 350, adj: [8, 12, 18] },
  // Grid row 3
  { id: 14, label: 'G_R3_C1',  x: 100, y: 450, adj: [9, 15, 19] },
  { id: 15, label: 'G_R3_C2',  x: 200, y: 450, adj: [10, 14, 16, 20] },
  { id: 16, label: 'G_R3_C3',  x: 300, y: 450, adj: [11, 15, 17, 21] },
  { id: 17, label: 'G_R3_C4',  x: 400, y: 450, adj: [12, 16, 18, 22] },
  { id: 18, label: 'G_R3_C5',  x: 500, y: 450, adj: [13, 17] },
  // Grid row 4 (4 nodes, col 1-4)
  { id: 19, label: 'G_R4_C1',  x: 100, y: 550, adj: [14, 20] },
  { id: 20, label: 'G_R4_C2',  x: 200, y: 550, adj: [15, 19, 21] },
  { id: 21, label: 'G_R4_C3',  x: 300, y: 550, adj: [16, 20, 22] },
  { id: 22, label: 'G_R4_C4',  x: 400, y: 550, adj: [17, 21] },
];

// EDGES: unique undirected pairs for rendering board lines
// Include each pair only once using nodeA.id < nodeB.id guard
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

// JUMP_MAP: Record<"tigerNode,goatNode", landingNode>
// Derived at module load time using the coordinate+adjacency algorithm:
//   For each node A, for each neighbor B in A.adj:
//     compute dx = B.x - A.x, dy = B.y - A.y
//     candidate C coords = (B.x + dx, B.y + dy)
//     find nodeC where coordinates match exactly
//     only store if nodeC.id is in B.adj (adjacency guard)
//
// The adjacency guard is required because this hybrid topology (triangle over grid)
// has non-collinear adjacency edges. Coordinate matching finds the geometric candidate;
// adjacency guard confirms it's a valid board line.
export const JUMP_MAP: Record<string, number> = (() => {
  const map: Record<string, number> = {};

  // Build a coordinate lookup for fast node search
  const coordLookup = new Map<string, number>();
  for (const node of NODES) {
    coordLookup.set(`${node.x},${node.y}`, node.id);
  }

  for (const nodeA of NODES) {
    for (const bId of nodeA.adj) {
      const nodeB = NODES[bId];
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const cx = nodeB.x + dx;
      const cy = nodeB.y + dy;

      const cId = coordLookup.get(`${cx},${cy}`);
      if (cId !== undefined && nodeB.adj.includes(cId)) {
        // Coordinate match + adjacency guard: valid jump
        map[`${nodeA.id},${nodeB.id}`] = cId;
      }
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
