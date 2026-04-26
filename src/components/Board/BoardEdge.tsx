import { memo } from 'react';
import type { NodeDef } from '../../engine/board';

interface BoardEdgeProps {
  from: NodeDef;
  to: NodeDef;
}

/**
 * Hairline carved edge between two intersections. A single rule-coloured
 * stroke — the dark-on-dark "deep groove" effect from the legacy theme
 * doesn't read on sandstone paper, and the design language calls for
 * one ink line per edge, not three stacked.
 */
export const BoardEdge = memo(function BoardEdge({ from, to }: BoardEdgeProps) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="var(--rule)"
      strokeWidth={1.2}
      strokeLinecap="round"
      opacity={0.62}
    />
  );
});
