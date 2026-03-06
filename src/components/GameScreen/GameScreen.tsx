import { useGame } from '../../hooks/useGame';
import { useAIGame } from '../../hooks/useAIGame';
import { Board } from '../Board/Board';
import { TurnIndicator } from './TurnIndicator';
import { PoolCounter } from './PoolCounter';
import { GameOverOverlay } from './GameOverOverlay';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';

interface GameScreenProps {
  aiConfig?: { humanRole: Role; difficulty: AIDifficulty } | null;
  onBackToMenu?: () => void;
}

/** Shared game board UI — accepts the hook return values as props. */
function GameBoard({
  game,
  isAIThinking,
  onBackToMenu,
}: {
  game: ReturnType<typeof useGame>;
  isAIThinking: boolean;
  onBackToMenu?: () => void;
}) {
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

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
      {/* Top bar: Back to Menu */}
      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          className="self-start mb-2 px-3 py-1 text-stone-400 hover:text-stone-200 text-sm transition-colors"
          data-testid="back-to-menu-btn"
        >
          &larr; Menu
        </button>
      )}

      {/* Turn indicator */}
      <TurnIndicator
        currentTurn={gameState.currentTurn}
        phase={gameState.phase}
      />

      {/* AI thinking indicator */}
      {isAIThinking && (
        <p className="text-amber-400 text-sm animate-pulse mt-1" data-testid="ai-thinking">
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
          onNodeTap={onNodeTap}
          chainJumpInProgress={gameState.chainJumpInProgress}
        />
      </div>

      {/* Chain-hop: End Turn button */}
      {gameState.chainJumpInProgress !== null && (
        <button
          onClick={onEndChain}
          className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded transition-colors"
          data-testid="end-chain-button"
        >
          End Turn
        </button>
      )}

      {/* Undo / Redo */}
      <div className="flex gap-4 mt-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1 bg-stone-700 text-white rounded disabled:opacity-40"
          data-testid="undo-button"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-1 bg-stone-700 text-white rounded disabled:opacity-40"
          data-testid="redo-button"
        >
          Redo
        </button>
      </div>

      {/* Game over overlay */}
      {status !== 'ongoing' && (
        <GameOverOverlay status={status} onNewGame={onNewGame} />
      )}
    </div>
  );
}

/** Local 2-player game screen. */
function LocalGameScreen({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const game = useGame();
  return <GameBoard game={game} isAIThinking={false} onBackToMenu={onBackToMenu} />;
}

/** AI game screen — spins up worker. */
function AIGameScreen({
  aiConfig,
  onBackToMenu,
}: {
  aiConfig: { humanRole: Role; difficulty: AIDifficulty };
  onBackToMenu?: () => void;
}) {
  const game = useAIGame(aiConfig);
  return <GameBoard game={game} isAIThinking={game.isAIThinking} onBackToMenu={onBackToMenu} />;
}

/**
 * GameScreen — renders either local or AI game depending on aiConfig.
 * Uses separate components so each hook is called unconditionally within its component.
 */
export function GameScreen({ aiConfig, onBackToMenu }: GameScreenProps) {
  if (aiConfig) {
    return <AIGameScreen aiConfig={aiConfig} onBackToMenu={onBackToMenu} />;
  }
  return <LocalGameScreen onBackToMenu={onBackToMenu} />;
}
