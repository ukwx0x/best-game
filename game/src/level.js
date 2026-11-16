// Aurora Flip: level generation and collision shapes.
// A level is a seeded list of patterns laid left to right: spike
// clusters, orb arcs, risky shards and barrier walls with a gap. The
// first stretch is always safe, gaps between hazards stay wide enough
// to react at the level speed, and two checkpoints split the run.

import { CEILING_Y, FLOOR_Y, LEVELS } from './config.js';
import { Rng, seedFromString } from './random.js';

const SPIKE_WIDTH = 46;
const SPIKE_HEIGHT = 52;
const BARRIER_WIDTH = 36;
const ORB_RADIUS = 16;

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function shrinkRect(rect, margin) {
  return {
    left: rect.left + margin,
    top: rect.top + margin,
    right: rect.right - margin,
    bottom: rect.bottom - margin,
  };
}

export function spikeRect(spike) {
  if (spike.side === 'floor') {
    return { left: spike.x, top: FLOOR_Y - spike.h, right: spike.x + spike.w, bottom: FLOOR_Y };
  }
  return { left: spike.x, top: CEILING_Y, right: spike.x + spike.w, bottom: CEILING_Y + spike.h };
}

export function barrierRect(barrier) {
  if (barrier.side === 'floor') {
    return { left: barrier.x, top: FLOOR_Y - barrier.extent, right: barrier.x + barrier.w, bottom: FLOOR_Y };
  }
  return { left: barrier.x, top: CEILING_Y, right: barrier.x + barrier.w, bottom: CEILING_Y + barrier.extent };
}

export function hazardHit(level, box) {
  for (const spike of level.spikes) {
    if (rectsOverlap(box, shrinkRect(spikeRect(spike), 9))) {
      return true;
    }
  }
  for (const barrier of level.barriers) {
    if (rectsOverlap(box, shrinkRect(barrierRect(barrier), 4))) {
      return true;
    }
  }
  return false;
}

function addSpikeCluster(level, rng, x, side, maxSpikes) {
  const count = rng.int(1, maxSpikes);
  for (let i = 0; i < count; i += 1) {
    level.spikes.push({ x: x + i * 54, side, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
  }
  return count * 54 + 30;
}

function addOrbArc(level, rng, x) {
  const midY = (FLOOR_Y + CEILING_Y) / 2;
  const peak = rng.range(90, 130);
  const flip = rng.chance(0.5) ? 1 : -1;
  for (let i = 0; i < 4; i += 1) {
    const t = i / 3;
    const y = midY - flip * Math.sin(t * Math.PI) * peak + (flip > 0 ? 40 : -40);
    level.orbs.push({ x: x + i * 58, y, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  }
  return 260;
}

function addOrbLine(level, rng, x) {
  const side = rng.chance(0.5) ? 'floor' : 'ceiling';
  const y = side === 'floor' ? FLOOR_Y - 62 : CEILING_Y + 62;
  for (let i = 0; i < 4; i += 1) {
    level.orbs.push({ x: x + i * 62, y, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  }
  return 280;
}

function addShardRisk(level, rng, x) {
  const side = rng.chance(0.5) ? 'floor' : 'ceiling';
  level.spikes.push({ x, side, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
  level.spikes.push({ x: x + 132, side, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
  const y = side === 'floor' ? FLOOR_Y - 175 : CEILING_Y + 175;
  level.shards.push({ x: x + 66, y, taken: false, phase: rng.range(0, 6.28) });
  return 210;
}

function addBarrier(level, rng, x) {
  const side = rng.chance(0.5) ? 'floor' : 'ceiling';
  const extent = rng.range(235, 300);
  level.barriers.push({ x, side, w: BARRIER_WIDTH, extent });
  // Two orbs sit in the open gap, rewarding the correct side.
  const gapY = side === 'floor' ? CEILING_Y + 72 : FLOOR_Y - 72;
  level.orbs.push({ x: x + 4, y: gapY, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  level.orbs.push({ x: x + 66, y: gapY, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  return 150;
}

export function buildLevel(levelIndex, seedBase) {
  const def = LEVELS[levelIndex];
  const rng = new Rng(seedFromString(seedBase + ':level' + (levelIndex + 1)));
  const level = {
    index: levelIndex,
    def,
    length: def.length,
    speed: def.speed,
    spikes: [],
    orbs: [],
    shards: [],
    barriers: [],
    checkpoints: [
      { x: Math.round(def.length * 0.34), reached: false },
      { x: Math.round(def.length * 0.66), reached: false },
    ],
    gateX: def.length - 140,
    totalOrbs: 0,
  };

  let x = 760;
  const endX = def.length - 620;
  while (x < endX) {
    const roll = rng.next();
    let used;
    if (roll < def.barrierChance) {
      used = addBarrier(level, rng, x);
    } else if (roll < def.barrierChance + def.shardChance) {
      used = addShardRisk(level, rng, x);
    } else if (roll < 0.62) {
      const side = rng.chance(0.5) ? 'floor' : 'ceiling';
      used = addSpikeCluster(level, rng, x, side, def.maxSpikes);
    } else if (roll < 0.81) {
      used = addOrbArc(level, rng, x);
    } else {
      used = addOrbLine(level, rng, x);
    }
    x += used + rng.range(def.gapMin, def.gapMax);
  }

  level.totalOrbs = level.orbs.length;
  return level;
}
