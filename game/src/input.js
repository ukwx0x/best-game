// Lumenfall: keyboard and mouse input, in logical 1280 by 720
// coordinates. The game reads edges (just pressed, just clicked) once
// per frame, and main.js clears them at the end of each frame so no
// press is read twice. Mouse position is scaled from the canvas box,
// so the game plays the same at any window size.

import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = VIEW_WIDTH / 2;
    this.mouseY = VIEW_HEIGHT / 2;
    this.clicks = [];
    this.rightClicks = [];
    this.pressedKeys = new Set();
    this.justPressed = new Set();
    this.onFirstGesture = null;
    this.gestureFired = false;

    const toLogical = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
      };
    };
    canvas.addEventListener('mousemove', (event) => {
      const pos = toLogical(event);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
    });
    canvas.addEventListener('click', (event) => {
      this.clicks.push(toLogical(event));
      this.fireGesture();
    });
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.rightClicks.push(toLogical(event));
      this.fireGesture();
    });
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      this.pressedKeys.add(key);
      this.justPressed.add(key);
      this.fireGesture();
      if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      this.pressedKeys.delete(key);
    });
  }

  fireGesture() {
    if (this.gestureFired) return;
    this.gestureFired = true;
    if (this.onFirstGesture) this.onFirstGesture();
  }

  wasPressed(key) {
    return this.justPressed.has(key);
  }

  endFrame() {
    this.clicks.length = 0;
    this.rightClicks.length = 0;
    this.justPressed.clear();
  }
}
