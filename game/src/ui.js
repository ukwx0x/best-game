// Aurora Flip: the HUD and every menu screen.
// The score, combo, progress, hearts and level banner are drawn here,
// plus the title, pause, level clear, game over and victory screens.
// Panels slide and fade in with easing, stars pop one by one, and the
// title hides the HUD so the logo owns the screen.

import {
  COLORS,
  FONT,
  LEVELS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  formatScore,
} from './config.js';
import { clamp, drawHeartShape, drawStarShape, easeOutBack, easeOutCubic, roundRectPath } from './shapes.js';
import { pointInRect } from './input.js';

function drawButton(ctx, button, hover) {
  ctx.save();
  if (hover) {
    ctx.shadowColor = COLORS.panelEdge;
    ctx.shadowBlur = 16;
  }
  const grad = ctx.createLinearGradient(0, button.y, 0, button.y + button.h);
  grad.addColorStop(0, hover ? '#2fb8a4' : '#259184');
  grad.addColorStop(1, hover ? COLORS.buttonHover : COLORS.button);
  ctx.fillStyle = grad;
  roundRectPath(ctx, button.x, button.y, button.w, button.h, 14);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(242,247,255,0.75)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, button.x, button.y, button.w, button.h, 14);
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
}

function drawButtons(ctx, game, input) {
  for (const button of game.buttons()) {
    drawButton(ctx, button, pointInRect(button, input.pointer.x, input.pointer.y));
  }
}

export function drawMuteButton(ctx, game, input) {
  const rect = game.muteButton();
  const hover = pointInRect(rect, input.pointer.x, input.pointer.y);
  ctx.fillStyle = hover ? 'rgba(38,160,141,0.92)' : 'rgba(16,26,56,0.88)';
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  // A small speaker icon, crossed out when muted.
  const ix = rect.x + 22;
  const iy = rect.y + rect.h / 2;
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.moveTo(ix - 6, iy - 4);
  ctx.lineTo(ix - 1, iy - 4);
  ctx.lineTo(ix + 4, iy - 9);
  ctx.lineTo(ix + 4, iy + 9);
  ctx.lineTo(ix - 1, iy + 4);
  ctx.lineTo(ix - 6, iy + 4);
  ctx.closePath();
  ctx.fill();
  if (game.sounds.muted) {
    ctx.strokeStyle = '#ff8fab';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ix + 8, iy - 7);
    ctx.lineTo(ix + 16, iy + 7);
    ctx.moveTo(ix + 16, iy - 7);
    ctx.lineTo(ix + 8, iy + 7);
    ctx.stroke();
  } else {
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ix + 5, iy, 7, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ix + 5, iy, 11, -0.9, 0.9);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.sounds.muted ? 'SOUND OFF' : 'SOUND ON', rect.x + 46, rect.y + rect.h / 2 + 1);
}

