import { useRef, useMemo, memo } from 'react';
import { NODES, EDGES } from '../../engine/board';
import type { GameState, LegalMove, GameEvent } from '../../engine';
import type { AnimationState } from '../../hooks/useAnimationQueue';
import { useDrag } from '../../hooks/useDrag';
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
  animationState?: AnimationState;
  lastEvents?: GameEvent[];
}

export const Board = memo(function Board({
  gameState,
  selectedNode,
  legalMoves,
  onNodeTap,
  chainJumpInProgress,
  animationState,
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isAnimating = animationState?.isAnimating ?? false;

  // Drag-to-move hook
  const { isDragging, dragPieceId, dragPos, handlers } = useDrag({
    svgRef,
    board: gameState.board,
    phase: gameState.phase,
    currentTurn: gameState.currentTurn,
    legalMoves,
    onNodeTap,
    disabled: isAnimating,
  });

  // Memoize the highlighted nodes set to prevent unnecessary recomputation
  const highlightedNodes = useMemo(() => {
    const set = new Set<number>();

    if (selectedNode !== null) {
      for (const lm of legalMoves) {
        if (lm.from === selectedNode && lm.to !== undefined) {
          set.add(lm.to);
        }
      }
    } else if (chainJumpInProgress !== null) {
      // Mid chain-hop: highlight all capture destinations
      for (const lm of legalMoves) {
        if (lm.move.type === 'CAPTURE' && lm.to !== undefined) {
          set.add(lm.to);
        }
      }
    }

    // During placement, highlight all valid placement spots for goat
    const showPlacementHints =
      gameState.phase === 'placement' &&
      selectedNode === null &&
      gameState.currentTurn === 'goat';

    if (showPlacementHints) {
      for (const lm of legalMoves) {
        if (lm.to !== undefined) {
          set.add(lm.to);
        }
      }
    }

    return set;
  }, [selectedNode, chainJumpInProgress, legalMoves, gameState.phase, gameState.currentTurn]);

  // Determine which pieces are draggable (movement phase, own turn, has legal moves)
  const canDragPiece = (nodeId: number): boolean => {
    if (isAnimating) return false;
    const piece = gameState.board[nodeId];
    if (!piece) return false;
    // Goat placement is tap-only
    if (gameState.phase === 'placement' && gameState.currentTurn === 'goat') return false;
    // Only current turn's pieces
    if (piece !== gameState.currentTurn) return false;
    // Must have legal moves from this node
    return legalMoves.some(lm => lm.from === nodeId);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 380"
      style={{ width: '100%', height: '100%', maxWidth: '600px' }}
      role="img"
      aria-label="Pulijoodam game board"
      data-testid="game-board"
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
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
      <g className="nodes" style={isAnimating ? { pointerEvents: 'none' } : undefined}>
        {NODES.map(node => (
          <BoardNode
            key={`node-${node.id}`}
            node={node}
            piece={gameState.board[node.id]}
            isSelected={selectedNode === node.id}
            isLegalMove={highlightedNodes.has(node.id)}
            onClick={() => onNodeTap(node.id)}
          />
        ))}
      </g>

      {/* Layer 3: pieces (rendered on top of nodes) */}
      <g className="pieces" style={isAnimating ? { pointerEvents: 'none' } : undefined}>
        {gameState.board.map((piece, nodeId) => {
          if (piece === null) return null;
          const node = NODES[nodeId];

          // Check if this piece has an animation override position
          const animEntry = animationState?.animatingPieces.get(nodeId);

          // If this piece is being dragged, use drag position
          const isBeingDragged = isDragging && dragPieceId === nodeId && dragPos;
          const pieceX = isBeingDragged ? dragPos.x : animEntry ? animEntry.toX : node.x;
          const pieceY = isBeingDragged ? dragPos.y : animEntry ? animEntry.toY : node.y;

          const draggable = canDragPiece(nodeId);

          if (piece === 'tiger') {
            const tigerGlowing =
              animationState?.gameOverGlow === 'tiger-wins';
            return (
              <TigerPiece
                key={`tiger-${nodeId}`}
                x={pieceX}
                y={pieceY}
                isSelected={selectedNode === nodeId}
                isGlowing={tigerGlowing}
                draggable={draggable}
                isBeingDragged={!!isBeingDragged}
                onPointerDown={draggable ? (e: React.PointerEvent) => handlers.onPointerDown(nodeId, e) : undefined}
              />
            );
          }
          return (
            <GoatPiece
              key={`goat-${nodeId}`}
              x={pieceX}
              y={pieceY}
              isSelected={selectedNode === nodeId}
              isFading={animationState?.fadingGoat === nodeId}
              isPlacing={animationState?.placingGoat === nodeId}
              isGlowing={animationState?.gameOverGlow === 'goat-wins'}
              draggable={draggable}
              isBeingDragged={!!isBeingDragged}
              onPointerDown={draggable ? (e: React.PointerEvent) => handlers.onPointerDown(nodeId, e) : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
});
