// Aurora Flip: the runner. One button flips gravity. The runner falls
// toward the current surface, lands with a squash, and slowly turns
// upside down while travelling on the ceiling.

import { CEILING_Y, FLIP_COOLDOWN, FLOOR_Y, GRAVITY, PLAYER_SIZE, PLAYER_X } from './config.js';

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
    this.vy = 160 * this.dir;
    this.onSurface = false;
    this.targetAngle = this.dir === 1 ? 0 : Math.PI;
    this.flipCooldown = FLIP_COOLDOWN;
    return true;
  }

  update(dt) {
    this.flipCooldown = Math.max(0, this.flipCooldown - dt);
    this.squash = Math.max(0, this.squash - dt * 4);
    const diff = this.targetAngle - this.angle;
    this.angle += diff * Math.min(1, dt * 14);
    if (this.onSurface) {
      return null;
    }
    this.vy += GRAVITY * this.dir * dt;
    this.y += this.vy * dt;
    const rest = this.restY();
    if ((this.dir === 1 && this.y >= rest) || (this.dir === -1 && this.y <= rest)) {
      this.y = rest;
      this.vy = 0;
      this.onSurface = true;
      this.squash = 1;
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
