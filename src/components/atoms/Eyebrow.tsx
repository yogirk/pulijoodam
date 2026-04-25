import type { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

/**
 * Small uppercase label. Used above sections, never as a heading —
 * for headings use a real h1/h2/h3 with .t-display.
 */
export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return <div className={`t-eyebrow ${className}`}>{children}</div>;
}