function drawHud(ctx, game) {
  ctx.textBaseline = 'middle';
  // Score pill, top left, with a small sun icon.
  ctx.fillStyle = 'rgba(10,18,40,0.72)';
  roundRectPath(ctx, 20, 14, 268, 52, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(174,189,216,0.35)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, 20, 14, 268, 52, 12);
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(48, 40, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.orbCore;
  ctx.beginPath();
  ctx.arc(48, 40, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 30px ' + FONT;
  ctx.fillText(formatScore(game.score), 70, 41);
  if (game.multiplier > 1) {
    const pop = 1 + 0.18 * game.comboPop;
    ctx.save();
    ctx.translate(87, 84);
    ctx.scale(pop, pop);
    ctx.fillStyle = COLORS.gold;
    roundRectPath(ctx, -59, -15, 118, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#1a1200';
    ctx.font = 'bold 18px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('COMBO x' + game.multiplier, 0, 1);
    ctx.restore();
  }
  // Level name and progress, top center, with checkpoint ticks.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 19px ' + FONT;
  ctx.fillText((game.levelIndex + 1) + '. ' + game.level.def.name.toUpperCase(), VIEW_WIDTH / 2, 26);
  const barX = VIEW_WIDTH / 2 - 180;
  const barY = 42;
  ctx.fillStyle = 'rgba(10,18,40,0.72)';
  roundRectPath(ctx, barX - 8, barY - 8, 376, 30, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(52,72,120,0.95)';
  roundRectPath(ctx, barX, barY, 360, 14, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(174,189,216,0.55)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, barX, barY, 360, 14, 7);
  ctx.stroke();
  const fillW = Math.max(8, 360 * game.progress);
  const theme = game.level.def;
  const barGrad = ctx.createLinearGradient(barX, 0, barX + 360, 0);
  barGrad.addColorStop(0, theme.auroraB);
  barGrad.addColorStop(1, theme.auroraA);
  ctx.fillStyle = barGrad;
  roundRectPath(ctx, barX, barY, fillW, 14, 7);
  ctx.fill();
  for (const checkpoint of game.level.checkpoints) {
    const tickX = barX + 360 * (checkpoint.x / game.level.gateX);
    ctx.fillStyle = checkpoint.reached ? theme.auroraA : 'rgba(242,247,255,0.6)';
    ctx.fillRect(tickX - 1.5, barY - 2, 3, 18);
  }
  ctx.fillStyle = theme.auroraA;
  drawStarShape(ctx, barX + 360 + 16, barY + 7, 10, 4, 4);
  ctx.fill();
  // Lives, top right, with a pop when one is lost.
  const lifePop = 1 + 0.3 * game.lifePop;
  for (let i = 0; i < 3; i += 1) {
    const hx = VIEW_WIDTH - 56 - i * 44;
    const scale = i === game.lives ? lifePop : 1;
    ctx.save();
    ctx.translate(hx, 34);
    ctx.scale(scale, scale);
    ctx.fillStyle = i < game.lives ? COLORS.heart : COLORS.heartEmpty;
    drawHeartShape(ctx, 0, 0, 34);
    ctx.fill();
    ctx.restore();
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 18px ' + FONT;
  ctx.fillText('BEST ' + formatScore(game.best), VIEW_WIDTH - 28, 70);
}

function drawBanner(ctx, game) {
  const t = game.bannerTime;
  if (t <= 0 || game.state !== 'playing') {
    return;
  }
  const alpha = t > 1.6 ? (2 - t) / 0.4 : Math.min(1, t / 0.5);
  const rise = easeOutCubic(clamp((2 - t) / 0.4, 0, 1)) * 18;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(4,8,24,0.45)';
  roundRectPath(ctx, VIEW_WIDTH / 2 - 330, 240 - rise, 660, 130, 18);
  ctx.fill();
  ctx.fillStyle = game.level.def.auroraA;
  ctx.font = 'bold 20px ' + FONT;
  ctx.fillText('LEVEL ' + (game.levelIndex + 1) + ' OF ' + LEVELS.length, VIEW_WIDTH / 2, 272 - rise);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 54px ' + FONT;
  ctx.fillText(game.level.def.name.toUpperCase(), VIEW_WIDTH / 2, 316 - rise);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '20px ' + FONT;
  ctx.fillText(game.level.def.sub, VIEW_WIDTH / 2, 350 - rise);
  ctx.restore();
}

function dimScreen(ctx, alpha) {
  ctx.fillStyle = 'rgba(4,8,24,' + alpha + ')';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function panelEntrance(game) {
  return {
    alpha: clamp(game.stateTime / 0.25, 0, 1),
    lift: (1 - easeOutCubic(game.stateTime / 0.35)) * 42,
  };
}

function drawPanel(ctx, x, y, w, h, accent) {
  ctx.fillStyle = 'rgba(13,21,48,0.97)';
  roundRectPath(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.strokeStyle = accent || COLORS.panelEdge;
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 20);
  ctx.stroke();
  const top = ctx.createLinearGradient(0, y, 0, y + 90);
  top.addColorStop(0, 'rgba(255,255,255,0.07)');
  top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top;
  roundRectPath(ctx, x, y, w, h, 20);
  ctx.fill();
}

function drawTitle(ctx, game, input) {
  const rise = (1 - easeOutCubic(game.stateTime / 0.6)) * 30;
  const alpha = clamp(game.stateTime / 0.4, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  // A soft veil behind the text, so the sky never fights the words.
  const veil = ctx.createLinearGradient(0, 90, 0, 480);
  veil.addColorStop(0, 'rgba(4,8,24,0)');
  veil.addColorStop(0.35, 'rgba(4,8,24,0.5)');
  veil.addColorStop(0.65, 'rgba(4,8,24,0.5)');
  veil.addColorStop(1, 'rgba(4,8,24,0)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 90, VIEW_WIDTH, 390);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = game.level.def.auroraB;
  ctx.shadowBlur = 34;
  const logo = ctx.createLinearGradient(0, 120, 0, 210);
  logo.addColorStop(0, '#ffffff');
  logo.addColorStop(1, '#9fe8ff');
  ctx.fillStyle = logo;
  ctx.font = 'bold 92px ' + FONT;
  ctx.fillText('AURORA FLIP', VIEW_WIDTH / 2, 172 - rise);
  ctx.restore();
  ctx.fillStyle = game.level.def.auroraA;
  ctx.font = 'bold 27px ' + FONT;
  ctx.fillText('Flip gravity. Gather the light. Reach the gate.', VIEW_WIDTH / 2, 232 - rise);
  // How to play, three rows with icons.
  drawPanel(ctx, 340, 262 - rise, 600, 168, 'rgba(75,227,195,0.6)');
  const rows = [
    { icon: 'flip', text: 'SPACE or CLICK flips gravity, floor to ceiling' },
    { icon: 'orb', text: 'Sun orbs build your combo, shards pay big' },
    { icon: 'spike', text: 'Dodge spikes, mines and phasing walls' },
  ];
  ctx.textAlign = 'left';
  for (let i = 0; i < rows.length; i += 1) {
    const ry = 302 - rise + i * 52;
    const ix = 392;
    if (rows[i].icon === 'flip') {
      ctx.strokeStyle = COLORS.auroraB;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ix - 8, ry - 10);
      ctx.lineTo(ix + 8, ry - 10);
      ctx.lineTo(ix + 2, ry - 16);
      ctx.moveTo(ix + 8, ry - 10);
      ctx.lineTo(ix + 2, ry - 4);
      ctx.moveTo(ix + 8, ry + 10);
      ctx.lineTo(ix - 8, ry + 10);
      ctx.lineTo(ix - 2, ry + 16);
      ctx.moveTo(ix - 8, ry + 10);
      ctx.lineTo(ix - 2, ry + 4);
      ctx.stroke();
    } else if (rows[i].icon === 'orb') {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(ix, ry, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.orbCore;
      ctx.beginPath();
      ctx.arc(ix, ry, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.spike;
      ctx.beginPath();
      ctx.moveTo(ix - 12, ry + 12);
      ctx.lineTo(ix, ry - 14);
      ctx.lineTo(ix + 12, ry + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.text;
    ctx.font = '21px ' + FONT;
    ctx.fillText(rows[i].text, 428, ry + 1);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '17px ' + FONT;
  ctx.fillText('Five skies: First Light, Twilight Reef, Ember Dusk, Frost Veil, Aurora Crown', VIEW_WIDTH / 2, 462 - rise);
  if (game.best > 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 22px ' + FONT;
    ctx.fillText('BEST SCORE: ' + formatScore(game.best), VIEW_WIDTH / 2, 494 - rise);
  }
  ctx.restore();
  drawButtons(ctx, game, input);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '17px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P pause    M sound    R restart', VIEW_WIDTH / 2, 648);
}

function drawPaused(ctx, game, input) {
  dimScreen(ctx, 0.6);
  const enter = panelEntrance(game);
  ctx.save();
  ctx.globalAlpha = enter.alpha;
  drawPanel(ctx, 390, 246 + enter.lift, 500, 336);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 56px ' + FONT;
  ctx.fillText('PAUSED', VIEW_WIDTH / 2, 308 + enter.lift);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '22px ' + FONT;
  ctx.fillText('Score ' + formatScore(game.score) + '   Orbs ' + game.orbsTaken + ' / ' + game.level.totalOrbs, VIEW_WIDTH / 2, 356 + enter.lift);
  ctx.restore();
  drawButtons(ctx, game, input);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '18px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P or ESC to resume', VIEW_WIDTH / 2, 556);
}

function drawLevelComplete(ctx, game, input) {
  dimScreen(ctx, 0.55);
  const enter = panelEntrance(game);
  ctx.save();
  ctx.globalAlpha = enter.alpha;
  drawPanel(ctx, 340, 150 + enter.lift, 600, 490, game.level.def.auroraA);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 54px ' + FONT;
  ctx.fillText('LEVEL CLEAR!', VIEW_WIDTH / 2, 222 + enter.lift);
  for (let i = 0; i < 3; i += 1) {
    const sx = VIEW_WIDTH / 2 - 80 + i * 80;
    const pop = easeOutBack((game.stateTime - 0.25 - i * 0.16) / 0.35);
    ctx.save();
    ctx.translate(sx, 296 + enter.lift);
    ctx.scale(Math.max(0.01, pop), Math.max(0.01, pop));
    if (i < game.stars) {
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 18;
      ctx.fillStyle = COLORS.gold;
      drawStarShape(ctx, 0, 0, 34, 15, 5);
      ctx.fill();
    } else {
      ctx.strokeStyle = COLORS.textDim;
      ctx.lineWidth = 2;
      drawStarShape(ctx, 0, 0, 34, 15, 5);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Sun orbs: ' + game.orbsTaken + ' / ' + game.level.totalOrbs + '    Shards: ' + game.shardsTaken, VIEW_WIDTH / 2, 366 + enter.lift);
  ctx.fillText('Level bonus: +' + formatScore(game.levelBonus), VIEW_WIDTH / 2, 404 + enter.lift);
  ctx.font = 'bold 28px ' + FONT;
  ctx.fillText('Total score: ' + formatScore(game.score), VIEW_WIDTH / 2, 450 + enter.lift);
  const last = game.levelIndex + 1 >= LEVELS.length;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '20px ' + FONT;
  ctx.fillText(last ? 'The aurora waits. See your results.' : 'Next: ' + LEVELS[game.levelIndex + 1].name, VIEW_WIDTH / 2, 488 + enter.lift);
  ctx.restore();
  drawButtons(ctx, game, input);
}

function drawGameOver(ctx, game, input) {
  dimScreen(ctx, 0.65);
  const enter = panelEntrance(game);
  ctx.save();
  ctx.globalAlpha = enter.alpha;
  drawPanel(ctx, 340, 180 + enter.lift, 600, 440, '#ff5d7a');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 50px ' + FONT;
  ctx.fillText('THE LIGHT FADES', VIEW_WIDTH / 2, 258 + enter.lift);
  if (game.isNewBest) {
    ctx.fillStyle = COLORS.gold;
    roundRectPath(ctx, VIEW_WIDTH / 2 - 88, 286 + enter.lift, 176, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#1a1200';
    ctx.font = 'bold 19px ' + FONT;
    ctx.fillText('NEW BEST!', VIEW_WIDTH / 2, 303 + enter.lift);
  }
  ctx.font = '28px ' + FONT;
  ctx.fillStyle = COLORS.text;
  ctx.fillText('Score: ' + formatScore(game.score), VIEW_WIDTH / 2, 352 + enter.lift);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Best: ' + formatScore(game.best), VIEW_WIDTH / 2, 392 + enter.lift);
  ctx.font = '20px ' + FONT;
  ctx.fillText('Reached ' + game.level.def.name + ', level ' + (game.levelIndex + 1) + ' of ' + LEVELS.length + '.', VIEW_WIDTH / 2, 436 + enter.lift);
  ctx.fillText('Press SPACE or click Try Again to run again.', VIEW_WIDTH / 2, 468 + enter.lift);
  ctx.restore();
  drawButtons(ctx, game, input);
}

function drawVictory(ctx, game, input) {
  dimScreen(ctx, 0.55);
  const enter = panelEntrance(game);
  ctx.save();
  ctx.globalAlpha = enter.alpha;
  drawPanel(ctx, 340, 150 + enter.lift, 600, 500, COLORS.gold);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const shine = ctx.createLinearGradient(0, 190, 0, 250);
  shine.addColorStop(0, '#ffffff');
  shine.addColorStop(1, COLORS.gold);
  ctx.fillStyle = shine;
  ctx.font = 'bold 50px ' + FONT;
  ctx.fillText('AURORA RESTORED!', VIEW_WIDTH / 2, 224 + enter.lift);
  ctx.fillStyle = COLORS.text;
  ctx.font = '24px ' + FONT;
  ctx.fillText('You cleared all five levels.', VIEW_WIDTH / 2, 284 + enter.lift);
  ctx.font = 'bold 32px ' + FONT;
  ctx.fillText('Final score: ' + formatScore(game.score), VIEW_WIDTH / 2, 336 + enter.lift);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Best: ' + formatScore(game.best), VIEW_WIDTH / 2, 378 + enter.lift);
  ctx.font = '20px ' + FONT;
  ctx.fillText('The aurora shines because you carried the light home.', VIEW_WIDTH / 2, 424 + enter.lift);
  if (game.isNewBest) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 21px ' + FONT;
    ctx.fillText('A new best score, under a brighter sky.', VIEW_WIDTH / 2, 458 + enter.lift);
  }
  ctx.restore();
  drawButtons(ctx, game, input);
}

export function drawScreens(ctx, game, input) {
  if (game.state !== 'title') {
    drawHud(ctx, game);
  }
  drawBanner(ctx, game);
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
  drawMuteButton(ctx, game, input);
}
