// Lumenfall: sound effects and generative music, made with WebAudio.
// No audio file ships with the game. Every sound is synthesized: short
// tones for shots and hits, filtered noise for bursts and leaks, and a
// quiet plucked melody over a low pad that starts on the first gesture,
// when the browser allows audio. Mute is a single flag, kept in memory.

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let muted = false;
let musicTimer = null;
let melodyStep = 0;

const MELODY = [220, 261.6, 329.6, 261.6, 293.7, 329.6, 392, 329.6, 293.7, 261.6, 220, 196];
const BASS = [110, 110, 87.3, 98];

function ensureAudio() {
  if (audioCtx) return true;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    audioCtx = new Ctor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(masterGain);
  } catch (err) {
    return false;
  }
  return true;
}

export function unlockAudio() {
  if (!ensureAudio()) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  startMusic();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone(freq, duration, type, volume, slideTo) {
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(duration, volume, filterFreq) {
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const length = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq || 900;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(now);
}

export function playShoot(kind) {
  if (kind === 'cannon') tone(160, 0.16, 'triangle', 0.22, 60);
  else if (kind === 'mortar') tone(120, 0.22, 'triangle', 0.24, 50);
  else if (kind === 'frost') tone(880, 0.08, 'sine', 0.06, 660);
  else if (kind === 'thorn') tone(520, 0.09, 'square', 0.05, 340);
  else tone(740 + Math.random() * 120, 0.06, 'sine', 0.09, 480);
}

export function playHit() {
  tone(300, 0.05, 'square', 0.04, 180);
}

export function playExplosion() {
  noiseBurst(0.35, 0.3, 700);
  tone(90, 0.3, 'sine', 0.3, 40);
}

export function playCoin() {
  tone(1180, 0.07, 'sine', 0.1);
  tone(1560, 0.1, 'sine', 0.08);
}

export function playBuild() {
  tone(392, 0.1, 'triangle', 0.16);
  tone(523, 0.14, 'triangle', 0.16);
}

export function playUpgrade() {
  tone(523, 0.09, 'triangle', 0.16);
  tone(659, 0.09, 'triangle', 0.16);
  tone(784, 0.16, 'triangle', 0.16);
}

export function playLeak() {
  tone(140, 0.35, 'sawtooth', 0.22, 55);
  noiseBurst(0.2, 0.12, 400);
}

export function playWaveStart() {
  tone(196, 0.25, 'triangle', 0.2);
  tone(294, 0.35, 'triangle', 0.2);
}

export function playBossRoar() {
  tone(70, 0.8, 'sawtooth', 0.28, 45);
  tone(105, 0.8, 'sawtooth', 0.18, 60);
}

export function playAbility() {
  tone(880, 0.3, 'sine', 0.2, 1760);
  noiseBurst(0.4, 0.14, 2400);
}

export function playBoon() {
  tone(659, 0.12, 'sine', 0.16);
  tone(880, 0.2, 'sine', 0.16);
}

export function playVictory() {
  const notes = [523, 659, 784, 1046, 784, 1046];
  notes.forEach((freq, i) => {
    setTimeout(() => tone(freq, 0.3, 'triangle', 0.2), i * 130);
  });
}

export function playDefeat() {
  const notes = [392, 330, 262, 196];
  notes.forEach((freq, i) => {
    setTimeout(() => tone(freq, 0.45, 'triangle', 0.18), i * 200);
  });
}

export function playClick() {
  tone(660, 0.05, 'sine', 0.08);
}

function startMusic() {
  if (musicTimer || !audioCtx) return;
  musicTimer = setInterval(() => {
    if (muted || !audioCtx) return;
    const now = audioCtx.currentTime;
    const freq = MELODY[melodyStep % MELODY.length];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(now);
    osc.stop(now + 0.55);
    if (melodyStep % 4 === 0) {
      const bass = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bass.type = 'sine';
      bass.frequency.value = BASS[(melodyStep / 4) % BASS.length];
      bassGain.gain.setValueAtTime(0.6, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      bass.connect(bassGain);
      bassGain.connect(musicGain);
      bass.start(now);
      bass.stop(now + 1.7);
    }
    melodyStep += 1;
  }, 420);
}
