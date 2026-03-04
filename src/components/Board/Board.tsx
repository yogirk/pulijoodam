import { NODES, EDGES } from '../../engine/board';
import type { GameState, LegalMove } from '../../engine';
import { BoardEdge } from './BoardEdge';
import { BoardNode } from './BoardNode';
import { TigerPiece } from './TigerPiece';
import { GoatPiece } from './GoatPiece';

interface BoardProps {
  gameState: GameState;
  selectedNode: number | null;
  legalMoves: LegalMove[];
  onNodeTap: (id: number) => void;
  chainJumpInProgress: number | null;
}

export function Board({
  gameState,
  selectedNode,
  legalMoves,
  onNodeTap,
  chainJumpInProgress,
}: BoardProps) {
  // Build a fast lookup set of legal move destination node IDs
  const legalMoveTo = new Set(
    legalMoves
      .filter(lm => lm.to !== undefined)
      .map(lm => lm.to as number)
  );

  // When a piece is selected, only highlight destinations reachable from it
  // (not all legal move destinations across the board)
  const highlightedNodes = new Set<number>();
  if (selectedNode !== null) {
    for (const lm of legalMoves) {
      if (lm.from === selectedNode && lm.to !== undefined) {
        highlightedNodes.add(lm.to);
      }
    }
  } else if (chainJumpInProgress !== null) {
    // Mid chain-hop: highlight all capture destinations
    for (const lm of legalMoves) {
      if (lm.move.type === 'CAPTURE' && lm.to !== undefined) {
        highlightedNodes.add(lm.to);
      }
    }
  }

  // During placement, highlight all valid placement spots for goat
  const showPlacementHints =
    gameState.phase === 'placement' &&
    selectedNode === null &&
    gameState.currentTurn === 'goat';

  if (showPlacementHints) {
    for (const nodeId of legalMoveTo) {
      highlightedNodes.add(nodeId);
    }
  }

  return (
    <svg
      viewBox="0 0 600 380"
      style={{ width: '100%', height: '100%', maxWidth: '600px' }}
      role="img"
      aria-label="Pulijoodam game board"
      data-testid="game-board"
    >
      {/* Layer 1: edges */}
      <g className="edges">
        {EDGES.map(([fromId, toId]) => (
          <BoardEdge
            key={`edge-${fromId}-${toId}`}
            from={NODES[fromId]}
            to={NODES[toId]}
          />
        ))}
      </g>

      {/* Layer 2: nodes (intersection circles + hit areas) */}
      <g className="nodes">
        {NODES.map(node => (
          <BoardNode
            key={`node-${node.id}`}
            node={node}
            isSelected={selectedNode === node.id}
            isLegalMove={highlightedNodes.has(node.id)}
            onClick={() => onNodeTap(node.id)}
          />
        ))}
      </g>

      {/* Layer 3: pieces (rendered on top of nodes) */}
      <g className="pieces">
        {gameState.board.map((piece, nodeId) => {
          if (piece === null) return null;
          const node = NODES[nodeId];
          if (piece === 'tiger') {
            return (
              <TigerPiece
                key={`tiger-${nodeId}`}
                x={node.x}
                y={node.y}
                isSelected={selectedNode === nodeId}
              />
            );
          }
          return (
            <GoatPiece
              key={`goat-${nodeId}`}
              x={node.x}
              y={node.y}
              isSelected={selectedNode === nodeId}
            />
          );
        })}
      </g>
    </svg>
  );
}
