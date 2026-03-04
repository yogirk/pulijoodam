import type { Role, Phase } from '../../engine';

interface TurnIndicatorProps {
  currentTurn: Role;
  phase: Phase;
  tigersInPool?: number;
}

export function TurnIndicator({ currentTurn, phase, tigersInPool = 0 }: TurnIndicatorProps) {
  const isTiger = currentTurn === 'tiger';

  let action = '';
  if (phase === 'placement') {
    if (isTiger && tigersInPool > 0) {
      action = 'Place a Tiger';
    } else if (isTiger) {
      action = 'Move or Capture';
    } else {
      action = 'Place a Goat';
    }
  }

  return (
    <div className="text-center mb-2">
      <div className="text-white text-xl font-bold" data-testid="turn-indicator">
        {isTiger ? 'Tiger' : 'Goat'}'s Turn
      </div>
      {action && (
        <div className="text-stone-400 text-sm mt-0.5">{action}</div>
      )}
    </div>
  );
}
