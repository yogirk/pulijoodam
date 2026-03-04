import type { NodeDef } from '../../engine/board';

interface BoardEdgeProps {
  from: NodeDef;
  to: NodeDef;
}

export function BoardEdge({ from, to }: BoardEdgeProps) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="#6b7280"
      strokeWidth={2}
    />
  );
}
