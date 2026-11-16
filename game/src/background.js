// Aurora Flip: the sky behind the run.
// Layered parallax fills the screen: a gradient sky with nebula glow
// and a moon, three twinkling star fields, shooting stars, aurora
// curtains with vertical rays, distant crystal spires, mountain
// ridges, drifting mist, and the two glowing surfaces. Every layer is
// tinted by the current level theme, and every fixed shape comes from
// a fixed seed, so the sky is identical on every run.

import { CEILING_Y, COLORS, FLOOR_Y, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { mulberry32 } from './random.js';

function fract(value) {
  return value - Math.floor(value);
}

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

function makeSpires(seed) {
  const rnd = mulberry32(seed);
  const spires = [];
  for (let x = 40; x < 2560; x += 190 + rnd() * 160) {
    spires.push({ x, w: 26 + rnd() * 30, h: 90 + rnd() * 170, lean: (rnd() - 0.5) * 24 });
  }
  return spires;
}

function makeNebulae(seed) {
  const rnd = mulberry32(seed);
  const blobs = [];
  for (let i = 0; i < 5; i += 1) {
    blobs.push({ x: rnd() * 1440, y: 90 + rnd() * 380, r: 130 + rnd() * 150 });
  }
  return blobs;
}

const STAR_LAYERS = [
  { parallax: 0.08, stars: makeStars(70, 11) },
  { parallax: 0.18, stars: makeStars(55, 23) },
  { parallax: 0.32, stars: makeStars(40, 37) },
];

const RIDGES = [
  { parallax: 0.25, base: 566, points: makeRidge(101, 95) },
  { parallax: 0.45, base: 604, points: makeRidge(202, 62) },
];

const SPIRES = makeSpires(303);
const NEBULAE = makeNebulae(404);

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
}

