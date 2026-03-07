interface TigerPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
  isGlowing?: boolean;
  draggable?: boolean;
  isBeingDragged?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function TigerPiece({
  x,
  y,
  isSelected,
  isGlowing,
  draggable,
  isBeingDragged,
  onPointerDown,
}: TigerPieceProps) {
  return (
    <g
      style={{
        pointerEvents: draggable ? 'auto' : 'none',
        touchAction: draggable ? 'none' : undefined,
      }}
      onPointerDown={onPointerDown}
    >
      <polygon
        transform={`translate(${x}, ${y}) rotate(45)`}
        points="-10,-10 10,-10 10,10 -10,10"
        fill="var(--tiger-fill)"
        stroke={isSelected ? 'var(--select-stroke)' : 'var(--tiger-stroke)'}
        strokeWidth={isSelected ? 3 : 1.5}
        style={{
          pointerEvents: 'none',
          transition: isBeingDragged
            ? 'none'
            : 'transform 350ms ease-in-out',
          transform: isBeingDragged
            ? `translate(${x}px, ${y}px) rotate(45deg) scale(1.2)`
            : undefined,
          filter: isBeingDragged
            ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
            : isGlowing
              ? 'drop-shadow(0 0 6px var(--tiger-fill))'
              : undefined,
          animation: isGlowing ? 'piece-glow 500ms ease-in-out' : undefined,
        }}
        data-testid="tiger-piece"
      />
      {/* Color-blind inner marker: cross pattern */}
      <line
        x1={-4}
        y1={0}
        x2={4}
        y2={0}
        stroke="var(--tiger-stroke)"
        strokeWidth={1.5}
        transform={`translate(${x}, ${y})`}
        style={{ pointerEvents: 'none' }}
      />
      <line
        x1={0}
        y1={-4}
        x2={0}
        y2={4}
        stroke="var(--tiger-stroke)"
        strokeWidth={1.5}
        transform={`translate(${x}, ${y})`}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
}
