import type { Role, Phase } from '../../engine';

interface TurnIndicatorProps {
  currentTurn: Role;
  phase: Phase;
}

export function TurnIndicator({ currentTurn, phase }: TurnIndicatorProps) {
  const isTiger = currentTurn === 'tiger';

  let action = '';
  if (phase === 'placement') {
    if (isTiger) {
      action = 'Move or Capture';
    } else {
      action = 'Place a Goat';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center mb-6">
      {/* Turn Pill */}
      <div
        className="glass-panel px-6 py-2 rounded-full flex items-center gap-4 transition-all duration-300"
        data-testid="turn-indicator"
      >
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${isTiger ? 'scale-125' : 'scale-75 opacity-30'}`}
          style={{
            backgroundColor: 'var(--tiger-fill)',
            boxShadow: isTiger ? '0 0 12px var(--tiger-fill)' : 'none'
          }}
        />
        <span
          className="text-lg font-bold tracking-widest uppercase"
          style={{ color: isTiger ? 'var(--tiger-fill)' : 'var(--goat-fill)' }}
        >
          {isTiger ? 'Tiger' : 'Goat'}'s Turn
        </span>
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${!isTiger ? 'scale-125' : 'scale-75 opacity-30'}`}
          style={{
            backgroundColor: 'var(--goat-fill)',
            boxShadow: !isTiger ? '0 0 12px var(--goat-fill)' : 'none'
          }}
        />
      </div>

      {/* Sub-action text */}
      {action && (
        <span
          className="text-xs mt-3 uppercase tracking-[0.2em] font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {action}
        </span>
      )}
    </div>
  );
}
