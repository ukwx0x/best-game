// Aurora Flip: particles and floating score popups.
// Sparks, trails, dust, shockwave rings, confetti, sparkles and
// drifting motes all live here, plus the small "+10" texts that rise
// from pickups. Counts are capped so a busy frame never grows the
// lists without bound.

import { FONT, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { drawSparkle, drawStarShape } from './shapes.js';

const MAX_PARTICLES = 340;
const CONFETTI_COLORS = ['#2ee6a8', '#ffd94d', '#ff7ab8', '#38b6ff', '#b678ff', '#f2f7ff'];

export class Particles {
  constructor() {
    this.items = [];
    this.popups = [];
  }

  push(item) {
    if (this.items.length >= MAX_PARTICLES) {
      return;
    }
    this.items.push(item);
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const power = speed * (0.35 + Math.random() * 0.65);
      this.push({
        kind: 'dot', x, y,
        vx: Math.cos(angle) * power, vy: Math.sin(angle) * power,
        life: 0.45 + Math.random() * 0.35, maxLife: 0.8,
        size: 2 + Math.random() * 4, color, drag: 0.92, gravity: 0,
      });
    }
  }

  ring(x, y, color, maxRadius) {
    this.push({
      kind: 'ring', x, y, vx: 0, vy: 0,
      life: 0.45, maxLife: 0.45, size: 6, maxRadius: maxRadius || 70,
      color, drag: 1, gravity: 0,
    });
  }

  sparkle(x, y, color, count) {
    for (let i = 0; i < (count || 5); i += 1) {
      this.push({
        kind: 'spark', x: x + (Math.random() - 0.5) * 44, y: y + (Math.random() - 0.5) * 44,
        vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30,
        life: 0.5 + Math.random() * 0.3, maxLife: 0.8,
        size: 6 + Math.random() * 8, color, drag: 0.97, gravity: 0, spin: Math.random() * 6.28,
      });
    }
  }

  trail(x, y, color) {
    this.push({
      kind: 'dot', x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10,
      vx: -60 - Math.random() * 40, vy: (Math.random() - 0.5) * 30,
      life: 0.35, maxLife: 0.35, size: 3 + Math.random() * 3, color, drag: 0.96, gravity: 0,
    });
  }

  dust(x, y, color, power) {
    const count = power > 900 ? 10 : 6;
    for (let i = 0; i < count; i += 1) {
      this.push({
        kind: 'dot', x: x + (Math.random() - 0.5) * 30, y,
        vx: (Math.random() - 0.5) * 150, vy: -20 - Math.random() * 50,
        life: 0.3 + Math.random() * 0.2, maxLife: 0.5,
        size: 2 + Math.random() * 3, color, drag: 0.94, gravity: 0,
      });
    }
  }

  mote() {
    this.push({
      kind: 'mote', x: VIEW_WIDTH + 12, y: 120 + Math.random() * 480,
      vx: -26 - Math.random() * 30, vy: (Math.random() - 0.5) * 12,
      life: 9, maxLife: 9, size: 1.5 + Math.random() * 2.5,
      color: '#bfe9ff', drag: 1, gravity: 0, phase: Math.random() * 6.28,
    });
  }

  confetti(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const power = 220 + Math.random() * 320;
      this.push({
        kind: 'confetti', x, y,
        vx: Math.cos(angle) * power, vy: Math.sin(angle) * power,
        life: 1.4 + Math.random() * 0.9, maxLife: 2.3,
        size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        drag: 0.985, gravity: 620, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
      });
    }
  }

  // A still celebration for a staged screenshot: confetti already
  // spread down both sides of the screen, clear of the center panel.
  celebration() {
    for (let i = 0; i < 46; i += 1) {
      const left = i % 2 === 0;
      this.push({
        kind: 'confetti',
        x: left ? 40 + Math.random() * 280 : 960 + Math.random() * 280,
        y: 60 + Math.random() * 420,
        vx: 0, vy: 0, life: 2.3, maxLife: 2.3, size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drag: 1, gravity: 0, rot: Math.random() * 6.28, vr: 0,
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
      item.vy = item.vy * item.drag + (item.gravity || 0) * dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      if (item.kind === 'confetti') {
        item.rot += item.vr * dt;
      }
      if (item.kind === 'mote' && item.x < -20) {
        this.items.splice(i, 1);
      }
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
      if (item.kind === 'ring') {
        const progress = 1 - alpha;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3 + 3 * alpha;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size + (item.maxRadius - item.size) * progress, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.kind === 'spark') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = item.color;
        drawSparkle(ctx, item.x, item.y, item.size * (0.6 + 0.4 * alpha), 0.45);
        ctx.fill();
      } else if (item.kind === 'confetti') {
        ctx.globalAlpha = Math.min(1, alpha * 2);
        ctx.fillStyle = item.color;
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rot);
        ctx.fillRect(-item.size / 2, -item.size / 4, item.size, item.size / 2);
        ctx.restore();
      } else if (item.kind === 'mote') {
        ctx.globalAlpha = 0.35 + 0.3 * Math.sin(item.life * 2 + item.phase);
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const popup of this.popups) {
      const alpha = Math.max(0, Math.min(1, popup.life));
      const scale = popup.life > 0.9 ? 1.25 - (popup.life - 0.9) * 1.25 : 1;
      ctx.globalAlpha = alpha;
      ctx.font = 'bold ' + Math.round(22 * scale) + 'px ' + FONT;
      ctx.fillStyle = 'rgba(4,8,24,0.7)';
      ctx.fillText(popup.text, popup.x + 2, popup.y + 2);
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.globalAlpha = 1;
  }

  drawStarBurst(ctx, x, y, color) {
    ctx.fillStyle = color;
    drawStarShape(ctx, x, y, 12, 5, 4);
    ctx.fill();
  }
}
