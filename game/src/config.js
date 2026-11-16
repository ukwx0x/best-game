// Aurora Flip: tuning, palette and level definitions.
// One place holds every number the game balances on, so tuning a level
// never means hunting through the physics or the renderer.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

// The two surfaces the runner flips between. The floor band runs from
// FLOOR_Y to the bottom of the screen, the ceiling band from the top
// down to CEILING_Y. Play happens in the open band between them.
export const FLOOR_Y = 620;
export const CEILING_Y = 100;

export const PLAYER_X = 260;
export const PLAYER_SIZE = 46;
export const GRAVITY = 2600;

// Seconds between accepted flips, so one key press never flips twice.
export const FLIP_COOLDOWN = 0.12;

// How long the runner is safe after a hit, in seconds.
export const RESPAWN_GRACE = 1.8;

export const START_LIVES = 3;
export const ORB_POINTS = 10;
export const SHARD_POINTS = 50;
export const LEVEL_CLEAR_BONUS = 250;
export const LIFE_BONUS = 100;
export const MAX_MULTIPLIER = 5;

// One entry per level. Speed rises, safe gaps shrink, and barriers and
// risky shards show up more often as the run goes on.
export const LEVELS = [
  { speed: 340, length: 8400, gapMin: 260, gapMax: 420, barrierChance: 0.12, shardChance: 0.18, maxSpikes: 2 },
  { speed: 375, length: 9200, gapMin: 240, gapMax: 390, barrierChance: 0.16, shardChance: 0.2, maxSpikes: 2 },
  { speed: 415, length: 10000, gapMin: 220, gapMax: 360, barrierChance: 0.2, shardChance: 0.22, maxSpikes: 3 },
  { speed: 455, length: 10800, gapMin: 200, gapMax: 330, barrierChance: 0.24, shardChance: 0.24, maxSpikes: 3 },
  { speed: 500, length: 11600, gapMin: 185, gapMax: 310, barrierChance: 0.28, shardChance: 0.26, maxSpikes: 3 },
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
