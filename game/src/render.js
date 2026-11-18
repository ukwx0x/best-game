// Lumenfall: all drawing. The night battlefield, the lantern, the HUD,
// the shop panel, the selected tower card, and every screen: title,
// boon choice, pause, victory and defeat. Button rectangles live here
// and main.js reads the same ones, so a click always lands where the
// button is drawn. No image file is used; every picture is drawn code.

import {
  ABILITIES, CELL, COLS, DIFFICULTIES, PANEL_X, PANEL_WIDTH, ROWS,
  TOTAL_WAVES, TOWER_ORDER, TOWER_TYPES, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';
import { LANTERN_POS, drawEnemies } from './enemies.js';
import { drawBuildGhost, drawRangeRing, drawTowers, sellValue, towerStats, upgradeCost } from './towers.js';
import { createEnemy } from './enemies.js';
import { createTower } from './towers.js';
import { drawEffects, shakeOffset } from './particles.js';

export function shopCardRect(index) {
  return { x: PANEL_X + 12, y: 76 + index * 86, w: PANEL_WIDTH - 24, h: 80 };
}

export function abilityRect(id) {
  if (id === 'sunburst') return { x: PANEL_X + 12, y: 540, w: 142, h: 44 };
  return { x: PANEL_X + 166, y: 540, w: 142, h: 44 };
}

export function startWaveRect() {
  return { x: PANEL_X + 12, y: 600, w: PANEL_WIDTH - 24, h: 56 };
}

export function speedRect() { return { x: 688, y: 10, w: 76, h: 34 }; }
export function pauseRect() { return { x: 772, y: 10, w: 76, h: 34 }; }
export function muteRect() { return { x: 856, y: 10, w: 76, h: 34 }; }

export function selectedPanelRect() { return { x: 16, y: 548, w: 440, h: 156 }; }
export function upgradeButtonRect() { return { x: 32, y: 648, w: 180, h: 40 }; }
export function sellButtonRect() { return { x: 228, y: 648, w: 120, h: 40 }; }

export function startButtonRect() { return { x: 440, y: 480, w: 400, h: 64 }; }
export function difficultyRect(index) {
  return { x: 440 + index * 140, y: 400, w: 120, h: 44 };
}

export function boonCardRect(index) {
  return { x: 190 + index * 300, y: 250, w: 280, h: 220 };
}

export function playAgainRect() { return { x: 440, y: 540, w: 190, h: 56 }; }
export function backToTitleRect() { return { x: 650, y: 540, w: 190, h: 56 }; }
export function pauseButtonRect(index) {
  return { x: 490, y: 330 + index * 64, w: 300, h: 52 };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawButton(ctx, rect, label, sub, enabled, hovered, accent) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = enabled ? (hovered ? '#2a3160' : '#1c2247') : '#161a33';
  ctx.fill();
  ctx.strokeStyle = enabled ? (accent || '#ffd97a') : '#3a4178';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = enabled ? '#f2ead8' : '#6b6f92';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + (sub ? -1 : 7));
  if (sub) {
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = enabled ? '#a9a3c7' : '#555a7a';
    ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 19);
  }
  ctx.restore();
}

