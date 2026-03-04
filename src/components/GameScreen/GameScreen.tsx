import { useGame } from '../../hooks/useGame';
import { Board } from '../Board/Board';
import { TurnIndicator } from './TurnIndicator';
import { PoolCounter } from './PoolCounter';
import { GameOverOverlay } from './GameOverOverlay';

export function GameScreen() {
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
  } = useGame();

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
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
