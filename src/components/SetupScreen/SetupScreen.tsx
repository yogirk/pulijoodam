import { useState } from 'react';
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

  const modeOptions: { id: Mode; label: string; hint: string; testId: string; show: boolean }[] = [
    { id: 'ai',     label: t.setup.vsAi,     hint: t.setup.vsAiHint,     testId: 'mode-ai',     show: true },
    { id: 'local',  label: t.setup.vsLocal,  hint: t.setup.vsLocalHint,  testId: 'mode-local',  show: true },
    { id: 'online', label: t.setup.vsOnline, hint: t.setup.vsOnlineHint, testId: 'mode-online', show: !!onPlayOnline },
  ];

  const sideOptions: { id: Role; label: string; desc: string; testId: string }[] = [
    { id: 'tiger', label: t.common.tigers, desc: t.setup.tigersDesc, testId: 'role-tiger' },
    { id: 'goat',  label: t.common.goats,  desc: t.setup.goatsDesc,  testId: 'role-goat' },
  ];

  const difficultyOptions: { id: AIDifficulty; label: string }[] = [
    { id: 'easy',   label: t.setup.easy },
    { id: 'medium', label: t.setup.medium },
    { id: 'hard',   label: t.setup.hard },
    { id: 'expert', label: t.setup.expert },
  ];

  return (
    <>
      {/* Threshold framing: lotus-vine muggu strips along left + right edges.
          Hoisted OUTSIDE the .anim-fade-in wrapper because that class applies
          a `transform`, which would establish a containing block and break
          `position: fixed`. As siblings, the strips stay fixed to the
          viewport and continue past the fold during scroll. */}
      <MugguBorder side="left" />
      <MugguBorder side="right" />

    <div
      className="min-h-screen-safe stone-bg anim-fade-in"
      data-testid="setup-screen"
      style={{ color: 'var(--ink)' }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px) 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top brand row — left: small ornament + established note. right: nothing. */}
        <div className="flex items-center gap-4 mb-10 sm:mb-14">
          <CornerOrnament size={24} />
          <Eyebrow>{t.app.establishedNote}</Eyebrow>
        </div>

        {/* Hero */}
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.05fr_1fr] items-center mb-10 sm:mb-16">
          <div>
            <Eyebrow>{t.app.eyebrow}</Eyebrow>
            <div className="mt-4">
              <Brand size="lg" />
            </div>
            <p
              className={lang === 'te' ? 't-telugu' : 't-display-italic'}
              style={{
                fontSize: 'clamp(16px, 1.6vw, 22px)',
                color: 'var(--ink-soft)',
                maxWidth: 480,
                marginTop: 18,
                lineHeight: 1.45,
              }}
            >
              {t.app.tagline}
            </p>

            <div className="flex flex-wrap gap-3 mt-9">
              <button
                data-testid="begin-btn"
                onClick={handleBegin}
                className="btn btn-primary"
                style={{ fontSize: 15, padding: '14px 24px' }}
              >
                {t.setup.begin} →
              </button>
              {onStartTutorial && (
                <button
                  data-testid="learn-rules-btn"
                  onClick={onStartTutorial}
                  className="btn btn-ghost"
                  style={{ fontSize: 15, padding: '14px 24px' }}
                >
                  {t.setup.learnRules}
                </button>
              )}
            </div>
          </div>

          {/* Floating board preview */}
          <div
            className="card-elev stone-texture relative"
            style={{ padding: 16 }}
            aria-hidden="true"
          >
            <div className="absolute" style={{ top: 12, left: 12 }}>
              <CornerOrnament size={20} corner="tl" />
            </div>
            <div className="absolute" style={{ top: 12, right: 12 }}>
              <CornerOrnament size={20} corner="tr" />
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
              className="flex justify-between mt-3"
              style={{ padding: '0 8px' }}
            >
              <span className="t-caption" style={{ fontSize: 13 }}>
                {t.setup.boardCaption}
              </span>
              <span className="t-caption" style={{ fontSize: 13 }}>
                3 : 15
              </span>
            </div>
          </div>
        </div>

        {/* Resume banner — appears between hero and form when there's a saved game */}
        {savedGame && (
          <div
            className="card mb-10"
            data-testid="resume-banner"
            style={{
              padding: 20,
              borderColor: 'color-mix(in oklch, var(--kumkum) 35%, transparent)',
              background: 'var(--kumkum-soft)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="t-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
                  {t.setup.resumePrompt}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
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
                  style={{ fontSize: 14, padding: '10px 18px' }}
                >
                  {t.common.continue}
                </button>
                <button
                  data-testid="dismiss-resume-btn"
                  onClick={onDismissResume}
                  className="btn btn-ghost"
                  style={{ fontSize: 14, padding: '10px 18px' }}
                >
                  {t.setup.newGame}
                </button>
              </div>
            </div>
          </div>
        )}

        <hr className="rule-h mb-8 sm:mb-12" />

        {/* Setup grid — three columns on desktop, stacks on smaller */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {/* I. Match */}
          <section role="group" aria-labelledby="match-eyebrow">
            <Eyebrow>
              <span id="match-eyebrow">
                {lang === 'te' ? 'ఒకటి' : 'I.'} · {t.setup.chooseMode}
              </span>
            </Eyebrow>
            <div className="flex flex-col gap-2 mt-4">
              {modeOptions.filter(o => o.show).map(o => {
                const selected = mode === o.id;
                return (
                  <button
                    key={o.id}
                    data-testid={o.testId}
                    aria-pressed={selected}
                    onClick={() => setMode(o.id)}
                    className="card text-left flex items-center justify-between"
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderColor: selected ? 'var(--ochre)' : 'var(--rule-soft)',
                      background: selected ? 'var(--ochre-soft)' : 'var(--paper-2)',
                      transition: 'background-color 160ms ease, border-color 160ms ease',
                      minHeight: 60,
                    }}
                  >
                    <span>
                      <span
                        className="block"
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
                      >
                        {o.label}
                      </span>
                      <span
                        className="block"
                        style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}
                      >
                        {o.hint}
                      </span>
                    </span>
                    {selected && (
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M 3 8 L 7 12 L 13 4"
                          fill="none"
                          stroke="var(--ochre-deep)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* II. Side */}
          <section role="group" aria-labelledby="side-eyebrow">
            <Eyebrow>
              <span id="side-eyebrow">
                {lang === 'te' ? 'రెండు' : 'II.'} · {t.setup.chooseSide}
              </span>
            </Eyebrow>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {sideOptions.map(o => {
                const selected = humanRole === o.id;
                return (
                  <button
                    key={o.id}
                    data-testid={o.testId}
                    aria-pressed={selected}
                    onClick={() => setHumanRole(o.id)}
                    className="card text-left"
                    style={{
                      padding: 14,
                      cursor: 'pointer',
                      borderColor: selected ? 'var(--ochre)' : 'var(--rule-soft)',
                      background: selected ? 'var(--ochre-soft)' : 'var(--paper-2)',
                      transition: 'background-color 160ms ease, border-color 160ms ease',
                      minHeight: 88,
                    }}
                  >
                    <div
                      style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}
                    >
                      {o.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-mute)',
                        textAlign: 'center',
                        marginTop: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {o.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* III. Difficulty — only when vs AI */}
          <section
            role="group"
            aria-labelledby="difficulty-eyebrow"
            aria-disabled={mode !== 'ai'}
            style={{ opacity: mode === 'ai' ? 1 : 0.45 }}
          >
            <Eyebrow>
              <span id="difficulty-eyebrow">
                {lang === 'te' ? 'మూడు' : 'III.'} · {t.setup.difficulty}
              </span>
            </Eyebrow>
            <div className="flex flex-col gap-1.5 mt-4">
              {difficultyOptions.map(o => {
                const selected = difficulty === o.id;
                const dots = DIFFICULTY_DOTS[o.id];
                return (
                  <button
                    key={o.id}
                    data-testid={`difficulty-${o.id}`}
                    aria-pressed={selected}
                    disabled={mode !== 'ai'}
                    onClick={() => setDifficulty(o.id)}
                    className="flex justify-between items-center"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--r-md)',
                      border: `1px solid ${selected ? 'var(--ochre)' : 'var(--rule-soft)'}`,
                      background: selected ? 'var(--ochre-soft)' : 'transparent',
                      color: 'var(--ink)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: mode === 'ai' ? 'pointer' : 'not-allowed',
                      transition: 'background-color 160ms ease, border-color 160ms ease',
                      minHeight: 44,
                    }}
                  >
                    <span>{o.label}</span>
                    <span className="flex gap-1" aria-hidden="true">
                      {[1, 2, 3, 4].map(i => (
                        <span
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: i <= dots ? 'var(--ochre-deep)' : 'var(--rule-soft)',
                          }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer links — keep "Game History" reachable */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-10 sm:mt-14">
          {onViewHistory && (
            <button
              data-testid="history-btn"
              onClick={onViewHistory}
              className="btn btn-quiet"
              style={{ padding: '10px 0', fontSize: 13 }}
            >
              {t.history.title}
            </button>
          )}
          {onStartTutorial && (
            <button
              data-testid="tutorial-btn"
              onClick={onStartTutorial}
              className="btn btn-quiet"
              style={{ padding: '10px 0', fontSize: 13 }}
            >
              {t.settings.learnToPlay}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
