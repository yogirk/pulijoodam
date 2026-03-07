import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAIGame } from '../../hooks/useAIGame';
import { useAnimationQueue } from '../../hooks/useAnimationQueue';
import { useSettings } from '../../hooks/useSettings';
import { Board } from '../Board/Board';
import { ScreenReaderAnnouncer } from '../Board/ScreenReaderAnnouncer';
import { TurnIndicator } from './TurnIndicator';
import { GameOverOverlay } from './GameOverOverlay';
import { SettingsDropdown } from '../Settings/SettingsDropdown';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';

interface GameScreenProps {
  aiConfig?: { humanRole: Role; difficulty: AIDifficulty } | null;
  onBackToMenu?: () => void;
  onStartTutorial?: () => void;
}

/** Shared game board UI -- accepts the hook return values as props. */
function GameBoard({
  game,
  isAIThinking,
  onBackToMenu,
  onStartTutorial,
}: {
  game: ReturnType<typeof useGame>;
  isAIThinking: boolean;
  onBackToMenu?: () => void;
  onStartTutorial?: () => void;
}) {
  const { theme, soundEnabled } = useSettings();
  const animationState = useAnimationQueue(game.lastEvents, soundEnabled, theme);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const {
    gameState,
    selectedNode,
    legalMoves,
    status,
    canUndo,
    canRedo,
    onNodeTap,
    onEndChain,
    onUndo,
    onRedo,
    onNewGame,
  } = game;

  // Both AI thinking and animations gate user input
  const inputDisabled = isAIThinking || animationState.isAnimating;

  return (
    <div
      className="h-[100dvh] w-screen overflow-hidden flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* 1. Dedicated Top Header */}
      <header className="h-14 lg:h-16 flex-none px-4 lg:px-6 flex items-center justify-between border-b shadow-sm z-10" style={{ borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex-1 flex items-center">
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <span>&larr;</span> Menu
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>Pulijoodam</h1>
        </div>
        <div className="flex-1 flex items-center justify-end">
          <SettingsDropdown onStartTutorial={onStartTutorial} />
        </div>
      </header>

      {/* 2. Main Middle Section: Sidebars + Hero Board */}
      <main className="flex-1 min-h-0 flex relative">

        {/* Left Sidebar (Collapsible) - Hidden on Mobile */}
        <aside
          className="hidden lg:flex h-full border-r flex flex-col transition-all duration-300 ease-in-out shrink-0"
          style={{ width: leftOpen ? '320px' : '48px', borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
        >
          {leftOpen ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide w-[320px] p-6 slide-right">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>The Ancient Hunt</h2>
                <button onClick={() => setLeftOpen(false)} className="px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer font-bold" style={{ color: 'var(--text-secondary)' }}>
                  &#x25C0;
                </button>
              </div>
              <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                <p><strong>Goal:</strong> The Tigers must hunt and capture 5 Goats. The Goats must trap the Tigers so they cannot move.</p>
                <div className="w-full h-px opacity-30" style={{ backgroundColor: 'var(--board-line)' }} />
                <p><strong>Placement:</strong> Goats are placed one by one onto the board intersections. Tigers can move along the lines.</p>
                <div className="w-full h-px opacity-30" style={{ backgroundColor: 'var(--board-line)' }} />
                <p><strong>Capture:</strong> A Tiger captures a Goat by jumping over it into an empty space, exactly like Checkers.</p>
              </div>
            </div>
          ) : (
            <button className="flex-1 w-full flex flex-col items-center pt-6 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setLeftOpen(true)} style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold">&#x25B6;</span>
              <span className="mt-8 text-xs font-bold tracking-[0.2em] transform -rotate-90 origin-center whitespace-nowrap">RULES</span>
            </button>
          )}
        </aside>

        {/* Center Hero Board */}
        <section className="flex-1 h-full min-w-0 flex items-center justify-center p-2 lg:p-8 relative">
          <div className="w-full h-full max-h-[85vh] flex items-center justify-center fade-in">
            <Board
              gameState={gameState}
              selectedNode={selectedNode}
              legalMoves={legalMoves}
              onNodeTap={inputDisabled ? () => { } : onNodeTap}
              chainJumpInProgress={gameState.chainJumpInProgress}
              animationState={animationState}
              lastEvents={game.lastEvents}
            />
          </div>
        </section>

        {/* Right Sidebar (Collapsible) - Hidden on Mobile */}
        <aside
          className="hidden lg:flex h-full border-l flex flex-col transition-all duration-300 ease-in-out shrink-0"
          style={{ width: rightOpen ? '320px' : '48px', borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
        >
          {rightOpen ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide w-[320px] p-6 slide-left">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setRightOpen(false)} className="px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer font-bold" style={{ color: 'var(--text-secondary)' }}>
                  &#x25B6;
                </button>
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Match Status</h2>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <div className="flex justify-between items-center p-4 rounded-xl shadow-inner" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Goats to Place</span>
                  <span className="text-xl font-bold" style={{ color: '#ffffff' }}>{gameState.goatsInPool}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl shadow-inner" style={{ backgroundColor: 'rgba(0,0,0,0.2)', outline: gameState.goatsCaptured > 0 ? '1px solid rgba(255,100,100,0.3)' : 'none' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--status-danger)' }}>Captured Goats</span>
                  <span className="text-xl font-bold" style={{ color: gameState.goatsCaptured > 0 ? 'var(--status-danger)' : '#ffffff' }}>{gameState.goatsCaptured} / 5</span>
                </div>
              </div>

              <div className="w-full h-px opacity-30 mb-8" style={{ backgroundColor: 'var(--board-line)' }} />

              <h3 className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: 'var(--text-secondary)' }}>Move History</h3>
              <div className="flex-1 flex flex-col gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <p className="text-xs text-center opacity-50 italic mt-8" style={{ color: 'var(--text-secondary)' }}>History tracking coming soon...</p>
              </div>
            </div>
          ) : (
            <button className="flex-1 w-full flex flex-col items-center pt-6 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setRightOpen(true)} style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold">&#x25C0;</span>
              <span className="mt-8 text-xs font-bold tracking-[0.2em] transform -rotate-90 origin-center whitespace-nowrap">STATUS</span>
            </button>
          )}
        </aside>

      </main>

      {/* 3. Dedicated Bottom Dashboard */}
      <footer className="h-20 lg:h-24 flex-none px-4 lg:px-8 flex items-center justify-between border-t shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-10" style={{ borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex-1 flex items-center justify-start min-w-0">
          <TurnIndicator currentTurn={gameState.currentTurn} phase={gameState.phase} />
        </div>

        <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-1 min-w-0">
          {isAIThinking && <span className="text-sm font-bold tracking-wider animate-pulse" style={{ color: 'var(--accent)' }}>AI Thinking...</span>}
        </div>

        {/* Mobile counter display (since sidebars are hidden) */}
        <div className="flex lg:hidden flex-col items-center justify-center gap-1 min-w-0">
          {gameState.phase === 'placement' && <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Pool: {gameState.goatsInPool}</span>}
          <span className="text-xs font-bold" style={{ color: 'var(--status-danger)' }}>Lost: {gameState.goatsCaptured}/5</span>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2 lg:gap-4 min-w-0">
          {gameState.chainJumpInProgress !== null && !inputDisabled && (
            <button onClick={onEndChain} className="px-3 lg:px-6 py-2 font-bold rounded-xl transition-transform hover:scale-[1.02] text-sm lg:text-base whitespace-nowrap" style={{ backgroundColor: 'var(--accent)', color: '#000000', boxShadow: '0 0 10px color-mix(in srgb, var(--accent) 40%, transparent)' }}>End Turn</button>
          )}
          <button onClick={onUndo} disabled={!canUndo || inputDisabled} className="px-4 lg:px-6 py-2 font-semibold rounded-xl transition-all hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-sm lg:text-base" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}>Undo</button>
          <button onClick={onRedo} disabled={!canRedo || inputDisabled} className="px-4 lg:px-6 py-2 font-semibold rounded-xl transition-all hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-sm lg:text-base hidden sm:block" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}>Redo</button>
        </div>
      </footer>

      {/* Screen reader announcements */}
      <ScreenReaderAnnouncer lastEvents={game.lastEvents} gameState={gameState} />

      {/* Game over overlay -- only show after animation completes */}
      {status !== 'ongoing' && !animationState.isAnimating && (
        <GameOverOverlay status={status} onNewGame={onNewGame} />
      )}
    </div>
  );
}

/** Local 2-player game screen. */
function LocalGameScreen({ onBackToMenu, onStartTutorial }: { onBackToMenu?: () => void; onStartTutorial?: () => void }) {
  const game = useGame();
  return <GameBoard game={game} isAIThinking={false} onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
}

/** AI game screen -- spins up worker. */
function AIGameScreen({
  aiConfig,
  onBackToMenu,
  onStartTutorial,
}: {
  aiConfig: { humanRole: Role; difficulty: AIDifficulty };
  onBackToMenu?: () => void;
  onStartTutorial?: () => void;
}) {
  const game = useAIGame(aiConfig);
  return <GameBoard game={game} isAIThinking={game.isAIThinking} onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
}

/**
 * GameScreen -- renders either local or AI game depending on aiConfig.
 * Uses separate components so each hook is called unconditionally within its component.
 */
export function GameScreen({ aiConfig, onBackToMenu, onStartTutorial }: GameScreenProps) {
  if (aiConfig) {
    return <AIGameScreen aiConfig={aiConfig} onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
  }
  return <LocalGameScreen onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
}
