import { memo } from 'react';

interface TigerPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
  isGlowing?: boolean;
  draggable?: boolean;
  isBeingDragged?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const TigerPiece = memo(function TigerPiece({
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
      <g
        style={{
          pointerEvents: 'none',
          transition: isBeingDragged
            ? 'none'
            : 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isBeingDragged
            ? `translate(${x}px, ${y}px) scale(1.2)`
            : `translate(${x}px, ${y}px)`,
          filter: isBeingDragged
            ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.7))'
            : isGlowing
              ? 'drop-shadow(0 0 12px var(--tiger-fill))'
              : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
          animation: isGlowing ? 'piece-glow 500ms ease-in-out' : undefined,
        }}
        data-testid="tiger-piece"
      >
        {/* Selection Glow */}
        {isSelected && (
          <rect x={-18} y={-18} width={36} height={36} fill="var(--select-stroke)" opacity={0.3} transform="rotate(45)" rx={4} className="animate-pulse" />
        )}
        <g transform="rotate(45)">
          {/* Base Diamond */}
          <rect x={-13} y={-13} width={26} height={26} fill="var(--tiger-stroke)" rx={3} />
          {/* Inner Gem */}
          <rect x={-10.5} y={-10.5} width={21} height={21} fill="var(--tiger-fill)" rx={2} />
          {/* Top Highlight for 3D gem effect */}
          <path d="M -10 -10 L 10 -10 L 5 -5 L -5 -5 Z" fill="rgba(255,255,255,0.4)" />
          {/* Bottom Shadow inner */}
          <path d="M -10 10 L 10 10 L 5 5 L -5 5 Z" fill="rgba(0,0,0,0.2)" />
        </g>

        {/* Color-blind inner marker: cross pattern */}
        <line x1={-5} y1={0} x2={5} y2={0} stroke="var(--tiger-stroke)" strokeWidth={2} strokeLinecap="round" />
        <line x1={0} y1={-5} x2={0} y2={5} stroke="var(--tiger-stroke)" strokeWidth={2} strokeLinecap="round" />
      </g>
    </g>
  );
});
