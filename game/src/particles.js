// Aurora Flip: particles and floating score popups.
// Sparks, trails, dust and celebration bursts all live here, plus the
// small "+10" texts that rise from pickups. Counts are capped so a busy
// frame never grows the lists without bound.

import { FONT } from './config.js';

const MAX_PARTICLES = 240;

export class Particles {
  constructor() {
    this.items = [];
    this.popups = [];
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      if (this.items.length >= MAX_PARTICLES) {
        return;
      }
      const angle = Math.random() * Math.PI * 2;
      const power = speed * (0.35 + Math.random() * 0.65);
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 2 + Math.random() * 4,
        color,
        drag: 0.92,
      });
    }
  }

  trail(x, y, color) {
    if (this.items.length >= MAX_PARTICLES) {
      return;
    }
    this.items.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: -60 - Math.random() * 40,
      vy: (Math.random() - 0.5) * 30,
      life: 0.35,
      maxLife: 0.35,
      size: 3 + Math.random() * 3,
      color,
      drag: 0.96,
    });
  }

  dust(x, y, color) {
    for (let i = 0; i < 6; i += 1) {
      if (this.items.length >= MAX_PARTICLES) {
        return;
      }
      this.items.push({
        x: x + (Math.random() - 0.5) * 26,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: -20 - Math.random() * 40,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        color,
        drag: 0.94,
      });
    }
  }

  popup(text, x, y, color) {
    this.popups.push({ text, x, y, life: 1.1, color });
    if (this.popups.length > 12) {
      this.popups.shift();
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      item.life -= dt;
      if (item.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      item.vx *= item.drag;
      item.vy *= item.drag;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
    }
    for (let i = this.popups.length - 1; i >= 0; i -= 1) {
      const popup = this.popups[i];
      popup.life -= dt;
      popup.y -= 42 * dt;
      if (popup.life <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const item of this.items) {
      const alpha = Math.max(0, item.life / item.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const popup of this.popups) {
      const alpha = Math.max(0, Math.min(1, popup.life));
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 22px ' + FONT;
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.globalAlpha = 1;
  }
}
