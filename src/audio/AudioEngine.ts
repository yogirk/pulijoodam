import type { ThemeName } from '../theme/theme';
import {
  playPlaceSound,
  playSlideSound,
  playCaptureSound,
  playWinSound,
  playLossSound,
  playIllegalSound,
} from './sounds';

class AudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playPlace(theme: ThemeName): void {
    playPlaceSound(this.getContext(), theme);
  }

  playSlide(theme: ThemeName): void {
    playSlideSound(this.getContext(), theme);
  }

  playCapture(theme: ThemeName, chainIndex = 0): void {
    playCaptureSound(this.getContext(), theme, chainIndex);
  }

  playWin(theme: ThemeName): void {
    playWinSound(this.getContext(), theme);
  }

  playLoss(theme: ThemeName): void {
    playLossSound(this.getContext(), theme);
  }

  playIllegal(theme: ThemeName): void {
    playIllegalSound(this.getContext(), theme);
  }
}

export const audioEngine = new AudioEngine();
