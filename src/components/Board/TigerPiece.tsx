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

/**
 * Carved Stone — premium default.
 * Disk with subtle layered fills to fake stone depth, an embossed
 * pawprint mark, and a soft cast shadow. No SVG gradients (perf,
 * theme-token portability). Designed to read at 40px viewport size.
 */
function StoneTiger() {
  return (
    <>
      {/* Cast shadow */}
      <ellipse cx={0} cy={12} rx={10} ry={2.4} fill="rgba(0,0,0,0.22)" />
      {/* Outer rim — slightly larger, darker */}
      <circle r={12.4} fill="var(--tiger-stroke)" opacity={0.85} />
      {/* Main disk */}
      <circle r={11.6} fill="var(--tiger-fill)" />
      {/* Top-left highlight (light from above) */}
      <circle cx={-2.5} cy={-2.5} r={9.5} fill="var(--tiger-mark)" opacity={0.07} />
      {/* Bottom-right inner shadow */}
      <circle cx={2.5} cy={2.5} r={9.5} fill="var(--tiger-stroke)" opacity={0.18} />
      {/* Inner carved ring */}
      <circle r={9.5} fill="none" stroke="var(--tiger-stroke)" strokeWidth={0.6} opacity={0.55} />
      {/* Embossed pawprint — single palm pad + four toe pads */}
      <g fill="var(--tiger-mark)" opacity={0.95}>
        {/* Palm pad — broad teardrop */}
        <path d="M -3.5 1.5 Q -4.6 5.5 0 6.4 Q 4.6 5.5 3.5 1.5 Q 2.4 -0.6 0 -0.4 Q -2.4 -0.6 -3.5 1.5 Z" />
        {/* Toe pads — four small ovals arched above palm */}
        <ellipse cx={-4.6} cy={-2.6} rx={1.2} ry={1.5} />
        <ellipse cx={-1.6} cy={-4.4} rx={1.25} ry={1.55} />
        <ellipse cx={1.6}  cy={-4.4} rx={1.25} ry={1.55} />
        <ellipse cx={4.6}  cy={-2.6} rx={1.2} ry={1.5} />
      </g>
      {/* Subtle highlight on top edge of palm pad — emboss */}
      <path
        d="M -3.0 0.3 Q -3.7 -0.1 -2.4 -0.3 Q 0 -0.6 2.4 -0.3 Q 3.7 -0.1 3.0 0.3"
        fill="none"
        stroke="var(--tiger-mark)"
        strokeWidth={0.5}
        opacity={0.35}
        strokeLinecap="round"
      />
    </>
  );
}

/**
 * Animal Heads — geometric tiger silhouette.
 * Bold shape, two ear triangles, two dark eyes, single nose dot.
 * No whiskers (whiskers always read cartoon at this scale).
 */
function HeadTiger() {
  return (
    <>
      {/* Cast shadow */}
      <ellipse cx={0} cy={12} rx={9} ry={2} fill="rgba(0,0,0,0.20)" />
      {/* Ears — outer */}
      <path d="M -10 -7 L -8.5 -13 L -4.5 -9 Z" fill="var(--tiger-stroke)" />
      <path d="M  10 -7 L  8.5 -13 L  4.5 -9 Z" fill="var(--tiger-stroke)" />
      {/* Ears — inner notch */}
      <path d="M -8.5 -8.5 L -7.5 -11.5 L -5.8 -9.2 Z" fill="var(--tiger-mark)" opacity={0.55} />
      <path d="M  8.5 -8.5 L  7.5 -11.5 L  5.8 -9.2 Z" fill="var(--tiger-mark)" opacity={0.55} />
      {/* Skull silhouette — rounded triangle */}
      <path
        d="M -10 -5
           Q -10.5 5  -7 9
           Q  0 12   7 9
           Q  10.5 5 10 -5
           Q  6 -9  0 -9
           Q -6 -9 -10 -5 Z"
        fill="var(--tiger-fill)"
        stroke="var(--tiger-stroke)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Forehead stripe — single carved mark */}
      <path d="M 0 -7 L 0 -3.5" stroke="var(--tiger-stroke)" strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <path d="M -2.6 -6.5 L -1.6 -3.5" stroke="var(--tiger-stroke)" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      <path d="M  2.6 -6.5 L  1.6 -3.5" stroke="var(--tiger-stroke)" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      {/* Eyes — almond, dark */}
      <ellipse cx={-3.6} cy={-0.5} rx={1.6} ry={1.2} fill="var(--tiger-stroke)" />
      <ellipse cx={ 3.6} cy={-0.5} rx={1.6} ry={1.2} fill="var(--tiger-stroke)" />
      {/* Nose */}
      <path d="M -1.6 4 Q 0 3 1.6 4 Q 0 5.4 -1.6 4 Z" fill="var(--tiger-stroke)" />
      {/* Mouth split */}
      <path d="M 0 5.4 L 0 7" stroke="var(--tiger-stroke)" strokeWidth={0.7} strokeLinecap="round" opacity={0.7} />
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
            ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.45))'
            : isGlowing
              ? 'drop-shadow(0 0 12px var(--tiger-fill))'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.28))',
          animation: isGlowing ? 'piece-glow 500ms ease-in-out' : undefined,
        }}
        data-testid="tiger-piece"
      >
        {/* Selection ring — static, dashed ochre */}
        {isSelected && (
          <circle
            r={16}
            fill="none"
            stroke="var(--select-stroke)"
            strokeWidth={1.5}
            strokeDasharray="2 3"
            opacity={0.85}
          />
        )}
        {pieceStyle === 'heads' ? <HeadTiger /> : <StoneTiger />}
      </g>
    </g>
  );
});
