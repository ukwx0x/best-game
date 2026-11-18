// Lumenfall: Keep the Last Lantern Lit. Tuning, palette, tower and enemy
// definitions, and the wave plan. One file, one job: every number the
// rest of the game balances against lives here, so tuning stays in one
// place and the other files stay about behaviour. Final tuning was set
// from headless full-run simulations: casual play leaks on every
// difficulty, and strong play with upgrades and boons wins.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const PANEL_X = 960;
export const PANEL_WIDTH = 320;
export const CELL = 48;
export const COLS = 20;
export const ROWS = 15;
export const STEP = 1 / 60;
export const TOTAL_WAVES = 15;
export const START_EMBER = 240;
export const START_LIVES = 20;
export const SELL_REFUND = 0.7;

export const PALETTE = {
  skyTop: '#0a0e24',
  skyBottom: '#1a1440',
  ground: '#141a38',
  groundAlt: '#171e42',
  path: '#3a2f52',
  pathEdge: '#55467a',
  stone: '#6b5a94',
  lantern: '#ffd97a',
  ember: '#ffb347',
  emberHot: '#ffe9a8',
  frost: '#7fd8ff',
  thorn: '#8fe388',
  star: '#fff3c4',
  danger: '#ff5d6c',
  panel: '#10142e',
  panelEdge: '#2c3566',
  text: '#f2ead8',
  dim: '#a9a3c7',
};

export const TOWER_TYPES = {
  ember: {
    id: 'ember',
    name: 'Ember Spire',
    short: 'Fast bolts',
    cost: 60,
    range: 130,
    cooldown: 0.34,
    damage: 9,
    projectileSpeed: 420,
    color: '#ffb347',
    key: '1',
    blurb: 'Rapid fire. Cheap and faithful.',
    upgrades: [
      { cost: 50, damage: 14, range: 140, cooldown: 0.3 },
      { cost: 90, damage: 22, range: 152, cooldown: 0.26 },
    ],
  },
  frost: {
    id: 'frost',
    name: 'Frost Lantern',
    short: 'Slows nearby foes',
    cost: 80,
    range: 120,
    cooldown: 0.5,
    damage: 3,
    slow: 0.38,
    color: '#7fd8ff',
    key: '2',
    blurb: 'Chills all foes in its glow.',
    upgrades: [
      { cost: 65, damage: 5, range: 132, slow: 0.46 },
      { cost: 110, damage: 8, range: 146, slow: 0.54 },
    ],
  },
  thorn: {
    id: 'thorn',
    name: 'Thorn Vine',
    short: 'Poison over time',
    cost: 90,
    range: 150,
    cooldown: 0.8,
    damage: 7,
    poison: 6,
    projectileSpeed: 300,
    color: '#8fe388',
    key: '3',
    blurb: 'Wounds that keep burning.',
    upgrades: [
      { cost: 75, damage: 10, range: 160, poison: 10 },
      { cost: 130, damage: 15, range: 172, poison: 16 },
    ],
  },
  cannon: {
    id: 'cannon',
    name: 'Sun Cannon',
    short: 'Heavy splash',
    cost: 140,
    range: 170,
    cooldown: 1.4,
    damage: 34,
    splash: 62,
    projectileSpeed: 320,
    color: '#ffe9a8',
    key: '4',
    blurb: 'Slow shots, wide bursts.',
    upgrades: [
      { cost: 120, damage: 52, range: 180, splash: 72 },
      { cost: 200, damage: 80, range: 192, splash: 84 },
    ],
  },
  mortar: {
    id: 'mortar',
    name: 'Star Mortar',
    short: 'Long range shells',
    cost: 170,
    range: 250,
    cooldown: 2.1,
    damage: 55,
    splash: 78,
    projectileSpeed: 260,
    color: '#e8b4ff',
    key: '5',
    blurb: 'Reaches across the field.',
    upgrades: [
      { cost: 150, damage: 85, range: 268, splash: 88 },
      { cost: 250, damage: 130, range: 288, splash: 100 },
    ],
  },
};

export const TOWER_ORDER = ['ember', 'frost', 'thorn', 'cannon', 'mortar'];

export const ENEMY_TYPES = {
  husk: {
    id: 'husk', name: 'Husk', hp: 34, speed: 42, reward: 6, leak: 1,
    radius: 14, color: '#8a7fb8', eye: '#ffd97a', score: 10,
  },
  emberling: {
    id: 'emberling', name: 'Emberling', hp: 20, speed: 66, reward: 6, leak: 1,
    radius: 11, color: '#c96a5a', eye: '#ffe9a8', score: 10,
  },
  wisp: {
    id: 'wisp', name: 'Wisp', hp: 16, speed: 88, reward: 8, leak: 1,
    radius: 10, color: '#7fd8ff', eye: '#ffffff', score: 15,
  },
  brute: {
    id: 'brute', name: 'Brute', hp: 150, speed: 30, reward: 14, leak: 2,
    radius: 19, color: '#5a4f8a', eye: '#ff5d6c', score: 30,
  },
  splitter: {
    id: 'splitter', name: 'Splitter', hp: 70, speed: 40, reward: 10, leak: 1,
    radius: 16, color: '#7ab86a', eye: '#eaffd8', score: 20, splitsInto: 'emberling', splitCount: 2,
  },
  shielded: {
    id: 'shielded', name: 'Shielded', hp: 90, speed: 36, reward: 13, leak: 1,
    radius: 15, color: '#9aa7d8', eye: '#ffd97a', score: 25, armor: 0.45,
  },
  swiftwing: {
    id: 'swiftwing', name: 'Swiftwing', hp: 46, speed: 104, reward: 11, leak: 1,
    radius: 12, color: '#d8a0e8', eye: '#ffffff', score: 20,
  },
  boss: {
    id: 'boss', name: 'Gloomwarden', hp: 2200, speed: 24, reward: 180, leak: 5,
    radius: 30, color: '#3a2a5e', eye: '#ff5d6c', score: 500, slowResist: 0.5,
  },
};