function drawSky(ctx, theme, cameraX, animTime) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(0.55, theme.skyMid);
  gradient.addColorStop(1, theme.skyLow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Nebula glow, barely there, in the theme aurora colors.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const nebColors = [theme.auroraA, theme.auroraB, theme.auroraC];
  for (let i = 0; i < NEBULAE.length; i += 1) {
    const blob = NEBULAE[i];
    let sx = (blob.x - cameraX * 0.05) % 1440;
    if (sx < 0) sx += 1440;
    sx -= 80;
    const glow = ctx.createRadialGradient(sx, blob.y, 10, sx, blob.y, blob.r);
    glow.addColorStop(0, rgba(nebColors[i % 3], 0.1));
    glow.addColorStop(1, rgba(nebColors[i % 3], 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, blob.y, blob.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // The moon, high and slow, with a wide halo.
  const moonX = 1080 - ((cameraX * 0.04) % 200);
  const moonY = 128;
  const halo = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 130);
  halo.addColorStop(0, rgba(theme.auroraB, 0.28));
  halo.addColorStop(1, rgba(theme.auroraB, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4f9ff';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(theme.skyMid, 0.16);
  ctx.beginPath();
  ctx.arc(moonX - 11, moonY - 7, 6, 0, Math.PI * 2);
  ctx.arc(moonX + 11, moonY + 9, 4, 0, Math.PI * 2);
  ctx.fill();

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

  // Two shooting stars on fixed periods, so the sky feels alive.
  for (const period of [7, 11]) {
    const cycle = animTime % period;
    if (cycle > 0.9) {
      continue;
    }
    const startX = 260 + ((period * 137) % 700);
    const startY = 90 + ((period * 53) % 130);
    const headX = startX + cycle * 620;
    const headY = startY + cycle * 210;
    const tail = ctx.createLinearGradient(headX, headY, headX - 130, headY - 44);
    tail.addColorStop(0, 'rgba(234,246,255,0.9)');
    tail.addColorStop(1, 'rgba(234,246,255,0)');
    ctx.strokeStyle = tail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(headX - 130, headY - 44);
    ctx.stroke();
  }
}

function drawAurora(ctx, theme, cameraX, animTime) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ribbons = [
    { base: 108, color: theme.auroraA, phase: 0, height: 120 },
    { base: 196, color: theme.auroraB, phase: 2.1, height: 100 },
    { base: 288, color: theme.auroraC, phase: 4.2, height: 84 },
  ];
  for (const ribbon of ribbons) {
    const gradient = ctx.createLinearGradient(0, ribbon.base - 60, 0, ribbon.base + ribbon.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, rgba(ribbon.color, 0.32));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55;
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
      const y = ribbon.base + ribbon.height + Math.sin((x + cameraX * 0.15) / 210 + animTime * 0.4 + ribbon.phase + 1.3) * 22;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // Vertical rays inside the curtain, faint and uneven, swaying
    // like light through ice. Kept subtle so they never read as bars.
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = ribbon.color;
    let rayIndex = 0;
    for (let x = 0; x < VIEW_WIDTH; x += 150) {
      rayIndex += 1;
      if (rayIndex % 3 === 0) {
        continue;
      }
      const sway = Math.sin(animTime * 0.7 + x / 130 + ribbon.phase) * 18;
      const top = ribbon.base - 20 + Math.sin((x + cameraX * 0.15) / 170 + animTime * 0.5 + ribbon.phase) * 24;
      const w = 6 + (rayIndex % 2) * 4;
      ctx.beginPath();
      ctx.moveTo(x + sway, top);
      ctx.lineTo(x + w + sway, top);
      ctx.lineTo(x + w + 14 + sway * 1.6, top + ribbon.height * 0.7);
      ctx.lineTo(x + 8 + sway * 1.6, top + ribbon.height * 0.7);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawRidgesAndSpires(ctx, theme, cameraX) {
  // Crystal spires between the stars and the mountains.
  let spireShift = -(cameraX * 0.32) % 2560;
  if (spireShift > 0) {
    spireShift -= 2560;
  }
  ctx.fillStyle = rgba(theme.auroraB, 0.16);
  for (const offset of [spireShift, spireShift + 2560]) {
    for (const spire of SPIRES) {
      const sx = offset + spire.x;
      if (sx < -80 || sx > VIEW_WIDTH + 80) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(sx - spire.w / 2, 620);
      ctx.lineTo(sx + spire.lean, 620 - spire.h);
      ctx.lineTo(sx + spire.w / 2, 620);
      ctx.closePath();
      ctx.fill();
    }
  }
  const ridgeColors = [theme.ridgeFar, theme.ridgeNear];
  for (let r = 0; r < RIDGES.length; r += 1) {
    const ridge = RIDGES[r];
    let shift = -(cameraX * ridge.parallax) % 2560;
    if (shift > 0) {
      shift -= 2560;
    }
    ctx.fillStyle = ridgeColors[r];
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
  // Low mist hugging the floor ridge.
  ctx.fillStyle = rgba(theme.mist, 0.05 + 0.02 * Math.sin(cameraX * 0.001));
  ctx.fillRect(0, 520, VIEW_WIDTH, 100);
}

function drawSurfaces(ctx, theme, cameraX, animTime) {
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

  // Strata lines inside both bands, so the ground has depth.
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (const y of [FLOOR_Y + 26, FLOOR_Y + 52, CEILING_Y - 26, CEILING_Y - 52]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_WIDTH, y);
    ctx.stroke();
  }

  // Glowing rune pebbles embedded in both surfaces. They are diamonds
  // and dots, never triangles, so they never read as spikes.
  const startSeg = Math.floor(cameraX / 90);
  for (let i = 0; i <= 16; i += 1) {
    const segX = (startSeg + i) * 90;
    const sx = segX - cameraX;
    const h = fract(Math.sin(segX * 12.9898) * 43758.5453);
    if (h < 0.45) {
      continue;
    }
    const size = 5 + h * 8;
    const glow = 0.35 + 0.3 * Math.sin(animTime * 2 + segX);
    ctx.globalAlpha = glow;
    ctx.fillStyle = theme.edge;
    ctx.beginPath();
    ctx.moveTo(sx + 34, FLOOR_Y + 12);
    ctx.lineTo(sx + 34 + size, FLOOR_Y + 12 + size);
    ctx.lineTo(sx + 34, FLOOR_Y + 12 + size * 2);
    ctx.lineTo(sx + 34 - size, FLOOR_Y + 12 + size);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 66, CEILING_Y - 18, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Glowing edges, with light pulses travelling along them.
  const shimmer = 0.75 + 0.25 * Math.sin(animTime * 2);
  ctx.save();
  ctx.shadowColor = theme.edge;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = theme.edge;
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
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 3; k += 1) {
    const px = ((animTime * 160 + k * 430 - cameraX * 0.6) % (VIEW_WIDTH + 120) + VIEW_WIDTH + 120) % (VIEW_WIDTH + 120) - 60;
    ctx.beginPath();
    ctx.arc(px, FLOOR_Y + 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(VIEW_WIDTH - px, CEILING_Y - 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVignette(ctx) {
  const glow = ctx.createRadialGradient(
    VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.42,
    VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.95,
  );
  glow.addColorStop(0, 'rgba(0,0,0,0)');
  glow.addColorStop(1, 'rgba(3,5,16,0.42)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const top = ctx.createLinearGradient(0, 0, 0, 96);
  top.addColorStop(0, 'rgba(3,5,16,0.5)');
  top.addColorStop(1, 'rgba(3,5,16,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, VIEW_WIDTH, 96);
}

export function drawBackground(ctx, theme, cameraX, animTime) {
  drawSky(ctx, theme, cameraX, animTime);
  drawAurora(ctx, theme, cameraX, animTime);
  drawRidgesAndSpires(ctx, theme, cameraX);
  drawSurfaces(ctx, theme, cameraX, animTime);
}

export { drawVignette, rgba };
