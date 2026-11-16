// Aurora Flip: all world drawing. The gate, checkpoints, sun orbs,
// star shards, crystal spikes, barrier walls, phasing walls, drifting
// mines and the runner are drawn here in code, with no image file.
// World items are placed in screen coordinates by subtracting the
// camera, the background comes from background.js, and the HUD and
// menu screens come from ui.js.

import {
  CEILING_Y,
  COLORS,
  FLOOR_Y,
  FONT,
  PLAYER_SIZE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { barrierRect, mineY, phaserPhase, spikeRect } from './level.js';
import { drawBackground, drawVignette } from './background.js';
import { drawScreens } from './ui.js';
import { drawSparkle, drawStarShape } from './shapes.js';

function drawGate(ctx, gateScreenX, animTime, theme) {
  if (gateScreenX < -140 || gateScreenX > VIEW_WIDTH + 140) {
    return;
  }
  const cy = (FLOOR_Y + CEILING_Y) / 2;
  // A beam of light rising from the gate, so it reads from far away.
  const beam = ctx.createLinearGradient(0, CEILING_Y, 0, cy);
  beam.addColorStop(0, 'rgba(46,230,168,0)');
  beam.addColorStop(1, 'rgba(46,230,168,0.18)');
  ctx.fillStyle = beam;
  ctx.fillRect(gateScreenX - 26, CEILING_Y, 52, cy - CEILING_Y);
  ctx.save();
  ctx.shadowColor = theme.auroraA;
  ctx.shadowBlur = 26;
  ctx.strokeStyle = theme.auroraA;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(gateScreenX, cy, 44, 236, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  const inner = ctx.createLinearGradient(0, cy - 236, 0, cy + 236);
  inner.addColorStop(0, 'rgba(46,230,168,0.05)');
  inner.addColorStop(0.5, 'rgba(46,230,168,0.28)');
  inner.addColorStop(1, 'rgba(56,182,255,0.08)');
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(gateScreenX, cy, 40, 230, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,247,255,0.8)';
  ctx.lineWidth = 3;
  for (let k = 0; k < 3; k += 1) {
    const start = animTime * 1.2 + k * 2.09;
    ctx.beginPath();
    ctx.ellipse(gateScreenX, cy, 30, 170, 0, start, start + 0.9);
    ctx.stroke();
  }
  // Orbiting sparks around the ring.
  for (let k = 0; k < 5; k += 1) {
    const angle = animTime * 0.9 + k * 1.256;
    const ox = gateScreenX + Math.cos(angle) * 44;
    const oy = cy + Math.sin(angle) * 236;
    ctx.fillStyle = '#eaf6ff';
    drawSparkle(ctx, ox, oy, 9, 0.5);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GATE', gateScreenX, CEILING_Y + 34);
}

function drawCheckpoints(ctx, level, cameraX, animTime, theme) {
  for (const checkpoint of level.checkpoints) {
    const sx = checkpoint.x - cameraX;
    if (sx < -40 || sx > VIEW_WIDTH + 40) {
      continue;
    }
    const color = checkpoint.reached ? theme.auroraA : COLORS.textDim;
    if (checkpoint.reached) {
      const pulse = 0.5 + 0.5 * Math.sin(animTime * 3);
      ctx.globalAlpha = 0.25 + 0.2 * pulse;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, FLOOR_Y - 60, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, FLOOR_Y);
    ctx.lineTo(sx, FLOOR_Y - 118);
    ctx.stroke();
    const wave = Math.sin(animTime * 3 + sx) * 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx, FLOOR_Y - 118);
    ctx.lineTo(sx + 44, FLOOR_Y - 104 + wave);
    ctx.lineTo(sx, FLOOR_Y - 88);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, FLOOR_Y - 122, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawOrbs(ctx, level, cameraX, animTime) {
  for (const orb of level.orbs) {
    if (orb.taken) {
      continue;
    }
    const sx = orb.x - cameraX;
    if (sx < -50 || sx > VIEW_WIDTH + 50) {
      continue;
    }
    const pulse = 1 + 0.12 * Math.sin(animTime * 3 + orb.phase);
    const glow = ctx.createRadialGradient(sx, orb.y, 2, sx, orb.y, orb.r * 2.4);
    glow.addColorStop(0, 'rgba(255,217,77,0.5)');
    glow.addColorStop(1, 'rgba(255,217,77,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, orb.y, orb.r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Rotating sun rays behind the orb.
    ctx.save();
    ctx.translate(sx, orb.y);
    ctx.rotate(animTime * 0.8 + orb.phase);
    ctx.strokeStyle = 'rgba(255,217,77,0.55)';
    ctx.lineWidth = 2.5;
    for (let k = 0; k < 8; k += 1) {
      const angle = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (orb.r + 3), Math.sin(angle) * (orb.r + 3));
      ctx.lineTo(Math.cos(angle) * (orb.r + 10), Math.sin(angle) * (orb.r + 10));
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = COLORS.orb;
    ctx.beginPath();
    ctx.arc(sx, orb.y, orb.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.orbCore;
    ctx.beginPath();
    ctx.arc(sx, orb.y, orb.r * 0.45 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(sx - 5, orb.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShards(ctx, level, cameraX, animTime) {
  for (const shard of level.shards) {
    if (shard.taken) {
      continue;
    }
    const sx = shard.x - cameraX;
    if (sx < -50 || sx > VIEW_WIDTH + 50) {
      continue;
    }
    const haloR = 30 + 4 * Math.sin(animTime * 2.4 + shard.phase);
    ctx.strokeStyle = 'rgba(255,224,102,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, shard.y, haloR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(sx, shard.y);
    ctx.rotate(animTime * 1.5 + shard.phase);
    ctx.shadowColor = COLORS.shard;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLORS.shard;
    drawStarShape(ctx, 0, 0, 24, 8, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff7cc';
    ctx.beginPath();
    ctx.arc(sx, shard.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpikes(ctx, level, cameraX) {
  for (const spike of level.spikes) {
    const rect = spikeRect(spike);
    const sx = rect.left - cameraX;
    if (sx < -80 || sx > VIEW_WIDTH + 80) {
      continue;
    }
    const tipX = sx + spike.w / 2;
    const tipY = spike.side === 'floor' ? rect.top : rect.bottom;
    const baseY = spike.side === 'floor' ? rect.bottom : rect.top;
    ctx.save();
    ctx.shadowColor = COLORS.spike;
    ctx.shadowBlur = 10;
    const grad = ctx.createLinearGradient(0, Math.min(tipY, baseY), 0, Math.max(tipY, baseY));
    grad.addColorStop(0, '#ff8fab');
    grad.addColorStop(1, COLORS.spike);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sx, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sx + spike.w, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // A crystal facet down the middle, so spikes read as cut crystal.
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(sx + spike.w * 0.62, baseY);
    ctx.lineTo(sx + spike.w * 0.38, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.spikeEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sx + spike.w, baseY);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBarrierShape(ctx, sx, rect, barrier, alpha, theme) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(sx, 0, sx + barrier.w, 0);
  grad.addColorStop(0, '#5a3fd4');
  grad.addColorStop(0.5, COLORS.crystal);
  grad.addColorStop(1, '#4a2fb8');
  ctx.fillStyle = grad;
  ctx.fillRect(sx, rect.top, barrier.w, rect.bottom - rect.top);
  ctx.strokeStyle = COLORS.crystalEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, rect.top, barrier.w, rect.bottom - rect.top);
  ctx.strokeStyle = 'rgba(201,184,255,0.4)';
  ctx.lineWidth = 1.5;
  const span = rect.bottom - rect.top;
  for (let k = 1; k <= 3; k += 1) {
    const y = rect.top + (span * k) / 4;
    ctx.beginPath();
    ctx.moveTo(sx + 4, y);
    ctx.lineTo(sx + barrier.w - 4, y - 14);
    ctx.stroke();
  }
  const capY = barrier.side === 'floor' ? rect.top : rect.bottom;
  ctx.save();
  ctx.shadowColor = COLORS.crystalEdge;
  ctx.shadowBlur = 14;
  ctx.fillStyle = COLORS.crystalEdge;
  drawStarShape(ctx, sx + barrier.w / 2, capY, 12, 5, 4);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawBarriers(ctx, level, cameraX, theme) {
  for (const barrier of level.barriers) {
    const rect = barrierRect(barrier);
    const sx = rect.left - cameraX;
    if (sx < -80 || sx > VIEW_WIDTH + 80) {
      continue;
    }
    drawBarrierShape(ctx, sx, rect, barrier, 1, theme);
  }
}

function drawPhasers(ctx, level, cameraX, time, animTime, theme) {
  for (const phaser of level.phasers) {
    const rect = barrierRect(phaser);
    const sx = rect.left - cameraX;
    if (sx < -80 || sx > VIEW_WIDTH + 80) {
      continue;
    }
    const phase = phaserPhase(phaser, time);
    if (phase === 'solid') {
      drawBarrierShape(ctx, sx, rect, phaser, 1, theme);
    } else if (phase === 'warning') {
      const blink = Math.floor(animTime * 8) % 2 === 0;
      drawBarrierShape(ctx, sx, rect, phaser, blink ? 0.85 : 0.35, theme);
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(sx - 3, rect.top - 3, phaser.w + 6, rect.bottom - rect.top + 6);
      ctx.setLineDash([]);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = COLORS.crystalEdge;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(sx, rect.top, phaser.w, rect.bottom - rect.top);
      ctx.setLineDash([]);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = COLORS.crystalEdge;
      const capY = phaser.side === 'floor' ? rect.top : rect.bottom;
      drawStarShape(ctx, sx + phaser.w / 2, capY, 9, 4, 4);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawMines(ctx, level, cameraX, time, animTime) {
  for (const mine of level.mines) {
    const sx = mine.x - cameraX;
    if (sx < -70 || sx > VIEW_WIDTH + 70) {
      continue;
    }
    const my = mineY(mine, time);
    // A pulsing danger ring, so the mine reads as danger at a glance.
    const ringR = mine.r + 8 + 4 * Math.sin(animTime * 4 + mine.phase);
    ctx.strokeStyle = 'rgba(255,93,93,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, my, ringR, 0, Math.PI * 2);
    ctx.stroke();
    // Eight spikes around a dark shell.
    ctx.fillStyle = '#3a1020';
    for (let k = 0; k < 8; k += 1) {
      const angle = (k * Math.PI) / 4 + animTime * 0.6;
      const tipX = sx + Math.cos(angle) * (mine.r + 8);
      const tipY = my + Math.sin(angle) * (mine.r + 8);
      const leftX = sx + Math.cos(angle - 0.18) * mine.r;
      const leftY = my + Math.sin(angle - 0.18) * mine.r;
      const rightX = sx + Math.cos(angle + 0.18) * mine.r;
      const rightY = my + Math.sin(angle + 0.18) * mine.r;
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = COLORS.mineCore;
    ctx.shadowBlur = 16;
    const shell = ctx.createRadialGradient(sx - 6, my - 6, 4, sx, my, mine.r);
    shell.addColorStop(0, '#7a2038');
    shell.addColorStop(1, '#2a0a18');
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.arc(sx, my, mine.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const corePulse = 1 + 0.2 * Math.sin(animTime * 4 + mine.phase);
    ctx.fillStyle = COLORS.mineCore;
    ctx.beginPath();
    ctx.arc(sx, my, 8 * corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd6de';
    ctx.beginPath();
    ctx.arc(sx, my, 3.5 * corePulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, game) {
  const player = game.player;
  let y = player.y;
  if (game.state === 'title') {
    y += Math.sin(game.animTime * 2) * 4;
  }
  ctx.save();
  ctx.translate(player.x, y);
  ctx.rotate(player.angle);
  const squash = player.squash;
  const stretch = player.stretch;
  ctx.scale(1 + squash * 0.18 - stretch * 0.1, 1 - squash * 0.14 + stretch * 0.12);
  if (player.isInvulnerable(game.time) && Math.floor(game.animTime * 12) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }
  // A soft glow under the wisp, so it pops against the sky.
  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 52);
  halo.addColorStop(0, 'rgba(83,233,255,0.35)');
  halo.addColorStop(1, 'rgba(83,233,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();
  // Scarf with two tails waving behind.
  const wave = Math.sin(game.animTime * 9) * 5;
  const wave2 = Math.sin(game.animTime * 9 + 1.4) * 4;
  ctx.fillStyle = COLORS.scarf;
  ctx.beginPath();
  ctx.moveTo(-14, -10);
  ctx.quadraticCurveTo(-34, -14 + wave, -50, -6 + wave);
  ctx.quadraticCurveTo(-34, 0 + wave, -14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e04f5f';
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.quadraticCurveTo(-30, 6 + wave2, -42, 12 + wave2);
  ctx.quadraticCurveTo(-28, 12 + wave2, -14, 8);
  ctx.closePath();
  ctx.fill();
  // Body.
  ctx.save();
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = 24;
  const body = ctx.createRadialGradient(-8, -10, 4, 0, 0, PLAYER_SIZE / 2);
  body.addColorStop(0, '#bdf6ff');
  body.addColorStop(0.45, COLORS.player);
  body.addColorStop(1, COLORS.playerDeep);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_SIZE / 2 - 1, 0, Math.PI * 2);
  ctx.stroke();
  // Gloss highlight.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(-9, -12, 8, 5, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // Face: two bright eyes looking ahead, a smile, and rosy cheeks.
  const eyeY = player.onSurface ? -8 : -6;
  for (const ex of [2, 14]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, eyeY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101a38';
    ctx.beginPath();
    ctx.arc(ex + 2, eyeY, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 3, eyeY - 1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#101a38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(9, 6, 7, 0.25, Math.PI - 0.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  ctx.beginPath();
  ctx.arc(-2, 4, 3.4, 0, Math.PI * 2);
  ctx.arc(20, 4, 3.4, 0, Math.PI * 2);
  ctx.fill();
  // A sprout antenna with a glowing tip.
  ctx.strokeStyle = COLORS.playerDeep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, -PLAYER_SIZE / 2 + 2);
  ctx.quadraticCurveTo(-8, -PLAYER_SIZE / 2 - 10, -2, -PLAYER_SIZE / 2 - 14);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(-2, -PLAYER_SIZE / 2 - 15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawGame(ctx, game, input) {
  const theme = game.level.def;
  // Trauma based shake: strong at first, settling smoothly, driven by
  // sines so a staged frame is stable.
  const trauma = game.trauma * game.trauma;
  const shakeX = trauma * 16 * Math.sin(game.animTime * 91);
  const shakeY = trauma * 11 * Math.sin(game.animTime * 113 + 1.7);
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground(ctx, theme, game.cameraX, game.animTime);
  drawGate(ctx, game.level.gateX - game.cameraX, game.animTime, theme);
  drawCheckpoints(ctx, game.level, game.cameraX, game.animTime, theme);
  drawOrbs(ctx, game.level, game.cameraX, game.animTime);
  drawShards(ctx, game.level, game.cameraX, game.animTime);
  drawSpikes(ctx, game.level, game.cameraX);
  drawBarriers(ctx, game.level, game.cameraX, theme);
  drawPhasers(ctx, game.level, game.cameraX, game.time, game.animTime, theme);
  drawMines(ctx, game.level, game.cameraX, game.time, game.animTime);
  game.particles.draw(ctx);
  drawPlayer(ctx, game);
  ctx.restore();

  drawVignette(ctx);
  drawScreens(ctx, game, input);

  if (game.flash > 0) {
    ctx.fillStyle = 'rgba(255,60,80,' + (game.flash * 0.3).toFixed(3) + ')';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
}
