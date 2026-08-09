import type { ItemCategory, ItemsConfig, PixelBuffer, Rgba } from '../../types';
import { createRng, type Rng } from '../rng';
import { paletteRgba } from '../palettes';
import {
  clear,
  createBuffer,
  fillCircle,
  fillRect,
  outlineOpaque,
  setPixel,
  stitchGrid,
} from '../pixelEngine';

function drawSword(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const blade = colors[colors.length - 1]!;
  const guard = colors[Math.min(2, colors.length - 1)]!;
  const hilt = colors[1]!;
  const cx = Math.floor(buf.width / 2);
  fillRect(buf, cx, 1, 1, Math.floor(buf.height * 0.55), blade);
  fillRect(buf, cx - 1, 2, 1, Math.floor(buf.height * 0.4), [
    Math.max(0, blade[0] - 40),
    Math.max(0, blade[1] - 40),
    Math.max(0, blade[2] - 40),
    255,
  ]);
  fillRect(buf, cx - Math.floor(buf.width / 5), Math.floor(buf.height * 0.55), Math.floor(buf.width / 2.5), 1, guard);
  fillRect(buf, cx, Math.floor(buf.height * 0.55), 1, Math.floor(buf.height * 0.3), hilt);
  fillRect(buf, cx - 1, buf.height - 3, 3, 2, guard);
}

function drawAxe(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const handle = colors[1]!;
  const head = colors[Math.min(3, colors.length - 1)]!;
  const cx = Math.floor(buf.width / 2);
  fillRect(buf, cx, 2, 1, buf.height - 4, handle);
  fillRect(buf, cx - Math.floor(buf.width / 4), 2, Math.floor(buf.width / 2.2), Math.floor(buf.height / 3), head);
}

function drawBow(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const wood = colors[2] ?? colors[1]!;
  const string = colors[colors.length - 1]!;
  const left = Math.floor(buf.width * 0.3);
  for (let y = 1; y < buf.height - 1; y++) {
    const bulge = Math.sin((y / buf.height) * Math.PI) * Math.floor(buf.width * 0.2);
    setPixel(buf, left + Math.round(bulge), y, wood);
    setPixel(buf, left, y, string);
  }
}

function drawShield(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const body = colors[Math.min(2, colors.length - 1)]!;
  const rim = colors[0]!;
  const emblem = colors[colors.length - 1]!;
  const cx = Math.floor(buf.width / 2);
  const cy = Math.floor(buf.height / 2);
  const rx = Math.floor(buf.width * 0.35);
  const ry = Math.floor(buf.height * 0.4);
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
        setPixel(buf, cx + x, cy + y, body);
      }
    }
  }
  outlineOpaque(buf, rim);
  fillRect(buf, cx - 1, cy - Math.floor(ry / 2), 2, ry, emblem);
}

function drawHelmet(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const metal = colors[2] ?? colors[1]!;
  const dark = colors[0]!;
  fillRect(buf, 3, 3, buf.width - 6, Math.floor(buf.height * 0.55), metal);
  fillRect(buf, 2, Math.floor(buf.height * 0.35), buf.width - 4, Math.floor(buf.height * 0.2), metal);
  fillRect(buf, Math.floor(buf.width * 0.35), Math.floor(buf.height * 0.45), Math.floor(buf.width * 0.3), Math.floor(buf.height * 0.15), dark);
}

function drawPotion(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const glass = colors[Math.min(3, colors.length - 1)]!;
  const liquid = colors[Math.min(rng.int(1, 3), colors.length - 1)]!;
  const cork = colors[1]!;
  const cx = Math.floor(buf.width / 2);
  const neckW = Math.max(2, Math.floor(buf.width / 5));
  fillRect(buf, cx - Math.floor(neckW / 2), 2, neckW, Math.floor(buf.height * 0.25), glass);
  fillRect(buf, cx - Math.floor(neckW / 2), 1, neckW, 2, cork);
  const bodyTop = Math.floor(buf.height * 0.28);
  fillCircle(buf, cx, Math.floor(buf.height * 0.62), Math.floor(buf.width * 0.28), glass);
  fillCircle(buf, cx, Math.floor(buf.height * 0.65), Math.floor(buf.width * 0.2), liquid);
  fillRect(buf, cx - Math.floor(neckW / 2), bodyTop, neckW, Math.floor(buf.height * 0.2), glass);
}

function drawTool(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const handle = colors[1]!;
  const head = colors[Math.min(3, colors.length - 1)]!;
  if (rng.chance(0.5)) {
    // pickaxe
    fillRect(buf, Math.floor(buf.width * 0.45), 3, 1, buf.height - 5, handle);
    fillRect(buf, Math.floor(buf.width * 0.2), 3, Math.floor(buf.width * 0.6), Math.floor(buf.height * 0.2), head);
  } else {
    // hammer
    fillRect(buf, Math.floor(buf.width * 0.45), 4, 1, buf.height - 6, handle);
    fillRect(buf, Math.floor(buf.width * 0.25), 2, Math.floor(buf.width * 0.5), Math.floor(buf.height * 0.3), head);
  }
}

