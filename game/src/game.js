// Aurora Flip: the game state machine.
// States: title, playing, paused, levelComplete, gameOver, victory.
// This file owns score, lives, combos, checkpoints, level flow and
// every transition between states. Drawing lives in render.js, the HUD
// and menus in ui.js. A short hit stop and trauma based shake sell
// every hit, a flip buffer keeps fast inputs fair, and a level banner
// introduces each new sky.

import {
  CEILING_Y,
  FLIP_BUFFER,
  FLOOR_Y,
  LEVELS,
  LEVEL_CLEAR_BONUS,
  LIFE_BONUS,
  MAX_MULTIPLIER,
  ORB_POINTS,
  PLAYER_X,
  RESPAWN_GRACE,
  SHARD_POINTS,
  START_LIVES,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { buildLevel, hazardHit } from './level.js';
import { Player } from './player.js';
import { Particles } from './particles.js';
import { pointInRect } from './input.js';

const BEST_KEY = 'auroraFlipBest';

function loadBest() {
  try {
    const saved = window.localStorage.getItem(BEST_KEY);
    const value = Number.parseInt(saved || '0', 10);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch (error) {
    return 0;
  }
}

export class Game {
  constructor(input, sounds, seedBase) {
    this.input = input;
    this.sounds = sounds;
    this.seedBase = seedBase || 'aurora';
    this.state = 'title';
    this.stateTime = 0;
    this.time = 0;
    this.animTime = 0;
    this.levelIndex = 0;
    this.level = buildLevel(0, this.seedBase);
    this.player = new Player();
    this.particles = new Particles();
    this.score = 0;
    this.best = loadBest();
    this.isNewBest = false;
    this.lives = START_LIVES;
    this.combo = 0;
    this.cameraX = 0;
    this.respawnCamera = 0;
    this.trauma = 0;
    this.shake = 0;
    this.flash = 0;
    this.stars = 0;
    this.levelBonus = 0;
    this.orbsTaken = 0;
    this.shardsTaken = 0;
    this.bannerTime = 0;
    this.hitStop = 0;
    this.flipBuffer = 0;
    this.comboPop = 0;
    this.lifePop = 0;
    this.moteTimer = 0;
    this.confettiTimer = 0;
    this.shotMode = false;
  }

  get multiplier() {
    return Math.min(MAX_MULTIPLIER, 1 + Math.floor(this.combo / 10));
  }

  get progress() {
    if (this.state === 'levelComplete' || this.state === 'victory') {
      return 1;
    }
    return Math.max(0, Math.min(1, (this.cameraX + PLAYER_X) / this.level.gateX));
  }

  get levelLabel() {
    return 'LEVEL ' + (this.levelIndex + 1) + ' OF ' + LEVELS.length;
  }

  setState(next) {
    this.state = next;
    this.stateTime = 0;
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      this.isNewBest = true;
    }
    try {
      window.localStorage.setItem(BEST_KEY, String(this.best));
    } catch (error) {
      // Best score is a nicety. The run continues without it.
    }
  }

  toTitle() {
    this.setState('title');
    this.levelIndex = 0;
    this.level = buildLevel(0, this.seedBase);
    this.player.reset();
    this.particles = new Particles();
    this.score = 0;
    this.lives = START_LIVES;
    this.combo = 0;
    this.cameraX = 0;
    this.respawnCamera = 0;
    this.trauma = 0;
    this.shake = 0;
    this.flash = 0;
    this.isNewBest = false;
  }

  startRun() {
    this.score = 0;
    this.lives = START_LIVES;
    this.combo = 0;
    this.isNewBest = false;
    this.startLevel(0);
    this.setState('playing');
    this.sounds.start();
  }

  startLevel(index) {
    this.levelIndex = index;
    this.level = buildLevel(index, this.seedBase);
    this.player.reset();
    this.particles = new Particles();
    this.cameraX = 0;
    this.respawnCamera = 0;
    this.orbsTaken = 0;
    this.shardsTaken = 0;
    this.combo = 0;
    this.trauma = 0;
    this.shake = 0;
    this.flash = 0;
    this.hitStop = 0;
    this.flipBuffer = 0;
    this.bannerTime = 2;
    this.moteTimer = 0;
  }

  muteButton() {
    return { x: VIEW_WIDTH - 172, y: VIEW_HEIGHT - 54, w: 158, h: 38 };
  }

  buttons() {
    if (this.state === 'title') {
      return [{ id: 'start', label: 'START GAME', x: 490, y: 516, w: 300, h: 64 }];
    }
    if (this.state === 'paused') {
      return [
        { id: 'resume', label: 'RESUME', x: 490, y: 386, w: 300, h: 62 },
        { id: 'restart', label: 'RESTART RUN', x: 490, y: 462, w: 300, h: 56 },
      ];
    }
    if (this.state === 'levelComplete') {
      const last = this.levelIndex + 1 >= LEVELS.length;
      return [{ id: 'next', label: last ? 'SEE RESULTS' : 'NEXT LEVEL', x: 490, y: 534, w: 300, h: 64 }];
    }
    if (this.state === 'gameOver') {
      return [{ id: 'retry', label: 'TRY AGAIN', x: 490, y: 516, w: 300, h: 64 }];
    }
    if (this.state === 'victory') {
      return [{ id: 'again', label: 'PLAY AGAIN', x: 490, y: 534, w: 300, h: 64 }];
    }
    return [];
  }

  clickedButton() {
    if (!this.input.pointer.clicked) {
      return null;
    }
    const { clickX, clickY } = this.input.pointer;
    for (const button of this.buttons()) {
      if (pointInRect(button, clickX, clickY)) {
        return button.id;
      }
    }
    return null;
  }

  handleMuteClick() {
    if (this.input.pointer.clicked && pointInRect(this.muteButton(), this.input.pointer.clickX, this.input.pointer.clickY)) {
      this.sounds.toggleMute();
      this.sounds.click();
      return true;
    }
    return false;
  }

  update(dt) {
    this.time += dt;
    this.animTime += dt;
    this.stateTime += dt;
    if (this.shotMode) {
      // Staged for a screenshot: the scene holds still while the sky
      // keeps shimmering, so the capture matches the staged state.
      return;
    }
    if (this.input.wasPressed('KeyM')) {
      this.sounds.toggleMute();
    }
    const muteClicked = this.handleMuteClick();
    if (this.input.wasPressed('KeyR') && this.state !== 'title') {
      this.startRun();
      return;
    }

    if (this.state === 'title') {
      this.cameraX += 55 * dt;
      if (this.cameraX > this.level.length - VIEW_WIDTH - 100) {
        this.cameraX = 0;
      }
      this.spawnMotes(dt);
      this.particles.update(dt);
      if (!muteClicked && (this.input.wasAnyPressed(['Space', 'Enter']) || this.clickedButton() === 'start')) {
        this.startRun();
      }
      return;
    }

    if (this.state === 'playing') {
      if (this.input.wasAnyPressed(['KeyP', 'Escape'])) {
        this.setState('paused');
        this.sounds.click();
        return;
      }
      // A hit stop freezes the world for a beat, so hits land hard.
      if (this.hitStop > 0) {
        this.hitStop -= dt;
        this.particles.update(dt * 0.25);
        return;
      }
      if (!muteClicked && (this.input.wasAnyPressed(['Space', 'ArrowUp', 'KeyW']) || this.input.pointer.clicked)) {
        if (!this.doFlip()) {
          this.flipBuffer = FLIP_BUFFER;
        }
      }
      if (this.flipBuffer > 0) {
        this.flipBuffer -= dt;
        if (this.player.flipCooldown <= 0 && this.doFlip()) {
          this.flipBuffer = 0;
        }
      }
      this.cameraX += this.level.speed * dt;
      const landed = this.player.update(dt);
      if (landed === 'landed') {
        const groundY = this.player.dir === 1 ? FLOOR_Y : CEILING_Y;
        this.particles.dust(this.player.x, groundY, '#4be3c3', this.player.impactVy);
        this.particles.ring(this.player.x, groundY, '#4be3c3', 46);
        this.sounds.land(this.player.impactVy);
        if (this.player.impactVy > 900) {
          this.trauma = Math.min(1, this.trauma + 0.18);
        }
      }
      this.player.trailTimer -= dt;
      if (this.player.trailTimer <= 0) {
        this.player.trailTimer = 0.03;
        this.particles.trail(this.player.x - 18, this.player.y, '#53e9ff');
      }
      this.spawnMotes(dt);
      this.checkPickups();
      this.checkCheckpoints();
      if (!this.player.isInvulnerable(this.time) && hazardHit(this.level, this.player.box(), this.time, this.cameraX)) {
        this.onHit();
      }
      if (this.cameraX + PLAYER_X >= this.level.gateX) {
        this.cameraX = this.level.gateX - PLAYER_X + 30;
        this.completeLevel();
      }
      this.bannerTime = Math.max(0, this.bannerTime - dt);
      this.trauma = Math.max(0, this.trauma - dt * 1.7);
      this.shake = this.trauma * 16;
      this.flash = Math.max(0, this.flash - dt * 1.6);
      this.comboPop = Math.max(0, this.comboPop - dt * 3);
      this.lifePop = Math.max(0, this.lifePop - dt * 3);
      this.particles.update(dt);
      return;
    }

    if (this.state === 'paused') {
      if (this.input.wasAnyPressed(['KeyP', 'Escape'])) {
        this.setState('playing');
        this.sounds.click();
        return;
      }
      const clicked = this.clickedButton();
      if (clicked === 'resume') {
        this.setState('playing');
        this.sounds.click();
      } else if (clicked === 'restart') {
        this.startRun();
      }
      return;
    }

    if (this.state === 'levelComplete') {
      this.rainConfetti(dt);
      this.particles.update(dt);
      if (this.input.wasAnyPressed(['Space', 'Enter']) || this.clickedButton() === 'next') {
        this.nextLevel();
      }
      return;
    }

    if (this.state === 'gameOver' || this.state === 'victory') {
      if (this.state === 'victory') {
        this.rainConfetti(dt);
      }
      this.particles.update(dt);
      const clicked = this.clickedButton();
      if (this.input.wasAnyPressed(['Space', 'Enter']) || clicked === 'retry' || clicked === 'again') {
        this.startRun();
      }
    }
  }

  spawnMotes(dt) {
    this.moteTimer -= dt;
    if (this.moteTimer <= 0) {
      this.moteTimer = 0.55;
      this.particles.mote();
    }
  }

  rainConfetti(dt) {
    this.confettiTimer -= dt;
    if (this.confettiTimer <= 0) {
      this.confettiTimer = 0.22;
      this.particles.confetti(120 + Math.random() * (VIEW_WIDTH - 240), -10, 3);
    }
  }

  doFlip() {
    if (this.player.flip()) {
      this.sounds.flip();
      this.particles.burst(this.player.x, this.player.y, '#b678ff', 8, 160);
      this.particles.ring(this.player.x, this.player.y, '#b678ff', 56);
      return true;
    }
    return false;
  }

  checkPickups() {
    const px = this.player.x;
    const py = this.player.y;
    for (const orb of this.level.orbs) {
      if (orb.taken) {
        continue;
      }
      const dx = orb.x - this.cameraX - px;
      const dy = orb.y - py;
      if (dx * dx + dy * dy < 38 * 38) {
        orb.taken = true;
        this.orbsTaken += 1;
        this.combo += 1;
        const points = ORB_POINTS * this.multiplier;
        this.score += points;
        this.particles.popup('+' + points, orb.x - this.cameraX, orb.y - 24, '#ffd94d');
        this.particles.burst(orb.x - this.cameraX, orb.y, '#ffd94d', 10, 170);
        this.particles.sparkle(orb.x - this.cameraX, orb.y, '#fff7cc', 4);
        this.sounds.collect(this.combo);
        if (this.combo > 0 && this.combo % 10 === 0) {
          this.comboPop = 1;
          this.particles.popup('COMBO x' + this.multiplier + '!', px + 70, py - 64, '#ffd94d');
          this.particles.ring(px, py, '#ffd94d', 80);
          this.sounds.milestone();
        }
      }
    }
    for (const shard of this.level.shards) {
      if (shard.taken) {
        continue;
      }
      const dx = shard.x - this.cameraX - px;
      const dy = shard.y - py;
      if (dx * dx + dy * dy < 44 * 44) {
        shard.taken = true;
        this.shardsTaken += 1;
        const points = SHARD_POINTS * this.multiplier;
        this.score += points;
        this.particles.popup('+' + points + ' SHARD', shard.x - this.cameraX, shard.y - 26, '#ffe066');
        this.particles.burst(shard.x - this.cameraX, shard.y, '#ffe066', 16, 220);
        this.particles.sparkle(shard.x - this.cameraX, shard.y, '#ffe066', 6);
        this.particles.ring(shard.x - this.cameraX, shard.y, '#ffe066', 74);
        this.sounds.shard();
      }
    }
  }

  checkCheckpoints() {
    const headX = this.cameraX + PLAYER_X;
    for (const checkpoint of this.level.checkpoints) {
      if (!checkpoint.reached && headX > checkpoint.x) {
        checkpoint.reached = true;
        this.respawnCamera = Math.max(0, checkpoint.x - 340);
        this.particles.popup('CHECKPOINT', checkpoint.x - this.cameraX, 300, '#2ee6a8');
        this.particles.ring(checkpoint.x - this.cameraX, FLOOR_Y - 60, '#2ee6a8', 70);
        this.sounds.checkpoint();
      }
    }
  }

  onHit() {
    this.lives -= 1;
    this.combo = 0;
    this.flash = 0.55;
    this.trauma = 1;
    this.shake = 16;
    this.lifePop = 1;
    this.sounds.hit();
    this.particles.burst(this.player.x, this.player.y, '#ff5d7a', 20, 260);
    this.particles.ring(this.player.x, this.player.y, '#ff5d7a', 90);
    if (this.lives <= 0) {
      this.hitStop = 0.22;
      this.setState('gameOver');
      this.saveBest();
      this.sounds.lose();
      return;
    }
    this.hitStop = 0.09;
    this.particles.popup('HIT', this.player.x, this.player.y - 50, '#ff5d7a');
    this.cameraX = this.respawnCamera;
    this.player.reset();
    this.player.invulnerableUntil = this.time + RESPAWN_GRACE;
  }

  completeLevel() {
    const fraction = this.orbsTaken / Math.max(1, this.level.totalOrbs);
    this.stars = fraction >= 0.9 ? 3 : fraction >= 0.6 ? 2 : 1;
    this.levelBonus = LEVEL_CLEAR_BONUS + LIFE_BONUS * this.lives;
    this.score += this.levelBonus;
    this.saveBest();
    this.setState('levelComplete');
    this.sounds.win();
    const gateScreenX = this.level.gateX - this.cameraX;
    this.particles.burst(gateScreenX, 360, '#2ee6a8', 30, 300);
    this.particles.burst(gateScreenX, 360, '#ffd94d', 20, 240);
    this.particles.ring(gateScreenX, 360, '#2ee6a8', 130);
    this.particles.confetti(gateScreenX, 300, 40);
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.setState('victory');
      this.saveBest();
      this.sounds.victory();
      this.particles.confetti(VIEW_WIDTH / 2, 260, 60);
      return;
    }
    this.startLevel(this.levelIndex + 1);
    this.setState('playing');
    this.sounds.start();
  }

  statusText() {
    if (this.state === 'title') {
      return 'Aurora Flip title screen. Press Space or click Start Game.';
    }
    if (this.state === 'playing') {
      return this.level.def.name + ', ' + this.levelLabel + '. Score ' + this.score + '. ' + this.lives + ' lives left.';
    }
    if (this.state === 'paused') {
      return 'Paused. Press P to resume.';
    }
    if (this.state === 'levelComplete') {
      return 'Level clear. ' + this.stars + ' stars. Score ' + this.score + '.';
    }
    if (this.state === 'gameOver') {
      return 'Game over. Score ' + this.score + '. Best ' + this.best + '.';
    }
    return 'You restored the aurora. Final score ' + this.score + '.';
  }
}
