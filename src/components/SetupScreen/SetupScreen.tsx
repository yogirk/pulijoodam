import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';
import type { PieceStyle } from '../../theme/theme';
import { useGame } from '../../hooks/useGame';
import { useSettings } from '../../hooks/useSettings';
import { IDLE_ANIMATION } from '../../hooks/useAnimationQueue';
import { Board } from '../Board/Board';
import { Brand } from '../atoms/Brand';
import { CornerOrnament } from '../atoms/CornerOrnament';
import { Eyebrow } from '../atoms/Eyebrow';
import { MugguBorder } from '../atoms/MugguBorder';
import { LanguageToggle, ThemeToggle } from '../atoms/HeaderToggles';

type Mode = 'ai' | 'local' | 'online';

interface SetupScreenProps {
  onStart: (config: { humanRole: Role; difficulty: AIDifficulty } | null) => void;
  onViewHistory?: () => void;
  onStartTutorial?: () => void;
  onPlayOnline?: () => void;
  savedGame?: { opponent: string; moves: number } | null;
  onResume?: () => void;
  onDismissResume?: () => void;
}

const DIFFICULTY_DOTS: Record<AIDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
};

/* ─── Mini glyphs for the Pieces row decoration ───────────────────────── */
function MiniStoneGlyph() {
  return (
    <svg width="14" height="14" viewBox="-9 -9 18 18" aria-hidden="true">
      <circle r="7.5" fill="var(--tiger-stroke)" opacity={0.85} />
      <circle r="7" fill="var(--tiger-fill)" />
      <ellipse cx="-2.4" cy="-1.6" rx="0.9" ry="1.1" fill="var(--tiger-mark)" />
      <ellipse cx="2.4" cy="-1.6" rx="0.9" ry="1.1" fill="var(--tiger-mark)" />
      <path
        d="M -2 1.2 Q -2.6 3.6 0 4 Q 2.6 3.6 2 1.2 Q 1.2 0 0 0 Q -1.2 0 -2 1.2 Z"
        fill="var(--tiger-mark)"
      />
    </svg>
  );
}

function MiniHeadsGlyph() {
  return (
    <svg width="14" height="14" viewBox="-9 -9 18 18" aria-hidden="true">
      <path d="M -5.5 -3 L -4.5 -7 L -2.5 -4.5 Z" fill="var(--tiger-stroke)" />
      <path d="M 5.5 -3 L 4.5 -7 L 2.5 -4.5 Z" fill="var(--tiger-stroke)" />
      <path
        d="M -5.5 -2 Q -6 4 -3.5 5.5 Q 0 6.5 3.5 5.5 Q 6 4 5.5 -2 Q 3.5 -4.5 0 -4.5 Q -3.5 -4.5 -5.5 -2 Z"
        fill="var(--tiger-fill)"
        stroke="var(--tiger-stroke)"
        strokeWidth={0.8}
      />
      <ellipse cx="-2" cy="-0.5" rx="0.8" ry="0.7" fill="var(--tiger-stroke)" />
      <ellipse cx="2" cy="-0.5" rx="0.8" ry="0.7" fill="var(--tiger-stroke)" />
    </svg>
  );
}

