// Lumenfall: the shadow foes. This file owns the winding path, enemy
// creation, movement along the path, slowing, poison and freezing, the
// boss enrage, and drawing every foe. Damage and death rewards live in
// game.js, which sweeps the flags set here.

import { CELL, ENEMY_TYPES } from './config.js';

export const PATH_POINTS = [
  { x: -30, y: 120 },
  { x: 744, y: 120 },
  { x: 744, y: 360 },
  { x: 216, y: 360 },
  { x: 216, y: 600 },
  { x: 840, y: 600 },
  { x: 888, y: 600 },
];

export const LANTERN_POS = { x: 888, y: 600 };

export function pathCells() {
  const cells = new Set();
  const mark = (col, row) => cells.add(`${col},${row}`);
  for (let col = 0; col <= 15; col += 1) mark(col, 2);
  for (let row = 2; row <= 7; row += 1) mark(15, row);
  for (let col = 4; col <= 15; col += 1) mark(col, 7);
  for (let row = 7; row <= 12; row += 1) mark(4, row);
  for (let col = 4; col <= 17; col += 1) mark(col, 12);
  mark(18, 12);
  return cells;
}

export function createEnemy(kindId, hpMultiplier, spawnJitter) {
  const def = ENEMY_TYPES[kindId];
  const hp = Math.round(def.hp * hpMultiplier);
  return {
    kind: kindId,
    name: def.name,
    x: PATH_POINTS[0].x,
    y: PATH_POINTS[0].y + (spawnJitter || 0),
    hp,
    maxHp: hp,
    speed: def.speed,
    reward: def.reward,
    leak: def.leak,
    radius: def.radius,
    color: def.color,
    eye: def.eye,
    score: def.score,
    armor: def.armor || 0,
    slowResist: def.slowResist || 0,
    splitsInto: def.splitsInto || null,
    splitCount: def.splitCount || 0,
    waypointIndex: 1,
    distance: 0,
    slowFactor: 0,
    slowUntil: 0,
    poisonDps: 0,
    poisonUntil: 0,
    freezeUntil: 0,
    flash: 0,
    wobble: Math.random() * Math.PI * 2,
    enraged: false,
    dead: false,
    reachedEnd: false,
  };
}

export function damageEnemy(enemy, amount, now) {
  if (enemy.dead) return 0;
  const dealt = Math.max(1, Math.round(amount * (1 - enemy.armor)));
  enemy.hp -= dealt;
  enemy.flash = 0.12;
  if (enemy.hp <= 0) enemy.dead = true;
  return dealt;
}

export function slowEnemy(enemy, factor, seconds, now) {
  const resisted = factor * (1 - enemy.slowResist);
  if (resisted > enemy.slowFactor || now >= enemy.slowUntil) {
    enemy.slowFactor = resisted;
  }
  enemy.slowUntil = now + seconds;
}

export function poisonEnemy(enemy, dps, seconds, now) {
  enemy.poisonDps = Math.max(enemy.poisonDps, dps);
  enemy.poisonUntil = now + seconds;
}

export function freezeEnemy(enemy, seconds, now) {
  const duration = seconds * (1 - enemy.slowResist);
  enemy.freezeUntil = now + duration;
}

export function moveEnemies(state, dt) {
  const now = state.time;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.reachedEnd) continue;
    enemy.flash = Math.max(0, enemy.flash - dt);
    if (now < enemy.poisonUntil && enemy.poisonDps > 0) {
      damageEnemy(enemy, enemy.poisonDps * dt, now);
      if (enemy.dead) continue;
    }
    if (now >= enemy.slowUntil) enemy.slowFactor = 0;
    if (now < enemy.freezeUntil) continue;
    let speed = enemy.speed * (1 - enemy.slowFactor);
    if (enemy.enraged) speed *= 1.35;
    let remaining = speed * dt;
    while (remaining > 0 && enemy.waypointIndex < PATH_POINTS.length) {
      const target = PATH_POINTS[enemy.waypointIndex];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.distance += dist;
        remaining -= dist;
        enemy.waypointIndex += 1;
      } else {
        enemy.x += (dx / dist) * remaining;
        enemy.y += (dy / dist) * remaining;
        enemy.distance += remaining;
        remaining = 0;
      }
    }
    if (enemy.waypointIndex >= PATH_POINTS.length) enemy.reachedEnd = true;
    if (enemy.kind === 'boss' && !enemy.enraged && enemy.hp <= enemy.maxHp * 0.5) {
      enemy.enraged = true;
      state.bossEnraged = true;
    }
  }
}

