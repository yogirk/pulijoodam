interface TigerPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
  isGlowing?: boolean;
}

export function TigerPiece({ x, y, isSelected, isGlowing }: TigerPieceProps) {
  return (
    <polygon
      transform={`translate(${x}, ${y}) rotate(45)`}
      points="-10,-10 10,-10 10,10 -10,10"
      fill="var(--tiger-fill)"
      stroke={isSelected ? 'var(--select-stroke)' : 'var(--tiger-stroke)'}
      strokeWidth={isSelected ? 3 : 1.5}
      style={{
        pointerEvents: 'none',
        transition: 'transform 350ms ease-in-out',
        animation: isGlowing ? 'piece-glow 500ms ease-in-out' : undefined,
        filter: isGlowing ? 'drop-shadow(0 0 6px var(--tiger-fill))' : undefined,
      }}
      data-testid="tiger-piece"
    />
  );
}
