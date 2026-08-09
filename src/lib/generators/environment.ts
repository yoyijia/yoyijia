import type {
  Biome,
  EnvironmentConfig,
  PixelBuffer,
  PixelSize,
  Rgba,
} from '../../types';
import { createRng, type Rng } from '../rng';
import { paletteRgba } from '../palettes';
import {
  blit,
  clear,
  createBuffer,
  fillCircle,
  fillRect,
  setPixel,
  stitchGrid,
} from '../pixelEngine';

type TileKind =
  | 'ground'
  | 'ground-alt'
  | 'water'
  | 'path'
  | 'wall'
  | 'tree'
  | 'rock'
  | 'flower'
  | 'roof'
  | 'door'
  | 'deco';

function biomeTileSet(biome: Biome): TileKind[] {
  const base: TileKind[] = ['ground', 'ground-alt', 'path', 'rock', 'deco'];
  switch (biome) {
    case 'grassland':
      return [...base, 'flower', 'tree', 'water'];
    case 'forest':
      return [...base, 'tree', 'tree', 'flower', 'water'];
    case 'desert':
      return ['ground', 'ground-alt', 'path', 'rock', 'rock', 'deco'];
    case 'coast':
      return ['ground', 'ground-alt', 'water', 'water', 'path', 'rock', 'deco'];
    case 'mountain':
      return ['ground', 'ground-alt', 'rock', 'rock', 'path', 'wall', 'deco'];
    case 'cave':
      return ['ground', 'ground-alt', 'wall', 'rock', 'path', 'deco', 'water'];
    case 'village':
      return [...base, 'wall', 'roof', 'door', 'flower', 'path'];
    case 'ruins':
      return [...base, 'wall', 'wall', 'rock', 'door', 'deco'];
  }
}

function drawGround(buf: PixelBuffer, colors: Rgba[], rng: Rng, alt: boolean) {
  const base = alt ? (colors[2] ?? colors[1]!) : (colors[1] ?? colors[0]!);
  const speck = colors[Math.min(3, colors.length - 1)]!;
  clear(buf);
  fillRect(buf, 0, 0, buf.width, buf.height, base);
  const dots = Math.floor((buf.width * buf.height) / 40);
  for (let i = 0; i < dots; i++) {
    setPixel(buf, rng.int(0, buf.width - 1), rng.int(0, buf.height - 1), speck);
  }
}

function drawWater(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  const deep = colors[0]!;
  const mid = colors[Math.min(2, colors.length - 1)]!;
  const hi = colors[Math.min(3, colors.length - 1)]!;
  fillRect(buf, 0, 0, buf.width, buf.height, mid);
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      if ((x + y * 2 + rng.int(0, 2)) % 5 === 0) setPixel(buf, x, y, deep);
      if ((x * 3 + y) % 11 === 0) setPixel(buf, x, y, hi);
    }
  }
}

function drawPath(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  const base = colors[Math.min(3, colors.length - 1)]!;
  const edge = colors[1]!;
  fillRect(buf, 0, 0, buf.width, buf.height, base);
  for (let i = 0; i < buf.width; i++) {
    if (rng.chance(0.3)) setPixel(buf, i, 0, edge);
    if (rng.chance(0.3)) setPixel(buf, i, buf.height - 1, edge);
  }
  for (let i = 0; i < Math.floor(buf.width / 4); i++) {
    setPixel(buf, rng.int(1, buf.width - 2), rng.int(1, buf.height - 2), edge);
  }
}

function drawWall(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  const stone = colors[2] ?? colors[1]!;
  const mortar = colors[0]!;
  const hi = colors[Math.min(3, colors.length - 1)]!;
  fillRect(buf, 0, 0, buf.width, buf.height, stone);
  const brickH = Math.max(2, Math.floor(buf.height / 4));
  const brickW = Math.max(3, Math.floor(buf.width / 3));
  for (let y = 0; y < buf.height; y += brickH) {
    const offset = (Math.floor(y / brickH) % 2) * Math.floor(brickW / 2);
    for (let x = -offset; x < buf.width; x += brickW) {
      fillRect(buf, x, y, brickW - 1, brickH - 1, stone);
      // mortar lines
      for (let mx = x; mx < x + brickW; mx++) setPixel(buf, mx, y, mortar);
      for (let my = y; my < y + brickH; my++) setPixel(buf, x, my, mortar);
      if (rng.chance(0.4)) {
        setPixel(buf, x + 1, y + 1, hi);
      }
    }
  }
}

