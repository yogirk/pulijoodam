import type { ThemeName } from '../theme/theme';

// ── Utility: noise buffer ───────────────────────────────────────────────────

function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// ── Place: stone tap (traditional) / wood clack (modern) ────────────────────

export function playPlaceSound(ctx: AudioContext, theme: ThemeName): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = theme === 'light' ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(theme === 'light' ? 900 : 600, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);

  // Noise burst for texture
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.04);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.1, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = theme === 'light' ? 2000 : 1200;
  filter.Q.value = 1.5;

  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.04);
}

// ── Slide: grinding scrape (traditional) / soft whoosh (modern) ─────────────

export function playSlideSound(ctx: AudioContext, theme: ThemeName): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = theme === 'light' ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(theme === 'light' ? 300 : 400, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

// ── Capture: heavy impact (traditional) / sharp knock (modern) ──────────────

export function playCaptureSound(
  ctx: AudioContext,
  theme: ThemeName,
  chainIndex = 0,
): void {
  const now = ctx.currentTime;
  const pitchMultiplier = 1 + chainIndex * 0.15;
  const volumeBoost = Math.min(1 + chainIndex * 0.1, 1.5);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const baseFreq = theme === 'light' ? 200 : 350;
  osc.type = theme === 'light' ? 'sine' : 'square';
  osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);
  osc.frequency.exponentialRampToValueAtTime(80 * pitchMultiplier, now + 0.12);

  gain.gain.setValueAtTime(0.3 * volumeBoost, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);

  // Noise burst for impact texture
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.06);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2 * volumeBoost, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.06);
}

// ── Win: bell/gong (traditional) / warm chime (modern) ──────────────────────

export function playWinSound(ctx: AudioContext, theme: ThemeName): void {
  const now = ctx.currentTime;

  if (theme === 'light') {
    // FM synthesis bell/gong
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const outGain = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(880, now);
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(880 * 1.4, now);
    modGain.gain.setValueAtTime(300, now);

    outGain.gain.setValueAtTime(0.2, now);
    outGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    modulator.connect(modGain).connect(carrier.frequency);
    carrier.connect(outGain).connect(ctx.destination);
    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.8);
    carrier.stop(now + 0.8);
  } else {
    // Harmonic chime -- three sine partials
    const freqs = [523, 659, 784]; // C5, E5, G5
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }
}

// ── Loss: low rumble (traditional) / dull thud (modern) ─────────────────────

export function playLossSound(ctx: AudioContext, theme: ThemeName): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(theme === 'light' ? 120 : 100, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);

  // Noise for rumble
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.3);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.3);
}

// ── Illegal: error buzz ─────────────────────────────────────────────────────

export function playIllegalSound(ctx: AudioContext, theme: ThemeName): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(theme === 'light' ? 180 : 220, now);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.setValueAtTime(0.15, now + 0.05);
  gain.gain.setValueAtTime(0, now + 0.06);
  gain.gain.setValueAtTime(0.15, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}
