import { useGame } from '../../hooks/useGame';
import { useAIGame } from '../../hooks/useAIGame';
import { useAnimationQueue } from '../../hooks/useAnimationQueue';
import { useSettings } from '../../hooks/useSettings';
import { Board } from '../Board/Board';
import { ScreenReaderAnnouncer } from '../Board/ScreenReaderAnnouncer';
import { GameOverOverlay } from './GameOverOverlay';
import { SettingsDropdown } from '../Settings/SettingsDropdown';
import { Brand } from '../atoms/Brand';
import { CornerOrnament } from '../atoms/CornerOrnament';
import { WIN_CAPTURES, type Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';

interface GameScreenProps {
  aiConfig?: { humanRole: Role; difficulty: AIDifficulty } | null;
  onBackToMenu?: () => void;
  onStartTutorial?: () => void;
}

/**
 * Shared game-board chrome. Rails are rendered as placeholder slots —
 * commit B replaces them with full SidePanel atoms (identity ribbon,
 * stats, "YOUR TURN •" indicator, accordions for rules and history).
 */
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
  const { theme, soundEnabled, t, lang } = useSettings();
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

  const inputDisabled = isAIThinking || animationState.isAnimating;

  // Turn caption — italic action prompt that appears below the move counter.
  // In commit B this becomes the "YOUR TURN •" ribbon on the active rail.
  let turnCaption = '';
  if (gameState.chainJumpInProgress !== null) {
    turnCaption = t.game.chainPossible;
  } else if (gameState.phase === 'placement' && gameState.currentTurn === 'goat') {
    turnCaption = t.turn.placeAGoat;
  } else {
    turnCaption = t.turn.moveAPiece;
  }

  return (
    <div
      className="h-[100dvh] w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
    >
      {/* Header */}
      <header
        className="flex-none flex items-center justify-between px-4 lg:px-6"
        style={{
          height: 56,
          borderBottom: '1px solid var(--rule-soft)',
          backgroundColor: 'var(--paper-2)',
        }}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {onBackToMenu && (
            <button
              data-testid="back-to-menu-btn"
              onClick={onBackToMenu}
              className="btn btn-quiet"
              style={{ minHeight: 44, padding: '6px 10px', fontSize: 13 }}
              aria-label={t.common.back}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M 10 3 L 5 8 L 10 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline" style={{ marginLeft: 4 }}>
                {lang === 'te' ? 'మెను' : 'Menu'}
              </span>
            </button>
          )}
        </div>

        <div className="flex-none flex items-center gap-3">
          <Brand size="sm" />
          <span className="pill" data-testid="phase-pill" style={{ marginLeft: 6 }}>
            {gameState.phase === 'placement' ? t.phase.placement : t.phase.movement}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-end">
          <SettingsDropdown onStartTutorial={onStartTutorial} />
        </div>
      </header>

      {/* Mobile capture/pool strip — under header on small screens */}
      <div
        className="flex lg:hidden items-center justify-center gap-3 px-4 flex-none"
        style={{
          height: 40,
          borderBottom: '1px solid var(--rule-soft)',
          backgroundColor: 'var(--paper-2)',
        }}
      >
        {gameState.phase === 'placement' && (
          <span className="pill">
            <span style={{ color: 'var(--ink-mute)' }}>{t.common.pool}</span>
            <span className="t-mono-ui" style={{ marginLeft: 6, color: 'var(--ink)', fontWeight: 600 }}>
              {gameState.goatsInPool}
            </span>
          </span>
        )}
        <span
          className={`pill ${gameState.goatsCaptured > 0 ? 'pill-kumkum' : ''}`}
          style={{
            animation:
              gameState.goatsCaptured >= WIN_CAPTURES - 3
                ? 'danger-pulse 2s ease-in-out infinite'
                : 'none',
          }}
        >
          <span>{t.common.captured}</span>
          <span className="t-mono-ui" style={{ marginLeft: 6, fontWeight: 700 }}>
            {gameState.goatsCaptured} / {WIN_CAPTURES}
          </span>
        </span>
      </div>

      {/* Main — 280/1fr/280 grid on desktop, single column below */}
      <main
        className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 lg:gap-6 p-4 lg:px-8 lg:py-6"
      >

        {/* Left rail — placeholder (commit B: SidePanel for tigers) */}
        <aside
          className="hidden lg:flex card flex-col"
          data-testid="left-rail"
          style={{ padding: 20, alignSelf: 'stretch' }}
          aria-label={t.common.tigers}
        >
          <div className="t-eyebrow">{t.common.tigers}</div>
          <div className="t-display" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 6 }}>
            {gameState.currentTurn === 'tiger' ? t.turn.yours : t.turn.theirs}
          </div>
          <div className="rule-h-solid" style={{ margin: '14px 0' }} />
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontStyle: 'italic' }}>
            (rail · commit B fills this in)
          </div>
        </aside>

        {/* Board — card-elev with stipple texture and four corner ornaments */}
        <section
          className="card-elev stone-texture flex items-center justify-center min-w-0 relative"
          style={{
            padding: 16,
            animation: animationState.shaking ? 'board-shake 200ms ease-out' : 'none',
          }}
        >
          <div className="absolute" style={{ top: 12, left: 12 }}>
            <CornerOrnament size={22} corner="tl" />
          </div>
          <div className="absolute" style={{ top: 12, right: 12 }}>
            <CornerOrnament size={22} corner="tr" />
          </div>
          <div className="absolute" style={{ bottom: 12, left: 12 }}>
            <CornerOrnament size={22} corner="bl" />
          </div>
          <div className="absolute" style={{ bottom: 12, right: 12 }}>
            <CornerOrnament size={22} corner="br" />
          </div>
          <div className="w-full h-full flex items-center justify-center">
            <Board
              gameState={gameState}
              selectedNode={selectedNode}
              legalMoves={legalMoves}
              onNodeTap={inputDisabled ? () => {} : onNodeTap}
              chainJumpInProgress={gameState.chainJumpInProgress}
              animationState={animationState}
              lastEvents={game.lastEvents}
            />
          </div>
        </section>

        {/* Right rail — placeholder (commit B: SidePanel for goats + move history) */}
        <aside
          className="hidden lg:flex card flex-col"
          data-testid="right-rail"
          style={{ padding: 20, alignSelf: 'stretch' }}
          aria-label={t.common.goats}
        >
          <div className="t-eyebrow">{t.common.goats}</div>
          <div className="t-display" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 6 }}>
            {gameState.currentTurn === 'goat' ? t.turn.yours : t.turn.theirs}
          </div>
          <div className="rule-h-solid" style={{ margin: '14px 0' }} />
          <div className="flex flex-col gap-3">
            {gameState.phase === 'placement' && (
              <div className="flex items-baseline justify-between">
                <span style={{ fontSize: 12, color: 'var(--ink-mute)', letterSpacing: '0.04em' }}>
                  {t.common.pool}
                </span>
                <span className="t-display" style={{ fontSize: 28, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                  {gameState.goatsInPool}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span style={{ fontSize: 12, color: 'var(--ink-mute)', letterSpacing: '0.04em' }}>
                {t.common.captured}
              </span>
              <span
                className="t-display"
                style={{
                  fontSize: 28,
                  color: gameState.goatsCaptured > 0 ? 'var(--kumkum)' : 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {gameState.goatsCaptured}
                <span style={{ color: 'var(--ink-mute)', fontSize: 18 }}> / {WIN_CAPTURES}</span>
              </span>
            </div>
          </div>
          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--ink-mute)', fontStyle: 'italic' }}>
            (rail · commit B fills this in)
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer
        className="flex-none flex items-center justify-between gap-3 px-4 lg:px-8"
        style={{
          height: 72,
          borderTop: '1px solid var(--rule-soft)',
          backgroundColor: 'var(--paper-2)',
        }}
      >
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <span className="t-mono-ui" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
            {t.common.moves} · {gameState.moveHistory.length}
          </span>
        </div>

        <div className="flex-1 hidden md:flex items-center justify-center min-w-0">
          {isAIThinking ? (
            <span
              className="t-caption"
              style={{ fontSize: 14, color: 'var(--ochre-deep)' }}
              data-testid="ai-thinking"
            >
              {t.game.aiThinking}
            </span>
          ) : (
            turnCaption && (
              <span className="t-caption" style={{ fontSize: 14 }}>
                {turnCaption}
              </span>
            )
          )}
        </div>

        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          {gameState.chainJumpInProgress !== null && !inputDisabled && (
            <button
              data-testid="end-chain-btn"
              onClick={onEndChain}
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: 13 }}
            >
              {t.game.endTurn}
            </button>
          )}
          <button
            data-testid="undo-btn"
            onClick={onUndo}
            disabled={!canUndo || inputDisabled}
            className="btn btn-ghost"
            style={{
              padding: '10px 14px',
              fontSize: 13,
              opacity: !canUndo || inputDisabled ? 0.4 : 1,
            }}
          >
            {t.game.undo}
          </button>
          <button
            data-testid="redo-btn"
            onClick={onRedo}
            disabled={!canRedo || inputDisabled}
            className="btn btn-ghost hidden sm:inline-flex"
            style={{
              padding: '10px 14px',
              fontSize: 13,
              opacity: !canRedo || inputDisabled ? 0.4 : 1,
            }}
          >
            {t.game.redo}
          </button>
        </div>
      </footer>

      {/* Screen reader announcements */}
      <ScreenReaderAnnouncer lastEvents={game.lastEvents} gameState={gameState} />

      {/* Game over overlay */}
      {status !== 'ongoing' && !animationState.isAnimating && (
        <GameOverOverlay status={status} onNewGame={onNewGame} />
      )}
    </div>
  );
}

function LocalGameScreen({
  onBackToMenu,
  onStartTutorial,
}: {
  onBackToMenu?: () => void;
  onStartTutorial?: () => void;
}) {
  const game = useGame();
  return <GameBoard game={game} isAIThinking={false} onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
}

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

export function GameScreen({ aiConfig, onBackToMenu, onStartTutorial }: GameScreenProps) {
  if (aiConfig) {
    return <AIGameScreen aiConfig={aiConfig} onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
  }
  return <LocalGameScreen onBackToMenu={onBackToMenu} onStartTutorial={onStartTutorial} />;
}
