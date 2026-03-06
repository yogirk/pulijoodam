interface GoatPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
}

export function GoatPiece({ x, y, isSelected }: GoatPieceProps) {
  return (
    <circle
      transform={`translate(${x}, ${y})`}
      r={9}
      fill="var(--goat-fill)"
      stroke={isSelected ? 'var(--select-stroke)' : 'var(--goat-stroke)'}
      strokeWidth={2}
      style={{ pointerEvents: 'none' }}
      data-testid="goat-piece"
    />
  );
}
