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
    <div className="text-center mb-2">
      <div
        className="text-xl font-bold"
        style={{ color: 'var(--text-primary)' }}
        data-testid="turn-indicator"
      >
        {isTiger ? 'Tiger' : 'Goat'}'s Turn
      </div>
      {action && (
        <div
          className="text-sm mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {action}
        </div>
      )}
    </div>
  );
}
