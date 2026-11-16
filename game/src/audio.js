// Aurora Flip: sound effects made with WebAudio oscillators.
// No audio file ships with the game. Every sound is a short synthesized
// tone, so the game stays silent until the first key press or click,
// when the browser allows audio to start.

const MUTE_KEY = 'auroraFlipMuted';

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try {
      this.muted = window.localStorage.getItem(MUTE_KEY) === '1';
    } catch (error) {
      this.muted = false;
    }
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioCtor) {
          this.ctx = new AudioCtor();
        }
      } catch (error) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      window.localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch (error) {
      // Storage may be unavailable. Muting still works for this session.
    }
    return this.muted;
  }

  tone(freq, duration, type, volume, delay, slideTo) {
    if (this.muted || !this.ctx) {
      return;
    }
    try {
      const start = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch (error) {
      // A failed tone never stops the game.
    }
  }

  flip() {
    this.tone(320, 0.14, 'sine', 0.16, 0, 640);
  }

  collect(step) {
    const base = 520 + Math.min(step, 12) * 30;
    this.tone(base, 0.09, 'triangle', 0.16, 0, null);
    this.tone(base * 1.5, 0.12, 'triangle', 0.12, 0.05, null);
  }

  shard() {
    this.tone(880, 0.1, 'triangle', 0.16, 0, null);
    this.tone(1174, 0.1, 'triangle', 0.14, 0.07, null);
    this.tone(1568, 0.16, 'triangle', 0.14, 0.14, null);
  }

  hit() {
    this.tone(140, 0.25, 'sawtooth', 0.2, 0, 60);
  }

  checkpoint() {
    this.tone(660, 0.12, 'sine', 0.16, 0, null);
    this.tone(990, 0.18, 'sine', 0.14, 0.09, null);
  }

  win() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, index) => {
      this.tone(freq, 0.16, 'triangle', 0.16, index * 0.09, null);
    });
  }

  lose() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, index) => {
      this.tone(freq, 0.2, 'triangle', 0.14, index * 0.11, null);
    });
  }

  click() {
    this.tone(700, 0.05, 'square', 0.06, 0, null);
  }

  start() {
    this.tone(440, 0.1, 'triangle', 0.14, 0, null);
    this.tone(660, 0.14, 'triangle', 0.14, 0.08, null);
  }
}
