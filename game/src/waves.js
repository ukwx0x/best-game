// Lumenfall: wave scheduling and the boon choice between waves. This
// file turns the wave plan into a timed spawn queue, drips foes onto
// the path, rolls three different boons after each cleared wave, and
// applies the boon the player picks. Wave end and victory detection
// live in game.js.

import { BOON_POOL, DIFFICULTIES, TOTAL_WAVES, waveHpMultiplier, wavePlan } from './config.js';
import { createEnemy } from './enemies.js';
import { shuffleCopy } from './random.js';
import { playBossRoar, playWaveStart } from './audio.js';

export function buildSpawnQueue(wave) {
  const queue = [];
  let at = 0.5;
  for (const [kind, count, gap] of wavePlan(wave)) {
    for (let i = 0; i < count; i += 1) {
      queue.push({ kind, at });
      at += gap;
    }
    at += 0.6;
  }
  return queue;
}

export function startWave(state) {
  if (state.waveActive || state.wave >= TOTAL_WAVES) return false;
  state.wave += 1;
  state.spawnQueue = buildSpawnQueue(state.wave);
  state.spawnTimer = 0;
  state.waveActive = true;
  state.waveTime = 0;
  const hasBoss = state.spawnQueue.some((entry) => entry.kind === 'boss');
  state.banner = {
    text: hasBoss ? `WAVE ${state.wave}  THE GLOOMWARDEN STIRS` : `WAVE ${state.wave} OF ${TOTAL_WAVES}`,
    sub: hasBoss ? 'A boss walks the path. Focus your fire.' : waveHint(state.wave),
    t: 2.4,
  };
  if (hasBoss) playBossRoar();
  else playWaveStart();
  return true;
}

export function waveHint(wave) {
  const hints = {
    1: 'Husks shamble toward the lantern.',
    2: 'Emberlings are quick. Build a second spire.',
    3: 'Frost slows the fast ones down.',
    4: 'Wisps fly fast and pay well.',
    6: 'Brutes soak damage. Cannons crack them.',
    7: 'Splitters burst into emberlings.',
    8: 'Shielded foes shrug off part of every hit.',
    9: 'Swiftwings outrun slow towers.',
    11: 'Upgrade towers near the bends.',
    13: 'Mortars reach across the whole field.',
    15: 'The last night. Hold the light.',
  };
  return hints[wave] || 'Hold the path. Keep the light.';
}

export function updateSpawning(state, dt) {
  if (!state.waveActive) return;
  state.spawnTimer += dt;
  const hpMul = waveHpMultiplier(state.wave) * DIFFICULTIES[state.difficulty].hpMul;
  while (state.spawnQueue.length > 0 && state.spawnQueue[0].at <= state.spawnTimer) {
    const entry = state.spawnQueue.shift();
    const jitter = (state.rng() - 0.5) * 14;
    state.enemies.push(createEnemy(entry.kind, hpMul, jitter));
  }
}

export function rollBoons(state) {
  const shuffled = shuffleCopy(state.rng, BOON_POOL);
  state.boonOptions = shuffled.slice(0, 3);
}

export function applyBoon(state, boon) {
  if (boon.apply) boon.apply(state.modifiers);
  if (boon.id === 'mend') state.lives = Math.min(state.maxLives, state.lives + 4);
  if (boon.id === 'coffer') state.ember += 90;
  if (boon.id === 'bulwark') {
    state.maxLives += 2;
    state.lives = Math.min(state.maxLives, state.lives + 2);
  }
  state.boonsTaken.push(boon.name);
  state.boonOptions = [];
}
