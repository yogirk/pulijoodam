import type { Role, Phase } from '../../engine';

interface TurnIndicatorProps {
  currentTurn: Role;
  phase: Phase;
}

export function TurnIndicator({ currentTurn, phase }: TurnIndicatorProps) {
  const isTiger = currentTurn === 'tiger';
  return (
    <div className="text-center mb-2">
      <div className="text-white text-xl font-bold" data-testid="turn-indicator">
        {isTiger ? '🐯 Tiger' : '🐐 Goat'}'s Turn
      </div>
      {phase === 'placement' && (
        <div className="text-stone-400 text-sm mt-0.5">(Placement)</div>
      )}
    </div>
  );
}
