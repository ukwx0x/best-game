// Aurora Flip: tuning, palette and level definitions.
// One place holds every number the game balances on, so tuning a level
// never means hunting through the physics or the renderer. Each level
// has its own name, sky, aurora colors and mechanics, so the run feels
// like a journey through five different skies, not one level repeated.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

// The two surfaces the runner flips between. The floor band runs from
// FLOOR_Y to the bottom of the screen, the ceiling band from the top
// down to CEILING_Y. Play happens in the open band between them.
export const FLOOR_Y = 620;
export const CEILING_Y = 100;

export const PLAYER_X = 260;
export const PLAYER_SIZE = 50;
export const GRAVITY = 2700;

// Launch speed when gravity flips, so the runner leaves the surface
// at once instead of drifting.
export const FLIP_LAUNCH = 280;

// Seconds between accepted flips, so one key press never flips twice.
export const FLIP_COOLDOWN = 0.08;

// Seconds a flip press is remembered while the cooldown runs out, so
// a fast double tap still flips on time.
export const FLIP_BUFFER = 0.14;

// How long the runner is safe after a hit, in seconds.
export const RESPAWN_GRACE = 1.8;

export const START_LIVES = 3;
export const ORB_POINTS = 10;
export const SHARD_POINTS = 50;
export const LEVEL_CLEAR_BONUS = 250;
export const LIFE_BONUS = 100;
export const MAX_MULTIPLIER = 5;

// Phasing walls run a fixed cycle: faded, warning shimmer, then solid.
// Only the solid part hurts, and the warning always comes first.
export const PHASER_CYCLE = 3.2;
export const PHASER_WARN_AT = 1.1;
export const PHASER_SOLID_AT = 1.5;

// One entry per level. Speed rises and safe gaps shrink as the run
// goes on, and each level adds something new: barriers, then drifting
// mines, then phasing walls, then all three at full speed.
export const LEVELS = [
  {
    name: 'First Light',
    sub: 'Learn the flip. The dawn is kind.',
    speed: 330, length: 8400, gapMin: 280, gapMax: 430,
    barrierChance: 0.1, shardChance: 0.16, mineChance: 0, phaserChance: 0, maxSpikes: 2,
    skyTop: '#0b1030', skyMid: '#14525c', skyLow: '#0e2b3f',
    auroraA: '#2ee6a8', auroraB: '#38b6ff', auroraC: '#b678ff',
    ridgeFar: '#141c44', ridgeNear: '#0f1836', edge: '#4be3c3', mist: '#2ee6a8',
  },
  {
    name: 'Twilight Reef',
    sub: 'Crystal walls rise. Pick a side early.',
    speed: 370, length: 9200, gapMin: 250, gapMax: 400,
    barrierChance: 0.16, shardChance: 0.18, mineChance: 0.12, phaserChance: 0, maxSpikes: 2,
    skyTop: '#120b30', skyMid: '#2a1a5c', skyLow: '#1a1440',
    auroraA: '#b678ff', auroraB: '#38b6ff', auroraC: '#2ee6a8',
    ridgeFar: '#1c1444', ridgeNear: '#140f36', edge: '#8f7bff', mist: '#b678ff',
  },
  {
    name: 'Ember Dusk',
    sub: 'Mines drift in the open sky. Thread between them.',
    speed: 410, length: 10000, gapMin: 230, gapMax: 370,
    barrierChance: 0.18, shardChance: 0.2, mineChance: 0.2, phaserChance: 0.12, maxSpikes: 3,
    skyTop: '#1c0b28', skyMid: '#5c1a3a', skyLow: '#2b0e2e',
    auroraA: '#ff7ab8', auroraB: '#ffb35c', auroraC: '#b678ff',
    ridgeFar: '#33122e', ridgeNear: '#240e26', edge: '#ff8fb8', mist: '#ff7ab8',
  },
  {
    name: 'Frost Veil',
    sub: 'Walls fade in and out. Watch the shimmer.',
    speed: 450, length: 10800, gapMin: 210, gapMax: 340,
    barrierChance: 0.2, shardChance: 0.22, mineChance: 0.2, phaserChance: 0.18, maxSpikes: 3,
    skyTop: '#0a1830', skyMid: '#1a4a6c', skyLow: '#0e2a44',
    auroraA: '#7fe7ff', auroraB: '#e8f6ff', auroraC: '#38b6ff',
    ridgeFar: '#14283f', ridgeNear: '#0e1e33', edge: '#7fe7ff', mist: '#7fe7ff',
  },
  {
    name: 'Aurora Crown',
    sub: 'Everything at once. Carry the light home.',
    speed: 495, length: 11600, gapMin: 190, gapMax: 315,
    barrierChance: 0.22, shardChance: 0.24, mineChance: 0.24, phaserChance: 0.2, maxSpikes: 3,
    skyTop: '#140a2e', skyMid: '#3a1a6c', skyLow: '#1e0e3a',
    auroraA: '#ffd94d', auroraB: '#b678ff', auroraC: '#2ee6a8',
    ridgeFar: '#221244', ridgeNear: '#180e33', edge: '#ffd94d', mist: '#b678ff',
  },
];

export const COLORS = {
  skyTop: '#0b1030',
  skyMid: '#123a5c',
  skyLow: '#0e2b3f',
  auroraA: '#2ee6a8',
  auroraB: '#38b6ff',
  auroraC: '#b678ff',
  mountainFar: '#141c44',
  mountainNear: '#0f1836',
  surfaceTop: '#17324e',
  surfaceLow: '#0a1428',
  surfaceEdge: '#4be3c3',
  crystal: '#7a5cff',
  crystalEdge: '#c9b8ff',
  spike: '#ff5d8f',
  spikeEdge: '#ffc2d4',
  orb: '#ffd94d',
  orbCore: '#fff7cc',
  shard: '#ffe066',
  player: '#53e9ff',
  playerDeep: '#3a6bff',
  scarf: '#ff6b6b',
  heart: '#ff5d7a',
  heartEmpty: '#3a4666',
  panel: '#101a38',
  panelEdge: '#4be3c3',
  text: '#f2f7ff',
  textDim: '#aebdd8',
  button: '#1d7a6e',
  buttonHover: '#26a08d',
  gold: '#ffd94d',
  mine: '#ff5d5d',
  mineCore: '#ff2e63',
};

// System fonts only. The game loads no font file and makes no request.
export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

export function formatScore(value) {
  const digits = String(Math.max(0, Math.floor(value)));
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ',';
    out += digits[i];
  }
  return out;
}
