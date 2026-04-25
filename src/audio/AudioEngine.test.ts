import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Web Audio API
function createMockOscillator() {
  return {
    type: 'sine',
    frequency: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockGain() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
}

function createMockFilter() {
  return {
    type: 'lowpass',
    frequency: { value: 0 },
    Q: { value: 0 },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
}

function createMockBufferSource() {
  return {
    buffer: null,
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockAudioContext() {
  return {
    currentTime: 0,
    state: 'running' as string,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => createMockOscillator()),
    createGain: vi.fn(() => createMockGain()),
    createBiquadFilter: vi.fn(() => createMockFilter()),
    createBuffer: vi.fn((_channels: number, length: number, _rate: number) => ({
      getChannelData: vi.fn(() => new Float32Array(length)),
    })),
    createBufferSource: vi.fn(() => createMockBufferSource()),
  };
}

let MockAudioContext: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  MockAudioContext = vi.fn(() => createMockAudioContext());
  vi.stubGlobal('AudioContext', MockAudioContext);
});

describe('AudioEngine', () => {
  it('does not create AudioContext on import', async () => {
    await import('./AudioEngine');
    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('creates AudioContext lazily on first sound call', async () => {
    const { audioEngine } = await import('./AudioEngine');
    audioEngine.playPlace('light');
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('reuses existing AudioContext on subsequent calls', async () => {
    const { audioEngine } = await import('./AudioEngine');
    audioEngine.playPlace('light');
    audioEngine.playPlace('dark');
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('resumes AudioContext when suspended', async () => {
    const mockCtx = createMockAudioContext();
    mockCtx.state = 'suspended';
    MockAudioContext.mockReturnValueOnce(mockCtx);

    const { audioEngine } = await import('./AudioEngine');
    audioEngine.playPlace('light');
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  describe('sound methods create oscillator nodes', () => {
    it('playPlace creates oscillator and gain', async () => {
      const mockCtx = createMockAudioContext();
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playPlace('light');

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playSlide creates oscillator and gain', async () => {
      const mockCtx = createMockAudioContext();
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playSlide('light');

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playCapture creates oscillator and gain', async () => {
      const mockCtx = createMockAudioContext();
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playCapture('light');

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playWin creates oscillator and gain', async () => {
      const mockCtx = createMockAudioContext();
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playWin('light');

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playLoss creates oscillator and gain', async () => {
      const mockCtx = createMockAudioContext();
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playLoss('light');

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playIllegal creates oscillator and gain', async () => {
      const mockCtx = createMockAudioContext();
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playIllegal('light');

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });
  });

  describe('chain-hop escalation', () => {
    it('playCapture with chainIndex=0 uses base frequency', async () => {
      const mockOsc = createMockOscillator();
      const mockCtx = createMockAudioContext();
      mockCtx.createOscillator.mockReturnValueOnce(mockOsc);
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playCapture('light', 0);

      // First frequency.setValueAtTime call provides the base frequency
      const baseFreq = mockOsc.frequency.setValueAtTime.mock.calls[0]?.[0];
      expect(baseFreq).toBeGreaterThan(0);
    });

    it('playCapture with chainIndex=2 uses higher frequency than chainIndex=0', async () => {
      // Test escalation by comparing two calls
      const mockOsc0 = createMockOscillator();
      const mockOsc2 = createMockOscillator();
      const mockCtx = createMockAudioContext();
      mockCtx.createOscillator
        .mockReturnValueOnce(mockOsc0)
        .mockReturnValueOnce(mockOsc2);
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playCapture('light', 0);
      audioEngine.playCapture('light', 2);

      const freq0 = mockOsc0.frequency.setValueAtTime.mock.calls[0]?.[0] ?? 0;
      const freq2 = mockOsc2.frequency.setValueAtTime.mock.calls[0]?.[0] ?? 0;
      expect(freq2).toBeGreaterThan(freq0);
    });
  });

  describe('theme-specific sounds', () => {
    it('playPlace traditional uses sine waveform', async () => {
      const mockOsc = createMockOscillator();
      const mockCtx = createMockAudioContext();
      mockCtx.createOscillator.mockReturnValueOnce(mockOsc);
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playPlace('light');

      expect(mockOsc.type).toBe('sine');
    });

    it('playPlace modern uses triangle waveform', async () => {
      const mockOsc = createMockOscillator();
      const mockCtx = createMockAudioContext();
      mockCtx.createOscillator.mockReturnValueOnce(mockOsc);
      MockAudioContext.mockReturnValueOnce(mockCtx);

      const { audioEngine } = await import('./AudioEngine');
      audioEngine.playPlace('dark');

      expect(mockOsc.type).toBe('triangle');
    });
  });
});