function drawFood(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const kind = rng.int(0, 2);
  if (kind === 0) {
    // apple
    fillCircle(buf, Math.floor(buf.width / 2), Math.floor(buf.height / 2), Math.floor(buf.width * 0.28), colors[Math.min(2, colors.length - 1)]!);
    fillRect(buf, Math.floor(buf.width / 2), Math.floor(buf.height * 0.2), 1, Math.floor(buf.height * 0.2), colors[1]!);
  } else if (kind === 1) {
    // bread
    fillRect(buf, Math.floor(buf.width * 0.2), Math.floor(buf.height * 0.35), Math.floor(buf.width * 0.6), Math.floor(buf.height * 0.35), colors[Math.min(3, colors.length - 1)]!);
  } else {
    // meat
    fillRect(buf, Math.floor(buf.width * 0.3), Math.floor(buf.height * 0.3), Math.floor(buf.width * 0.4), Math.floor(buf.height * 0.4), colors[Math.min(2, colors.length - 1)]!);
    fillRect(buf, Math.floor(buf.width * 0.45), Math.floor(buf.height * 0.2), 1, Math.floor(buf.height * 0.2), colors[colors.length - 1]!);
  }
}

function drawGem(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const gem = colors[Math.min(rng.int(1, colors.length - 1), colors.length - 1)]!;
  const hi = colors[colors.length - 1]!;
  const cx = Math.floor(buf.width / 2);
  const cy = Math.floor(buf.height / 2);
  const r = Math.floor(buf.width * 0.28);
  for (let y = -r; y <= r; y++) {
    const w = r - Math.abs(y);
    fillRect(buf, cx - w, cy + y, w * 2 + 1, 1, gem);
  }
  setPixel(buf, cx - 1, cy - Math.floor(r / 2), hi);
}

function drawMisc(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const c = colors[Math.min(rng.int(1, colors.length - 1), colors.length - 1)]!;
  const shapes = rng.int(0, 2);
  if (shapes === 0) {
    fillRect(buf, Math.floor(buf.width * 0.25), Math.floor(buf.height * 0.25), Math.floor(buf.width * 0.5), Math.floor(buf.height * 0.5), c);
  } else if (shapes === 1) {
    fillCircle(buf, Math.floor(buf.width / 2), Math.floor(buf.height / 2), Math.floor(buf.width * 0.25), c);
  } else {
    // key
    fillCircle(buf, Math.floor(buf.width * 0.35), Math.floor(buf.height * 0.35), Math.floor(buf.width * 0.15), c);
    fillRect(buf, Math.floor(buf.width * 0.35), Math.floor(buf.height * 0.3), Math.floor(buf.width * 0.4), Math.max(1, Math.floor(buf.height / 10)), c);
  }
}

function drawItem(
  category: ItemCategory,
  size: number,
  colors: Rgba[],
  rng: Rng,
): PixelBuffer {
  const buf = createBuffer(size, size);
  switch (category) {
    case 'weapons': {
      const w = rng.int(0, 2);
      if (w === 0) drawSword(buf, colors);
      else if (w === 1) drawAxe(buf, colors);
      else drawBow(buf, colors);
      break;
    }
    case 'armor': {
      if (rng.chance(0.5)) drawShield(buf, colors);
      else drawHelmet(buf, colors);
      break;
    }
    case 'potions':
      drawPotion(buf, colors, rng);
      break;
    case 'tools':
      drawTool(buf, colors, rng);
      break;
    case 'food':
      drawFood(buf, colors, rng);
      break;
    case 'gems':
      drawGem(buf, colors, rng);
      break;
    case 'misc':
      drawMisc(buf, colors, rng);
      break;
  }
  outlineOpaque(buf, colors[0]!);
  return buf;
}

export function generateItemsSheet(config: ItemsConfig): {
  tiles: PixelBuffer[];
  sheet: PixelBuffer;
} {
  const colors = paletteRgba(config.paletteId);
  const count = config.cols * config.rows;
  const tiles: PixelBuffer[] = [];
  for (let i = 0; i < count; i++) {
    const rng = createRng(config.seed + i * 97);
    tiles.push(drawItem(config.category, config.tileSize, colors, rng));
  }
  return { tiles, sheet: stitchGrid(tiles, config.cols) };
}

export const ITEM_CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'potions', label: 'Potions' },
  { id: 'tools', label: 'Tools' },
  { id: 'food', label: 'Food' },
  { id: 'gems', label: 'Gems' },
  { id: 'misc', label: 'Misc' },
];
