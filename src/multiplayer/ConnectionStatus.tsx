interface ConnectionStatusProps {
  state: 'connected' | 'reconnecting' | 'disconnected';
}

const STATUS_CONFIG = {
  connected: { color: '#22c55e', label: 'Connected' },
  reconnecting: { color: '#eab308', label: 'Reconnecting' },
  disconnected: { color: '#ef4444', label: 'Disconnected' },
} as const;

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const { color, label } = STATUS_CONFIG[state];

  return (
    <div
      className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
      }}
      data-testid="connection-status"
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}
