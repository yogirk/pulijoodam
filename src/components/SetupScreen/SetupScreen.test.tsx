// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsProvider } from '../../hooks/useSettings';
import { SetupScreen } from './SetupScreen';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('SetupScreen', () => {
  it('renders without crashing', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);
    expect(screen.getByText('Pulijoodam')).toBeTruthy();
  });

  it('defaults to Goat role and Medium difficulty', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    const goatBtn = screen.getByTestId('role-goat');
    const mediumBtn = screen.getByTestId('difficulty-medium');

    // Check selected state (scale class for selected buttons)
    expect(goatBtn.className).toContain('scale-105');
    expect(mediumBtn.className).toContain('scale-[1.02]');
  });

  it('switches role when tiger is clicked', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    const tigerBtn = screen.getByTestId('role-tiger');
    const goatBtn = screen.getByTestId('role-goat');

    fireEvent.click(tigerBtn);

    expect(tigerBtn.className).toContain('scale-105');
    expect(goatBtn.className).toContain('opacity-70');
  });

  it('calls onStart with correct config when Start Game is clicked', () => {
    const onStart = vi.fn();
    renderWithProviders(<SetupScreen onStart={onStart} />);

    // Select tiger + hard
    fireEvent.click(screen.getByTestId('role-tiger'));
    fireEvent.click(screen.getByTestId('difficulty-hard'));
    fireEvent.click(screen.getByTestId('start-game-btn'));

    expect(onStart).toHaveBeenCalledWith({
      humanRole: 'tiger',
      difficulty: 'hard',
    });
  });

  it('calls onStart with null for local 2-player', () => {
    const onStart = vi.fn();
    renderWithProviders(<SetupScreen onStart={onStart} />);

    fireEvent.click(screen.getByTestId('local-2p-btn'));

    expect(onStart).toHaveBeenCalledWith(null);
  });

  it('renders all four difficulty buttons', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    expect(screen.getByTestId('difficulty-easy')).toBeTruthy();
    expect(screen.getByTestId('difficulty-medium')).toBeTruthy();
    expect(screen.getByTestId('difficulty-hard')).toBeTruthy();
    expect(screen.getByTestId('difficulty-expert')).toBeTruthy();
  });

  it('switches difficulty when clicked', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    const expertBtn = screen.getByTestId('difficulty-expert');
    fireEvent.click(expertBtn);
    expect(expertBtn.className).toContain('scale-[1.02]');

    const mediumBtn = screen.getByTestId('difficulty-medium');
    expect(mediumBtn.className).toContain('opacity-70');
  });
});
