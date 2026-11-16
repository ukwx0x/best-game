// Aurora Flip: level generation and collision shapes.
// A level is a seeded list of patterns laid left to right: spike
// clusters, orb arcs, risky shards, barrier walls with a gap, drifting
// mines and phasing walls. The first stretch is always safe, gaps
// between hazards stay wide enough to react at the level speed, hazard
// sides mostly alternate so the player keeps flipping, and two
// checkpoints split the run.

import { CEILING_Y, FLOOR_Y, LEVELS, PHASER_CYCLE, PHASER_SOLID_AT, PHASER_WARN_AT } from './config.js';
import { Rng, seedFromString } from './random.js';

const SPIKE_WIDTH = 46;
const SPIKE_HEIGHT = 52;
const BARRIER_WIDTH = 36;
const ORB_RADIUS = 16;
const MINE_RADIUS = 22;

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

// Where a phasing wall sits in its cycle: faded, warning, or solid.
export function phaserPhase(phaser, time) {
  const t = (((time + phaser.offset) % PHASER_CYCLE) + PHASER_CYCLE) % PHASER_CYCLE;
  if (t < PHASER_WARN_AT) return 'faded';
  if (t < PHASER_SOLID_AT) return 'warning';
  return 'solid';
}

export function mineY(mine, time) {
  return mine.baseY + Math.sin(time * 1.8 + mine.phase) * mine.amp;
}

function circleHitsBox(cx, cy, radius, box) {
  const nearestX = Math.max(box.left, Math.min(cx, box.right));
  const nearestY = Math.max(box.top, Math.min(cy, box.bottom));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function shiftRect(rect, cameraX) {
  return { left: rect.left - cameraX, top: rect.top, right: rect.right - cameraX, bottom: rect.bottom };
}

// The player box is in screen coordinates, the level in world
// coordinates, so every hazard rect is shifted by the camera before
// the overlap test. Without that shift no hazard could ever touch
// the runner.
export function hazardHit(level, box, time, cameraX) {
  for (const spike of level.spikes) {
    if (rectsOverlap(box, shrinkRect(shiftRect(spikeRect(spike), cameraX), 9))) {
      return true;
    }
  }
  for (const barrier of level.barriers) {
    if (rectsOverlap(box, shrinkRect(shiftRect(barrierRect(barrier), cameraX), 4))) {
      return true;
    }
  }
  for (const phaser of level.phasers) {
    if (phaserPhase(phaser, time) === 'solid' && rectsOverlap(box, shrinkRect(shiftRect(barrierRect(phaser), cameraX), 4))) {
      return true;
    }
  }
  for (const mine of level.mines) {
    if (circleHitsBox(mine.x - cameraX, mineY(mine, time), MINE_RADIUS - 5, box)) {
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

function addShardRisk(level, rng, x, side) {
  level.spikes.push({ x, side, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
  level.spikes.push({ x: x + 132, side, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
  const y = side === 'floor' ? FLOOR_Y - 175 : CEILING_Y + 175;
  level.shards.push({ x: x + 66, y, taken: false, phase: rng.range(0, 6.28) });
  return 210;
}

function addBarrier(level, rng, x, side) {
  const extent = rng.range(235, 300);
  level.barriers.push({ x, side, w: BARRIER_WIDTH, extent });
  // Two orbs sit in the open gap, rewarding the correct side.
  const gapY = side === 'floor' ? CEILING_Y + 72 : FLOOR_Y - 72;
  level.orbs.push({ x: x + 4, y: gapY, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  level.orbs.push({ x: x + 66, y: gapY, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  return 150;
}

function addPhaser(level, rng, x, side) {
  const extent = rng.range(240, 300);
  level.phasers.push({ x, side, w: BARRIER_WIDTH, extent, offset: rng.range(0, PHASER_CYCLE) });
  const gapY = side === 'floor' ? CEILING_Y + 72 : FLOOR_Y - 72;
  level.orbs.push({ x: x + 4, y: gapY, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  level.orbs.push({ x: x + 66, y: gapY, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  return 150;
}

function addMines(level, rng, x) {
  const highFirst = rng.chance(0.5);
  const bases = highFirst ? [250, 470] : [470, 250];
  for (let i = 0; i < 2; i += 1) {
    level.mines.push({
      x: x + i * 175,
      baseY: bases[i],
      amp: rng.range(42, 66),
      phase: rng.range(0, 6.28),
      r: MINE_RADIUS,
    });
  }
  // Three orbs weave through the gap between the mines.
  for (let i = 0; i < 3; i += 1) {
    const y = 360 + (i === 1 ? (highFirst ? 90 : -90) : 0);
    level.orbs.push({ x: x + 30 + i * 130, y, r: ORB_RADIUS, taken: false, phase: rng.range(0, 6.28) });
  }
  return 380;
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
    phasers: [],
    mines: [],
    checkpoints: [
      { x: Math.round(def.length * 0.34), reached: false },
      { x: Math.round(def.length * 0.66), reached: false },
    ],
    gateX: def.length - 140,
    totalOrbs: 0,
  };

  const options = [
    ['barrier', def.barrierChance],
    ['phaser', def.phaserChance],
    ['mine', def.mineChance],
    ['shard', def.shardChance],
    ['spikes', 0.3],
    ['arc', 0.17],
    ['line', 0.15],
  ];
  const totalWeight = options.reduce((sum, entry) => sum + entry[1], 0);

  let side = 'floor';
  function nextSide() {
    if (rng.chance(0.62)) {
      side = side === 'floor' ? 'ceiling' : 'floor';
    }
    return side;
  }

  // Forced introductions: each level that defines mines or phasing
  // walls is guaranteed to show them, whatever the dice roll.
  const forced = [];
  if (def.mineChance > 0) {
    forced.push({ at: Math.round(def.length * 0.3), kind: 'mine' });
    forced.push({ at: Math.round(def.length * 0.62), kind: 'mine' });
  }
  if (def.phaserChance > 0) {
    forced.push({ at: Math.round(def.length * 0.46), kind: 'phaser' });
  }
  forced.sort((a, b) => a.at - b.at);

  let x = 760;
  const endX = def.length - 620;
  while (x < endX) {
    let kind;
    if (forced.length > 0 && x >= forced[0].at) {
      kind = forced.shift().kind;
    } else {
      let roll = rng.next() * totalWeight;
      kind = 'line';
      for (const entry of options) {
        roll -= entry[1];
        if (roll <= 0) {
          kind = entry[0];
          break;
        }
      }
    }
    let used;
    if (kind === 'barrier') {
      used = addBarrier(level, rng, x, nextSide());
    } else if (kind === 'phaser') {
      used = addPhaser(level, rng, x, nextSide());
    } else if (kind === 'mine') {
      used = addMines(level, rng, x);
    } else if (kind === 'shard') {
      used = addShardRisk(level, rng, x, nextSide());
    } else if (kind === 'spikes') {
      used = addSpikeCluster(level, rng, x, nextSide(), def.maxSpikes);
    } else if (kind === 'arc') {
      used = addOrbArc(level, rng, x);
    } else {
      used = addOrbLine(level, rng, x);
    }
    x += used + rng.range(def.gapMin, def.gapMax);
  }

  level.totalOrbs = level.orbs.length;
  return level;
}
