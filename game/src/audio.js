// Aurora Flip: sound effects and ambience made with WebAudio.
// No audio file ships with the game. Every sound is synthesized: short
// tones for actions, filtered noise for whooshes and hits, and a quiet
// pad plus wind bed that starts on the first key press or click, when
// the browser allows audio to start.

const MUTE_KEY = 'auroraFlipMuted';

// A bright pentatonic ladder, so a long orb streak climbs musically
// instead of repeating one note.
const LADDER = [523, 587, 659, 784, 880, 1046, 1174, 1318, 1568, 1760];

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientOn = false;
    this.noiseBuffer = null;
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
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : 0.9;
          this.master.connect(this.ctx.destination);
        }
      } catch (error) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.ambientOn) {
      this.ambientOn = true;
      this.startAmbient();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }
    try {
      window.localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch (error) {
      // Storage may be unavailable. Muting still works for this session.
    }
    return this.muted;
  }

  startAmbient() {
    try {
      const ctx = this.ctx;
      // A soft pad: three detuned sines through a low filter, breathing
      // slowly through a low frequency oscillator on the gain.
      const padGain = ctx.createGain();
      padGain.gain.value = 0.014;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620;
      padGain.connect(filter);
      filter.connect(this.master);
      [110, 164.81, 220.5].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (index - 1) * 4;
        osc.connect(padGain);
        osc.start();
      });
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.006;
      lfo.connect(lfoGain);
      lfoGain.connect(padGain.gain);
      lfo.start();
      // Wind: looped noise through a low filter, barely there.
      const wind = ctx.createBufferSource();
      wind.buffer = this.noise();
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 380;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.005;
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.master);
      wind.start();
    } catch (error) {
      // Ambience is a nicety. The game stays silent without it.
    }
  }

  noise() {
    if (!this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 0.6);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
  }

  tone(freq, duration, type, volume, delay, slideTo) {
    if (this.muted || !this.ctx || !this.master) {
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
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch (error) {
      // A failed tone never stops the game.
    }
  }

  whoosh(duration, volume, fromFreq, toFreq, delay) {
    if (this.muted || !this.ctx || !this.master) {
      return;
    }
    try {
      const start = this.ctx.currentTime + (delay || 0);
      const source = this.ctx.createBufferSource();
      source.buffer = this.noise();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.2;
      filter.frequency.setValueAtTime(fromFreq, start);
      filter.frequency.exponentialRampToValueAtTime(toFreq, start + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(start);
      source.stop(start + duration + 0.05);
    } catch (error) {
      // A failed whoosh never stops the game.
    }
  }

  flip() {
    this.whoosh(0.18, 0.12, 500, 2400, 0);
    this.tone(320, 0.14, 'sine', 0.14, 0, 660);
  }

  land(strength) {
    const volume = 0.05 + Math.min(0.07, strength / 14000);
    this.tone(95, 0.09, 'sine', volume, 0, 55);
  }

  collect(step) {
    const note = LADDER[Math.min(step - 1, LADDER.length - 1)] || LADDER[0];
    this.tone(note, 0.1, 'triangle', 0.16, 0, null);
    this.tone(note * 1.5, 0.13, 'triangle', 0.1, 0.05, null);
    if (step > 0 && step % 5 === 0) {
      this.tone(note * 2, 0.2, 'sine', 0.1, 0.1, null);
    }
  }

  milestone() {
    const notes = [784, 1046, 1318];
    notes.forEach((freq, index) => {
      this.tone(freq, 0.14, 'triangle', 0.14, index * 0.06, null);
    });
  }

  shard() {
    this.tone(880, 0.1, 'triangle', 0.16, 0, null);
    this.tone(1174, 0.1, 'triangle', 0.14, 0.07, null);
    this.tone(1568, 0.2, 'triangle', 0.14, 0.14, null);
    this.tone(2093, 0.24, 'sine', 0.08, 0.2, null);
  }

  hit() {
    this.whoosh(0.22, 0.2, 1800, 120, 0);
    this.tone(140, 0.28, 'sawtooth', 0.18, 0, 55);
    this.tone(70, 0.3, 'sine', 0.2, 0, 40);
  }

  checkpoint() {
    this.tone(660, 0.12, 'sine', 0.16, 0, null);
    this.tone(990, 0.2, 'sine', 0.14, 0.09, null);
    this.tone(1320, 0.26, 'sine', 0.09, 0.18, null);
  }

  win() {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((freq, index) => {
      this.tone(freq, 0.16, 'triangle', 0.15, index * 0.09, null);
    });
  }

  victory() {
    const notes = [523, 659, 784, 1046, 1318, 1568, 1318, 1568];
    notes.forEach((freq, index) => {
      this.tone(freq, 0.2, 'triangle', 0.15, index * 0.11, null);
      this.tone(freq / 2, 0.2, 'sine', 0.07, index * 0.11, null);
    });
  }

  lose() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, index) => {
      this.tone(freq, 0.22, 'triangle', 0.13, index * 0.12, null);
    });
    this.tone(98, 0.6, 'sine', 0.1, 0.1, 65);
  }

  click() {
    this.tone(700, 0.05, 'square', 0.05, 0, null);
  }

  start() {
    this.tone(440, 0.1, 'triangle', 0.14, 0, null);
    this.tone(660, 0.14, 'triangle', 0.14, 0.08, null);
    this.tone(880, 0.18, 'triangle', 0.1, 0.16, null);
  }
}
