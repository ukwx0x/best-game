// Aurora Flip: staged states for screenshots.
// The game reads ?shot=start, play, complete or over plus ?seed=, and
// sets itself to that exact state with a fixed seed. The renderer then
// draws the staged state with the same code that draws live play, so a
// screenshot is a real render of the game, frozen for the camera.
// Without a shot parameter the game plays normally.

import { CEILING_Y, FLOOR_Y, PLAYER_X, VIEW_WIDTH } from './config.js';

function findPlayCamera(level) {
  // Try several framings per mine and keep the one whose runner window
  // is clearest, so the shot shows the hazard ahead, not a collision.
  let bestCam = 0;
  let bestClearance = -1;
  for (const mine of level.mines) {
    for (const offset of [800, 650, 950, 550]) {
      const cam = mine.x - offset;
      if (cam < 0) {
        continue;
      }
      const px = cam + PLAYER_X;
      let clearance = 400;
      for (const wall of [...level.barriers, ...level.phasers]) {
        const gap = wall.x + wall.w < px ? px - (wall.x + wall.w) : wall.x - px;
        clearance = Math.min(clearance, Math.abs(gap));
        if (wall.x < px + 60 && wall.x + wall.w > px - 60) {
          clearance = -100;
        }
      }
      for (const spike of level.spikes) {
        if (spike.x < px + 60 && spike.x + spike.w > px - 60) {
          clearance = -100;
        }
      }
      for (const other of level.mines) {
        clearance = Math.min(clearance, Math.abs(other.x - px));
      }
      if (clearance > bestClearance) {
        bestClearance = clearance;
        bestCam = cam;
      }
    }
  }
  if (bestClearance >= 0) {
    return bestCam;
  }
  const fallback = level.mines[0] || level.orbs[0];
  return Math.max(0, (fallback ? fallback.x : 900) - 700);
}

export function applyShot(game, search) {
  const params = new URLSearchParams(search || '');
  const shot = params.get('shot');
  if (!shot) {
    return null;
  }
  const seed = params.get('seed') || '7';
  game.seedBase = 'shot' + seed;
  game.shotMode = true;

  if (shot === 'start') {
    game.toTitle();
    game.cameraX = 120;
    game.animTime = 3.4;
    game.time = 3.4;
    game.stateTime = 1.5;
    return shot;
  }

  if (shot === 'play') {
    game.startRun();
    game.startLevel(2);
    game.state = 'playing';
    game.stateTime = 1.5;
    game.bannerTime = 0;
    game.score = 1240;
    game.best = Math.max(game.best, 2450);
    game.combo = 14;
    game.lives = 3;
    // Frame a mine with the runner in clear space: search the mines
    // for a camera where no wall, spike or mine sits on the runner,
    // so the shot shows the hazard ahead, not a collision.
    game.cameraX = findPlayCamera(game.level);
    game.player.dir = -1;
    game.player.targetAngle = Math.PI;
    game.player.angle = 2.2;
    game.player.y = (FLOOR_Y + CEILING_Y) / 2 - 40;
    game.player.vy = -300;
    game.player.onSurface = false;
    game.player.stretch = 0.6;
    game.animTime = 12.5;
    game.time = 12.5;
    game.particles.burst(game.player.x - 30, game.player.y + 10, '#53e9ff', 10, 120);
    game.particles.ring(game.player.x, game.player.y, '#b678ff', 56);
    game.particles.popup('+10', game.player.x + 60, game.player.y - 60, '#ffd94d');
    return shot;
  }

  if (shot === 'complete') {
    game.startRun();
    game.startLevel(1);
    game.state = 'levelComplete';
    game.stateTime = 1.2;
    game.score = 2450;
    game.best = Math.max(game.best, 2450);
    game.stars = 3;
    game.levelBonus = 450;
    game.lives = 2;
    game.level.orbs.forEach((orb) => {
      orb.taken = true;
    });
    game.orbsTaken = game.level.totalOrbs;
    game.shardsTaken = 2;
    game.cameraX = Math.max(0, game.level.gateX - 1120);
    game.animTime = 6;
    game.time = 6;
    game.particles.celebration();
    return shot;
  }

  if (shot === 'over') {
    game.startRun();
    game.startLevel(0);
    game.state = 'gameOver';
    game.stateTime = 1.2;
    game.score = 1870;
    game.best = Math.max(game.best, 5200);
    game.lives = 0;
    game.cameraX = 900;
    game.animTime = 8;
    game.time = 8;
    return shot;
  }

  game.shotMode = false;
  return null;
}
