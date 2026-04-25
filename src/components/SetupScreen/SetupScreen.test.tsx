// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsProvider } from '../../hooks/useSettings';
import { SetupScreen } from './SetupScreen';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('SetupScreen', () => {
  it('renders the brand wordmark', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);
    // EN brand splits into "Puli" + italic "joodam"
    expect(screen.getByText('Puli')).toBeTruthy();
    expect(screen.getByText('joodam')).toBeTruthy();
  });

  it('defaults to vs AI mode, Goat role, Medium difficulty', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    expect(screen.getByTestId('mode-ai').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('mode-local').getAttribute('aria-pressed')).toBe('false');

    expect(screen.getByTestId('role-goat').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('role-tiger').getAttribute('aria-pressed')).toBe('false');

    expect(screen.getByTestId('difficulty-medium').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('difficulty-easy').getAttribute('aria-pressed')).toBe('false');
  });

  it('switches role when tiger is clicked', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    fireEvent.click(screen.getByTestId('role-tiger'));

    expect(screen.getByTestId('role-tiger').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('role-goat').getAttribute('aria-pressed')).toBe('false');
  });

  it('switches difficulty when expert is clicked', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    fireEvent.click(screen.getByTestId('difficulty-expert'));

    expect(screen.getByTestId('difficulty-expert').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('difficulty-medium').getAttribute('aria-pressed')).toBe('false');
  });

  it('renders all four difficulty buttons', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    expect(screen.getByTestId('difficulty-easy')).toBeTruthy();
    expect(screen.getByTestId('difficulty-medium')).toBeTruthy();
    expect(screen.getByTestId('difficulty-hard')).toBeTruthy();
    expect(screen.getByTestId('difficulty-expert')).toBeTruthy();
  });

  it('Begin starts an AI match with chosen role and difficulty', () => {
    const onStart = vi.fn();
    renderWithProviders(<SetupScreen onStart={onStart} />);

    fireEvent.click(screen.getByTestId('role-tiger'));
    fireEvent.click(screen.getByTestId('difficulty-hard'));
    fireEvent.click(screen.getByTestId('begin-btn'));

    expect(onStart).toHaveBeenCalledWith({ humanRole: 'tiger', difficulty: 'hard' });
  });

  it('Begin starts a local match (null config) when local mode is selected', () => {
    const onStart = vi.fn();
    renderWithProviders(<SetupScreen onStart={onStart} />);

    fireEvent.click(screen.getByTestId('mode-local'));
    fireEvent.click(screen.getByTestId('begin-btn'));

    expect(onStart).toHaveBeenCalledWith(null);
  });

  it('Begin invokes onPlayOnline when online mode is selected', () => {
    const onStart = vi.fn();
    const onPlayOnline = vi.fn();
    renderWithProviders(<SetupScreen onStart={onStart} onPlayOnline={onPlayOnline} />);

    fireEvent.click(screen.getByTestId('mode-online'));
    fireEvent.click(screen.getByTestId('begin-btn'));

    expect(onPlayOnline).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('hides the online mode option when onPlayOnline is not provided', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);
    expect(screen.queryByTestId('mode-online')).toBeNull();
  });

  it('disables difficulty buttons when not in AI mode', () => {
    renderWithProviders(<SetupScreen onStart={() => {}} />);

    fireEvent.click(screen.getByTestId('mode-local'));

    const easy = screen.getByTestId('difficulty-easy') as HTMLButtonElement;
    expect(easy.disabled).toBe(true);
  });

  it('shows the resume banner when a saved game is present', () => {
    const onResume = vi.fn();
    renderWithProviders(
      <SetupScreen
        onStart={() => {}}
        savedGame={{ opponent: 'ai', moves: 12 }}
        onResume={onResume}
        onDismissResume={() => {}}
      />,
    );

    expect(screen.getByTestId('resume-banner')).toBeTruthy();
    fireEvent.click(screen.getByTestId('resume-btn'));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('renders history and tutorial footer links when callbacks are provided', () => {
    renderWithProviders(
      <SetupScreen onStart={() => {}} onViewHistory={() => {}} onStartTutorial={() => {}} />,
    );
    expect(screen.getByTestId('history-btn')).toBeTruthy();
    expect(screen.getByTestId('tutorial-btn')).toBeTruthy();
  });
});
