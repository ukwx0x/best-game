// Lumenfall: the light towers. This file owns tower creation,
// upgrades, targeting, firing, projectiles, splash and poison, the
// frost aura, and drawing every tower, its range ring and the build
// ghost. Economy and placement rules live in game.js.

import { TOWER_TYPES } from './config.js';
import { damageEnemy, poisonEnemy, slowEnemy } from './enemies.js';
import { burstEffects, spawnRing, spawnTrailParticle } from './particles.js';
import { playExplosion, playHit, playShoot } from './audio.js';

export function createTower(typeId, col, row) {
  const def = TOWER_TYPES[typeId];
  return {
    type: typeId,
    name: def.name,
    col,
    row,
    x: col * 48 + 24,
    y: row * 48 + 24,
    level: 1,
    cooldown: 0,
    invested: def.cost,
    angle: -Math.PI / 2,
    pulse: 0,
    flash: 0,
  };
}

export function towerStats(tower, modifiers) {
  const def = TOWER_TYPES[tower.type];
  const stats = {
    damage: def.damage,
    range: def.range,
    cooldown: def.cooldown,
    slow: def.slow || 0,
    poison: def.poison || 0,
    splash: def.splash || 0,
    projectileSpeed: def.projectileSpeed || 0,
    color: def.color,
  };
  for (let level = 2; level <= tower.level; level += 1) {
    Object.assign(stats, def.upgrades[level - 2]);
  }
  stats.damage = Math.round(stats.damage * modifiers.damageMul);
  stats.range = Math.round(stats.range * modifiers.rangeMul);
  stats.cooldown *= modifiers.cooldownMul;
  stats.slow = Math.min(0.7, stats.slow * modifiers.slowMul);
  return stats;
}

export function upgradeCost(tower) {
  const def = TOWER_TYPES[tower.type];
  if (tower.level >= 3) return null;
  return def.upgrades[tower.level - 1].cost;
}

export function upgradeTower(tower) {
  const cost = upgradeCost(tower);
  if (cost === null) return false;
  tower.level += 1;
  tower.invested += cost;
  tower.flash = 0.4;
  return true;
}

export function sellValue(tower) {
  return Math.floor(tower.invested * 0.7);
}

function pickTarget(state, tower, range) {
  let best = null;
  let bestDistance = -1;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.reachedEnd) continue;
    const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    if (dist <= range && enemy.distance > bestDistance) {
      best = enemy;
      bestDistance = enemy.distance;
    }
  }
  return best;
}

export function fireTower(state, tower, stats, target) {
  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  tower.flash = 0.12;
  state.projectiles.push({
    x: tower.x,
    y: tower.y - 10,
    target,
    tx: target.x,
    ty: target.y,
    speed: stats.projectileSpeed,
    damage: stats.damage,
    splash: stats.splash,
    poison: stats.poison,
    color: stats.color,
    kind: tower.type,
    trail: 0,
  });
  playShoot(tower.type);
}

export function updateTowers(state, dt) {
  for (const tower of state.towers) {
    tower.cooldown -= dt;
    tower.flash = Math.max(0, tower.flash - dt);
    tower.pulse += dt;
    const stats = towerStats(tower, state.modifiers);
    if (tower.type === 'frost') {
      let chilled = false;
      for (const enemy of state.enemies) {
        if (enemy.dead || enemy.reachedEnd) continue;
        const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
        if (dist <= stats.range) {
          slowEnemy(enemy, stats.slow, 0.6, state.time);
          damageEnemy(enemy, stats.damage * dt * 2, state.time);
          chilled = true;
        }
      }
      if (chilled && Math.random() < dt * 6) {
        spawnTrailParticle(state.effects, tower.x + (Math.random() - 0.5) * 30, tower.y, '#7fd8ff');
      }
      continue;
    }
    if (tower.cooldown > 0) continue;
    const target = pickTarget(state, tower, stats.range);
    if (target) {
      fireTower(state, tower, stats, target);
      tower.cooldown = stats.cooldown;
    }
  }
}

function explodeProjectile(state, proj) {
  if (proj.splash > 0) {
    spawnRing(state.effects, proj.tx, proj.ty, proj.color, proj.splash);
    burstEffects(state.effects, proj.tx, proj.ty, proj.color, 14, 130, 0.5, 3);
    playExplosion();
    for (const enemy of state.enemies) {
      if (enemy.dead || enemy.reachedEnd) continue;
      const dist = Math.hypot(enemy.x - proj.tx, enemy.y - proj.ty);
      if (dist <= proj.splash + enemy.radius) {
        damageEnemy(enemy, proj.damage, state.time);
        if (proj.poison) poisonEnemy(enemy, proj.poison, 3, state.time);
      }
    }
  } else if (proj.target && !proj.target.dead && !proj.target.reachedEnd) {
    damageEnemy(proj.target, proj.damage, state.time);
    if (proj.poison) poisonEnemy(proj.target, proj.poison, 3, state.time);
    burstEffects(state.effects, proj.target.x, proj.target.y, proj.color, 5, 80, 0.3, 2.5);
    playHit();
  }
}

