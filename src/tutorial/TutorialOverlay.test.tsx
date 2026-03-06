// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialOverlay } from './TutorialOverlay';
import type { TutorialStep } from './lessons';

const baseStep: TutorialStep = {
  text: 'Place your first goat on a highlighted node.',
  highlightNodes: [1, 2, 3],
  position: 'bottom',
};

describe('TutorialOverlay', () => {
  it('renders step text', () => {
    render(
      <TutorialOverlay
        step={baseStep}
        lessonTitle="Board & Placement"
        stepIndex={0}
        totalSteps={5}
        onSkip={() => {}}
        encouragement={null}
      />
    );
    expect(screen.getByText('Place your first goat on a highlighted node.')).toBeTruthy();
  });

  it('renders skip button and clicking it calls onSkip', () => {
    const onSkip = vi.fn();
    render(
      <TutorialOverlay
        step={baseStep}
        lessonTitle="Board & Placement"
        stepIndex={0}
        totalSteps={5}
        onSkip={onSkip}
        encouragement={null}
      />
    );
    const skipBtn = screen.getByText('Skip Tutorial');
    expect(skipBtn).toBeTruthy();
    fireEvent.click(skipBtn);
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('shows step counter correctly', () => {
    render(
      <TutorialOverlay
        step={baseStep}
        lessonTitle="Board & Placement"
        stepIndex={1}
        totalSteps={5}
        onSkip={() => {}}
        encouragement={null}
      />
    );
    expect(screen.getByText('Step 2 of 5')).toBeTruthy();
  });

  it('shows lesson title', () => {
    render(
      <TutorialOverlay
        step={baseStep}
        lessonTitle="Board & Placement"
        stepIndex={0}
        totalSteps={5}
        onSkip={() => {}}
        encouragement={null}
      />
    );
    expect(screen.getByText('Board & Placement')).toBeTruthy();
  });

  it('shows encouragement text when provided', () => {
    render(
      <TutorialOverlay
        step={baseStep}
        lessonTitle="Board & Placement"
        stepIndex={0}
        totalSteps={5}
        onSkip={() => {}}
        encouragement="Good move! That works too."
      />
    );
    expect(screen.getByText('Good move! That works too.')).toBeTruthy();
  });

  it('does not show encouragement when null', () => {
    render(
      <TutorialOverlay
        step={baseStep}
        lessonTitle="Board & Placement"
        stepIndex={0}
        totalSteps={5}
        onSkip={() => {}}
        encouragement={null}
      />
    );
    expect(screen.queryByTestId('encouragement-text')).toBeNull();
  });
});
