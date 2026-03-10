// Algebraic node naming for Pulijoodam board positions.
// Names are derived programmatically from the NODES array by sorting nodes
// into rows (by Y coordinate) then columns (by X coordinate within each row).
// Row letters: a, b, c, ... Column numbers: 1, 2, 3, ...

import { NODES } from '../engine/board';

/** Group board nodes into rows sorted by Y then X. Shared by nodeNames and positionString. */
export function getNodeRows(): number[][] {
  const rowMap = new Map<number, number[]>();
  for (const node of NODES) {
    const ids = rowMap.get(node.y) ?? [];
    ids.push(node.id);
    rowMap.set(node.y, ids);
  }

  const sortedYs = [...rowMap.keys()].sort((a, b) => a - b);
  return sortedYs.map(y => {
    const ids = rowMap.get(y)!;
    ids.sort((a, b) => NODES[a].x - NODES[b].x);
    return ids;
  });
}

const NODE_ROWS = getNodeRows();

function buildMappings(): { nodeToName: string[]; nameToNode: Record<string, number> } {
  const nodeToName: string[] = new Array(NODES.length).fill('');
  const nameToNode: Record<string, number> = {};

  for (let rowIdx = 0; rowIdx < NODE_ROWS.length; rowIdx++) {
    const rowLetter = String.fromCharCode(97 + rowIdx); // 'a', 'b', 'c', ...
    const nodeIds = NODE_ROWS[rowIdx];

    for (let colIdx = 0; colIdx < nodeIds.length; colIdx++) {
      const id = nodeIds[colIdx];
      const name = `${rowLetter}${colIdx + 1}`;
      nodeToName[id] = name;
      nameToNode[name] = id;
    }
  }

  return { nodeToName, nameToNode };
}

const mappings = buildMappings();

/** Maps node ID (index) to algebraic name (e.g., NODE_TO_NAME[0] = 'a1') */
export const NODE_TO_NAME: string[] = mappings.nodeToName;

/** Maps algebraic name to node ID */
export const NAME_TO_NODE: Record<string, number> = mappings.nameToNode;

/** Convert node ID to algebraic name with bounds checking */
export function nodeToName(id: number): string {
  if (!Number.isInteger(id) || id < 0 || id >= NODE_TO_NAME.length) {
    throw new Error(`Invalid node ID: ${id}`);
  }
  return NODE_TO_NAME[id];
}

/** Convert algebraic name to node ID with validation */
export function nameToNode(name: string): number {
  const id = NAME_TO_NODE[name];
  if (id === undefined) {
    throw new Error(`Invalid node name: "${name}"`);
  }
  return id;
}
