import { useP2PGame } from './useP2PGame';
import { ConnectionStatus } from './ConnectionStatus';
import { DisconnectBanner } from './DisconnectBanner';
import { useAnimationQueue } from '../hooks/useAnimationQueue';
import { useSettings } from '../hooks/useSettings';
import { Board } from '../components/Board/Board';
import { TurnIndicator } from '../components/GameScreen/TurnIndicator';
import { PoolCounter } from '../components/GameScreen/PoolCounter';
import { GameOverOverlay } from '../components/GameScreen/GameOverOverlay';
import { SettingsDropdown } from '../components/Settings/SettingsDropdown';
import type { P2PConnection } from './webrtc';
import type { Role } from '../engine';

interface P2PGameScreenProps {
  connection: P2PConnection;
  localRole: Role;
  onContinueVsAI: (moveHistory: import('../engine').Move[]) => void;
  onEndGame: () => void;
}

export function P2PGameScreen({
  connection,
  localRole,
  onContinueVsAI,
  onEndGame,
}: P2PGameScreenProps) {
  const game = useP2PGame({ localRole, connection });
  const { theme, soundEnabled } = useSettings();
  const animationState = useAnimationQueue(game.lastEvents, soundEnabled, theme);

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

  // Map connectionState to status indicator values
  const statusIndicator: 'connected' | 'reconnecting' | 'disconnected' =
    connectionState === 'connected'
      ? 'connected'
      : connectionState === 'disconnected' || connectionState === 'failed'
        ? 'disconnected'
        : 'reconnecting';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-2">
        <button
          onClick={onEndGame}
          className="px-3 py-1 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          data-testid="back-to-menu-btn"
        >
          &larr; Menu
        </button>
        <SettingsDropdown />
      </div>

      {/* Connection status */}
      <div className="w-full max-w-lg relative">
        <ConnectionStatus state={statusIndicator} />
      </div>

      {/* Role label */}
      <p
        className="text-xs mb-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        You are playing as <strong style={{ color: 'var(--accent)' }}>{localRole}</strong>
      </p>

      {/* Turn indicator */}
      <TurnIndicator
        currentTurn={gameState.currentTurn}
        phase={gameState.phase}
      />

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
      {gameState.chainJumpInProgress !== null &&
        !inputDisabled &&
        gameState.currentTurn === localRole && (
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

      {/* No undo/redo in P2P mode (MP-08) */}

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
