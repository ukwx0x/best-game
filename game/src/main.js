// Aurora Flip: boot and frame loop.
// Sets the canvas to the logical 1280 by 720 view, wires keyboard,
// mouse and touch input, runs one update and one draw per animation
// frame, and keeps the screen reader status line in step with the game.

import { Game } from './game.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';
import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = new Input();
const sounds = new SoundBank();
const game = new Game(input, sounds, 'aurora');
const shot = applyShot(game, window.location.search);

let pixelRatio = 1;

function resize() {
  pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(VIEW_WIDTH * pixelRatio);
  canvas.height = Math.floor(VIEW_HEIGHT * pixelRatio);
  const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
  canvas.style.width = Math.floor(VIEW_WIDTH * scale) + 'px';
  canvas.style.height = Math.floor(VIEW_HEIGHT * scale) + 'px';
}

window.addEventListener('resize', resize);
resize();

function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_WIDTH,
    y: ((clientY - rect.top) / rect.height) * VIEW_HEIGHT,
  };
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'ArrowDown') {
    event.preventDefault();
  }
  sounds.ensure();
  input.keyDown(event.code);
});

window.addEventListener('keyup', (event) => {
  input.keyUp(event.code);
});

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  sounds.ensure();
  const point = toLogical(event.clientX, event.clientY);
  input.pointerDown(point.x, point.y);
});

canvas.addEventListener('pointermove', (event) => {
  const point = toLogical(event.clientX, event.clientY);
  input.pointerMove(point.x, point.y);
});

canvas.addEventListener('pointerup', () => {
  input.pointerUp();
});

canvas.addEventListener('pointerleave', () => {
  input.pointerUp();
});

let lastStatus = '';
let lastTime = performance.now();
let firstFrame = true;

function frame(now) {
  const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  game.update(dt);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawGame(ctx, game, input);
  const status = game.statusText();
  if (status !== lastStatus) {
    lastStatus = status;
    statusEl.textContent = status;
  }
  input.endFrame();
  if (firstFrame) {
    firstFrame = false;
    window.__auroraReady = true;
    window.__auroraGame = game;
    window.__auroraShot = shot;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
