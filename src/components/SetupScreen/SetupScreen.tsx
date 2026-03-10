import { useState } from 'react';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';
import { useGame } from '../../hooks/useGame';
import { IDLE_ANIMATION } from '../../hooks/useAnimationQueue';
import { Board } from '../Board/Board';

interface SetupScreenProps {
  onStart: (config: { humanRole: Role; difficulty: AIDifficulty } | null) => void;
  onViewHistory?: () => void;
  onStartTutorial?: () => void;
  onPlayOnline?: () => void;
  savedGame?: { opponent: string; moves: number } | null;
  onResume?: () => void;
  onDismissResume?: () => void;
}

const DIFFICULTIES: { key: AIDifficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'expert', label: 'Expert' },
];

export function SetupScreen({
  onStart,
  onViewHistory,
  onStartTutorial,
  onPlayOnline,
  savedGame,
  onResume,
  onDismissResume
}: SetupScreenProps) {
  const [humanRole, setHumanRole] = useState<Role>('goat');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  // Initialize a dummy game state just for the atmospheric background
  const dummyGame = useGame();

  return (
    <div
      className="min-h-screen-safe flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ATMOSPHERIC BACKGROUND BOARD */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{ opacity: 0.35, filter: 'blur(8px)', transform: 'scale(1.15)' }}
      >
        <div className="w-full max-w-2xl px-8">
          <Board
            gameState={dummyGame.gameState}
            selectedNode={null}
            legalMoves={[]}
            onNodeTap={() => { }}
            chainJumpInProgress={null}
            animationState={IDLE_ANIMATION}
            lastEvents={[]}
          />
        </div>
      </div>

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
      <div className="glass-panel rounded-3xl p-5 sm:p-8 max-w-md w-full flex flex-col items-center relative z-10">

        {/* Title */}
        <div className="text-center mb-6 sm:mb-10">
          <h1
            className="text-3xl sm:text-5xl font-extrabold mb-2 tracking-tight drop-shadow-lg"
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
        <div className="w-full mb-5 sm:mb-8">
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
                ? 'scale-105'
                : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              style={{
                backgroundColor: humanRole === 'goat' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: humanRole === 'goat' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${humanRole === 'goat' ? 'transparent' : 'var(--board-line)'}`,
                boxShadow: humanRole === 'goat' ? '0 0 15px color-mix(in srgb, var(--accent) 50%, transparent)' : 'none',
              }}
            >
              Goat
            </button>
            <button
              data-testid="role-tiger"
              onClick={() => setHumanRole('tiger')}
              className={`flex-1 min-h-[50px] rounded-xl font-bold transition-all duration-300 ${humanRole === 'tiger'
                ? 'scale-105'
                : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              style={{
                backgroundColor: humanRole === 'tiger' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: humanRole === 'tiger' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${humanRole === 'tiger' ? 'transparent' : 'var(--board-line)'}`,
                boxShadow: humanRole === 'tiger' ? '0 0 15px color-mix(in srgb, var(--accent) 50%, transparent)' : 'none',
              }}
            >
              Tiger
            </button>
          </div>
        </div>

        {/* Difficulty selection */}
        <div className="w-full mb-6 sm:mb-10">
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
                  ? 'scale-[1.02]'
                  : 'hover:scale-[1.02] opacity-70 hover:opacity-100'
                  }`}
                style={{
                  backgroundColor: difficulty === key ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: difficulty === key ? '#ffffff' : 'var(--text-primary)',
                  border: `1px solid ${difficulty === key ? 'transparent' : 'var(--board-line)'}`,
                  boxShadow: difficulty === key ? '0 0 10px color-mix(in srgb, var(--accent) 40%, transparent)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 relative">

          {savedGame && (
            <div
              className="w-full p-4 mb-2 rounded-xl flex flex-col items-center border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--accent)',
                boxShadow: '0 0 15px color-mix(in srgb, var(--accent) 20%, transparent)'
              }}
            >
              <h3 className="font-bold mb-1" style={{ color: 'var(--accent)' }}>Resume Game?</h3>
              <p className="text-xs mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                You have an unfinished {savedGame.opponent === 'ai' ? 'AI' : 'local'} game with {savedGame.moves} moves.
              </p>
              <div className="flex w-full gap-2">
                <button
                  onClick={onResume}
                  className="flex-1 min-h-[44px] font-bold rounded-lg text-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: 'var(--legal-move-stroke)', color: '#ffffff' }}
                >
                  Resume
                </button>
                <button
                  onClick={onDismissResume}
                  className="flex-1 min-h-[44px] font-bold rounded-lg text-sm transition-colors hover:bg-black/20"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  New Game
                </button>
              </div>
            </div>
          )}

          {!savedGame && (
            <button
              data-testid="start-game-btn"
              onClick={() => onStart({ humanRole, difficulty })}
              className="w-full min-h-[56px] font-bold rounded-xl text-lg transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--legal-move-stroke)',
                color: '#ffffff',
                boxShadow: '0 0 20px color-mix(in srgb, var(--legal-move-stroke) 40%, transparent)',
              }}
            >
              Start Single Player
            </button>
          )}

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
              className="transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Game History
            </button>
          )}
          {onStartTutorial && (
            <button
              data-testid="tutorial-btn"
              onClick={onStartTutorial}
              className="transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Learn to Play
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
