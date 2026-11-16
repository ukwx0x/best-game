// Aurora Flip: staged states for screenshots.
// The game reads ?shot=start, play, complete or over plus ?seed=, and
// sets itself to that exact state with a fixed seed. The renderer then
// draws the staged state with the same code that draws live play, so a
// screenshot is a real render of the game, frozen for the camera.
// Without a shot parameter the game plays normally.

import { CEILING_Y, FLOOR_Y, VIEW_WIDTH } from './config.js';

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
    game.cameraX = 420;
    game.animTime = 3.4;
    game.time = 3.4;
    return shot;
  }

  if (shot === 'play') {
    game.startRun();
    game.startLevel(1);
    game.state = 'playing';
    game.score = 1240;
    game.best = Math.max(game.best, 2450);
    game.combo = 14;
    game.lives = 3;
    // Frame the first orb arc ahead of the runner.
    const target = game.level.orbs.find((orb) => orb.x > 900) || game.level.orbs[0];
    game.cameraX = Math.max(0, target.x - 640);
    game.player.dir = -1;
    game.player.targetAngle = Math.PI;
    game.player.angle = 2.2;
    game.player.y = (FLOOR_Y + CEILING_Y) / 2 - 40;
    game.player.vy = -300;
    game.player.onSurface = false;
    game.animTime = 12.5;
    game.time = 12.5;
    game.particles.burst(game.player.x - 30, game.player.y + 10, '#53e9ff', 10, 120);
    game.particles.popup('+10', game.player.x + 60, game.player.y - 60, '#ffd94d');
    return shot;
  }

  if (shot === 'complete') {
    game.startRun();
    game.startLevel(1);
    game.state = 'levelComplete';
    game.score = 2450;
    game.best = Math.max(game.best, 2450);
    game.stars = 3;
    game.levelBonus = 450;
    game.lives = 2;
    game.level.orbs.forEach((orb) => {
      orb.taken = true;
    });
    game.orbsTaken = game.level.totalOrbs;
    game.cameraX = Math.max(0, game.level.gateX - VIEW_WIDTH + 220);
    game.animTime = 6;
    game.time = 6;
    return shot;
  }

  if (shot === 'over') {
    game.startRun();
    game.startLevel(0);
    game.state = 'gameOver';
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
