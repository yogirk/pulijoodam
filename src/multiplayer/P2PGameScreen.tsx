import { useState } from 'react';
import { useP2PGame } from './useP2PGame';
import { DisconnectBanner } from './DisconnectBanner';
import { useAnimationQueue } from '../hooks/useAnimationQueue';
import { useSettings } from '../hooks/useSettings';
import { Board } from '../components/Board/Board';
import { TurnIndicator } from '../components/GameScreen/TurnIndicator';
import { GameOverOverlay } from '../components/GameScreen/GameOverOverlay';
import { SettingsDropdown } from '../components/Settings/SettingsDropdown';
import { ScreenReaderAnnouncer } from '../components/Board/ScreenReaderAnnouncer';
import { MoveHistory } from '../components/GameScreen/MoveHistory';
import type { P2PConnection } from './webrtc';
import type { Role } from '../engine';

interface P2PGameScreenProps {
  connection: P2PConnection;
  localRole: Role;
  onContinueVsAI: (moveHistory: import('../engine').Move[]) => void;
  onEndGame: () => void;
}

const STATUS_STYLE = {
  connected: { color: 'var(--status-success)', label: 'Connected' },
  reconnecting: { color: 'var(--status-warning)', label: 'Reconnecting' },
  disconnected: { color: 'var(--status-error)', label: 'Disconnected' },
} as const;

