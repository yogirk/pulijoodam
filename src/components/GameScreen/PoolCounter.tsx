interface PoolCounterProps {
  label: string;
  count: number;
  visible?: boolean;
}

export function PoolCounter({ label, count, visible = true }: PoolCounterProps) {
  if (!visible) return null;
  return (
    <div
      className="text-sm px-3 py-1.5 rounded"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
      }}
      data-testid="pool-counter"
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}: </span>
      <span className="font-bold">{count}</span>
    </div>
  );
}
