import { useState, useEffect, useRef, useMemo } from 'react';
import type { GameRecord } from './types';
import type { GameState, Move } from '../engine';
import { createGame, applyMove, getLegalMoves } from '../engine';
import { Board } from '../components/Board/Board';

interface ReplayScreenProps {
  game: GameRecord;
  onBack: () => void;
}

/** Replay all moves through the engine to build an array of state snapshots. */
function buildSnapshots(moves: Move[]): GameState[] {
  const snapshots: GameState[] = [];
  let state = createGame();
  snapshots.push(state);

  for (const move of moves) {
    const result = applyMove(state, move);
    if (!result.error) {
      state = result.state;
      snapshots.push(state);
    }
  }

  return snapshots;
}

function describeMoveAction(move: Move): string {
  switch (move.type) {
    case 'PLACE':
      return `Goat placed at node ${move.to}`;
    case 'MOVE':
      return `Piece moved from ${move.from} to ${move.to}`;
    case 'CAPTURE':
      return `Tiger captured: ${move.from} over ${move.over} to ${move.to}`;
    case 'END_CHAIN':
      return 'Chain hop ended';
  }
}

export function ReplayScreen({ game, onBack }: ReplayScreenProps) {
  const snapshots = useMemo(() => buildSnapshots(game.moveHistory), [game]);
  const maxIndex = snapshots.length - 1;

  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentState = snapshots[moveIndex];
  const legalMoves = useMemo(() => getLegalMoves(currentState), [currentState]);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setMoveIndex(prev => {
          const next = prev + 1;
          if (next >= maxIndex) {
            setIsPlaying(false);
          }
          return Math.min(next, maxIndex);
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, maxIndex]);

  const goToFirst = () => { setMoveIndex(0); setIsPlaying(false); };
  const goToPrev = () => setMoveIndex(i => Math.max(0, i - 1));
  const goToNext = () => setMoveIndex(i => Math.min(maxIndex, i + 1));
  const goToLast = () => { setMoveIndex(maxIndex); setIsPlaying(false); };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else if (moveIndex < maxIndex) {
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center mb-4">
        <button
          onClick={onBack}
          className="px-3 py-1 text-stone-400 hover:text-stone-200 text-sm transition-colors"
          data-testid="replay-back-btn"
        >
          &larr; Back
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-amber-400">
          Game Replay
        </h1>
        <div className="w-16" />
      </div>

      {/* Board (read-only) */}
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <Board
          gameState={currentState}
          selectedNode={null}
          legalMoves={legalMoves}
          onNodeTap={() => {}}
          chainJumpInProgress={null}
        />
      </div>

      {/* Move info */}
      {moveIndex > 0 && moveIndex <= game.moveHistory.length && (
        <p className="text-stone-400 text-sm mt-2">
          {describeMoveAction(game.moveHistory[moveIndex - 1])}
        </p>
      )}

      {/* Move counter */}
      <p className="text-stone-300 text-sm mt-2" data-testid="replay-move-counter">
        Move {moveIndex} / {maxIndex}
      </p>

      {/* Timeline scrubber */}
      <input
        type="range"
        min={0}
        max={maxIndex}
        value={moveIndex}
        onChange={(e) => setMoveIndex(Number(e.target.value))}
        className="w-full max-w-lg mt-2"
        data-testid="replay-scrubber"
      />

      {/* Controls */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={goToFirst}
          disabled={moveIndex === 0}
          className="px-3 py-2 bg-stone-700 text-white rounded disabled:opacity-40"
          data-testid="replay-first"
        >
          |&lt;
        </button>
        <button
          onClick={goToPrev}
          disabled={moveIndex === 0}
          className="px-3 py-2 bg-stone-700 text-white rounded disabled:opacity-40"
          data-testid="replay-prev"
        >
          &lt;
        </button>
        <button
          onClick={togglePlay}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded transition-colors"
          data-testid="replay-play"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={goToNext}
          disabled={moveIndex === maxIndex}
          className="px-3 py-2 bg-stone-700 text-white rounded disabled:opacity-40"
          data-testid="replay-next"
        >
          &gt;
        </button>
        <button
          onClick={goToLast}
          disabled={moveIndex === maxIndex}
          className="px-3 py-2 bg-stone-700 text-white rounded disabled:opacity-40"
          data-testid="replay-last"
        >
          &gt;|
        </button>
      </div>
    </div>
  );
}
