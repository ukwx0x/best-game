// Aurora Flip: keyboard, mouse and touch input, in logical coordinates.
// The game reads edges (just pressed, just clicked) once per frame, and
// main.js clears them at the end of each frame so no press is read twice.

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = {
      x: 0,
      y: 0,
      down: false,
      clicked: false,
      clickX: 0,
      clickY: 0,
    };
  }

  keyDown(code) {
    if (!this.down.has(code)) {
      this.pressed.add(code);
    }
    this.down.add(code);
  }

  keyUp(code) {
    this.down.delete(code);
  }

  pointerDown(x, y) {
    this.pointer.down = true;
    this.pointer.clicked = true;
    this.pointer.clickX = x;
    this.pointer.clickY = y;
    this.pointer.x = x;
    this.pointer.y = y;
  }

  pointerUp() {
    this.pointer.down = false;
  }

  pointerMove(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  wasAnyPressed(codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  endFrame() {
    this.pressed.clear();
    this.pointer.clicked = false;
  }
}

export function pointInRect(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
