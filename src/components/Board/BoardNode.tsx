interface BoardNodeProps {
  node: { id: number; x: number; y: number };
  isSelected: boolean;
  isLegalMove: boolean;
  onClick: () => void;
}

export function BoardNode({ node, isSelected, isLegalMove, onClick }: BoardNodeProps) {
  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Node ${node.id}`}
    >
      {/* Visual node circle */}
      <circle r={8} fill={isSelected ? '#f59e0b' : '#374151'} />

      {/* Legal move highlight ring */}
      {isLegalMove && (
        <circle
          r={16}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* MANDATORY 44×44 hit area — MUST be last (top z-order) to capture clicks */}
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
}
