// Aurora Flip: the runner. One button flips gravity. The runner falls
// toward the current surface, lands with a squash, stretches while it
// flies, and slowly turns upside down while travelling on the ceiling.
// The flip answers on the same frame the key is pressed, and a short
// cooldown stops one press from flipping twice.

import { CEILING_Y, FLIP_COOLDOWN, FLIP_LAUNCH, FLOOR_Y, GRAVITY, PLAYER_SIZE, PLAYER_X } from './config.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PLAYER_X;
    this.y = FLOOR_Y - PLAYER_SIZE / 2;
    this.vy = 0;
    this.dir = 1;
    this.onSurface = true;
    this.angle = 0;
    this.targetAngle = 0;
    this.squash = 0;
    this.stretch = 0;
    this.impactVy = 0;
    this.flipCooldown = 0;
    this.invulnerableUntil = 0;
    this.trailTimer = 0;
  }

  restY() {
    return this.dir === 1 ? FLOOR_Y - PLAYER_SIZE / 2 : CEILING_Y + PLAYER_SIZE / 2;
  }

  flip() {
    if (this.flipCooldown > 0) {
      return false;
    }
    this.dir *= -1;
    this.vy = FLIP_LAUNCH * this.dir;
    this.onSurface = false;
    this.targetAngle = this.dir === 1 ? 0 : Math.PI;
    this.flipCooldown = FLIP_COOLDOWN;
    this.stretch = 0.7;
    return true;
  }

  update(dt) {
    this.flipCooldown = Math.max(0, this.flipCooldown - dt);
    this.squash = Math.max(0, this.squash - dt * 4);
    const diff = this.targetAngle - this.angle;
    this.angle += diff * Math.min(1, dt * 14);
    if (this.onSurface) {
      this.stretch = Math.max(0, this.stretch - dt * 5);
      return null;
    }
    this.vy += GRAVITY * this.dir * dt;
    this.y += this.vy * dt;
    // Stretch grows with falling speed, so fast flips look fast.
    this.stretch = Math.max(0.25, Math.min(1, Math.abs(this.vy) / 1100));
    const rest = this.restY();
    if ((this.dir === 1 && this.y >= rest) || (this.dir === -1 && this.y <= rest)) {
      this.y = rest;
      this.impactVy = Math.abs(this.vy);
      this.vy = 0;
      this.onSurface = true;
      this.squash = 1;
      this.stretch = 0;
      return 'landed';
    }
    return null;
  }

  box() {
    const half = PLAYER_SIZE / 2 - 5;
    return { left: this.x - half, top: this.y - half, right: this.x + half, bottom: this.y + half };
  }

  isInvulnerable(now) {
    return now < this.invulnerableUntil;
  }
}
