// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { SettingsProvider } from '../../hooks/useSettings';
import { SidePanel } from './SidePanel';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('SidePanel', () => {
  it('renders the side label and stats', () => {
    renderWithProviders(
      <SidePanel
        side="tiger"
        isTurn={false}
        stats={[
          { label: 'Captured', value: '3 / 10' },
          { label: 'Remaining', value: 12 },
        ]}
      />,
    );

    expect(screen.getByText('Tigers')).toBeTruthy();
    expect(screen.getByText('Captured')).toBeTruthy();
    expect(screen.getByText('3 / 10')).toBeTruthy();
    expect(screen.getByText('Remaining')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('renders the YOUR TURN ribbon when active', () => {
    renderWithProviders(
      <SidePanel side="goat" isTurn stats={[]} testId="rail" />,
    );
    expect(screen.getByTestId('turn-ribbon')).toBeTruthy();
  });

  it('does not render the turn ribbon when not active', () => {
    renderWithProviders(
      <SidePanel side="goat" isTurn={false} stats={[]} testId="rail" />,
    );
    expect(screen.queryByTestId('turn-ribbon')).toBeNull();
  });

  it('labels the panel "You" when isYou is true', () => {
    renderWithProviders(
      <SidePanel side="goat" isTurn={false} isYou stats={[]} />,
    );
    expect(screen.getByText('You')).toBeTruthy();
  });

  it('labels the panel "Opponent" when isYou is false', () => {
    renderWithProviders(
      <SidePanel side="tiger" isTurn={false} isYou={false} stats={[]} />,
    );
    expect(screen.getByText('Opponent')).toBeTruthy();
  });

  it('shows neither You nor Opponent when isYou is undefined', () => {
    renderWithProviders(
      <SidePanel side="tiger" isTurn={false} stats={[]} />,
    );
    expect(screen.queryByText('You')).toBeNull();
    expect(screen.queryByText('Opponent')).toBeNull();
  });
});
