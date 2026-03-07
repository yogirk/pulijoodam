import { useRef, useMemo, memo } from 'react';
import { NODES, EDGES } from '../../engine/board';
import type { GameState, LegalMove, GameEvent } from '../../engine';
import type { AnimationState } from '../../hooks/useAnimationQueue';
import { useDrag } from '../../hooks/useDrag';
import { BoardEdge } from './BoardEdge';
import { BoardNode } from './BoardNode';
import { TigerPiece } from './TigerPiece';
import { GoatPiece } from './GoatPiece';

interface StablePiece {
  id: string;
  type: 'tiger' | 'goat';
  nodeId: number;
}

function useStablePieces(board: (('tiger' | 'goat') | null)[]) {
  const piecesRef = useRef<StablePiece[]>([]);
  const nextGoatId = useRef(1);
  const nextTigerId = useRef(1);
  const prevBoard = useRef<(('tiger' | 'goat') | null)[]>([]);

  if (prevBoard.current !== board) {
    const pBoard = prevBoard.current;

    // First setup or complete reset
    if (pBoard.length === 0 || piecesRef.current.length === 0) {
      const initialPieces: StablePiece[] = [];
      board.forEach((p, idx) => {
        if (p === 'tiger') initialPieces.push({ id: `tiger-${nextTigerId.current++}`, type: 'tiger', nodeId: idx });
        else if (p === 'goat') initialPieces.push({ id: `goat-${nextGoatId.current++}`, type: 'goat', nodeId: idx });
      });
      piecesRef.current = initialPieces;
    } else {
      const missingNodes: { nodeId: number; type: 'tiger' | 'goat' }[] = [];
      const addedNodes: { nodeId: number; type: 'tiger' | 'goat' }[] = [];

      for (let i = 0; i < board.length; i++) {
        if (pBoard[i] !== board[i]) {
          if (pBoard[i]) missingNodes.push({ nodeId: i, type: pBoard[i] as 'tiger' | 'goat' });
          if (board[i]) addedNodes.push({ nodeId: i, type: board[i] as 'tiger' | 'goat' });
        }
      }

      const newPieces = [...piecesRef.current];

      missingNodes.forEach(missing => {
        const addedIdx = addedNodes.findIndex(a => a.type === missing.type);
        if (addedIdx !== -1) {
          // Move
          const added = addedNodes[addedIdx];
          const pIdx = newPieces.findIndex(p => p.nodeId === missing.nodeId && p.type === missing.type);
          if (pIdx !== -1) {
            newPieces[pIdx] = { ...newPieces[pIdx], nodeId: added.nodeId };
          }
          addedNodes.splice(addedIdx, 1);
        } else {
          // Capture / Removal
          const pIdx = newPieces.findIndex(p => p.nodeId === missing.nodeId && p.type === missing.type);
          if (pIdx !== -1) {
            newPieces.splice(pIdx, 1);
          }
        }
      });

      // Placements / Undo capture back to life
      addedNodes.forEach(added => {
        if (added.type === 'goat') {
          newPieces.push({ id: `goat-${nextGoatId.current++}`, type: 'goat', nodeId: added.nodeId });
        } else if (added.type === 'tiger') {
          newPieces.push({ id: `tiger-${nextTigerId.current++}`, type: 'tiger', nodeId: added.nodeId });
        }
      });

      piecesRef.current = newPieces;
    }
    prevBoard.current = board;
  }

  return piecesRef.current;
}

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

  // Track pieces stably across renders to enable smooth CSS slide animations
  const stablePieces = useStablePieces(gameState.board);

  return (
    <svg
      ref={svgRef}
      viewBox="-60 -60 720 540"
      style={{ width: '100%', height: '100%', maxWidth: 'none', touchAction: 'none' }}
      role="group"
      aria-label="Pulijoodam game board"
      data-testid="game-board"
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      className="drop-shadow-2xl"
    >
      {/* Layer 0: Physical Board Arena Surface */}
      <rect
        x="-30"
        y="-30"
        width="660"
        height="480"
        rx="24"
        fill="var(--bg-secondary)"
        stroke="var(--board-line)"
        strokeWidth="4"
        opacity={0.9}
        className="shadow-2xl"
      />
      {/* Inner decorative rim for the board base */}
      <rect
        x="-20"
        y="-20"
        width="640"
        height="460"
        rx="20"
        fill="transparent"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth="2"
      />

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

      {/* Layer 3: pieces (rendered on top of nodes, using stable IDs so they glide) */}
      <g className="pieces" style={isAnimating ? { pointerEvents: 'none' } : undefined}>
        {stablePieces.map((piece) => {
          const nodeId = piece.nodeId;
          const node = NODES[nodeId];

          // Check if this piece has an animation override position
          const animEntry = animationState?.animatingPieces.get(nodeId);

          // If this piece is being dragged, use drag position
          const isBeingDragged = isDragging && dragPieceId === nodeId && dragPos;
          const pieceX = isBeingDragged ? dragPos.x : animEntry ? animEntry.toX : node.x;
          const pieceY = isBeingDragged ? dragPos.y : animEntry ? animEntry.toY : node.y;

          const draggable = canDragPiece(nodeId);

          if (piece.type === 'tiger') {
            const tigerGlowing = animationState?.gameOverGlow === 'tiger-wins';
            return (
              <TigerPiece
                key={piece.id}
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
              key={piece.id}
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