export function updateProjectiles(state, dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const proj = state.projectiles[i];
    if (proj.target && !proj.target.dead && !proj.target.reachedEnd) {
      proj.tx = proj.target.x;
      proj.ty = proj.target.y;
    }
    const dx = proj.tx - proj.x;
    const dy = proj.ty - proj.y;
    const dist = Math.hypot(dx, dy);
    const step = proj.speed * dt;
    proj.trail -= dt;
    if (proj.trail <= 0) {
      spawnTrailParticle(state.effects, proj.x, proj.y, proj.color);
      proj.trail = 0.03;
    }
    if (dist <= step + 6) {
      proj.x = proj.tx;
      proj.y = proj.ty;
      explodeProjectile(state, proj);
      state.projectiles.splice(i, 1);
    } else {
      proj.x += (dx / dist) * step;
      proj.y += (dy / dist) * step;
    }
  }
}

function drawTowerBase(ctx, tower, stats) {
  const { x, y } = tower;
  ctx.fillStyle = 'rgba(5, 6, 18, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2f5e';
  ctx.strokeStyle = '#4a528f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15, y + 14);
  ctx.lineTo(x - 10, y - 8);
  ctx.lineTo(x + 10, y - 8);
  ctx.lineTo(x + 15, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a4178';
  ctx.fillRect(x - 16, y + 10, 32, 5);
}

function drawTowerTop(ctx, tower, stats) {
  const { x, y } = tower;
  const glow = 10 + Math.sin(tower.pulse * 3) * 3 + (tower.flash > 0 ? 12 : 0);
  ctx.save();
  ctx.shadowColor = stats.color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = stats.color;
  if (tower.type === 'ember') {
    ctx.beginPath();
    ctx.moveTo(x, y - 24);
    ctx.quadraticCurveTo(x + 9, y - 10, x + 6, y - 2);
    ctx.quadraticCurveTo(x, y + 2, x - 6, y - 2);
    ctx.quadraticCurveTo(x - 9, y - 10, x, y - 24);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(x, y - 10, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.type === 'frost') {
    ctx.beginPath();
    ctx.arc(x, y - 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 12);
    ctx.lineTo(x + 12, y - 12);
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else if (tower.type === 'thorn') {
    ctx.strokeStyle = stats.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.quadraticCurveTo(x + i * 10, y - 14, x + i * 13, y - 24 - Math.abs(i) * -2);
      ctx.stroke();
    }
    ctx.fillStyle = '#eaffd8';
    ctx.beginPath();
    ctx.arc(x, y - 24, 3.5, 0, Math.PI * 2);
    ctx.arc(x - 13, y - 20, 3, 0, Math.PI * 2);
    ctx.arc(x + 13, y - 20, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.type === 'cannon') {
    ctx.save();
    ctx.translate(x, y - 12);
    ctx.rotate(tower.angle);
    ctx.fillStyle = '#55467a';
    ctx.fillRect(0, -5, 22, 10);
    ctx.fillStyle = stats.color;
    ctx.beginPath();
    ctx.arc(22, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = stats.color;
    ctx.beginPath();
    ctx.arc(x, y - 12, 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#55467a';
    ctx.beginPath();
    ctx.arc(x, y - 10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stats.color;
    ctx.beginPath();
    ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 2, y - 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < tower.level; i += 1) {
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.arc(x - 8 + i * 8, y + 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTowers(ctx, state) {
  for (const tower of state.towers) {
    const stats = towerStats(tower, state.modifiers);
    drawTowerBase(ctx, tower, stats);
    drawTowerTop(ctx, tower, stats);
  }
  for (const proj of state.projectiles) {
    ctx.save();
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.kind === 'mortar' || proj.kind === 'cannon' ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawRangeRing(ctx, x, y, range, color) {
  ctx.fillStyle = 'rgba(255, 217, 122, 0.08)';
  ctx.strokeStyle = color || 'rgba(255, 217, 122, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawBuildGhost(ctx, state, col, row, valid) {
  const x = col * 48 + 24;
  const y = row * 48 + 24;
  const def = TOWER_TYPES[state.buildType];
  const ghost = createTower(state.buildType, col, row);
  const stats = towerStats(ghost, state.modifiers);
  ctx.globalAlpha = 0.85;
  drawRangeRing(ctx, x, y, stats.range, valid ? 'rgba(143, 227, 136, 0.7)' : 'rgba(255, 93, 108, 0.7)');
  ctx.fillStyle = valid ? 'rgba(143, 227, 136, 0.25)' : 'rgba(255, 93, 108, 0.25)';
  ctx.fillRect(col * 48 + 2, row * 48 + 2, 44, 44);
  ctx.globalAlpha = 0.6;
  drawTowerBase(ctx, ghost, stats);
  drawTowerTop(ctx, ghost, stats);
  ctx.globalAlpha = 1;
  ctx.fillStyle = valid ? '#8fe388' : '#ff5d6c';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${def.name}  ${def.cost} ember`, x, y - 30);
}
