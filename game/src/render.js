// Aurora Flip: all drawing. The background, surfaces, entities, the
// runner, the HUD and every menu screen are drawn here in code, with no
// image file. World items are placed in screen coordinates by
// subtracting the camera, and the HUD is drawn unshaken on top.

import {
  CEILING_Y,
  COLORS,
  FLOOR_Y,
  FONT,
  PLAYER_SIZE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  formatScore,
} from './config.js';
import { barrierRect, spikeRect } from './level.js';
import { pointInRect } from './input.js';
import { mulberry32 } from './random.js';

function fract(value) {
  return value - Math.floor(value);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawStarShape(ctx, cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawHeartShape(ctx, cx, cy, size) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.4, cy - s * 0.1, cx - s * 0.7, cy - s, cx, cy - s * 0.25);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s, cx + s * 1.4, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}

// Fixed star fields and ridges, generated once from fixed seeds so the
// background is identical on every run.
function makeStars(count, seed) {
  const rnd = mulberry32(seed);
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: rnd() * 1440,
      y: 18 + rnd() * 560,
      r: 0.8 + rnd() * 1.9,
      phase: rnd() * 6.28,
      speed: 1 + rnd() * 2,
    });
  }
  return stars;
}

function makeRidge(seed, amp) {
  const rnd = mulberry32(seed);
  const points = [];
  for (let x = 0; x <= 2560; x += 128) {
    points.push({ x, dy: -(18 + rnd() * amp) });
  }
  return points;
}

const STAR_LAYERS = [
  { parallax: 0.1, stars: makeStars(70, 11) },
  { parallax: 0.22, stars: makeStars(55, 23) },
  { parallax: 0.38, stars: makeStars(40, 37) },
];

const RIDGES = [
  { parallax: 0.25, base: 566, color: COLORS.mountainFar, points: makeRidge(101, 95) },
  { parallax: 0.45, base: 604, color: COLORS.mountainNear, points: makeRidge(202, 62) },
];

