import { useCallback, useRef, useState } from 'react';
import { NODES } from '../engine/board';
import type { Piece, Phase, Role, LegalMove } from '../engine/types';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Minimum SVG-unit movement before drag activates (below = tap) */
export const DRAG_THRESHOLD = 5;

/** Maximum distance (SVG units) from a valid node to snap on drop */
export const SNAP_RADIUS = 30;

// ─── Pure helpers (exported for testing) ────────────────────────────────────

/**
 * Find the nearest node to (x, y) — Voronoi-style tap resolution.
 * Used for empty-space taps on the SVG so every pixel maps to exactly
 * one node, eliminating the overlap that earlier per-node hit rects had
 * in dense rows. The engine validates the resulting tap (turn, phase,
 * legal target); we just resolve which node the user *meant*.
 */
export function findNearestNode(x: number, y: number): number {
  let bestId = 0;
  let bestDist = Infinity;
  for (const node of NODES) {
    const dx = node.x - x;
    const dy = node.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = node.id;
    }
  }
  return bestId;
}

/**
 * Find the nearest legal-move destination node within SNAP_RADIUS of (x, y).
 * Returns node id or null if none found.
 */
export function findNearestValidNode(
  x: number,
  y: number,
  fromNodeId: number,
  legalMoves: LegalMove[],
): number | null {
  // Collect valid destination node ids from the dragged piece's source
  const validDestinations = new Set<number>();
  for (const lm of legalMoves) {
    if (lm.from === fromNodeId && lm.to !== undefined) {
      validDestinations.add(lm.to);
    }
  }

  let bestId: number | null = null;
  let bestDist = SNAP_RADIUS + 1;

  for (const destId of validDestinations) {
    const node = NODES[destId];
    const dx = node.x - x;
    const dy = node.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= SNAP_RADIUS && dist < bestDist) {
      bestDist = dist;
      bestId = destId;
    }
  }

  return bestId;
}

// ─── Screen-to-SVG coordinate conversion ────────────────────────────────────

function screenToSVG(
  svg: SVGSVGElement,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: screenX, y: screenY };
  const pt = new DOMPoint(screenX, screenY);
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseDragOptions {
  svgRef: React.RefObject<SVGSVGElement | null>;
  board: (Piece | null)[];
  phase: Phase;
  currentTurn: Role;
  legalMoves: LegalMove[];
  onNodeTap: (id: number) => void;
  disabled: boolean;
}

interface DragState {
  isDragging: boolean;
  dragPieceId: number | null;
  dragPos: { x: number; y: number } | null;
}

const INITIAL_STATE: DragState = {
  isDragging: false,
  dragPieceId: null,
  dragPos: null,
};

export function useDrag({
  svgRef,
  board,
  phase,
  currentTurn,
  legalMoves,
  onNodeTap,
  disabled,
}: UseDragOptions) {
  const [dragState, setDragState] = useState<DragState>(INITIAL_STATE);

  // Refs to track drag session without re-renders
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragNodeRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const onPointerDown = useCallback(
    (nodeId: number, e: React.PointerEvent) => {
      if (disabled) return;

      const svg = svgRef.current;
      if (!svg) return;

      const piece = board[nodeId];
      if (!piece) return;

      // Goat placement stays tap-only: goat's turn in placement phase, empty node targets
      if (phase === 'placement' && currentTurn === 'goat') {
        return;
      }

      // Only the current turn's pieces can be dragged (or chain-hop tiger)
      if (piece !== currentTurn) return;

      // Piece must have legal moves from this node
      const hasMovesFrom = legalMoves.some(lm => lm.from === nodeId);
      if (!hasMovesFrom) return;

      // Capture pointer for reliable tracking even when cursor leaves element
      (e.target as Element).setPointerCapture(e.pointerId);

      const svgPos = screenToSVG(svg, e.clientX, e.clientY);
      startPosRef.current = svgPos;
      dragNodeRef.current = nodeId;
      isDraggingRef.current = false;

      setDragState({
        isDragging: false,
        dragPieceId: nodeId,
        dragPos: null,
      });
    },
    [disabled, svgRef, board, phase, currentTurn, legalMoves],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragNodeRef.current === null || !startPosRef.current) return;

      const svg = svgRef.current;
      if (!svg) return;

      const svgPos = screenToSVG(svg, e.clientX, e.clientY);
      const dx = svgPos.x - startPosRef.current.x;
      const dy = svgPos.y - startPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!isDraggingRef.current && dist < DRAG_THRESHOLD) {
        // Still under threshold -- don't start drag
        return;
      }

      isDraggingRef.current = true;
      setDragState({
        isDragging: true,
        dragPieceId: dragNodeRef.current,
        dragPos: svgPos,
      });
    },
    [svgRef],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const nodeId = dragNodeRef.current;

      // Empty-space tap: pointerdown didn't grab a piece. Resolve the
      // tap to the nearest node by Euclidean distance (Voronoi).
      if (nodeId === null) {
        if (disabled) return;
        const svg = svgRef.current;
        if (!svg) return;
        const svgPos = screenToSVG(svg, e.clientX, e.clientY);
        onNodeTap(findNearestNode(svgPos.x, svgPos.y));
        return;
      }

      // Release pointer capture
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may have already been released
      }

      if (!isDraggingRef.current) {
        // Under threshold -- treat as tap
        onNodeTap(nodeId);
      } else {
        // Drag completed -- find nearest valid drop target
        const svg = svgRef.current;
        if (svg) {
          const svgPos = screenToSVG(svg, e.clientX, e.clientY);
          const targetNode = findNearestValidNode(
            svgPos.x,
            svgPos.y,
            nodeId,
            legalMoves,
          );
          if (targetNode !== null) {
            // Reuse tap-tap flow: select piece, then select destination
            onNodeTap(nodeId);
            onNodeTap(targetNode);
          }
          // If targetNode is null, piece snaps back (cancel) -- no action needed
        }
      }

      // Reset drag state
      startPosRef.current = null;
      dragNodeRef.current = null;
      isDraggingRef.current = false;
      setDragState(INITIAL_STATE);
    },
    [svgRef, legalMoves, onNodeTap, disabled],
  );

  return {
    isDragging: dragState.isDragging,
    dragPieceId: dragState.dragPieceId,
    dragPos: dragState.dragPos,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
