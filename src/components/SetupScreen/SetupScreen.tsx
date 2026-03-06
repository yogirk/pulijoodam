import { useState } from 'react';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';

interface SetupScreenProps {
  onStart: (config: { humanRole: Role; difficulty: AIDifficulty } | null) => void;
}

const DIFFICULTIES: { key: AIDifficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'expert', label: 'Expert' },
];

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [humanRole, setHumanRole] = useState<Role>('goat');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-amber-400 mb-1">Pulijoodam</h1>
      <p className="text-stone-400 text-sm mb-8">Tiger vs Goat</p>

      {/* Role selection */}
      <div className="mb-6">
        <h2 className="text-stone-300 text-center text-sm font-semibold mb-2 uppercase tracking-wider">
          Play as
        </h2>
        <div className="flex gap-3">
          <button
            data-testid="role-goat"
            onClick={() => setHumanRole('goat')}
            className={`min-w-[120px] min-h-[44px] px-6 py-3 rounded-lg font-semibold transition-colors ${
              humanRole === 'goat'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
            }`}
          >
            Goat
          </button>
          <button
            data-testid="role-tiger"
            onClick={() => setHumanRole('tiger')}
            className={`min-w-[120px] min-h-[44px] px-6 py-3 rounded-lg font-semibold transition-colors ${
              humanRole === 'tiger'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
            }`}
          >
            Tiger
          </button>
        </div>
      </div>

      {/* Difficulty selection */}
      <div className="mb-8">
        <h2 className="text-stone-300 text-center text-sm font-semibold mb-2 uppercase tracking-wider">
          Difficulty
        </h2>
        <div className="flex gap-2">
          {DIFFICULTIES.map(({ key, label }) => (
            <button
              key={key}
              data-testid={`difficulty-${key}`}
              onClick={() => setDifficulty(key)}
              className={`min-w-[70px] min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                difficulty === key
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Start Game */}
      <button
        data-testid="start-game-btn"
        onClick={() => onStart({ humanRole, difficulty })}
        className="min-h-[44px] px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-colors mb-4"
      >
        Start Game
      </button>

      {/* Local 2-Player */}
      <button
        data-testid="local-2p-btn"
        onClick={() => onStart(null)}
        className="min-h-[44px] px-6 py-2 text-stone-400 hover:text-stone-200 text-sm underline transition-colors"
      >
        Local 2-Player
      </button>
    </div>
  );
}
