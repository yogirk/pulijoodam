import { memo } from 'react';
import { useSettings } from '../../hooks/useSettings';

interface TigerPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
  isGlowing?: boolean;
  draggable?: boolean;
  isBeingDragged?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

/** Classic diamond/gem shape */
function ClassicTiger() {
  return (
    <>
      <g transform="rotate(45)">
        <rect x={-13} y={-13} width={26} height={26} fill="var(--tiger-stroke)" rx={3} />
        <rect x={-10.5} y={-10.5} width={21} height={21} fill="var(--tiger-fill)" rx={2} />
        <path d="M -10 -10 L 10 -10 L 5 -5 L -5 -5 Z" fill="rgba(255,255,255,0.4)" />
        <path d="M -10 10 L 10 10 L 5 5 L -5 5 Z" fill="rgba(0,0,0,0.2)" />
      </g>
      <line x1={-5} y1={0} x2={5} y2={0} stroke="var(--tiger-stroke)" strokeWidth={2} strokeLinecap="round" />
      <line x1={0} y1={-5} x2={0} y2={5} stroke="var(--tiger-stroke)" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

/** Style D: Rounded tiger face with ears, stripes, eyes, nose, and mouth */
function CharacterTiger() {
  return (
    <>
      {/* Round head */}
      <circle cx={0} cy={1} r={11} fill="var(--tiger-fill)" stroke="var(--tiger-stroke)" strokeWidth={1.2} />
      {/* Ears */}
      <path d="M-8,-8 L-11,-14 L-4,-10 Z" fill="var(--tiger-fill)" stroke="var(--tiger-stroke)" strokeWidth={1} strokeLinejoin="round" />
      <path d="M8,-8 L11,-14 L4,-10 Z" fill="var(--tiger-fill)" stroke="var(--tiger-stroke)" strokeWidth={1} strokeLinejoin="round" />
      {/* Inner ears */}
      <path d="M-7,-8 L-9,-12 L-5,-9 Z" fill="var(--tiger-stroke)" />
      <path d="M7,-8 L9,-12 L5,-9 Z" fill="var(--tiger-stroke)" />
      {/* Muzzle area */}
      <ellipse cx={0} cy={5} rx={6} ry={4.5} fill="var(--tiger-fill)" opacity={0.6} />
      {/* Eyes */}
      <ellipse cx={-4} cy={-1} rx={1.5} ry={2} fill="var(--bg-primary, #111827)" />
      <circle cx={-3.5} cy={-1.5} r={0.6} fill="var(--tiger-fill)" />
      <ellipse cx={4} cy={-1} rx={1.5} ry={2} fill="var(--bg-primary, #111827)" />
      <circle cx={4.5} cy={-1.5} r={0.6} fill="var(--tiger-fill)" />
      {/* Nose */}
      <path d="M-2,3.5 Q0,2 2,3.5 Q0,5 -2,3.5 Z" fill="var(--tiger-stroke)" />
      {/* Mouth */}
      <path d="M0,5 L0,6 M-2,6.5 Q0,8 2,6.5" stroke="var(--tiger-stroke)" strokeWidth={0.7} fill="none" strokeLinecap="round" />
      {/* Forehead stripes */}
      <path d="M0,-10 L0,-6" stroke="var(--tiger-stroke)" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M-3,-9 L-2,-6" stroke="var(--tiger-stroke)" strokeWidth={1} strokeLinecap="round" />
      <path d="M3,-9 L2,-6" stroke="var(--tiger-stroke)" strokeWidth={1} strokeLinecap="round" />
    </>
  );
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
  const { pieceStyle } = useSettings();

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
          pieceStyle === 'character'
            ? <circle r={16} fill="var(--select-stroke)" opacity={0.3} className="animate-pulse" />
            : <rect x={-18} y={-18} width={36} height={36} fill="var(--select-stroke)" opacity={0.3} transform="rotate(45)" rx={4} className="animate-pulse" />
        )}
        {pieceStyle === 'character' ? <CharacterTiger /> : <ClassicTiger />}
      </g>
    </g>
  );
});
