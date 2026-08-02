class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.3;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volumeMult = 1,
    freqEnd?: number
  ) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(this.volume * volumeMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not supported
    }
  }

  private playNoise(duration: number, volumeMult = 0.5) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * volumeMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      // Band-pass filter for wind sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch {
      // Audio not supported
    }
  }

  flap() {
    this.playTone(600, 0.1, 'sine', 0.4, 900);
    setTimeout(() => this.playTone(800, 0.08, 'sine', 0.2, 1100), 30);
  }

  score() {
    this.playTone(880, 0.1, 'sine', 0.5);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.4), 80);
  }

  hit() {
    this.playNoise(0.15, 0.6);
    this.playTone(200, 0.2, 'square', 0.3, 80);
  }

  die() {
    this.playTone(400, 0.15, 'sawtooth', 0.3, 100);
    setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.25, 80), 100);
    setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.2, 60), 200);
  }

  swoosh() {
    this.playNoise(0.15, 0.2);
  }

  buttonClick() {
    this.playTone(700, 0.05, 'sine', 0.2);
  }
}

export const soundManager = new SoundManager();