function drawBackground(ctx, state) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  grad.addColorStop(0, '#0a0e24');
  grad.addColorStop(0.55, '#141038');
  grad.addColorStop(1, '#1a1440');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  for (const star of state.ambientStars) {
    const twinkle = 0.5 + 0.5 * Math.sin(state.time * 1.6 + star.tw);
    ctx.globalAlpha = 0.35 + twinkle * 0.6;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.shadowColor = '#e8ecff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath();
  ctx.arc(820, 84, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(10, 14, 36, 0.5)';
  ctx.beginPath();
  ctx.arc(808, 76, 26, 0, Math.PI * 2);
  ctx.fill();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      ctx.fillStyle = (col + row) % 2 === 0 ? '#141a38' : '#171e42';
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }
  ctx.fillStyle = 'rgba(20, 26, 56, 0.6)';
  for (let i = 0; i < 26; i += 1) {
    const gx = ((i * 173) % PANEL_X) + 10;
    const gy = ((i * 97) % VIEW_HEIGHT) + 8;
    if (state.pathSet.has(`${Math.floor(gx / CELL)},${Math.floor(gy / CELL)}`)) continue;
    ctx.beginPath();
    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const key of state.pathSet) {
    const [col, row] = key.split(',').map(Number);
    if (col === 18 && row === 12) continue;
    ctx.fillStyle = '#3a2f52';
    ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    ctx.fillStyle = '#463a63';
    ctx.fillRect(col * CELL + 4, row * CELL + 4, CELL - 8, CELL - 8);
    ctx.fillStyle = '#55467a';
    ctx.fillRect(col * CELL + 10, row * CELL + 10, 6, 6);
    ctx.fillRect(col * CELL + 30, row * CELL + 28, 6, 6);
  }
  for (const fly of state.fireflies) {
    const fx = fly.x + Math.sin(state.time * fly.speed + fly.phase) * 22;
    const fy = fly.y + Math.cos(state.time * fly.speed * 0.8 + fly.phase) * 14;
    const glow = 0.4 + 0.6 * Math.max(0, Math.sin(state.time * 1.4 + fly.phase));
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLantern(ctx, state) {
  const { x, y } = LANTERN_POS;
  const healthRatio = Math.max(0.15, state.lives / state.maxLives);
  const flicker = 1 + Math.sin(state.time * 5) * 0.06 + Math.sin(state.time * 11.3) * 0.04;
  const glowRadius = 150 * healthRatio * flicker + 40;
  const glow = ctx.createRadialGradient(x, y - 20, 10, x, y - 20, glowRadius);
  glow.addColorStop(0, 'rgba(255, 217, 122, 0.5)');
  glow.addColorStop(0.5, 'rgba(255, 179, 71, 0.18)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 20, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2f5e';
  ctx.strokeStyle = '#4a528f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 18, y + 22);
  ctx.lineTo(x - 12, y - 6);
  ctx.lineTo(x + 12, y - 6);
  ctx.lineTo(x + 18, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1c2247';
  ctx.strokeStyle = '#ffd97a';
  roundRect(ctx, x - 14, y - 40, 28, 34, 6);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = '#ffd97a';
  ctx.shadowBlur = 22 * healthRatio + 6;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.ellipse(x, y - 23, 7 * healthRatio + 2, 11 * healthRatio + 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 40);
  ctx.lineTo(x, y - 52);
  ctx.lineTo(x + 8, y - 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE LAST LANTERN', x, y + 40);
}

function drawHud(ctx, state, mouse) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.78)';
  ctx.fillRect(0, 0, PANEL_X, 52);
  ctx.fillStyle = '#2c3566';
  ctx.fillRect(0, 52, PANEL_X, 2);
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(26, 27, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(`${state.ember}`, 42, 34);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#a9a3c7';
  ctx.fillText('ember', 42, 48);
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#ffd97a';
  ctx.fillText('Light', 140, 30);
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(`${state.lives}/${state.maxLives}`, 196, 30);
  ctx.fillStyle = '#2c3566';
  ctx.fillRect(140, 36, 110, 7);
  ctx.fillStyle = state.lives / state.maxLives > 0.35 ? '#ffd97a' : '#ff5d6c';
  ctx.fillRect(140, 36, 110 * Math.max(0, state.lives / state.maxLives), 7);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`Wave ${Math.max(1, state.wave)}/${TOTAL_WAVES}`, 290, 30);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#a9a3c7';
  const remaining = state.spawnQueue.length + state.enemies.length;
  ctx.fillText(state.waveActive ? `${remaining} foes left` : state.wave === 0 ? 'build, then start wave 1' : 'wave clear', 290, 48);
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(`Score ${state.score}`, 470, 30);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#a9a3c7';
  ctx.fillText(`${state.kills} felled  Best ${state.best.score}`, 470, 48);
  drawButton(ctx, speedRect(), state.speed === 1 ? '1x' : '2x', null, true, pointInRect(mouse.x, mouse.y, speedRect()), '#7fd8ff');
  drawButton(ctx, pauseRect(), 'Pause', null, true, pointInRect(mouse.x, mouse.y, pauseRect()), '#7fd8ff');
  drawButton(ctx, muteRect(), state.muted ? 'Muted' : 'Sound', null, true, pointInRect(mouse.x, mouse.y, muteRect()), '#7fd8ff');
  const boss = state.enemies.find((enemy) => enemy.kind === 'boss' && !enemy.dead);
  if (boss) {
    const barW = 420;
    const barX = (PANEL_X - barW) / 2;
    ctx.fillStyle = 'rgba(8, 10, 26, 0.85)';
    roundRect(ctx, barX - 12, 62, barW + 24, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#ff5d6c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8d98';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(boss.enraged ? 'GLOOMWARDEN  ENRAGED' : 'GLOOMWARDEN', PANEL_X / 2, 78);
    ctx.fillStyle = '#2c3566';
    ctx.fillRect(barX, 84, barW, 8);
    ctx.fillStyle = '#ff5d6c';
    ctx.fillRect(barX, 84, barW * Math.max(0, boss.hp / boss.maxHp), 8);
  }
}

function drawShopCard(ctx, state, index, mouse) {
  const typeId = TOWER_ORDER[index];
  const def = TOWER_TYPES[typeId];
  const rect = shopCardRect(index);
  const affordable = state.ember >= def.cost;
  const selected = state.buildType === typeId;
  const hovered = pointInRect(mouse.x, mouse.y, rect);
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = selected ? '#2a2a55' : hovered ? '#1e2450' : '#161b3a';
  ctx.fill();
  ctx.strokeStyle = selected ? '#ffd97a' : '#2c3566';
  ctx.lineWidth = selected ? 3 : 2;
  ctx.stroke();
  ctx.globalAlpha = affordable ? 1 : 0.55;
  ctx.save();
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(rect.x + 32, rect.y + 30, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(rect.x + 29, rect.y + 27, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(def.name, rect.x + 56, rect.y + 26);
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(def.short, rect.x + 56, rect.y + 46);
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`${def.cost} ember`, rect.x + 56, rect.y + 66);
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`DMG ${def.damage}  RNG ${def.range}`, rect.x + 168, rect.y + 66);
  ctx.fillStyle = '#2c3566';
  roundRect(ctx, rect.x + rect.w - 34, rect.y + 10, 24, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(def.key, rect.x + rect.w - 22, rect.y + 27);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPanel(ctx, state, mouse) {
  ctx.fillStyle = '#10142e';
  ctx.fillRect(PANEL_X, 0, PANEL_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#2c3566';
  ctx.fillRect(PANEL_X, 0, 2, VIEW_HEIGHT);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText("KEEPER'S LEDGER", PANEL_X + 12, 26);
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`${DIFFICULTIES[state.difficulty].name} night  ${state.boonsTaken.length} boons`, PANEL_X + 12, 46);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('BUILD TOWERS', PANEL_X + 12, 66);
  for (let i = 0; i < TOWER_ORDER.length; i += 1) drawShopCard(ctx, state, i, mouse);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('ABILITIES', PANEL_X + 12, 530);
  for (const id of ['sunburst', 'frostnova']) {
    const def = ABILITIES[id];
    const rect = abilityRect(id);
    const cd = state.abilities[id].cd;
    const ready = cd <= 0;
    const hovered = pointInRect(mouse.x, mouse.y, rect);
    drawButton(ctx, rect, `${def.name} [${def.key}]`, ready ? 'ready' : `${Math.ceil(cd)}s`, ready, hovered, id === 'sunburst' ? '#ffd97a' : '#7fd8ff');
  }
  const waveRect = startWaveRect();
  const canStart = !state.waveActive && state.wave < TOTAL_WAVES;
  const waveLabel = state.waveActive ? 'WAVE RUNNING' : state.wave >= TOTAL_WAVES ? 'NIGHT COMPLETE' : state.wave === 0 ? 'START WAVE 1' : `START WAVE ${state.wave + 1}`;
  drawButton(ctx, waveRect, waveLabel, canStart ? '[Space] call the night' : 'hold the path', canStart, pointInRect(mouse.x, mouse.y, waveRect), '#8fe388');
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('1-5 pick a tower, click a tower to upgrade,', PANEL_X + 12, 678);
  ctx.fillText('Q Sunburst, W Frost Nova, F speed, P pause.', PANEL_X + 12, 696);
}

function drawSelectedPanel(ctx, state, mouse) {
  const tower = state.selectedTower;
  if (!tower) return;
  const stats = towerStats(tower, state.modifiers);
  const rect = selectedPanelRect();
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = 'rgba(16, 20, 46, 0.94)';
  ctx.fill();
  ctx.strokeStyle = '#ffd97a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`${tower.name}  Lv ${tower.level}`, rect.x + 16, rect.y + 30);
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(TOWER_TYPES[tower.type].blurb, rect.x + 16, rect.y + 52);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '15px Georgia, serif';
  let line = `Damage ${stats.damage}   Range ${stats.range}   Fire ${stats.cooldown.toFixed(2)}s`;
  if (stats.slow) line += `   Slow ${Math.round(stats.slow * 100)}%`;
  if (stats.poison) line += `   Poison ${stats.poison}/s`;
  if (stats.splash) line += `   Splash ${stats.splash}`;
  ctx.fillText(line, rect.x + 16, rect.y + 76);
  const cost = upgradeCost(tower);
  if (cost !== null) {
    const next = TOWER_TYPES[tower.type].upgrades[tower.level - 1];
    ctx.fillStyle = '#a9a3c7';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(`Next level: damage ${next.damage}, range ${next.range}`, rect.x + 16, rect.y + 98);
  } else {
    ctx.fillStyle = '#ffd97a';
    ctx.font = '14px Georgia, serif';
    ctx.fillText('Fully kindled. This tower is at its brightest.', rect.x + 16, rect.y + 98);
  }
  const upRect = upgradeButtonRect();
  const sellRect = sellButtonRect();
  if (cost !== null) {
    drawButton(ctx, upRect, `Upgrade  ${cost}`, null, state.ember >= cost, pointInRect(mouse.x, mouse.y, upRect), '#8fe388');
  } else {
    drawButton(ctx, upRect, 'Max level', null, false, false, '#8fe388');
  }
  drawButton(ctx, sellRect, `Sell +${sellValue(tower)}`, null, true, pointInRect(mouse.x, mouse.y, sellRect), '#ff8d98');
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Click empty ground to close.', rect.x + 360, rect.y + 30);
  ctx.restore();
}

function drawBanner(ctx, state) {
  if (!state.banner) return;
  const alpha = Math.min(1, state.banner.t);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  roundRect(ctx, 150, 108, 660, 78, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd97a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 27px Georgia, serif';
  ctx.fillText(state.banner.text, 480, 142);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(state.banner.sub, 480, 168);
  ctx.restore();
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(640, 360, 320, 640, 360, 760);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function titleDemo(state) {
  if (state.titleDemo) return state.titleDemo;
  const towers = [createTower('ember', 13, 4), createTower('frost', 13, 5), createTower('cannon', 6, 9), createTower('thorn', 6, 5), createTower('mortar', 10, 10)];
  towers[0].level = 2;
  towers[2].level = 3;
  const enemies = [];
  const kinds = ['husk', 'emberling', 'wisp', 'brute', 'shielded', 'splitter'];
  const spots = [[300, 120], [430, 120], [560, 120], [744, 220], [744, 320], [520, 360]];
  for (let i = 0; i < kinds.length; i += 1) {
    const enemy = createEnemy(kinds[i], 1, 0);
    enemy.x = spots[i][0];
    enemy.y = spots[i][1];
    enemies.push(enemy);
  }
  state.titleDemo = { towers, enemies };
  return state.titleDemo;
}

function drawTitle(ctx, state, mouse) {
  drawBackground(ctx, state);
  const demo = titleDemo(state);
  drawLantern(ctx, state);
  drawTowers(ctx, { towers: demo.towers, modifiers: state.modifiers, projectiles: [] });
  drawEnemies(ctx, { enemies: demo.enemies, time: state.time });
  ctx.fillStyle = 'rgba(8, 10, 26, 0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = '#ffd97a';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('LUMENFALL', 640, 168);
  ctx.restore();
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('Keep the Last Lantern Lit', 640, 208);
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Shadows walk the winding path. Build towers of light, choose boons, and hold', 640, 242);
  ctx.fillText('the lantern through 15 waves, three Gloomwarden bosses, and the longest night.', 640, 266);
  const feats = ['5 light towers', '8 shadow foes', '3 bosses', '8 boons', '2 abilities'];
  ctx.font = 'bold 15px Georgia, serif';
  feats.forEach((feat, i) => {
    const fx = 640 + (i - 2) * 150;
    ctx.fillStyle = '#1c2247';
    roundRect(ctx, fx - 66, 288, 132, 34, 17);
    ctx.fill();
    ctx.strokeStyle = '#2c3566';
    ctx.stroke();
    ctx.fillStyle = '#f2ead8';
    ctx.fillText(feat, fx, 310);
  });
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('CHOOSE YOUR NIGHT', 640, 386);
  const ids = ['story', 'standard', 'nightmare'];
  ids.forEach((id, i) => {
    const rect = difficultyRect(i);
    const def = DIFFICULTIES[id];
    const selected = state.difficulty === id;
    const hovered = pointInRect(mouse.x, mouse.y, rect);
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fillStyle = selected ? '#2a2a55' : hovered ? '#1e2450' : '#161b3a';
    ctx.fill();
    ctx.strokeStyle = selected ? '#ffd97a' : '#2c3566';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(def.name, rect.x + rect.w / 2, rect.y + 28);
    ctx.restore();
  });
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(DIFFICULTIES[state.difficulty].blurb, 640, 468);
  const startRect = startButtonRect();
  drawButton(ctx, startRect, 'BEGIN THE NIGHT', 'or press Enter', true, pointInRect(mouse.x, mouse.y, startRect), '#ffd97a');
  ctx.fillStyle = '#a9a3c7';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Mouse: build, upgrade, aim abilities.  Keys 1-5: towers.  Q/W: abilities.  Space: start wave.', 640, 580);
  ctx.fillText('Click a tower to upgrade or sell it. Leaks drain the lantern. Lose all light and the night wins.', 640, 602);
  if (state.best.score > 0) {
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(`Best run: ${state.best.score} points, wave ${state.best.wave}, ${state.best.stars} stars`, 640, 640);
  }
  drawVignette(ctx);
}

function drawBoonChoice(ctx, state, mouse) {
  drawPlayField(ctx, state, mouse);
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('THE LANTERN OFFERS A BOON', 640, 168);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`Wave ${state.wave} is clear. Choose one gift before the next wave.`, 640, 200);
  state.boonOptions.forEach((boon, i) => {
    const rect = boonCardRect(i);
    const hovered = pointInRect(mouse.x, mouse.y, rect);
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
    ctx.fillStyle = hovered ? '#232a58' : '#161b3a';
    ctx.fill();
    ctx.strokeStyle = hovered ? '#ffd97a' : '#2c3566';
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = '#ffd97a';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + 56, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + 56, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 21px Georgia, serif';
    ctx.fillText(boon.name, rect.x + rect.w / 2, rect.y + 116);
    ctx.fillStyle = '#a9a3c7';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(boon.text, rect.x + rect.w / 2, rect.y + 146);
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`Press ${i + 1} or click`, rect.x + rect.w / 2, rect.y + 186);
    ctx.restore();
  });
  drawVignette(ctx);
}

function drawPause(ctx, state, mouse) {
  drawPlayField(ctx, state, mouse);
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('PAUSED', 640, 268);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`Wave ${state.wave} of ${TOTAL_WAVES}. The shadows wait.`, 640, 300);
  const labels = ['Resume', 'Restart Run', 'Back to Title'];
  labels.forEach((label, i) => {
    const rect = pauseButtonRect(i);
    drawButton(ctx, rect, label, null, true, pointInRect(mouse.x, mouse.y, rect), '#7fd8ff');
  });
  drawVignette(ctx);
}

function drawStars(ctx, cx, y, filled, big) {
  for (let i = -1; i <= 1; i += 1) {
    const sx = cx + i * 64;
    const sy = y + Math.abs(i) * 10;
    const size = big ? 26 : 20;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const angle = -Math.PI / 2 + (p * Math.PI) / 5;
      const radius = p % 2 === 0 ? size : size * 0.45;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const index = i + 1;
    const isFilled = index < filled || (filled === 3);
    ctx.fillStyle = index < filled ? '#ffd97a' : '#3a4178';
    ctx.shadowColor = index < filled ? '#ffd97a' : 'transparent';
    ctx.shadowBlur = index < filled ? 18 : 0;
    ctx.fill();
    ctx.restore();
  }
}

function drawStatsGrid(ctx, state, y) {
  const minutes = Math.floor(state.runTime / 60);
  const seconds = Math.floor(state.runTime % 60);
  const rows = [
    ['Final score', `${state.score}`],
    ['Waves held', `${state.wave} / ${TOTAL_WAVES}`],
    ['Foes felled', `${state.kills}`],
    ['Lantern light left', `${state.lives} / ${state.maxLives}`],
    ['Ember earned', `${state.emberEarned}`],
    ['Towers built', `${state.towersBuilt}`],
    ['Time in the night', `${minutes}:${String(seconds).padStart(2, '0')}`],
    ['Boons taken', state.boonsTaken.length ? (state.boonsTaken.length === 1 ? state.boonsTaken[0] : `${state.boonsTaken[0]} +${state.boonsTaken.length - 1} more`) : 'None'],
  ];
  ctx.textAlign = 'left';
  rows.forEach((row, i) => {
    const ry = y + i * 28;
    ctx.fillStyle = '#a9a3c7';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(row[0], 470, ry);
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(row[1], 700, ry);
  });
}

function drawEndScreen(ctx, state, mouse, victory) {
  drawPlayField(ctx, state, mouse);
  ctx.fillStyle = 'rgba(8, 10, 26, 0.78)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.save();
  roundRect(ctx, 330, 84, 620, 520, 18);
  ctx.fillStyle = '#10142e';
  ctx.fill();
  ctx.strokeStyle = victory ? '#ffd97a' : '#ff5d6c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = 'center';
  if (victory) {
    drawStars(ctx, 640, 150, state.stars, true);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('DAWN BREAKS', 640, 226);
    ctx.fillStyle = '#f2ead8';
    ctx.font = '17px Georgia, serif';
    ctx.fillText('The lantern burns on. The night is yours, Keeper.', 640, 256);
  } else {
    ctx.fillStyle = '#ff8d98';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('THE LIGHT WENT OUT', 640, 168);
    ctx.fillStyle = '#f2ead8';
    ctx.font = '17px Georgia, serif';
    ctx.fillText(`The shadows reached the lantern on wave ${state.wave}. Try a new plan.`, 640, 200);
  }
  drawStatsGrid(ctx, state, victory ? 292 : 240);
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`Best run: ${state.best.score} points, wave ${state.best.wave}`, 640, 522);
  drawButton(ctx, playAgainRect(), victory ? 'PLAY AGAIN' : 'TRY AGAIN', 'or press R', true, pointInRect(mouse.x, mouse.y, playAgainRect()), '#8fe388');
  drawButton(ctx, backToTitleRect(), 'TITLE', null, true, pointInRect(mouse.x, mouse.y, backToTitleRect()), '#7fd8ff');
  drawVignette(ctx);
}

function drawPlayField(ctx, state, mouse) {
  const offset = shakeOffset(state.effects);
  ctx.save();
  ctx.translate(offset.x, offset.y);
  drawBackground(ctx, state);
  drawLantern(ctx, state);
  if (state.selectedTower) {
    const stats = towerStats(state.selectedTower, state.modifiers);
    drawRangeRing(ctx, state.selectedTower.x, state.selectedTower.y, stats.range, 'rgba(255, 217, 122, 0.6)');
  }
  drawTowers(ctx, state);
  drawEnemies(ctx, state);
  drawEffects(ctx, state.effects);
  ctx.restore();
  if (state.effects.flash > 0) {
    ctx.globalAlpha = state.effects.flash;
    ctx.fillStyle = state.effects.flashColor;
    ctx.fillRect(0, 0, PANEL_X, VIEW_HEIGHT);
    ctx.globalAlpha = 1;
  }
  if (state.buildType && mouse.x < PANEL_X) {
    const col = Math.floor(mouse.x / CELL);
    const row = Math.floor(mouse.y / CELL);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const def = TOWER_TYPES[state.buildType];
      const valid = !state.pathSet.has(`${col},${row}`) && !state.towers.some((t) => t.col === col && t.row === row) && state.ember >= def.cost;
      drawBuildGhost(ctx, state, col, row, valid);
    }
  }
  drawHud(ctx, state, mouse);
  drawPanel(ctx, state, mouse);
  drawSelectedPanel(ctx, state, mouse);
  drawBanner(ctx, state);
  drawVignette(ctx);
}

export function renderGame(ctx, state, mouse) {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (state.screen === 'title') {
    drawTitle(ctx, state, mouse);
  } else if (state.screen === 'boon') {
    drawBoonChoice(ctx, state, mouse);
  } else if (state.screen === 'pause') {
    drawPause(ctx, state, mouse);
  } else if (state.screen === 'victory') {
    drawEndScreen(ctx, state, mouse, true);
  } else if (state.screen === 'defeat') {
    drawEndScreen(ctx, state, mouse, false);
  } else {
    drawPlayField(ctx, state, mouse);
  }
}
