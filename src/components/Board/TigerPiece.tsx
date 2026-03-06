interface TigerPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
}

export function TigerPiece({ x, y, isSelected }: TigerPieceProps) {
  return (
    <polygon
      transform={`translate(${x}, ${y}) rotate(45)`}
      points="-10,-10 10,-10 10,10 -10,10"
      fill="var(--tiger-fill)"
      stroke={isSelected ? 'var(--select-stroke)' : 'var(--tiger-stroke)'}
      strokeWidth={isSelected ? 3 : 1.5}
      style={{ pointerEvents: 'none' }}
      data-testid="tiger-piece"
    />
  );
}
