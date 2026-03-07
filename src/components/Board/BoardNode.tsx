import { memo } from 'react';
import type { Piece } from '../../engine/types';

interface BoardNodeProps {
  node: { id: number; x: number; y: number };
  piece?: Piece | null;
  isSelected: boolean;
  isLegalMove: boolean;
  onClick: () => void;
}

function buildAriaLabel(
  nodeId: number,
  piece: Piece | null | undefined,
  isSelected: boolean,
  isLegalMove: boolean,
): string {
  const parts: string[] = [`Node ${nodeId}`];

  if (piece) {
    parts.push(piece);
  } else {
    parts.push('empty');
  }

  if (isSelected) {
    parts.push('selected');
  }

  if (isLegalMove) {
    parts.push('legal move');
  }

  return parts.join(', ');
}

export const BoardNode = memo(function BoardNode({ node, piece, isSelected, isLegalMove, onClick }: BoardNodeProps) {
  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={buildAriaLabel(node.id, piece, isSelected, isLegalMove)}
    >
      {/* Visual node circle */}
      <circle
        r={8}
        fill={isSelected ? 'var(--node-selected)' : 'var(--node-fill)'}
      />

      {/* Legal move highlight ring */}
      {isLegalMove && (
        <circle
          r={16}
          fill="none"
          stroke="var(--legal-move-stroke)"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* MANDATORY 44x44 hit area -- MUST be last (top z-order) to capture clicks */}
      <rect
        x={-22}
        y={-22}
        width={44}
        height={44}
        fill="transparent"
        data-testid={`node-hitarea-${node.id}`}
      />
    </g>
  );
});