function drawTree(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const trunk = colors[Math.min(2, colors.length - 1)]!;
  const leaf = colors[1]!;
  const leafHi = colors[Math.min(3, colors.length - 1)]!;
  const cx = Math.floor(buf.width / 2);
  const trunkW = Math.max(2, Math.floor(buf.width / 6));
  fillRect(buf, cx - Math.floor(trunkW / 2), Math.floor(buf.height * 0.55), trunkW, Math.floor(buf.height * 0.4), trunk);
  const r = Math.floor(buf.width * 0.35);
  fillCircle(buf, cx, Math.floor(buf.height * 0.4), r, leaf);
  fillCircle(buf, cx - Math.floor(r / 2), Math.floor(buf.height * 0.35), Math.floor(r * 0.6), leafHi);
}

function drawRock(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const body = colors[2] ?? colors[1]!;
  const shade = colors[0]!;
  const hi = colors[Math.min(3, colors.length - 1)]!;
  const cx = Math.floor(buf.width / 2) + rng.int(-1, 1);
  const cy = Math.floor(buf.height / 2) + rng.int(0, 1);
  const rx = Math.floor(buf.width * 0.35);
  const ry = Math.floor(buf.height * 0.28);
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
        setPixel(buf, cx + x, cy + y, y > 0 ? shade : body);
      }
    }
  }
  setPixel(buf, cx - 1, cy - 1, hi);
}

function drawFlower(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const stem = colors[1]!;
  const petal = colors[Math.min(2, colors.length - 1)]!;
  const center = colors[colors.length - 1]!;
  const cx = Math.floor(buf.width / 2);
  fillRect(buf, cx, Math.floor(buf.height * 0.45), 1, Math.floor(buf.height * 0.4), stem);
  const py = Math.floor(buf.height * 0.4);
  const offsets = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (const [ox, oy] of offsets) {
    setPixel(buf, cx + ox!, py + oy!, petal);
  }
  setPixel(buf, cx, py, center);
  if (rng.chance(0.5) && buf.width >= 16) {
    setPixel(buf, cx - 3, Math.floor(buf.height * 0.7), stem);
  }
}

function drawRoof(buf: PixelBuffer, colors: Rgba[]) {
  const roof = colors[Math.min(2, colors.length - 1)]!;
  const edge = colors[0]!;
  clear(buf);
  const mid = Math.floor(buf.width / 2);
  for (let y = 0; y < buf.height; y++) {
    const half = Math.floor((y / buf.height) * mid);
    fillRect(buf, mid - half, y, half * 2 + 1, 1, roof);
    setPixel(buf, mid - half, y, edge);
    setPixel(buf, mid + half, y, edge);
  }
}

function drawDoor(buf: PixelBuffer, colors: Rgba[]) {
  const wood = colors[Math.min(2, colors.length - 1)]!;
  const frame = colors[0]!;
  const knob = colors[colors.length - 1]!;
  clear(buf);
  const m = Math.max(1, Math.floor(buf.width / 8));
  fillRect(buf, m, m, buf.width - 2 * m, buf.height - m, wood);
  strokeFrame(buf, m, m, buf.width - 2 * m, buf.height - m, frame);
  setPixel(buf, buf.width - m - Math.max(2, m), Math.floor(buf.height / 2), knob);
}

function strokeFrame(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  c: Rgba,
) {
  for (let i = 0; i < w; i++) {
    setPixel(buf, x + i, y, c);
    setPixel(buf, x + i, y + h - 1, c);
  }
  for (let i = 0; i < h; i++) {
    setPixel(buf, x, y + i, c);
    setPixel(buf, x + w - 1, y + i, c);
  }
}

function drawDeco(buf: PixelBuffer, colors: Rgba[], rng: Rng) {
  clear(buf);
  const c = colors[Math.min(rng.int(1, colors.length - 1), colors.length - 1)]!;
  const kind = rng.int(0, 2);
  if (kind === 0) {
    // grass tuft
    const baseY = buf.height - 2;
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(buf.width / 2) + i - 1;
      for (let y = 0; y < Math.floor(buf.height / 3); y++) {
        setPixel(buf, x + (y % 2 === 0 ? 0 : rng.int(-1, 1)), baseY - y, c);
      }
    }
  } else if (kind === 1) {
    fillCircle(buf, Math.floor(buf.width / 2), Math.floor(buf.height / 2), Math.max(1, Math.floor(buf.width / 6)), c);
  } else {
    fillRect(buf, Math.floor(buf.width / 3), Math.floor(buf.height / 2), Math.floor(buf.width / 3), Math.floor(buf.height / 3), c);
  }
}

