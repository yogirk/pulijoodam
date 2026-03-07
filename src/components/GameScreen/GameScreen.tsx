import { useGame } from '../../hooks/useGame';
import { useAIGame } from '../../hooks/useAIGame';
import { useAnimationQueue } from '../../hooks/useAnimationQueue';
import { useSettings } from '../../hooks/useSettings';
import { Board } from '../Board/Board';
import { ScreenReaderAnnouncer } from '../Board/ScreenReaderAnnouncer';
import { TurnIndicator } from './TurnIndicator';
import { PoolCounter } from './PoolCounter';
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
      className="min-h-screen-safe flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Top bar: always full width */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-2 pb-1">
        {onBackToMenu ? (
          <button
            onClick={onBackToMenu}
            className="px-3 py-1 text-sm rounded-lg transition-colors min-h-[44px]"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            data-testid="back-to-menu-btn"
          >
            &larr; Menu
          </button>
        ) : (
          <div />
        )}
        <SettingsDropdown onStartTutorial={onStartTutorial} />
      </div>

      {/* Main content: column in portrait, row in landscape */}
      <div className="flex-1 flex flex-col game-main items-center justify-center gap-1 sm:gap-2 px-4 pb-4">
        {/* Board */}
        <div className="w-full max-w-lg game-board-wrap flex items-center justify-center">
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

        {/* Sidebar: status + controls — below board in portrait, beside in landscape */}
        <div className="game-sidebar flex flex-col items-center gap-1">
          {/* Turn indicator */}
          <TurnIndicator
            currentTurn={gameState.currentTurn}
            phase={gameState.phase}
          />

          {/* AI thinking indicator (Wrapped in fixed height to prevent layout shift) */}
          <div className="h-6 flex items-center justify-center">
            {isAIThinking && (
              <p
                className="text-sm animate-pulse tracking-wide font-medium"
                style={{ color: 'var(--accent)' }}
                data-testid="ai-thinking"
              >
                AI is thinking...
              </p>
            )}
          </div>

          {/* Counters */}
          <div className="flex gap-4">
            <PoolCounter
              label="Goats"
              count={gameState.goatsInPool}
              visible={gameState.phase === 'placement'}
            />
            <PoolCounter
              label="Captured"
              count={gameState.goatsCaptured}
            />
          </div>

          {/* Chain-hop: End Turn button */}
          {gameState.chainJumpInProgress !== null && !inputDisabled && (
            <button
              onClick={onEndChain}
              className="px-4 py-2 font-semibold rounded transition-colors min-h-[44px]"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-primary)',
              }}
              data-testid="end-chain-button"
            >
              End Turn
            </button>
          )}

          {/* Undo / Redo */}
          <div className="flex gap-4">
            <button
              onClick={onUndo}
              disabled={!canUndo || inputDisabled}
              className="px-3 py-1 rounded transition-colors disabled:opacity-40 min-h-[44px] min-w-[44px]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              data-testid="undo-button"
            >
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo || inputDisabled}
              className="px-3 py-1 rounded transition-colors disabled:opacity-40 min-h-[44px] min-w-[44px]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              data-testid="redo-button"
            >
              Redo
            </button>
          </div>
        </div>
      </div>

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
