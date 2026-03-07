interface PoolCounterProps {
  label: string;
  count: number;
  visible?: boolean;
}

export function PoolCounter({ label, count, visible = true }: PoolCounterProps) {
  if (!visible) return null;
  return (
    <div
      className="flex items-center gap-2 px-5 py-2 rounded-xl glass-panel font-semibold shadow-sm transition-all duration-300 hover:scale-[1.02]"
      style={{
        border: '1px solid color-mix(in srgb, var(--board-line) 30%, transparent)'
      }}
      data-testid="pool-counter"
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className="text-lg" style={{ color: 'var(--text-primary)' }}>
        {count}
      </span>
    </div>
  );
}
