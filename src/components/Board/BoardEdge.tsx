import { memo } from 'react';
import type { NodeDef } from '../../engine/board';

interface BoardEdgeProps {
  from: NodeDef;
  to: NodeDef;
}

export const BoardEdge = memo(function BoardEdge({ from, to }: BoardEdgeProps) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="var(--board-line)"
      strokeWidth="var(--board-line-width)"
    />
  );
});
