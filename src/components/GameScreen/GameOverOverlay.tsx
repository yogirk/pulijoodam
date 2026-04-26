import { useEffect, useRef } from 'react';
import {
  WIN_CAPTURES,
  NODES,
  JUMP_MAP,
  type GameState,
  type GameStatus,
} from '../../engine';
import { useT } from '../../hooks/useSettings';
import { CornerOrnament } from '../atoms/CornerOrnament';
import { Eyebrow } from '../atoms/Eyebrow';
import { PieceGlyph } from '../atoms/PieceGlyph';

interface GameOverOverlayProps {
  status: GameStatus;
  gameState: GameState;
  onNewGame: () => void;
  onBackToMenu?: () => void;
}

function trappedTigerCount(state: GameState): number {
  let trapped = 0;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'tiger') continue;
    let hasMove = false;
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] === null) {
        hasMove = true;
        break;
      }
      if (state.board[neighbor] === 'goat') {
        const landing = JUMP_MAP[`${i},${neighbor}`];
        if (landing !== undefined && state.board[landing] === null) {
          hasMove = true;
          break;
        }
      }
    }
    if (!hasMove) trapped++;
  }
  return trapped;
}

export function GameOverOverlay({
  status,
  gameState,
  onNewGame,
  onBackToMenu,
}: GameOverOverlayProps) {
  const t = useT();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onNewGame();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNewGame]);

  const isTigerWin = status === 'tiger-wins';
  const isGoatWin = status === 'goat-wins';
  const isDraw = status === 'draw-repetition' || status === 'draw-50moves';

  let heading: string;
  let flourish: string | null;
  if (isTigerWin) {
    heading = t.gameOver.tigersWin;
    flourish = t.gameOver.flourishTigerWin;
  } else if (isGoatWin) {
    heading = t.gameOver.goatsWin;
    flourish = t.gameOver.flourishGoatWin;
  } else if (status === 'draw-repetition') {
    heading = t.gameOver.drawRepetition;
    flourish = null;
  } else if (status === 'draw-50moves') {
    heading = t.gameOver.draw50Moves;
    flourish = null;
  } else {
    heading = '';
    flourish = null;
  }

  const captured = gameState.goatsCaptured;
  const trapped = trappedTigerCount(gameState);
  const moves = gameState.moveHistory.length;

  // Hero glyph: tiger on tiger-win, goat on goat-win, neutral (no glyph) on draw.
  const heroRole = isTigerWin ? 'tiger' : isGoatWin ? 'goat' : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: 'color-mix(in oklch, var(--paper) 80%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'overlay-backdrop-enter 320ms ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Game over"
      data-testid="game-over-overlay"
    >
      <div
        className="card-elev stone-texture relative w-full max-w-[540px] text-center px-6 py-9 sm:px-10 sm:py-12"
        style={{
          animation: 'overlay-card-enter 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ position: 'absolute', top: 14, left: 14 }}>
          <CornerOrnament size={26} corner="tl" />
        </div>
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <CornerOrnament size={26} corner="tr" />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
          <CornerOrnament size={26} corner="bl" />
        </div>
        <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
          <CornerOrnament size={26} corner="br" />
        </div>

        <Eyebrow className="mb-6">{t.gameOver.eyebrow}</Eyebrow>

        {heroRole && (
          <div className="flex justify-center mb-5">
            <PieceGlyph type={heroRole} size={84} />
          </div>
        )}

        <h2
          className="t-display"
          style={{
            fontSize: isDraw ? 36 : 44,
            margin: 0,
            color: 'var(--ink)',
            lineHeight: 1.1,
          }}
          data-testid="game-over-text"
        >
          {heading}
        </h2>

        {flourish && (
          <p
            className="t-display-italic"
            style={{
              fontSize: 18,
              color: 'var(--ink-soft)',
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            {flourish}
          </p>
        )}

        <div
          className="flex justify-center gap-5 sm:gap-8"
          style={{
            padding: '18px 0',
            borderTop: '1px solid var(--rule-soft)',
            borderBottom: '1px solid var(--rule-soft)',
            margin: '28px 0 32px',
          }}
        >
          <Stat
            value={`${captured} / ${WIN_CAPTURES}`}
            label={t.gameOver.captured}
            color={isTigerWin ? 'var(--kumkum)' : 'var(--ink-mute)'}
          />
          <div style={{ width: 1, background: 'var(--rule-soft)' }} />
          <Stat
            value={String(trapped)}
            label={t.gameOver.trapped}
            color={isGoatWin ? 'var(--jade)' : 'var(--ink-mute)'}
          />
          <div style={{ width: 1, background: 'var(--rule-soft)' }} />
          <Stat value={String(moves)} label={t.gameOver.moves} color="var(--ink)" />
        </div>

        <div className="flex flex-wrap justify-center" style={{ gap: 10 }}>
          <button
            ref={buttonRef}
            onClick={onNewGame}
            className="btn btn-primary"
            data-testid="new-game-button"
          >
            {t.gameOver.rematch}
          </button>
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="btn btn-quiet"
              data-testid="game-over-home-button"
            >
              {t.gameOver.home}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div>
      <div
        className="t-display"
        style={{ fontSize: 32, color, lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div className="t-eyebrow" style={{ marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