export function SetupScreen({
  onStart,
  onViewHistory,
  onStartTutorial,
  onPlayOnline,
  savedGame,
  onResume,
  onDismissResume,
}: SetupScreenProps) {
  const { t, lang, pieceStyle, setPieceStyle } = useSettings();
  const [mode, setMode] = useState<Mode>('ai');
  const [humanRole, setHumanRole] = useState<Role>('goat');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  const previewGame = useGame();

  function handleBegin() {
    if (mode === 'ai') {
      onStart({ humanRole, difficulty });
    } else if (mode === 'online') {
      onPlayOnline?.();
    } else {
      onStart(null);
    }
  }

  const showDifficulty = mode === 'ai';

  const modeOptions: { id: Mode; label: string; testId: string; show: boolean }[] = [
    { id: 'ai',     label: t.setup.vsAi,     testId: 'mode-ai',     show: true },
    { id: 'local',  label: t.setup.vsLocal,  testId: 'mode-local',  show: true },
    { id: 'online', label: t.setup.vsOnline, testId: 'mode-online', show: !!onPlayOnline },
  ];

  const sideOptions: { id: Role; label: string; testId: string }[] = [
    { id: 'tiger', label: t.common.tigers, testId: 'role-tiger' },
    { id: 'goat',  label: t.common.goats,  testId: 'role-goat'  },
  ];

  const piecesOptions: { id: PieceStyle; label: string; testId: string; decoration: ReactNode }[] = [
    { id: 'stone', label: t.settings.pieceStone, testId: 'pieces-stone', decoration: <MiniStoneGlyph /> },
    { id: 'heads', label: t.settings.pieceHeads, testId: 'pieces-heads', decoration: <MiniHeadsGlyph /> },
  ];

  const difficultyOptions: { id: AIDifficulty; label: string }[] = [
    { id: 'easy',   label: t.setup.easy   },
    { id: 'medium', label: t.setup.medium },
    { id: 'hard',   label: t.setup.hard   },
    { id: 'expert', label: t.setup.expert },
  ];

  return (
    <>
      {/* Threshold framing — fixed-position lotus-vine borders. */}
      <MugguBorder side="left" />
      <MugguBorder side="right" />

      <div
        className="min-h-screen-safe stone-bg anim-fade-in"
        data-testid="setup-screen"
        style={{ color: 'var(--ink)' }}
      >
        {/* ── Slim utility bar ───────────────────────────────────────── */}
        <header
          className="flex items-center"
          style={{
            height: 48,
            padding: '0 clamp(48px, 6vw, 72px)',
            background: 'var(--paper-2)',
            borderBottom: '1px solid var(--rule-soft)',
            gap: 12,
          }}
        >
          <span
            className={lang === 'te' ? 't-telugu' : 't-display'}
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.005em',
            }}
          >
            {t.app.name}
          </span>
          <span style={{ flex: 1 }} />

          {onViewHistory && (
            <button
              data-testid="history-btn"
              onClick={onViewHistory}
              className="btn btn-quiet"
              style={{ padding: '6px 10px', fontSize: 13, minHeight: 36 }}
            >
              {t.history.title}
            </button>
          )}
          {onStartTutorial && (
            <button
              data-testid="tutorial-btn"
              onClick={onStartTutorial}
              className="btn btn-quiet"
              style={{ padding: '6px 10px', fontSize: 13, minHeight: 36 }}
            >
              {t.settings.learnToPlay}
            </button>
          )}

          <LanguageToggle />
          <ThemeToggle />
        </header>

        {/* ── Main content ───────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: 'clamp(28px, 4.5vw, 56px) clamp(48px, 6vw, 72px) clamp(40px, 5vw, 72px)',
          }}
        >
          {/* Resume banner — full-width above the grid when a game is saved. */}
          {savedGame && (
            <div
              className="card"
              data-testid="resume-banner"
              style={{
                marginBottom: 24,
                padding: '14px 18px',
                borderColor: 'color-mix(in oklch, var(--kumkum) 30%, transparent)',
                background: 'var(--kumkum-soft)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="t-display" style={{ fontSize: 18, color: 'var(--ink)' }}>
                    {t.setup.resumePrompt}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                    {(savedGame.opponent === 'ai'
                      ? t.setup.resumeAiBody
                      : t.setup.resumeLocalBody
                    ).replace('{n}', String(savedGame.moves))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    data-testid="resume-btn"
                    onClick={onResume}
                    className="btn btn-primary"
                    style={{ fontSize: 13, padding: '8px 16px' }}
                  >
                    {t.common.continue}
                  </button>
                  <button
                    data-testid="dismiss-resume-btn"
                    onClick={onDismissResume}
                    className="btn btn-ghost"
                    style={{ fontSize: 13, padding: '8px 16px' }}
                  >
                    {t.setup.newGame}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/*
            Console + Stage grid.
            Mobile (single col):  brand → stage → form → cta
            Desktop (lg+):        [brand | stage]
                                  [form  | stage]
                                  [cta   | stage]
            Stage spans all three rows on the right; controls read top
            to bottom on the left.
          */}
          <div
            className="
              grid items-start
              gap-8 lg:gap-14
              [grid-template-areas:'brand'_'stage'_'form'_'cta']
              lg:grid-cols-[1.38fr_1fr]
              lg:[grid-template-areas:'brand_stage'_'form_stage'_'cta_stage']
            "
          >
            {/* Brand block */}
            <section style={{ gridArea: 'brand' }}>
              <Eyebrow>{t.app.eyebrow}</Eyebrow>
              <div className="mt-3">
                <Brand size="lg" />
              </div>
              <p
                className={lang === 'te' ? 't-telugu' : 't-display-italic'}
                style={{
                  fontSize: 'clamp(15px, 1.4vw, 19px)',
                  color: 'var(--ink-soft)',
                  maxWidth: 460,
                  marginTop: 14,
                  lineHeight: 1.5,
                }}
              >
                {t.app.tagline}
              </p>
            </section>

            {/* Stage — board preview, top-aligned with brand on lg+. */}
            <aside
              className="card-elev stone-texture relative"
              style={{
                gridArea: 'stage',
                alignSelf: 'start',
                padding: 14,
                width: '100%',
                maxWidth: 480,
                justifySelf: 'end',
              }}
              aria-label={t.setup.boardCaption}
            >
              <div className="absolute" style={{ top: 10, left: 10 }}>
                <CornerOrnament size={18} corner="tl" />
              </div>
              <div className="absolute" style={{ top: 10, right: 10 }}>
                <CornerOrnament size={18} corner="tr" />
              </div>
              <div className="absolute" style={{ bottom: 10, left: 10 }}>
                <CornerOrnament size={18} corner="bl" />
              </div>
              <div className="absolute" style={{ bottom: 10, right: 10 }}>
                <CornerOrnament size={18} corner="br" />
              </div>
              <Board
                gameState={previewGame.gameState}
                selectedNode={null}
                legalMoves={[]}
                onNodeTap={() => {}}
                chainJumpInProgress={null}
                animationState={IDLE_ANIMATION}
                lastEvents={[]}
              />
              <div
                className="flex justify-between"
                style={{ padding: '6px 8px 0', fontSize: 12 }}
                aria-hidden="true"
              >
                <span className="t-caption">{t.setup.boardCaption}</span>
                <span className="t-caption">3 : 15</span>
              </div>
            </aside>

            {/* Form — bracketed by hairline ink rules. */}
            <section style={{ gridArea: 'form' }} aria-label={t.setup.chooseMode}>
              <hr
                aria-hidden="true"
                style={{
                  border: 0,
                  borderTop: '1px solid var(--rule-soft)',
                  margin: '0 0 22px',
                }}
              />

              <div className="flex flex-col" style={{ gap: 14 }}>
                <FormRow label={t.setup.chooseMode}>
                  <Seg
                    ariaLabel={t.setup.chooseMode}
                    value={mode}
                    onChange={setMode}
                    options={modeOptions
                      .filter((o) => o.show)
                      .map((o) => ({ id: o.id, label: o.label, testId: o.testId }))}
                  />
                </FormRow>

                <FormRow label={t.setup.chooseSide}>
                  <Seg
                    ariaLabel={t.setup.chooseSide}
                    value={humanRole}
                    onChange={setHumanRole}
                    options={sideOptions.map((o) => ({
                      id: o.id,
                      label: o.label,
                      testId: o.testId,
                    }))}
                  />
                </FormRow>

                <FormRow label={t.settings.pieces}>
                  <Seg
                    ariaLabel={t.settings.pieces}
                    value={pieceStyle}
                    onChange={setPieceStyle}
                    options={piecesOptions.map((o) => ({
                      id: o.id,
                      label: o.label,
                      testId: o.testId,
                      decoration: o.decoration,
                    }))}
                  />
                </FormRow>

                {/*
                  Difficulty — progressive disclosure.
                  Row stays in DOM (test contract finds `difficulty-easy`)
                  but is visually collapsed and inert when mode !== 'ai'.
                */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: showDifficulty ? '1fr' : '0fr',
                    opacity: showDifficulty ? 1 : 0,
                    marginTop: showDifficulty ? 0 : -14,
                    transition:
                      'grid-template-rows 220ms ease, opacity 200ms ease, margin 200ms ease',
                    pointerEvents: showDifficulty ? 'auto' : 'none',
                  }}
                  aria-hidden={!showDifficulty}
                >
                  <div style={{ overflow: 'hidden', minHeight: 0 }}>
                    <FormRow label={t.setup.difficulty}>
                      <Seg
                        ariaLabel={t.setup.difficulty}
                        value={difficulty}
                        onChange={setDifficulty}
                        disabled={!showDifficulty}
                        tabbable={showDifficulty}
                        options={difficultyOptions.map((o) => ({
                          id: o.id,
                          label: o.label,
                          testId: `difficulty-${o.id}`,
                          decoration: <Dots count={DIFFICULTY_DOTS[o.id]} />,
                        }))}
                      />
                    </FormRow>
                  </div>
                </div>
              </div>

              <hr
                aria-hidden="true"
                style={{
                  border: 0,
                  borderTop: '1px solid var(--rule-soft)',
                  margin: '24px 0 0',
                }}
              />
            </section>

            {/* CTA — full width of the controls column. */}
            <div style={{ gridArea: 'cta' }}>
              <button
                data-testid="begin-btn"
                onClick={handleBegin}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '16px 24px',
                  minHeight: 56,
                  marginTop: 24,
                }}
              >
                {t.setup.begin} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Local helpers
   ────────────────────────────────────────────────────────────────────── */

function FormRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: '96px 1fr',
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--ink-mute)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function Seg<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  disabled,
  tabbable = true,
}: {
  ariaLabel: string;
  options: { id: T; label: string; testId?: string; decoration?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  disabled?: boolean;
  tabbable?: boolean;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-pressed={active}
            data-testid={o.testId}
            disabled={disabled}
            tabIndex={tabbable ? undefined : -1}
            onClick={() => onChange(o.id)}
            className={`seg-item ${active ? 'is-active' : ''}`}
            style={{
              cursor: disabled ? 'not-allowed' : 'pointer',
              gap: 8,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {o.decoration}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Dots({ count }: { count: number }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: i <= count ? 'var(--ochre-deep)' : 'var(--rule-soft)',
          }}
        />
      ))}
    </span>
  );
}
