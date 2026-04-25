import type { Role } from '../../engine';

interface PieceGlyphProps {
  type: Role;
  size?: number;
}

/**
 * Decorative piece glyph for use in headers, rails, and selection cards.
 * Uses the same token system as the on-board pieces but stripped of all
 * gameplay state (no selection, no glow, no shadow). Always renders the
 * "carved stone" variant — the rail is a brand surface, not a customisable
 * gameplay surface.
 */
export function PieceGlyph({ type, size = 32 }: PieceGlyphProps) {
  if (type === 'tiger') {
    return (
      <svg width={size} height={size} viewBox="-15 -15 30 30" aria-hidden="true">
        <circle r={12.4} fill="var(--tiger-stroke)" opacity={0.85} />
        <circle r={11.6} fill="var(--tiger-fill)" />
        <circle cx={-2.5} cy={-2.5} r={9.5} fill="var(--tiger-mark)" opacity={0.07} />
        <circle r={9.5} fill="none" stroke="var(--tiger-stroke)" strokeWidth={0.6} opacity={0.55} />
        <g fill="var(--tiger-mark)" opacity={0.95}>
          <path d="M -3.5 1.5 Q -4.6 5.5 0 6.4 Q 4.6 5.5 3.5 1.5 Q 2.4 -0.6 0 -0.4 Q -2.4 -0.6 -3.5 1.5 Z" />
          <ellipse cx={-4.6} cy={-2.6} rx={1.2} ry={1.5} />
          <ellipse cx={-1.6} cy={-4.4} rx={1.25} ry={1.55} />
          <ellipse cx={1.6} cy={-4.4} rx={1.25} ry={1.55} />
          <ellipse cx={4.6} cy={-2.6} rx={1.2} ry={1.5} />
        </g>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="-15 -15 30 30" aria-hidden="true">
      <circle r={10.5} fill="var(--goat-stroke)" opacity={0.7} />
      <circle r={9.8} fill="var(--goat-fill)" />
      <circle cx={-2} cy={-2} r={8} fill="#ffffff" opacity={0.18} />
      <circle r={7.8} fill="none" stroke="var(--goat-stroke)" strokeWidth={0.5} opacity={0.45} />
      <path
        d="M -3.5 -3 Q -5 0 -3 3 Q 0 4.5 3 3 Q 5 0 3.5 -3"
        fill="none"
        stroke="var(--goat-mark)"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle cx={0} cy={-1} r={0.9} fill="var(--goat-mark)" opacity={0.7} />
    </svg>
  );
}
