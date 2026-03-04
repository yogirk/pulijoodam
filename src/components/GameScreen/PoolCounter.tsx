interface PoolCounterProps {
  label: string;
  count: number;
  visible?: boolean;
}

export function PoolCounter({ label, count, visible = true }: PoolCounterProps) {
  if (!visible) return null;
  return (
    <div
      className="bg-stone-800 text-white text-sm px-3 py-1.5 rounded"
      data-testid="pool-counter"
    >
      <span className="text-stone-400">{label}: </span>
      <span className="font-bold">{count}</span>
    </div>
  );
}
