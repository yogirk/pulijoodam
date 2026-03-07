import { useState } from 'react';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';

interface SetupScreenProps {
  onStart: (config: { humanRole: Role; difficulty: AIDifficulty } | null) => void;
  onViewHistory?: () => void;
  onStartTutorial?: () => void;
  onPlayOnline?: () => void;
}

const DIFFICULTIES: { key: AIDifficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'expert', label: 'Expert' },
];

export function SetupScreen({ onStart, onViewHistory, onStartTutorial, onPlayOnline }: SetupScreenProps) {
  const [humanRole, setHumanRole] = useState<Role>('goat');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Decorative Background Orbs */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[50vmin] h-[50vmin] rounded-full mix-blend-screen filter blur-[100px] opacity-30 pointer-events-none"
        style={{ backgroundColor: 'var(--accent)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50vmin] h-[50vmin] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--legal-move-stroke)' }}
      />

      {/* Main Card */}
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full flex flex-col items-center relative z-10">

        {/* Title */}
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-extrabold mb-2 tracking-tight drop-shadow-lg"
            style={{ color: 'var(--accent)' }}
          >
            Pulijoodam
          </h1>
          <p
            className="text-sm tracking-[0.2em] font-medium uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            Tiger vs Goat
          </p>
        </div>

        {/* Role selection */}
        <div className="w-full mb-8">
          <h2
            className="text-xs font-bold mb-3 uppercase tracking-widest text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            Select Role
          </h2>
          <div className="flex gap-3 justify-center">
            <button
              data-testid="role-goat"
              onClick={() => setHumanRole('goat')}
              className={`flex-1 min-h-[50px] rounded-xl font-bold transition-all duration-300 ${humanRole === 'goat'
                  ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              style={{
                backgroundColor: humanRole === 'goat' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: humanRole === 'goat' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${humanRole === 'goat' ? 'transparent' : 'var(--board-line)'}`
              }}
            >
              Goat
            </button>
            <button
              data-testid="role-tiger"
              onClick={() => setHumanRole('tiger')}
              className={`flex-1 min-h-[50px] rounded-xl font-bold transition-all duration-300 ${humanRole === 'tiger'
                  ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              style={{
                backgroundColor: humanRole === 'tiger' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: humanRole === 'tiger' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${humanRole === 'tiger' ? 'transparent' : 'var(--board-line)'}`
              }}
            >
              Tiger
            </button>
          </div>
        </div>

        {/* Difficulty selection */}
        <div className="w-full mb-10">
          <h2
            className="text-xs font-bold mb-3 uppercase tracking-widest text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            AI Difficulty
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
            {DIFFICULTIES.map(({ key, label }) => (
              <button
                key={key}
                data-testid={`difficulty-${key}`}
                onClick={() => setDifficulty(key)}
                className={`sm:flex-1 min-h-[44px] px-2 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${difficulty === key
                    ? 'shadow-[0_0_10px_rgba(245,158,11,0.4)] scale-[1.02]'
                    : 'hover:scale-[1.02] opacity-70 hover:opacity-100'
                  }`}
                style={{
                  backgroundColor: difficulty === key ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: difficulty === key ? '#ffffff' : 'var(--text-primary)',
                  border: `1px solid ${difficulty === key ? 'transparent' : 'var(--board-line)'}`
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            data-testid="start-game-btn"
            onClick={() => onStart({ humanRole, difficulty })}
            className="w-full min-h-[56px] font-bold rounded-xl text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            style={{ backgroundColor: 'var(--legal-move-stroke)', color: '#ffffff' }}
          >
            Start Single Player
          </button>

          <button
            data-testid="local-2p-btn"
            onClick={() => onStart(null)}
            className="w-full min-h-[56px] font-bold rounded-xl text-lg transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--board-line)'
            }}
          >
            Local 2-Player
          </button>

          {onPlayOnline && (
            <button
              data-testid="play-online-btn"
              onClick={onPlayOnline}
              className="w-full min-h-[56px] font-bold rounded-xl text-lg transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--accent)',
                border: '2px solid var(--accent)'
              }}
            >
              Play Online
            </button>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex gap-6 text-sm font-medium">
          {onViewHistory && (
            <button
              data-testid="history-btn"
              onClick={onViewHistory}
              className="transition-colors hover:text-white"
              style={{ color: 'var(--text-secondary)' }}
            >
              Game History
            </button>
          )}
          {onStartTutorial && (
            <button
              data-testid="tutorial-btn"
              onClick={onStartTutorial}
              className="transition-colors hover:text-white"
              style={{ color: 'var(--text-secondary)' }}
            >
              Learn to Play
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
