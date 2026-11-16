// Aurora Flip: shared canvas shapes and easing.
// One copy of each small drawing helper, used by the world renderer
// and the menu screens alike, so every panel, star and heart matches.

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function easeOutCubic(t) {
  const u = clamp(t, 0, 1);
  return 1 - Math.pow(1 - u, 3);
}

export function easeOutBack(t) {
  const u = clamp(t, 0, 1);
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
}

export function roundRectPath(ctx, x, y, w, h, r) {
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

export function drawStarShape(ctx, cx, cy, outer, inner, points) {
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

export function drawHeartShape(ctx, cx, cy, size) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.4, cy - s * 0.1, cx - s * 0.7, cy - s, cx, cy - s * 0.25);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s, cx + s * 1.4, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}

// A four point sparkle, the glint on orbs, shards and the gate.
export function drawSparkle(ctx, cx, cy, size, squash) {
  const sy = size * (squash || 1);
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx, cy, cx + sy, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size);
  ctx.quadraticCurveTo(cx, cy, cx - sy, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size);
  ctx.closePath();
}
