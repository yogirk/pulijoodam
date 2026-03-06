import { useGame } from '../../hooks/useGame';
import { useAIGame } from '../../hooks/useAIGame';
import { useAnimationQueue } from '../../hooks/useAnimationQueue';
import { useSettings } from '../../hooks/useSettings';
import { Board } from '../Board/Board';
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
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Top bar: Back to Menu + Settings */}
      <div className="w-full max-w-lg flex items-center justify-between mb-2">
        {onBackToMenu ? (
          <button
            onClick={onBackToMenu}
            className="px-3 py-1 text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            data-testid="back-to-menu-btn"
          >
            &larr; Menu
          </button>
        ) : (
          <div />
        )}
        <SettingsDropdown onStartTutorial={onStartTutorial} />
      </div>

      {/* Turn indicator */}
      <TurnIndicator
        currentTurn={gameState.currentTurn}
        phase={gameState.phase}
      />

      {/* AI thinking indicator */}
      {isAIThinking && (
        <p
          className="text-sm animate-pulse mt-1"
          style={{ color: 'var(--accent)' }}
          data-testid="ai-thinking"
        >
          AI is thinking...
        </p>
      )}

      {/* Counters */}
      <div className="flex gap-4 my-2">
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

      {/* Board */}
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <Board
          gameState={gameState}
          selectedNode={selectedNode}
          legalMoves={legalMoves}
          onNodeTap={inputDisabled ? () => {} : onNodeTap}
          chainJumpInProgress={gameState.chainJumpInProgress}
          animationState={animationState}
        />
      </div>

      {/* Chain-hop: End Turn button */}
      {gameState.chainJumpInProgress !== null && !inputDisabled && (
        <button
          onClick={onEndChain}
          className="mt-2 px-4 py-2 font-semibold rounded transition-colors"
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
      <div className="flex gap-4 mt-2">
        <button
          onClick={onUndo}
          disabled={!canUndo || inputDisabled}
          className="px-3 py-1 rounded disabled:opacity-40"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
          data-testid="undo-button"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo || inputDisabled}
          className="px-3 py-1 rounded disabled:opacity-40"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
          data-testid="redo-button"
        >
          Redo
        </button>
      </div>

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
