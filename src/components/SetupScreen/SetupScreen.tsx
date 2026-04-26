import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '../../engine';
import type { AIDifficulty } from '../../engine/ai/types';
import { useGame } from '../../hooks/useGame';
import { useSettings } from '../../hooks/useSettings';
import { IDLE_ANIMATION } from '../../hooks/useAnimationQueue';
import { Board } from '../Board/Board';
import { Brand } from '../atoms/Brand';
import { CornerOrnament } from '../atoms/CornerOrnament';
import { Eyebrow } from '../atoms/Eyebrow';
import { MugguBorder } from '../atoms/MugguBorder';
import {
  LanguageToggle,
  PiecesToggle,
  ThemeToggle,
} from '../atoms/HeaderToggles';

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

export function SetupScreen({
  onStart,
  onViewHistory,
  onStartTutorial,
  onPlayOnline,
  savedGame,
  onResume,
  onDismissResume,
}: SetupScreenProps) {
  const { t, lang } = useSettings();
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

  const modeOptions: { id: Mode; label: string; testId: string; show: boolean }[] = [
    { id: 'ai',     label: t.setup.vsAi,     testId: 'mode-ai',     show: true },
    { id: 'local',  label: t.setup.vsLocal,  testId: 'mode-local',  show: true },
    { id: 'online', label: t.setup.vsOnline, testId: 'mode-online', show: !!onPlayOnline },
  ];

  const sideOptions: { id: Role; label: string; testId: string }[] = [
    { id: 'tiger', label: t.common.tigers, testId: 'role-tiger' },
    { id: 'goat',  label: t.common.goats,  testId: 'role-goat'  },
  ];

  const difficultyOptions: { id: AIDifficulty; label: string }[] = [
    { id: 'easy',   label: t.setup.easy   },
    { id: 'medium', label: t.setup.medium },
    { id: 'hard',   label: t.setup.hard   },
    { id: 'expert', label: t.setup.expert },
  ];

  return (
    <>
      {/* Threshold framing — hoisted outside the .anim-fade-in transform so
          position: fixed pins to viewport. */}
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
          <PiecesToggle />
          <ThemeToggle />
        </header>

        {/* ── Main content ───────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: 'clamp(32px, 5vw, 56px) clamp(48px, 6vw, 72px) clamp(40px, 5vw, 64px)',
          }}
        >
          {/* Hero — two-column on lg+, stacked below */}
          <section className="grid gap-8 lg:gap-14 lg:grid-cols-[1.1fr_1fr] items-center">
            <div>
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
            </div>

            {/* Compact board preview */}
            <div
              className="card-elev stone-texture relative"
              style={{ padding: 14, justifySelf: 'end', maxWidth: 440 }}
              aria-hidden="true"
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
              >
                <span className="t-caption">{t.setup.boardCaption}</span>
                <span className="t-caption">3 : 15</span>
              </div>
            </div>
          </section>

          {/* Resume banner — between hero and form when there's a saved game */}
          {savedGame && (
            <div
              className="card"
              data-testid="resume-banner"
              style={{
                marginTop: 24,
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

          {/* Inline form — three rows of pickers */}
          <section
            className="flex flex-col"
            style={{ marginTop: 28, gap: 14 }}
            aria-label={t.setup.chooseMode}
          >
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
                options={sideOptions.map((o) => ({ id: o.id, label: o.label, testId: o.testId }))}
              />
            </FormRow>

            <FormRow label={t.setup.difficulty} dim={mode !== 'ai'}>
              <Seg
                ariaLabel={t.setup.difficulty}
                value={difficulty}
                onChange={setDifficulty}
                disabled={mode !== 'ai'}
                options={difficultyOptions.map((o) => ({
                  id: o.id,
                  label: o.label,
                  testId: `difficulty-${o.id}`,
                  decoration: <Dots count={DIFFICULTY_DOTS[o.id]} />,
                }))}
              />
            </FormRow>
          </section>

          {/* Begin CTA at bottom */}
          <div className="flex justify-end" style={{ marginTop: 28 }}>
            <button
              data-testid="begin-btn"
              onClick={handleBegin}
              className="btn btn-primary"
              style={{ fontSize: 15, padding: '14px 26px' }}
            >
              {t.setup.begin} →
            </button>
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
  dim,
}: {
  label: string;
  children: ReactNode;
  dim?: boolean;
}) {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: 'minmax(120px, 0.25fr) 1fr',
        gap: 16,
        opacity: dim ? 0.55 : 1,
        transition: 'opacity 200ms ease',
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
}: {
  ariaLabel: string;
  options: { id: T; label: string; testId?: string; decoration?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  disabled?: boolean;
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
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', gap: 3 }}
    >
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
