// Lumenfall: the game state machine. This file owns the run state,
// placement rules, the per-step simulation, kill and leak sweeping,
// abilities, boon flow, victory and defeat, star ratings and the saved
// best score. Drawing lives in render.js, towers in towers.js, foes in
// enemies.js, and wave timing in waves.js.

import {
  ABILITIES, CELL, COLS, DIFFICULTIES, PANEL_X, ROWS, TOTAL_WAVES,
  TOWER_TYPES, waveClearBonus, waveHpMultiplier,
} from './config.js';
import { pathCells, createEnemy, damageEnemy, freezeEnemy, moveEnemies } from './enemies.js';
import { createTower, updateProjectiles, updateTowers } from './towers.js';
import { rollBoons, updateSpawning } from './waves.js';
import { createEffects, updateEffects, addShake, addFlash, burstEffects, spawnFloater, spawnRing } from './particles.js';
import { mulberry32 } from './random.js';
import { playBuild, playCoin, playDefeat, playLeak, playVictory, playAbility } from './audio.js';

const BEST_KEY = 'lumenfall-best-v1';

export function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return { score: 0, wave: 0, stars: 0 };
    const parsed = JSON.parse(raw);
    return { score: parsed.score || 0, wave: parsed.wave || 0, stars: parsed.stars || 0 };
  } catch (err) {
    return { score: 0, wave: 0, stars: 0 };
  }
}

export function saveBest(state) {
  const best = {
    score: Math.max(state.best.score, state.score),
    wave: Math.max(state.best.wave, state.wave),
    stars: Math.max(state.best.stars, state.stars || 0),
  };
  state.best = best;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch (err) {
    // Storage may be unavailable. The run still counts.
  }
}

export function createGame(difficultyId, seed) {
  const difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES.standard;
  const rng = mulberry32(seed >>> 0 || 1);
  const stars = [];
  for (let i = 0; i < 110; i += 1) {
    stars.push({ x: rng() * PANEL_X, y: rng() * 260, r: 0.6 + rng() * 1.5, tw: rng() * Math.PI * 2 });
  }
  const fireflies = [];
  for (let i = 0; i < 16; i += 1) {
    fireflies.push({ x: rng() * PANEL_X, y: 120 + rng() * 560, phase: rng() * Math.PI * 2, speed: 0.4 + rng() * 0.5 });
  }
  return {
    screen: 'title',
    difficulty: difficulty.id,
    seed,
    rng,
    time: 0,
    runTime: 0,
    ember: difficulty.startEmber,
    lives: difficulty.startLives,
    maxLives: difficulty.startLives,
    wave: 0,
    score: 0,
    kills: 0,
    leaks: 0,
    emberEarned: 0,
    towersBuilt: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    effects: createEffects(),
    spawnQueue: [],
    spawnTimer: 0,
    waveActive: false,
    waveTime: 0,
    buildType: null,
    selectedTower: null,
    boonOptions: [],
    boonsTaken: [],
    abilities: { sunburst: { cd: 0 }, frostnova: { cd: 0 } },
    modifiers: { damageMul: 1, rangeMul: 1, slowMul: 1, cooldownMul: 1, rewardMul: 1 },
    banner: null,
    speed: 1,
    bossEnraged: false,
    stars: 0,
    best: loadBest(),
    pathSet: pathCells(),
    ambientStars: stars,
    fireflies,
    muted: false,
    hoverTower: null,
  };
}

export function cellAt(x, y) {
  if (x < 0 || x >= PANEL_X || y < 0 || y >= ROWS * CELL) return null;
  return { col: Math.floor(x / CELL), row: Math.floor(y / CELL) };
}

export function towerAtCell(state, col, row) {
  return state.towers.find((tower) => tower.col === col && tower.row === row) || null;
}

export function canPlaceTower(state, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  if (state.pathSet.has(`${col},${row}`)) return false;
  if (towerAtCell(state, col, row)) return false;
  return true;
}

export function placeTower(state, col, row) {
  if (!state.buildType) return false;
  const def = TOWER_TYPES[state.buildType];
  if (state.ember < def.cost) return false;
  if (!canPlaceTower(state, col, row)) return false;
  state.ember -= def.cost;
  const tower = createTower(state.buildType, col, row);
  state.towers.push(tower);
  state.towersBuilt += 1;
  state.selectedTower = tower;
  state.buildType = null;
  burstEffects(state.effects, tower.x, tower.y, '#ffd97a', 16, 110, 0.5, 3);
  spawnRing(state.effects, tower.x, tower.y, '#ffd97a', 40);
  playBuild();
  return true;
}

export function starRating(state) {
  if (state.lives >= 15) return 3;
  if (state.lives >= 8) return 2;
  return 1;
}

