// Lumenfall: particles, floating texts, shockwave rings and screen
// shake. Every hit, death, build and leak leaves something visible, so
// the player always sees what just happened. Counts are capped so a
// busy frame never grows the lists without bound.

const MAX_PARTICLES = 420;
const MAX_FLOATERS = 40;

export function createEffects() {
  return { particles: [], floaters: [], rings: [], shake: 0, flash: 0, flashColor: '#ffffff' };
}

export function burstEffects(effects, x, y, color, count, speed, life, size) {
  for (let i = 0; i < count; i += 1) {
    if (effects.particles.length >= MAX_PARTICLES) return;
    const angle = Math.random() * Math.PI * 2;
    const power = speed * (0.35 + Math.random() * 0.85);
    effects.particles.push({
      x, y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 18,
      life: life * (0.6 + Math.random() * 0.7),
      maxLife: life,
      size: size * (0.6 + Math.random() * 0.8),
      color,
      gravity: 60,
    });
  }
}

export function spawnTrailParticle(effects, x, y, color) {
  if (effects.particles.length >= MAX_PARTICLES) return;
  effects.particles.push({
    x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6,
    vx: (Math.random() - 0.5) * 20, vy: -14 - Math.random() * 20,
    life: 0.35, maxLife: 0.35, size: 2.5 + Math.random() * 2, color, gravity: -30,
  });
}

export function spawnFloater(effects, x, y, text, color, big) {
  if (effects.floaters.length >= MAX_FLOATERS) effects.floaters.shift();
  effects.floaters.push({ x, y, text, color, life: 1.1, maxLife: 1.1, big: Boolean(big) });
}

export function spawnRing(effects, x, y, color, maxRadius) {
  effects.rings.push({ x, y, color, radius: 8, maxRadius, life: 0.45, maxLife: 0.45 });
}

export function addShake(effects, amount) {
  effects.shake = Math.min(16, effects.shake + amount);
}

export function addFlash(effects, color, amount) {
  effects.flash = Math.max(effects.flash, amount);
  effects.flashColor = color;
}

export function updateEffects(effects, dt) {
  for (let i = effects.particles.length - 1; i >= 0; i -= 1) {
    const p = effects.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      effects.particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (let i = effects.floaters.length - 1; i >= 0; i -= 1) {
    const f = effects.floaters[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) effects.floaters.splice(i, 1);
  }
  for (let i = effects.rings.length - 1; i >= 0; i -= 1) {
    const r = effects.rings[i];
    r.life -= dt;
    r.radius = r.maxRadius * (1 - r.life / r.maxLife);
    if (r.life <= 0) effects.rings.splice(i, 1);
  }
  effects.shake = Math.max(0, effects.shake - 34 * dt);
  effects.flash = Math.max(0, effects.flash - 1.6 * dt);
}

export function shakeOffset(effects) {
  if (effects.shake <= 0.1) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * effects.shake,
    y: (Math.random() - 0.5) * effects.shake,
  };
}

export function drawEffects(ctx, effects) {
  for (const r of effects.rings) {
    ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.9;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of effects.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const f of effects.floaters) {
    ctx.globalAlpha = Math.min(1, (f.life / f.maxLife) * 2);
    ctx.font = f.big ? 'bold 22px Georgia, serif' : 'bold 15px Georgia, serif';
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(5, 6, 18, 0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
