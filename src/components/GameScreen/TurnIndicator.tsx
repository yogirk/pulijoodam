import type { Role, Phase } from '../../engine';

interface TurnIndicatorProps {
  currentTurn: Role;
  phase: Phase;
  chainJumpInProgress?: boolean;
}

export function TurnIndicator({ currentTurn, phase, chainJumpInProgress }: TurnIndicatorProps) {
  const isTiger = currentTurn === 'tiger';

  let action = '';
  let actionHighlight = false;
  if (chainJumpInProgress) {
    action = 'Continue capture or end turn';
    actionHighlight = true;
  } else if (phase === 'placement') {
    if (isTiger) {
      action = 'Move or Capture';
    } else {
      action = 'Place a Goat';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
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
          className={`text-xs mt-3 uppercase tracking-[0.2em] font-medium${actionHighlight ? ' animate-pulse' : ''}`}
          style={{ color: actionHighlight ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          {action}
        </span>
      )}
    </div>
  );
}