function sweepEnemies(state) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    if (enemy.dead) {
      const reward = Math.round(enemy.reward * state.modifiers.rewardMul);
      state.ember += reward;
      state.emberEarned += reward;
      state.score += enemy.score;
      state.kills += 1;
      burstEffects(state.effects, enemy.x, enemy.y, enemy.color, enemy.kind === 'boss' ? 40 : 12, 140, 0.55, 3);
      spawnRing(state.effects, enemy.x, enemy.y, enemy.color, enemy.radius + 18);
      spawnFloater(state.effects, enemy.x, enemy.y - enemy.radius - 6, `+${reward}`, '#ffd97a', false);
      if (enemy.kind === 'boss') {
        addShake(state.effects, 10);
        spawnFloater(state.effects, enemy.x, enemy.y - 50, 'GLOOMWARDEN FELLED', '#ffe9a8', true);
      }
      if (enemy.splitsInto) {
        const hpMul = waveHpMultiplier(state.wave) * DIFFICULTIES[state.difficulty].hpMul * 0.6;
        for (let s = 0; s < enemy.splitCount; s += 1) {
          const child = createEnemy(enemy.splitsInto, hpMul, (s - 0.5) * 16);
          child.x = enemy.x + (s - 0.5) * 18;
          child.y = enemy.y + (s - 0.5) * 10;
          child.waypointIndex = enemy.waypointIndex;
          child.distance = enemy.distance;
          state.enemies.push(child);
        }
      }
      if (state.kills % 3 === 0) playCoin();
      state.enemies.splice(i, 1);
      continue;
    }
    if (enemy.reachedEnd) {
      state.lives -= enemy.leak;
      state.leaks += 1;
      addShake(state.effects, 8);
      addFlash(state.effects, '#ff5d6c', 0.35);
      burstEffects(state.effects, 888, 600, '#ff5d6c', 20, 150, 0.6, 3.5);
      spawnFloater(state.effects, 888, 548, `-${enemy.leak} LIGHT`, '#ff5d6c', true);
      playLeak();
      state.enemies.splice(i, 1);
    }
  }
}

export function fireSunburst(state) {
  const ability = state.abilities.sunburst;
  if (ability.cd > 0 || state.enemies.length === 0) return false;
  ability.cd = ABILITIES.sunburst.cooldown;
  addFlash(state.effects, '#ffe9a8', 0.55);
  addShake(state.effects, 6);
  spawnRing(state.effects, 480, 360, '#ffe9a8', 520);
  for (const enemy of state.enemies) {
    damageEnemy(enemy, ABILITIES.sunburst.damage * state.modifiers.damageMul, state.time);
    burstEffects(state.effects, enemy.x, enemy.y, '#ffe9a8', 6, 90, 0.4, 2.5);
  }
  playAbility();
  return true;
}

export function fireFrostNova(state) {
  const ability = state.abilities.frostnova;
  if (ability.cd > 0 || state.enemies.length === 0) return false;
  ability.cd = ABILITIES.frostnova.cooldown;
  addFlash(state.effects, '#7fd8ff', 0.4);
  spawnRing(state.effects, 480, 360, '#7fd8ff', 520);
  for (const enemy of state.enemies) {
    freezeEnemy(enemy, ABILITIES.frostnova.freeze, state.time);
  }
  playAbility();
  return true;
}

function endWaveIfCleared(state) {
  if (!state.waveActive) return;
  if (state.spawnQueue.length > 0 || state.enemies.length > 0) return;
  state.waveActive = false;
  const bonus = waveClearBonus(state.wave);
  state.ember += bonus;
  state.emberEarned += bonus;
  state.score += bonus * 2;
  spawnFloater(state.effects, 480, 200, `WAVE CLEAR  +${bonus} EMBER`, '#ffe9a8', true);
  if (state.wave >= TOTAL_WAVES) {
    state.stars = starRating(state);
    state.screen = 'victory';
    saveBest(state);
    playVictory();
    return;
  }
  rollBoons(state);
  state.screen = 'boon';
}

export function stepGame(state, dt) {
  state.runTime += dt;
  state.abilities.sunburst.cd = Math.max(0, state.abilities.sunburst.cd - dt);
  state.abilities.frostnova.cd = Math.max(0, state.abilities.frostnova.cd - dt);
  if (state.banner) {
    state.banner.t -= dt;
    if (state.banner.t <= 0) state.banner = null;
  }
  updateSpawning(state, dt);
  updateTowers(state, dt);
  updateProjectiles(state, dt);
  moveEnemies(state, dt);
  sweepEnemies(state);
  updateEffects(state.effects, dt);
  if (state.lives <= 0) {
    state.lives = 0;
    state.screen = 'defeat';
    saveBest(state);
    playDefeat();
    return;
  }
  endWaveIfCleared(state);
}

export function restartRun(state) {
  const fresh = createGame(state.difficulty, (state.seed + 1) >>> 0);
  fresh.screen = 'play';
  fresh.best = state.best;
  fresh.muted = state.muted;
  return fresh;
}
