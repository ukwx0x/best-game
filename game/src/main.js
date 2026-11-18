// Lumenfall: boot and frame loop. Sets the canvas to the logical 1280
// by 720 view, wires input, runs the fixed step simulation, dispatches
// every click and key to the screen that owns it, and draws each frame.
// Screenshot mode (?shot=) stages a frozen scene and sets
// window.__shotReady once the first frame is drawn, so a headless
// browser can capture a real render of the game.

import { STEP, TOWER_ORDER, TOWER_TYPES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createGame, cellAt, placeTower, restartRun, stepGame, towerAtCell } from './game.js';
import { sellValue, upgradeCost, upgradeTower } from './towers.js';
import { fireFrostNova, fireSunburst } from './game.js';
import { startWave, applyBoon } from './waves.js';
import {
  abilityRect, backToTitleRect, boonCardRect, difficultyRect, muteRect,
  pauseButtonRect, pauseRect, playAgainRect, pointInRect, renderGame,
  selectedPanelRect, sellButtonRect, shopCardRect, speedRect, startButtonRect,
  startWaveRect, upgradeButtonRect,
} from './render.js';
import { Input } from './input.js';
import { stageShot } from './shots.js';
import { playClick, playUpgrade, playBoon, toggleMute, unlockAudio } from './audio.js';
import { burstEffects, spawnRing } from './particles.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed')) || 7;
const shotMode = Boolean(shotName);

let state = shotMode ? stageShot(shotName, seed) : createGame('standard', (Date.now() % 2147483647) || 7);
let lastScreen = state.screen;

// A read handle for scripted playtests. It changes nothing in the game.
Object.defineProperty(window, '__game', { get: () => state });

const input = new Input(canvas);
input.onFirstGesture = () => unlockAudio();

function setStatus() {
  if (!statusLine) return;
  if (state.screen === 'play') {
    statusLine.textContent = `Wave ${state.wave} of 15. Ember ${state.ember}. Lantern light ${state.lives} of ${state.maxLives}. Score ${state.score}.`;
  } else if (state.screen === 'title') {
    statusLine.textContent = 'Lumenfall title screen. Choose a difficulty and begin the night.';
  } else if (state.screen === 'boon') {
    statusLine.textContent = 'Choose a boon before the next wave.';
  } else if (state.screen === 'victory') {
    statusLine.textContent = `Victory. ${state.stars} stars. Score ${state.score}.`;
  } else if (state.screen === 'defeat') {
    statusLine.textContent = `Defeat on wave ${state.wave}. Score ${state.score}.`;
  }
}

function startNewRun() {
  state = createGame(state.difficulty, (Date.now() % 2147483647) || 7);
  state.screen = 'play';
  state.muted = inputMuted;
  playClick();
}

let inputMuted = false;

function toggleSound() {
  inputMuted = toggleMute();
  state.muted = inputMuted;
}

function handleTitleClick(x, y) {
  const ids = ['story', 'standard', 'nightmare'];
  for (let i = 0; i < ids.length; i += 1) {
    if (pointInRect(x, y, difficultyRect(i))) {
      state.difficulty = ids[i];
      state.titleDemo = null;
      playClick();
      return;
    }
  }
  if (pointInRect(x, y, startButtonRect())) startNewRun();
}

function handleBoonClick(x, y) {
  for (let i = 0; i < state.boonOptions.length; i += 1) {
    if (pointInRect(x, y, boonCardRect(i))) {
      applyBoon(state, state.boonOptions[i]);
      state.screen = 'play';
      playBoon();
      return;
    }
  }
}

function handlePauseClick(x, y) {
  if (pointInRect(x, y, pauseButtonRect(0))) {
    state.screen = 'play';
    playClick();
  } else if (pointInRect(x, y, pauseButtonRect(1))) {
    state = restartRun(state);
    playClick();
  } else if (pointInRect(x, y, pauseButtonRect(2))) {
    const best = state.best;
    state = createGame(state.difficulty, 7);
    state.best = best;
    state.screen = 'title';
    playClick();
  }
}

function handleEndClick(x, y) {
  if (pointInRect(x, y, playAgainRect())) {
    state = restartRun(state);
    playClick();
  } else if (pointInRect(x, y, backToTitleRect())) {
    const best = state.best;
    state = createGame(state.difficulty, 7);
    state.best = best;
    state.screen = 'title';
    playClick();
  }
}