// Wave plan: each wave lists groups of one kind, spawned in order.
// hpMul grows so later waves need upgrades, not just more towers.
export function wavePlan(wave) {
  const plans = {
    1: [['husk', 6, 0.9]],
    2: [['husk', 8, 0.8], ['emberling', 4, 0.7]],
    3: [['emberling', 8, 0.6], ['husk', 6, 0.7]],
    4: [['husk', 10, 0.6], ['wisp', 6, 0.5], ['emberling', 4, 0.5]],
    5: [['husk', 6, 0.6], ['boss', 1, 1.0], ['emberling', 6, 0.5]],
    6: [['brute', 3, 1.0], ['husk', 10, 0.5], ['wisp', 6, 0.4]],
    7: [['splitter', 5, 0.8], ['emberling', 8, 0.45], ['husk', 8, 0.5]],
    8: [['shielded', 6, 0.8], ['wisp', 8, 0.4], ['brute', 2, 1.0]],
    9: [['swiftwing', 8, 0.45], ['splitter', 5, 0.7], ['shielded', 4, 0.7]],
    10: [['shielded', 6, 0.6], ['boss', 1, 1.0], ['brute', 4, 0.8], ['wisp', 8, 0.35]],
    11: [['brute', 5, 0.8], ['swiftwing', 10, 0.4], ['splitter', 6, 0.6]],
    12: [['shielded', 8, 0.55], ['swiftwing', 8, 0.4], ['brute', 4, 0.7], ['wisp', 10, 0.3]],
    13: [['splitter', 8, 0.5], ['brute', 6, 0.6], ['shielded', 6, 0.5], ['swiftwing', 8, 0.35]],
    14: [['brute', 8, 0.5], ['shielded', 8, 0.45], ['swiftwing', 12, 0.3], ['wisp', 10, 0.3]],
    15: [['shielded', 6, 0.5], ['boss', 1, 1.0], ['brute', 6, 0.6], ['boss', 1, 2.5], ['swiftwing', 12, 0.3]],
  };
  return plans[wave] || plans[1];
}

export function waveHpMultiplier(wave) {
  return 1 + (wave - 1) * 0.45;
}

export function waveClearBonus(wave) {
  return 30 + wave * 6;
}

export const DIFFICULTIES = {
  story: { id: 'story', name: 'Story', hpMul: 0.75, startEmber: 300, startLives: 24, blurb: 'A gentler night.' },
  standard: { id: 'standard', name: 'Standard', hpMul: 1.0, startEmber: START_EMBER, startLives: START_LIVES, blurb: 'The intended fight.' },
  nightmare: { id: 'nightmare', name: 'Nightmare', hpMul: 1.35, startEmber: 200, startLives: 16, blurb: 'For keepers only.' },
};

export const BOON_POOL = [
  { id: 'sharpen', name: 'Sharpened Light', text: '+15% tower damage', apply: (m) => { m.damageMul *= 1.15; } },
  { id: 'farsee', name: 'Far Sight', text: '+12% tower range', apply: (m) => { m.rangeMul *= 1.12; } },
  { id: 'mend', name: 'Mend the Lantern', text: 'Repair 4 lantern light', apply: null },
  { id: 'coffer', name: 'Ember Coffer', text: '+90 ember at once', apply: null },
  { id: 'bounty', name: 'Bounty Night', text: '+25% ember from kills', apply: (m) => { m.rewardMul *= 1.25; } },
  { id: 'chill', name: 'Deep Chill', text: 'Slows are 25% stronger', apply: (m) => { m.slowMul *= 1.25; } },
  { id: 'haste', name: 'Swift Hands', text: 'Towers fire 10% faster', apply: (m) => { m.cooldownMul *= 0.9; } },
  { id: 'bulwark', name: 'Bulwark', text: '+2 max lantern light, repair 2', apply: null },
];

export const ABILITIES = {
  sunburst: { id: 'sunburst', name: 'Sunburst', key: 'Q', cooldown: 24, damage: 120, blurb: 'A flash that burns every foe on the field.' },
  frostnova: { id: 'frostnova', name: 'Frost Nova', key: 'W', cooldown: 30, freeze: 3, blurb: 'Freezes every foe for 3 seconds.' },
};