function drawEnemyBody(ctx, enemy, time) {
  const wobble = Math.sin(time * 3 + enemy.wobble) * 2;
  const x = enemy.x;
  const y = enemy.y + wobble * 0.4;
  const r = enemy.radius;
  ctx.save();
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = enemy.kind === 'boss' ? 26 : 12;
  ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : enemy.color;
  ctx.beginPath();
  if (enemy.kind === 'wisp' || enemy.kind === 'swiftwing') {
    ctx.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(8, 10, 26, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (enemy.kind === 'shielded') {
    ctx.strokeStyle = '#dfe6ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 3, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();
  }
  if (enemy.kind === 'brute' || enemy.kind === 'boss') {
    ctx.fillStyle = 'rgba(8, 10, 26, 0.55)';
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 + time * 0.4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * r * 0.62, y + Math.sin(angle) * r * 0.62, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (enemy.kind === 'boss') {
    ctx.fillStyle = '#ffd97a';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + i * 14 - 6, y - r + 4);
      ctx.lineTo(x + i * 14, y - r - 14);
      ctx.lineTo(x + i * 14 + 6, y - r + 4);
      ctx.closePath();
      ctx.fill();
    }
    if (enemy.enraged) {
      ctx.strokeStyle = '#ff5d6c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 6 + Math.sin(time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (enemy.kind === 'swiftwing') {
    ctx.fillStyle = 'rgba(232, 180, 255, 0.7)';
    const flap = Math.sin(time * 10 + enemy.wobble) * 6;
    ctx.beginPath();
    ctx.ellipse(x - r - 4, y - 4 - flap, 8, 4, -0.5, 0, Math.PI * 2);
    ctx.ellipse(x + r + 4, y - 4 + flap, 8, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const eyeY = y - 3;
  const eyeGap = enemy.kind === 'boss' ? 11 : r * 0.38;
  ctx.fillStyle = enemy.eye;
  ctx.beginPath();
  ctx.arc(x - eyeGap, eyeY, enemy.kind === 'boss' ? 4.5 : 3, 0, Math.PI * 2);
  ctx.arc(x + eyeGap, eyeY, enemy.kind === 'boss' ? 4.5 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0e24';
  ctx.beginPath();
  ctx.arc(x - eyeGap, eyeY, 1.5, 0, Math.PI * 2);
  ctx.arc(x + eyeGap, eyeY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEnemies(ctx, state) {
  const time = state.time;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.reachedEnd) continue;
    if (state.time < enemy.freezeUntil) {
      ctx.fillStyle = 'rgba(127, 216, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.slowFactor > 0 && state.time < enemy.slowUntil) {
      ctx.strokeStyle = 'rgba(127, 216, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawEnemyBody(ctx, enemy, time);
    if (enemy.hp < enemy.maxHp && enemy.kind !== 'boss') {
      const width = enemy.radius * 2;
      const barY = enemy.y - enemy.radius - 10;
      ctx.fillStyle = 'rgba(5, 6, 18, 0.8)';
      ctx.fillRect(enemy.x - width / 2, barY, width, 4);
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = ratio > 0.5 ? '#8fe388' : ratio > 0.25 ? '#ffb347' : '#ff5d6c';
      ctx.fillRect(enemy.x - width / 2, barY, width * ratio, 4);
    }
  }
}

export function cellCenter(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}