function handlePlayClick(x, y) {
  if (pointInRect(x, y, speedRect())) {
    state.speed = state.speed === 1 ? 2 : 1;
    playClick();
    return;
  }
  if (pointInRect(x, y, pauseRect())) {
    state.screen = 'pause';
    playClick();
    return;
  }
  if (pointInRect(x, y, muteRect())) {
    toggleSound();
    return;
  }
  if (state.selectedTower) {
    const upRect = upgradeButtonRect();
    const sellRect = sellButtonRect();
    if (pointInRect(x, y, upRect)) {
      const cost = upgradeCost(state.selectedTower);
      if (cost !== null && state.ember >= cost) {
        state.ember -= cost;
        upgradeTower(state.selectedTower);
        burstEffects(state.effects, state.selectedTower.x, state.selectedTower.y, '#ffd97a', 16, 110, 0.5, 3);
        playUpgrade();
      }
      return;
    }
    if (pointInRect(x, y, sellRect)) {
      state.ember += sellValue(state.selectedTower);
      state.towers = state.towers.filter((tower) => tower !== state.selectedTower);
      state.selectedTower = null;
      playClick();
      return;
    }
    if (pointInRect(x, y, selectedPanelRect())) return;
  }
  for (let i = 0; i < TOWER_ORDER.length; i += 1) {
    if (pointInRect(x, y, shopCardRect(i))) {
      const type = TOWER_ORDER[i];
      state.buildType = state.buildType === type ? null : type;
      state.selectedTower = null;
      playClick();
      return;
    }
  }
  if (pointInRect(x, y, abilityRect('sunburst'))) {
    fireSunburst(state);
    return;
  }
  if (pointInRect(x, y, abilityRect('frostnova'))) {
    fireFrostNova(state);
    return;
  }
  if (pointInRect(x, y, startWaveRect())) {
    startWave(state);
    return;
  }
  const cell = cellAt(x, y);
  if (!cell) return;
  if (state.buildType) {
    placeTower(state, cell.col, cell.row);
    return;
  }
  const tower = towerAtCell(state, cell.col, cell.row);
  state.selectedTower = tower;
  if (tower) {
    spawnRing(state.effects, tower.x, tower.y, '#ffd97a', 36);
    playClick();
  }
}

function handleClick(x, y) {
  if (state.screen === 'title') handleTitleClick(x, y);
  else if (state.screen === 'boon') handleBoonClick(x, y);
  else if (state.screen === 'pause') handlePauseClick(x, y);
  else if (state.screen === 'victory' || state.screen === 'defeat') handleEndClick(x, y);
  else handlePlayClick(x, y);
}

function handleKeys() {
  if (input.wasPressed('m')) toggleSound();
  if (state.screen === 'title') {
    if (input.wasPressed('Enter') || input.wasPressed(' ')) startNewRun();
    return;
  }
  if (state.screen === 'boon') {
    for (let i = 0; i < state.boonOptions.length; i += 1) {
      if (input.wasPressed(String(i + 1))) {
        applyBoon(state, state.boonOptions[i]);
        state.screen = 'play';
        playBoon();
      }
    }
    return;
  }
  if (state.screen === 'pause') {
    if (input.wasPressed('p') || input.wasPressed('Escape')) state.screen = 'play';
    if (input.wasPressed('r')) state = restartRun(state);
    return;
  }
  if (state.screen === 'victory' || state.screen === 'defeat') {
    if (input.wasPressed('r') || input.wasPressed('Enter')) state = restartRun(state);
    return;
  }
  for (let i = 0; i < TOWER_ORDER.length; i += 1) {
    if (input.wasPressed(TOWER_TYPES[TOWER_ORDER[i]].key)) {
      const type = TOWER_ORDER[i];
      state.buildType = state.buildType === type ? null : type;
      state.selectedTower = null;
    }
  }
  if (input.wasPressed('q')) fireSunburst(state);
  if (input.wasPressed('w')) fireFrostNova(state);
  if (input.wasPressed(' ')) startWave(state);
  if (input.wasPressed('f')) state.speed = state.speed === 1 ? 2 : 1;
  if (input.wasPressed('p')) state.screen = 'pause';
  if (input.wasPressed('Escape')) {
    if (state.buildType || state.selectedTower) {
      state.buildType = null;
      state.selectedTower = null;
    } else {
      state.screen = 'pause';
    }
  }
}

let lastTime = performance.now();
let accumulator = 0;
let shotReadySet = false;

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!shotMode) {
    state.time += dt;
    handleKeys();
    for (const click of input.clicks) handleClick(click.x, click.y);
    if (input.rightClicks.length > 0) {
      state.buildType = null;
      state.selectedTower = null;
    }
    if (state.screen === 'play') {
      accumulator += dt * state.speed;
      let steps = 0;
      while (accumulator >= STEP && steps < 12 && state.screen === 'play') {
        stepGame(state, STEP);
        accumulator -= STEP;
        steps += 1;
      }
      if (state.screen !== 'play') accumulator = 0;
    } else {
      accumulator = 0;
    }
    if (state.screen !== lastScreen) {
      lastScreen = state.screen;
      setStatus();
    }
  }
  renderGame(ctx, state, { x: input.mouseX, y: input.mouseY });
  input.endFrame();
  if (shotMode && !shotReadySet) {
    shotReadySet = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

setStatus();
requestAnimationFrame(frame);
