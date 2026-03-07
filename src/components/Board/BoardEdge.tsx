import { memo } from 'react';
import type { NodeDef } from '../../engine/board';

interface BoardEdgeProps {
  from: NodeDef;
  to: NodeDef;
}

export const BoardEdge = memo(function BoardEdge({ from, to }: BoardEdgeProps) {
  return (
    <g>
      {/* Groove Ridge / Highlight */}
      <line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="6"
        transform="translate(0, 1)"
      />
      {/* Deep Carved Shadow (Inner depth) */}
      <line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="6"
      />
      {/* Base Groove Line */}
      <line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke="var(--board-line)"
        strokeWidth="3"
        opacity="0.9"
      />
    </g>
  );
});
