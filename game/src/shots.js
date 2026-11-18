// Lumenfall: staged states for screenshots. The game reads
// ?shot=title, play, boss or victory plus ?seed=, and sets itself to
// that exact state with a fixed seed. Play and boss scenes run the real
// simulation forward from a fresh run with real towers and the real
// wave spawner, then freeze, so a screenshot is a real render of the
// game, frozen for the camera. The renderer draws staged states with
// the same code that draws live play.

import { STEP } from './config.js';
import { createGame, placeTower, stepGame } from './game.js';
import { buildSpawnQueue } from './waves.js';
import { createEnemy } from './enemies.js';
import { upgradeTower } from './towers.js';

const PLAY_TOWERS = [
  ['ember', 13, 4, 2], ['frost', 13, 5, 1], ['thorn', 6, 5, 2],
  ['cannon', 6, 9, 2], ['mortar', 10, 10, 1], ['ember', 10, 4, 1],
  ['frost', 8, 10, 1], ['cannon', 16, 9, 1], ['thorn', 12, 13, 1],
];

const BOSS_TOWERS = [
  ['ember', 13, 4, 3], ['frost', 13, 5, 2], ['thorn', 6, 5, 2],
  ['cannon', 6, 9, 3], ['mortar', 10, 10, 2], ['ember', 10, 4, 2],
  ['frost', 8, 10, 2], ['cannon', 16, 9, 2], ['thorn', 12, 13, 2],
  ['mortar', 2, 9, 1], ['ember', 17, 10, 2],
];

function buildTowers(state, layout) {
  for (const [type, col, row, level] of layout) {
    state.buildType = type;
    state.ember = 9999;
    placeTower(state, col, row);
    const tower = state.towers[state.towers.length - 1];
    while (tower.level < level) upgradeTower(tower);
  }
  state.buildType = null;
  state.selectedTower = null;
}

function runSimulation(state, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    state.time += STEP;
    stepGame(state, STEP);
    if (state.screen !== 'play') break;
  }
  // A foe hit in the last instant would freeze white. Clear the flash
  // so every foe shows its true colour in the still frame.
  for (const enemy of state.enemies) enemy.flash = 0;
}

function placeAlongPath(state, kind, x, y, waypointIndex, distance, hpMul, hpRatio) {
  const enemy = createEnemy(kind, hpMul, 0);
  enemy.x = x;
  enemy.y = y;
  enemy.waypointIndex = waypointIndex;
  enemy.distance = distance;
  if (hpRatio) enemy.hp = Math.round(enemy.maxHp * hpRatio);
  state.enemies.push(enemy);
  return enemy;
}

function stagePlay(state) {
  state.screen = 'play';
  buildTowers(state, PLAY_TOWERS);
  state.ember = 312;
  state.wave = 7;
  state.score = 2450;
  state.kills = 86;
  state.towersBuilt = PLAY_TOWERS.length;
  const hpMul = 2.32;
  placeAlongPath(state, 'splitter', 120, 120, 1, 150, hpMul, 1);
  placeAlongPath(state, 'emberling', 190, 120, 1, 220, hpMul, 0.7);
  placeAlongPath(state, 'husk', 260, 120, 1, 290, hpMul, 1);
  placeAlongPath(state, 'emberling', 330, 120, 1, 360, hpMul, 1);
  placeAlongPath(state, 'splitter', 420, 120, 1, 450, hpMul, 0.55);
  placeAlongPath(state, 'husk', 500, 120, 1, 530, hpMul, 0.8);
  placeAlongPath(state, 'wisp', 590, 120, 1, 620, hpMul, 1);
  placeAlongPath(state, 'emberling', 680, 120, 1, 710, hpMul, 0.6);
  placeAlongPath(state, 'brute', 744, 200, 2, 854, hpMul, 0.75);
  placeAlongPath(state, 'husk', 744, 280, 2, 934, hpMul, 1);
  placeAlongPath(state, 'splitter', 680, 360, 3, 1078, hpMul, 0.65);
  placeAlongPath(state, 'emberling', 580, 360, 3, 1178, hpMul, 1);
  placeAlongPath(state, 'wisp', 470, 360, 3, 1288, hpMul, 0.5);
  placeAlongPath(state, 'husk', 360, 360, 3, 1398, hpMul, 1);
  placeAlongPath(state, 'brute', 216, 460, 4, 1702, hpMul, 0.85);
  placeAlongPath(state, 'emberling', 216, 540, 4, 1782, hpMul, 1);
  placeAlongPath(state, 'husk', 320, 600, 5, 1926, hpMul, 0.7);
  placeAlongPath(state, 'wisp', 430, 600, 5, 2036, hpMul, 1);
  state.waveActive = true;
  state.spawnQueue = [{ kind: 'husk', at: 99 }, { kind: 'emberling', at: 99 }, { kind: 'husk', at: 99 }];
  runSimulation(state, 1.0);
  state.screen = 'play';
  state.banner = null;
}

function stageBoss(state) {
  state.screen = 'play';
  buildTowers(state, BOSS_TOWERS);
  state.ember = 428;
  state.wave = 10;
  state.score = 5310;
  state.kills = 178;
  state.towersBuilt = BOSS_TOWERS.length;
  state.lives = 16;
  const boss = createEnemy('boss', 2.98, 0);
  boss.x = 744;
  boss.y = 280;
  boss.waypointIndex = 2;
  boss.distance = 934;
  boss.hp = Math.round(boss.maxHp * 0.62);
  state.enemies.push(boss);
  const escorts = [['shielded', 420, 120, 1, 450], ['shielded', 350, 120, 1, 380], ['brute', 500, 120, 1, 530], ['wisp', 620, 120, 1, 650], ['husk', 280, 120, 1, 310], ['emberling', 200, 120, 1, 230], ['swiftwing', 744, 180, 2, 834], ['wisp', 680, 360, 3, 1078], ['brute', 560, 360, 3, 1198]];
  for (const [kind, x, y, waypointIndex, distance] of escorts) {
    const enemy = createEnemy(kind, 2.98, 0);
    enemy.x = x;
    enemy.y = y;
    enemy.waypointIndex = waypointIndex;
    enemy.distance = distance;
    state.enemies.push(enemy);
  }
  state.waveActive = true;
  state.spawnQueue = [];
  runSimulation(state, 1.2);
  state.screen = 'play';
  state.banner = { text: 'WAVE 10  THE GLOOMWARDEN STIRS', sub: 'A boss walks the path. Focus your fire.', t: 2.4 };
}

function stageVictory(state) {
  buildTowers(state, BOSS_TOWERS);
  state.screen = 'victory';
  state.wave = 15;
  state.score = 8420;
  state.kills = 312;
  state.leaks = 3;
  state.lives = 17;
  state.ember = 210;
  state.emberEarned = 3210;
  state.towersBuilt = 14;
  state.runTime = 754;
  state.stars = 3;
  state.boonsTaken = ['Sharpened Light', 'Far Sight', 'Bounty Night', 'Mend the Lantern'];
  state.best = { score: 8420, wave: 15, stars: 3 };
  state.time = 6;
}

export function stageShot(name, seed) {
  const state = createGame('standard', seed);
  state.time = 6;
  if (name === 'play') stagePlay(state);
  else if (name === 'boss') stageBoss(state);
  else if (name === 'victory') stageVictory(state);
  else state.screen = 'title';
  state.time = Math.max(state.time, 6);
  return state;
}