export function P2PGameScreen({
  connection,
  localRole,
  onContinueVsAI,
  onEndGame,
}: P2PGameScreenProps) {
  const game = useP2PGame({ localRole, connection });
  const { theme, soundEnabled } = useSettings();
  const animationState = useAnimationQueue(game.lastEvents, soundEnabled, theme);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const {
    gameState,
    selectedNode,
    legalMoves,
    status,
    onNodeTap,
    onEndChain,
    onNewGame,
    isDisconnected,
    connectionState,
  } = game;

  const inputDisabled = animationState.isAnimating;

  const statusKey: 'connected' | 'reconnecting' | 'disconnected' =
    connectionState === 'connected'
      ? 'connected'
      : connectionState === 'disconnected' || connectionState === 'failed'
        ? 'disconnected'
        : 'reconnecting';

  const connStatus = STATUS_STYLE[statusKey];

  return (
    <div
      className="h-[100dvh] w-screen overflow-hidden flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* 1. Header */}
      <header
        className="h-14 lg:h-16 flex-none px-4 lg:px-6 flex items-center justify-between border-b shadow-sm z-10"
        style={{ borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex-1 flex items-center">
          <button
            onClick={onEndGame}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            data-testid="back-to-menu-btn"
          >
            <span>&larr;</span> Menu
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center leading-tight">
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>
            Pulijoodam
          </h1>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Playing as <strong style={{ color: 'var(--accent)' }}>{localRole}</strong>
          </span>
        </div>
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Connection status */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(0,0,0,0.2)' }}
            data-testid="connection-status"
          >
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: connStatus.color }}
            />
            <span className="hidden sm:inline">{connStatus.label}</span>
          </div>
          <SettingsDropdown />
        </div>
      </header>

      {/* Mobile match status bar — replaces sidebar info on small screens */}
      <div
        className="flex lg:hidden items-center justify-center gap-3 px-4 py-1.5 border-b flex-none"
        style={{ borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
      >
        {gameState.phase === 'placement' && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)' }}
          >
            <span className="uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>Pool</span>
            <span>{gameState.goatsInPool}</span>
          </div>
        )}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold"
          style={{
            backgroundColor: 'rgba(0,0,0,0.25)',
            color: gameState.goatsCaptured > 0 ? 'var(--status-error)' : 'var(--text-primary)',
            outline: gameState.goatsCaptured > 0 ? '1px solid rgba(255,100,100,0.3)' : 'none',
            animation: gameState.goatsCaptured >= 3 ? 'danger-pulse 2s ease-in-out infinite' : 'none',
          }}
        >
          <span className="uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>Captured</span>
          <span>{gameState.goatsCaptured} / 5</span>
        </div>
      </div>

      {/* 2. Main: Sidebars + Hero Board */}
      <main className="flex-1 min-h-0 flex relative">

        {/* Left Sidebar — Hidden on Mobile */}
        <aside
          className="hidden lg:flex h-full border-r flex flex-col transition-all duration-300 ease-in-out shrink-0"
          style={{ width: leftOpen ? '320px' : '48px', borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
        >
          {leftOpen ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide w-[320px] p-6">
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
          <div
            className="w-full h-full max-h-[85vh] flex items-center justify-center fade-in"
            style={{ animation: animationState.shaking ? 'board-shake 200ms ease-out' : 'none' }}
          >
            <Board
              gameState={gameState}
              selectedNode={selectedNode}
              legalMoves={legalMoves}
              onNodeTap={inputDisabled ? () => {} : onNodeTap}
              chainJumpInProgress={gameState.chainJumpInProgress}
              animationState={animationState}
            />
          </div>
        </section>

        {/* Right Sidebar — Hidden on Mobile */}
        <aside
          className="hidden lg:flex h-full border-l flex flex-col transition-all duration-300 ease-in-out shrink-0"
          style={{ width: rightOpen ? '320px' : '48px', borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
        >
          {rightOpen ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide w-[320px] p-6">
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
                <div className="flex justify-between items-center p-4 rounded-xl shadow-inner" style={{ backgroundColor: 'rgba(0,0,0,0.2)', outline: gameState.goatsCaptured > 0 ? '1px solid rgba(255,100,100,0.3)' : 'none', animation: gameState.goatsCaptured >= 3 ? 'danger-pulse 2s ease-in-out infinite' : 'none' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--status-error)' }}>Captured Goats</span>
                  <span className="text-xl font-bold" style={{ color: gameState.goatsCaptured > 0 ? 'var(--status-error)' : '#ffffff' }}>{gameState.goatsCaptured} / 5</span>
                </div>
              </div>

              <div className="w-full h-px opacity-30 mb-8" style={{ backgroundColor: 'var(--board-line)' }} />

              <h3 className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: 'var(--text-secondary)' }}>Move History</h3>
              <div className="flex-1 flex flex-col p-2 rounded-xl min-h-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <MoveHistory moveHistory={gameState.moveHistory} />
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

      {/* 3. Footer */}
      <footer
        className="h-20 lg:h-24 flex-none px-4 lg:px-8 flex items-center justify-between border-t shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-10"
        style={{ borderColor: 'var(--board-line)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex-1 flex items-center justify-start min-w-0">
          <TurnIndicator
            currentTurn={gameState.currentTurn}
            phase={gameState.phase}
            chainJumpInProgress={gameState.chainJumpInProgress !== null}
          />
        </div>

        <div className="flex-1 flex items-center justify-end gap-2 lg:gap-4 min-w-0">
          {gameState.chainJumpInProgress !== null &&
            !inputDisabled &&
            gameState.currentTurn === localRole && (
            <button
              onClick={onEndChain}
              className="px-3 lg:px-6 py-2 font-bold rounded-xl transition-transform hover:scale-[1.02] text-sm lg:text-base whitespace-nowrap animate-pulse"
              style={{ backgroundColor: 'var(--accent)', color: '#000000', boxShadow: '0 0 14px color-mix(in srgb, var(--accent) 50%, transparent)' }}
              data-testid="end-chain-button"
            >
              End Turn
            </button>
          )}
          {/* No undo/redo in P2P mode */}
        </div>
      </footer>

      {/* Screen reader announcements */}
      <ScreenReaderAnnouncer lastEvents={game.lastEvents} gameState={gameState} />

      {/* Game over overlay */}
      {status !== 'ongoing' && !animationState.isAnimating && (
        <GameOverOverlay status={status} onNewGame={onNewGame} />
      )}

      {/* Disconnect banner */}
      {isDisconnected && status === 'ongoing' && (
        <DisconnectBanner
          onContinueVsAI={() => onContinueVsAI(gameState.moveHistory)}
          onEndGame={onEndGame}
        />
      )}
    </div>
  );
}
