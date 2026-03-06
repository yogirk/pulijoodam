import type { TutorialStep } from './lessons';

interface TutorialOverlayProps {
  step: TutorialStep;
  lessonTitle: string;
  stepIndex: number;
  totalSteps: number;
  onSkip: () => void;
  encouragement: string | null;
}

export function TutorialOverlay({
  step,
  lessonTitle,
  stepIndex,
  totalSteps,
  onSkip,
  encouragement,
}: TutorialOverlayProps) {
  return (
    <div
      className="tutorial-overlay"
      data-testid="tutorial-overlay"
      data-position={step.position}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '2px solid var(--accent)',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      {/* Lesson title + step counter */}
      <div
        className="flex items-center justify-between mb-2"
        style={{ borderBottom: '1px solid var(--text-secondary)', paddingBottom: '8px' }}
      >
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--accent)' }}
        >
          {lessonTitle}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          Step {stepIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Step text */}
      <p className="text-sm leading-relaxed my-3" data-testid="step-text">
        {step.text}
      </p>

      {/* Encouragement text (when user makes valid but unexpected move) */}
      {encouragement && (
        <p
          className="text-sm font-medium my-2"
          style={{ color: 'var(--accent)' }}
          data-testid="encouragement-text"
        >
          {encouragement}
        </p>
      )}

      {/* Skip button */}
      <div className="flex justify-end mt-2">
        <button
          onClick={onSkip}
          className="text-xs px-3 py-1 rounded transition-colors"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--text-secondary)',
          }}
          data-testid="skip-tutorial-btn"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}