export function generateTile(
  kind: TileKind,
  size: number,
  paletteId: string,
  seed: number,
): PixelBuffer {
  const rng = createRng(seed);
  const colors = paletteRgba(paletteId);
  const buf = createBuffer(size, size);
  switch (kind) {
    case 'ground':
      drawGround(buf, colors, rng, false);
      break;
    case 'ground-alt':
      drawGround(buf, colors, rng, true);
      break;
    case 'water':
      drawWater(buf, colors, rng);
      break;
    case 'path':
      drawPath(buf, colors, rng);
      break;
    case 'wall':
      drawWall(buf, colors, rng);
      break;
    case 'tree':
      drawTree(buf, colors);
      break;
    case 'rock':
      drawRock(buf, colors, rng);
      break;
    case 'flower':
      drawFlower(buf, colors, rng);
      break;
    case 'roof':
      drawRoof(buf, colors);
      break;
    case 'door':
      drawDoor(buf, colors);
      break;
    case 'deco':
      drawDeco(buf, colors, rng);
      break;
  }
  return buf;
}

export function generateEnvironmentTileset(config: EnvironmentConfig): {
  tiles: PixelBuffer[];
  labels: string[];
  sheet: PixelBuffer;
} {
  const kinds = biomeTileSet(config.biome);
  const tiles = kinds.map((kind, i) =>
    generateTile(kind, config.tileSize, config.paletteId, config.seed + i * 31),
  );
  return {
    tiles,
    labels: kinds,
    sheet: stitchGrid(tiles, Math.min(4, tiles.length)),
  };
}

export function generateEnvironmentMap(config: EnvironmentConfig): {
  tiles: PixelBuffer[];
  labels: string[];
  sheet: PixelBuffer;
  map: PixelBuffer;
} {
  const { tiles, labels, sheet } = generateEnvironmentTileset(config);
  const rng = createRng(config.seed + 999);
  const map = createBuffer(
    config.mapCols * config.tileSize,
    config.mapRows * config.tileSize,
  );

  // weight ground tiles higher
  const weights = labels.map((l) =>
    l.startsWith('ground') ? 5 : l === 'path' ? 2 : l === 'water' ? 2 : 1,
  );
  const total = weights.reduce((a, b) => a + b, 0);

  for (let row = 0; row < config.mapRows; row++) {
    for (let col = 0; col < config.mapCols; col++) {
      let r = rng.next() * total;
      let idx = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]!;
        if (r <= 0) {
          idx = i;
          break;
        }
      }
      // prefer path as horizontal band
      if (row === Math.floor(config.mapRows / 2) && rng.chance(0.7)) {
        const pathIdx = labels.indexOf('path');
        if (pathIdx >= 0) idx = pathIdx;
      }
      blit(map, tiles[idx]!, col * config.tileSize, row * config.tileSize, false);
    }
  }

  // place a few props (tree/rock) on top of ground
  for (let i = 0; i < Math.floor(config.mapCols * config.mapRows * 0.08); i++) {
    const propLabels = ['tree', 'rock', 'flower', 'deco', 'door', 'roof'];
    const available = propLabels
      .map((p) => labels.indexOf(p))
      .filter((i) => i >= 0);
    if (available.length === 0) break;
    const idx = rng.pick(available);
    const col = rng.int(0, config.mapCols - 1);
    const row = rng.int(0, config.mapRows - 1);
    blit(map, tiles[idx]!, col * config.tileSize, row * config.tileSize, true);
  }

  return { tiles, labels, sheet, map };
}

export const BIOMES: { id: Biome; label: string }[] = [
  { id: 'grassland', label: 'Grassland' },
  { id: 'forest', label: 'Forest' },
  { id: 'desert', label: 'Desert' },
  { id: 'coast', label: 'Coast' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'cave', label: 'Cave' },
  { id: 'village', label: 'Village' },
  { id: 'ruins', label: 'Ruins' },
];

export const ENV_SIZES: PixelSize[] = [16, 32, 64, 128, 256, 512];