function drawSky(ctx, cameraX, animTime) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(0.55, COLORS.skyMid);
  gradient.addColorStop(1, COLORS.skyLow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  for (const layer of STAR_LAYERS) {
    for (const star of layer.stars) {
      let sx = (star.x - cameraX * layer.parallax) % 1440;
      if (sx < 0) {
        sx += 1440;
      }
      sx -= 80;
      if (sx < -8 || sx > VIEW_WIDTH + 8) {
        continue;
      }
      const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(animTime * star.speed + star.phase));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#eaf6ff';
      ctx.beginPath();
      ctx.arc(sx, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawAurora(ctx, cameraX, animTime) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ribbons = [
    { base: 118, color: COLORS.auroraA, phase: 0 },
    { base: 208, color: COLORS.auroraB, phase: 2.1 },
  ];
  for (const ribbon of ribbons) {
    const gradient = ctx.createLinearGradient(0, ribbon.base - 60, 0, ribbon.base + 110);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, ribbon.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.27;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (let x = -20; x <= VIEW_WIDTH + 20; x += 32) {
      const y = ribbon.base + Math.sin((x + cameraX * 0.15) / 170 + animTime * 0.5 + ribbon.phase) * 28;
      if (x === -20) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    for (let x = VIEW_WIDTH + 20; x >= -20; x -= 32) {
      const y = ribbon.base + 95 + Math.sin((x + cameraX * 0.15) / 210 + animTime * 0.4 + ribbon.phase + 1.3) * 22;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawRidges(ctx, cameraX) {
  for (const ridge of RIDGES) {
    let shift = -(cameraX * ridge.parallax) % 2560;
    if (shift > 0) {
      shift -= 2560;
    }
    ctx.fillStyle = ridge.color;
    for (const offset of [shift, shift + 2560]) {
      ctx.beginPath();
      ctx.moveTo(offset, ridge.base);
      for (const point of ridge.points) {
        ctx.lineTo(offset + point.x, ridge.base + point.dy);
      }
      ctx.lineTo(offset + 2560, ridge.base);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawSurfaces(ctx, cameraX, animTime) {
  const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, VIEW_HEIGHT);
  floorGrad.addColorStop(0, COLORS.surfaceTop);
  floorGrad.addColorStop(1, COLORS.surfaceLow);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, FLOOR_Y, VIEW_WIDTH, VIEW_HEIGHT - FLOOR_Y);

  const ceilGrad = ctx.createLinearGradient(0, 0, 0, CEILING_Y);
  ceilGrad.addColorStop(0, COLORS.surfaceLow);
  ceilGrad.addColorStop(1, COLORS.surfaceTop);
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, VIEW_WIDTH, CEILING_Y);

  // Crystal shards embedded in both surfaces, one pattern per segment.
  const startSeg = Math.floor(cameraX / 90);
  for (let i = 0; i <= 16; i += 1) {
    const segX = (startSeg + i) * 90;
    const sx = segX - cameraX;
    const h = fract(Math.sin(segX * 12.9898) * 43758.5453);
    if (h < 0.45) {
      continue;
    }
    const size = 16 + h * 26;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = COLORS.crystal;
    ctx.beginPath();
    ctx.moveTo(sx + 20, FLOOR_Y);
    ctx.lineTo(sx + 34, FLOOR_Y - size);
    ctx.lineTo(sx + 48, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 52, CEILING_Y);
    ctx.lineTo(sx + 66, CEILING_Y + size * 0.8);
    ctx.lineTo(sx + 80, CEILING_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Glowing edges, shimmering gently.
  const shimmer = 0.75 + 0.25 * Math.sin(animTime * 2);
  ctx.save();
  ctx.shadowColor = COLORS.surfaceEdge;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = COLORS.surfaceEdge;
  ctx.globalAlpha = shimmer;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y + 1);
  ctx.lineTo(VIEW_WIDTH, FLOOR_Y + 1);
  ctx.moveTo(0, CEILING_Y - 1);
  ctx.lineTo(VIEW_WIDTH, CEILING_Y - 1);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawGate(ctx, gateScreenX, animTime) {
  if (gateScreenX < -120 || gateScreenX > VIEW_WIDTH + 120) {
    return;
  }
  const cy = (FLOOR_Y + CEILING_Y) / 2;
  ctx.save();
  ctx.shadowColor = COLORS.auroraA;
  ctx.shadowBlur = 26;
  ctx.strokeStyle = COLORS.auroraA;
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
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GATE', gateScreenX, CEILING_Y + 34);
}

function drawCheckpoints(ctx, level, cameraX, animTime) {
  for (const checkpoint of level.checkpoints) {
    const sx = checkpoint.x - cameraX;
    if (sx < -40 || sx > VIEW_WIDTH + 40) {
      continue;
    }
    const color = checkpoint.reached ? COLORS.auroraA : COLORS.textDim;
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
    if (sx < -40 || sx > VIEW_WIDTH + 40) {
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
    ctx.fillStyle = COLORS.orb;
    ctx.beginPath();
    ctx.arc(sx, orb.y, orb.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.orbCore;
    ctx.beginPath();
    ctx.arc(sx, orb.y, orb.r * 0.45 * pulse, 0, Math.PI * 2);
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
    ctx.strokeStyle = COLORS.spikeEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sx + spike.w, baseY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(sx + spike.w * 0.72, baseY);
    ctx.stroke();
  }
}

function drawBarriers(ctx, level, cameraX) {
  for (const barrier of level.barriers) {
    const rect = barrierRect(barrier);
    const sx = rect.left - cameraX;
    if (sx < -80 || sx > VIEW_WIDTH + 80) {
      continue;
    }
    const grad = ctx.createLinearGradient(sx, 0, sx + barrier.w, 0);
    grad.addColorStop(0, '#5a3fd4');
    grad.addColorStop(0.5, COLORS.crystal);
    grad.addColorStop(1, '#4a2fb8');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, rect.top, barrier.w, rect.bottom - rect.top);
    ctx.strokeStyle = COLORS.crystalEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, rect.top, barrier.w, rect.bottom - rect.top);
    // Crystal veins across the column.
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
    // Glowing cap on the free end.
    const capY = barrier.side === 'floor' ? rect.top : rect.bottom;
    ctx.save();
    ctx.shadowColor = COLORS.crystalEdge;
    ctx.shadowBlur = 14;
    ctx.fillStyle = COLORS.crystalEdge;
    drawStarShape(ctx, sx + barrier.w / 2, capY, 12, 5, 4);
    ctx.fill();
    ctx.restore();
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
  ctx.scale(1 + squash * 0.18, 1 - squash * 0.14);
  if (player.isInvulnerable(game.time) && Math.floor(game.animTime * 12) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }
  // Scarf trailing behind.
  const wave = Math.sin(game.animTime * 9) * 5;
  ctx.fillStyle = COLORS.scarf;
  ctx.beginPath();
  ctx.moveTo(-16, -8);
  ctx.quadraticCurveTo(-34, -12 + wave, -48, -4 + wave);
  ctx.quadraticCurveTo(-34, 2 + wave, -16, 4);
  ctx.closePath();
  ctx.fill();
  // Feet.
  ctx.fillStyle = '#24408f';
  ctx.beginPath();
  ctx.arc(-9, 21, 6, 0, Math.PI * 2);
  ctx.arc(10, 21, 6, 0, Math.PI * 2);
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
  // Eyes looking ahead.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(9, -8, 6, 0, Math.PI * 2);
  ctx.arc(9, 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101a38';
  ctx.beginPath();
  ctx.arc(11, -8, 3, 0, Math.PI * 2);
  ctx.arc(11, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawButton(ctx, button, hover) {
  ctx.save();
  if (hover) {
    ctx.shadowColor = COLORS.panelEdge;
    ctx.shadowBlur = 16;
  }
  ctx.fillStyle = hover ? COLORS.buttonHover : COLORS.button;
  roundRectPath(ctx, button.x, button.y, button.w, button.h, 14);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(242,247,255,0.7)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, button.x, button.y, button.w, button.h, 14);
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
}

function drawMuteButton(ctx, game, input) {
  const rect = game.muteButton();
  const hover = pointInRect(rect, input.pointer.x, input.pointer.y);
  ctx.fillStyle = hover ? 'rgba(38,160,141,0.9)' : 'rgba(16,26,56,0.9)';
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.sounds.muted ? 'SOUND OFF' : 'SOUND ON', rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
}

function drawHud(ctx, game) {
  ctx.textBaseline = 'middle';
  // Score, top left.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 34px ' + FONT;
  ctx.fillText('SCORE ' + formatScore(game.score), 28, 36);
  if (game.multiplier > 1) {
    ctx.fillStyle = COLORS.gold;
    roundRectPath(ctx, 28, 58, 118, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#1a1200';
    ctx.font = 'bold 18px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('COMBO x' + game.multiplier, 87, 74);
  }
  // Level label and progress, top center.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 18px ' + FONT;
  ctx.fillText(game.levelLabel, VIEW_WIDTH / 2, 24);
  const barX = VIEW_WIDTH / 2 - 180;
  const barY = 38;
  ctx.fillStyle = 'rgba(52,72,120,0.95)';
  roundRectPath(ctx, barX, barY, 360, 14, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(174,189,216,0.55)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, barX, barY, 360, 14, 7);
  ctx.stroke();
  const fillW = Math.max(8, 360 * game.progress);
  const barGrad = ctx.createLinearGradient(barX, 0, barX + 360, 0);
  barGrad.addColorStop(0, COLORS.auroraB);
  barGrad.addColorStop(1, COLORS.auroraA);
  ctx.fillStyle = barGrad;
  roundRectPath(ctx, barX, barY, fillW, 14, 7);
  ctx.fill();
  ctx.fillStyle = COLORS.auroraA;
  drawStarShape(ctx, barX + 360 + 16, barY + 7, 10, 4, 4);
  ctx.fill();
  // Lives, top right.
  for (let i = 0; i < 3; i += 1) {
    const hx = VIEW_WIDTH - 56 - i * 44;
    ctx.fillStyle = i < game.lives ? COLORS.heart : COLORS.heartEmpty;
    drawHeartShape(ctx, hx, 34, 34);
    ctx.fill();
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 18px ' + FONT;
  ctx.fillText('BEST ' + formatScore(game.best), VIEW_WIDTH - 28, 68);
  // Control hints along the floor band while playing.
  if (game.state === 'playing') {
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '16px ' + FONT;
    ctx.fillText('SPACE or CLICK: flip gravity    P: pause    M: sound    R: restart', VIEW_WIDTH / 2, 698);
    ctx.globalAlpha = 1;
  }
}

function dimScreen(ctx, alpha) {
  ctx.fillStyle = 'rgba(4,8,24,' + alpha + ')';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(16,26,56,0.96)';
  roundRectPath(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 20);
  ctx.stroke();
}

function drawTitle(ctx, game, input) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = COLORS.auroraB;
  ctx.shadowBlur = 30;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 86px ' + FONT;
  ctx.fillText('AURORA FLIP', VIEW_WIDTH / 2, 196);
  ctx.restore();
  ctx.fillStyle = COLORS.auroraA;
  ctx.font = 'bold 27px ' + FONT;
  ctx.fillText('Flip gravity. Gather the light. Reach the gate.', VIEW_WIDTH / 2, 258);
  ctx.fillStyle = COLORS.text;
  ctx.font = '21px ' + FONT;
  ctx.fillText('SPACE or CLICK flips gravity between the floor and the ceiling.', VIEW_WIDTH / 2, 322);
  ctx.fillText('Catch sun orbs to build your combo, grab star shards for big points.', VIEW_WIDTH / 2, 354);
  ctx.fillText('Dodge crystal spikes. Three lives. Five levels. One aurora.', VIEW_WIDTH / 2, 386);
  if (game.best > 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 22px ' + FONT;
    ctx.fillText('BEST SCORE: ' + formatScore(game.best), VIEW_WIDTH / 2, 436);
  }
  for (const button of game.buttons()) {
    drawButton(ctx, button, pointInRect(button, input.pointer.x, input.pointer.y));
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '17px ' + FONT;
  ctx.fillText('P pause    M sound    R restart', VIEW_WIDTH / 2, 660);
}

function drawPaused(ctx, game, input) {
  dimScreen(ctx, 0.6);
  drawPanel(ctx, 390, 280, 500, 300);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 56px ' + FONT;
  ctx.fillText('PAUSED', VIEW_WIDTH / 2, 338);
  for (const button of game.buttons()) {
    drawButton(ctx, button, pointInRect(button, input.pointer.x, input.pointer.y));
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '18px ' + FONT;
  ctx.fillText('P or ESC to resume', VIEW_WIDTH / 2, 552);
}

function drawLevelComplete(ctx, game, input) {
  dimScreen(ctx, 0.55);
  drawPanel(ctx, 340, 170, 600, 470);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 54px ' + FONT;
  ctx.fillText('LEVEL CLEAR!', VIEW_WIDTH / 2, 238);
  for (let i = 0; i < 3; i += 1) {
    const sx = VIEW_WIDTH / 2 - 80 + i * 80;
    if (i < game.stars) {
      ctx.fillStyle = COLORS.gold;
      drawStarShape(ctx, sx, 304, 34, 15, 5);
      ctx.fill();
    } else {
      ctx.strokeStyle = COLORS.textDim;
      ctx.lineWidth = 2;
      drawStarShape(ctx, sx, 304, 34, 15, 5);
      ctx.stroke();
    }
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Sun orbs: ' + game.orbsTaken + ' / ' + game.level.totalOrbs, VIEW_WIDTH / 2, 368);
  ctx.fillText('Level bonus: +' + formatScore(game.levelBonus), VIEW_WIDTH / 2, 406);
  ctx.font = 'bold 28px ' + FONT;
  ctx.fillText('Total score: ' + formatScore(game.score), VIEW_WIDTH / 2, 452);
  for (const button of game.buttons()) {
    drawButton(ctx, button, pointInRect(button, input.pointer.x, input.pointer.y));
  }
}

function drawGameOver(ctx, game, input) {
  dimScreen(ctx, 0.65);
  drawPanel(ctx, 340, 190, 600, 430);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 50px ' + FONT;
  ctx.fillText('THE LIGHT FADES', VIEW_WIDTH / 2, 268);
  ctx.font = '28px ' + FONT;
  ctx.fillText('Score: ' + formatScore(game.score), VIEW_WIDTH / 2, 338);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Best: ' + formatScore(game.best), VIEW_WIDTH / 2, 380);
  ctx.font = '20px ' + FONT;
  ctx.fillText('Press SPACE or click Try Again to run again.', VIEW_WIDTH / 2, 436);
  for (const button of game.buttons()) {
    drawButton(ctx, button, pointInRect(button, input.pointer.x, input.pointer.y));
  }
}

function drawVictory(ctx, game, input) {
  dimScreen(ctx, 0.55);
  drawPanel(ctx, 340, 170, 600, 470);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 50px ' + FONT;
  ctx.fillText('AURORA RESTORED!', VIEW_WIDTH / 2, 238);
  ctx.font = '24px ' + FONT;
  ctx.fillText('You cleared all five levels.', VIEW_WIDTH / 2, 300);
  ctx.font = 'bold 30px ' + FONT;
  ctx.fillText('Final score: ' + formatScore(game.score), VIEW_WIDTH / 2, 352);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Best: ' + formatScore(game.best), VIEW_WIDTH / 2, 392);
  ctx.font = '20px ' + FONT;
  ctx.fillText('The aurora shines because you carried the light home.', VIEW_WIDTH / 2, 442);
  for (const button of game.buttons()) {
    drawButton(ctx, button, pointInRect(button, input.pointer.x, input.pointer.y));
  }
}

export function drawGame(ctx, game, input) {
  const shakeX = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake : 0;
  const shakeY = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake * 0.6 : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawSky(ctx, game.cameraX, game.animTime);
  drawAurora(ctx, game.cameraX, game.animTime);
  drawRidges(ctx, game.cameraX);
  drawSurfaces(ctx, game.cameraX, game.animTime);
  drawGate(ctx, game.level.gateX - game.cameraX, game.animTime);
  drawCheckpoints(ctx, game.level, game.cameraX, game.animTime);
  drawOrbs(ctx, game.level, game.cameraX, game.animTime);
  drawShards(ctx, game.level, game.cameraX, game.animTime);
  drawSpikes(ctx, game.level, game.cameraX);
  drawBarriers(ctx, game.level, game.cameraX);
  game.particles.draw(ctx);
  drawPlayer(ctx, game);
  ctx.restore();

  drawHud(ctx, game);
  drawMuteButton(ctx, game, input);

  if (game.state === 'title') {
    drawTitle(ctx, game, input);
  } else if (game.state === 'paused') {
    drawPaused(ctx, game, input);
  } else if (game.state === 'levelComplete') {
    drawLevelComplete(ctx, game, input);
  } else if (game.state === 'gameOver') {
    drawGameOver(ctx, game, input);
  } else if (game.state === 'victory') {
    drawVictory(ctx, game, input);
  }

  if (game.flash > 0) {
    ctx.fillStyle = 'rgba(255,60,80,' + (game.flash * 0.3).toFixed(3) + ')';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
}
