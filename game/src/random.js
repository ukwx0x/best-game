// Aurora Flip: small seeded random numbers.
// Levels are generated from a seed, so the same seed always builds the
// same level. That keeps play fair and screenshots reproducible.

export function seedFromString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed) {
    this.nextFn = mulberry32(seed);
  }

  next() {
    return this.nextFn();
  }

  range(min, max) {
    return min + this.nextFn() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  chance(probability) {
    return this.nextFn() < probability;
  }

  pick(list) {
    return list[Math.floor(this.nextFn() * list.length)];
  }
}
