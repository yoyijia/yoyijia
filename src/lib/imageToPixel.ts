import type { PixelBuffer, PixelSize, ReferenceOptions, Rgba } from '../types';
import { hexToRgba, nearestColor, paletteRgba, rgbaToHex } from './palettes';
import {
  blit,
  createBuffer,
  getPixel,
  quantizeBuffer,
  setPixel,
  stitchGrid,
} from './pixelEngine';

function loadImage(file: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    if (typeof file === 'string') {
      img.src = file;
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
}

function sampleImage(
  img: HTMLImageElement,
  width: number,
  height: number,
): PixelBuffer {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  return { width, height, data: data.data };
}

/** Median-cut style simple palette extraction */
export function extractPalette(buf: PixelBuffer, count: number): Rgba[] {
  const samples: Rgba[] = [];
  const step = Math.max(1, Math.floor((buf.width * buf.height) / 2000));
  for (let i = 0; i < buf.data.length; i += 4 * step) {
    if (buf.data[i + 3]! < 128) continue;
    samples.push([
      buf.data[i]!,
      buf.data[i + 1]!,
      buf.data[i + 2]!,
      255,
    ]);
  }
  if (samples.length === 0) return [hexToRgba('#000000'), hexToRgba('#ffffff')];

  let buckets: Rgba[][] = [samples];
  while (buckets.length < count) {
    buckets.sort((a, b) => channelRange(b) - channelRange(a));
    const largest = buckets.shift()!;
    if (largest.length < 2) {
      buckets.push(largest);
      break;
    }
    const ch = dominantChannel(largest);
    largest.sort((a, b) => a[ch]! - b[ch]!);
    const mid = Math.floor(largest.length / 2);
    buckets.push(largest.slice(0, mid), largest.slice(mid));
  }

  return buckets.map((bucket) => {
    let r = 0,
      g = 0,
      b = 0;
    for (const c of bucket) {
      r += c[0];
      g += c[1];
      b += c[2];
    }
    const n = bucket.length || 1;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n), 255] as Rgba;
  });
}

function channelRange(colors: Rgba[]): number {
  let minR = 255,
    maxR = 0,
    minG = 255,
    maxG = 0,
    minB = 255,
    maxB = 0;
  for (const c of colors) {
    minR = Math.min(minR, c[0]);
    maxR = Math.max(maxR, c[0]);
    minG = Math.min(minG, c[1]);
    maxG = Math.max(maxG, c[1]);
    minB = Math.min(minB, c[2]);
    maxB = Math.max(maxB, c[2]);
  }
  return Math.max(maxR - minR, maxG - minG, maxB - minB);
}

function dominantChannel(colors: Rgba[]): 0 | 1 | 2 {
  let minR = 255,
    maxR = 0,
    minG = 255,
    maxG = 0,
    minB = 255,
    maxB = 0;
  for (const c of colors) {
    minR = Math.min(minR, c[0]);
    maxR = Math.max(maxR, c[0]);
    minG = Math.min(minG, c[1]);
    maxG = Math.max(maxG, c[1]);
    minB = Math.min(minB, c[2]);
    maxB = Math.max(maxB, c[2]);
  }
  const ranges = [maxR - minR, maxG - minG, maxB - minB];
  let best: 0 | 1 | 2 = 0;
  if (ranges[1]! > ranges[best]!) best = 1;
  if (ranges[2]! > ranges[best]!) best = 2;
  return best;
}

function floydSteinberg(buf: PixelBuffer, palette: Rgba[]): void {
  const w = buf.width;
  const h = buf.height;
  const copy = new Float32Array(buf.data.length);
  for (let i = 0; i < buf.data.length; i++) copy[i] = buf.data[i]!;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (copy[i + 3]! < 16) {
        setPixel(buf, x, y, [0, 0, 0, 0]);
        continue;
      }
      const old: Rgba = [
        clamp(copy[i]!),
        clamp(copy[i + 1]!),
        clamp(copy[i + 2]!),
        255,
      ];
      const n = nearestColor(old, palette);
      setPixel(buf, x, y, n);
      const err = [old[0] - n[0], old[1] - n[1], old[2] - n[2]];
      distribute(copy, w, h, x + 1, y, err, 7 / 16);
      distribute(copy, w, h, x - 1, y + 1, err, 3 / 16);
      distribute(copy, w, h, x, y + 1, err, 5 / 16);
      distribute(copy, w, h, x + 1, y + 1, err, 1 / 16);
    }
  }
}

function distribute(
  data: Float32Array,
  w: number,
  h: number,
  x: number,
  y: number,
  err: number[],
  factor: number,
) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) * 4;
  data[i] = data[i]! + err[0]! * factor;
  data[i + 1] = data[i + 1]! + err[1]! * factor;
  data[i + 2] = data[i + 2]! + err[2]! * factor;
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export async function referenceToPixelMap(
  source: File | string,
  options: ReferenceOptions,
): Promise<{
  map: PixelBuffer;
  tiles: PixelBuffer[];
  sheet: PixelBuffer;
  palette: string[];
}> {
  const img = await loadImage(source);
  const tile = options.tileSize;
  const cols = Math.max(1, Math.round(options.targetWidth / tile));
  const rows = Math.max(1, Math.round(options.targetHeight / tile));
  const width = cols * tile;
  const height = rows * tile;

  const sampled = sampleImage(img, width, height);

  let palette: Rgba[];
  if (options.paletteId === 'auto') {
    palette = extractPalette(sampled, options.colorCount);
  } else {
    palette = paletteRgba(options.paletteId);
  }

  if (options.dither) {
    floydSteinberg(sampled, palette);
  } else {
    quantizeBuffer(sampled, palette);
  }

  // Slice into modular tiles
  const tiles: PixelBuffer[] = [];
  const unique = new Map<string, PixelBuffer>();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tileBuf = createBuffer(tile, tile);
      for (let y = 0; y < tile; y++) {
        for (let x = 0; x < tile; x++) {
          setPixel(
            tileBuf,
            x,
            y,
            getPixel(sampled, col * tile + x, row * tile + y),
          );
        }
      }
      // dedupe similar tiles by coarse hash for modular sheet
      const hash = coarseHash(tileBuf);
      if (!unique.has(hash) && unique.size < 64) {
        unique.set(hash, tileBuf);
      }
      tiles.push(tileBuf);
    }
  }

  const modularTiles = [...unique.values()];
  const sheetCols = Math.min(8, Math.max(1, modularTiles.length));

  return {
    map: sampled,
    tiles: modularTiles,
    sheet: stitchGrid(modularTiles, sheetCols),
    palette: palette.map(rgbaToHex),
  };
}

function coarseHash(buf: PixelBuffer): string {
  // sample a grid of pixels for approximate uniqueness
  const parts: number[] = [];
  const step = Math.max(1, Math.floor(buf.width / 4));
  for (let y = 0; y < buf.height; y += step) {
    for (let x = 0; x < buf.width; x += step) {
      const c = getPixel(buf, x, y);
      parts.push((c[0] >> 4) << 8 | (c[1] >> 4) << 4 | (c[2] >> 4));
    }
  }
  return parts.join(',');
}

export async function referenceToPixelArt(
  source: File | string,
  size: number,
  options: Omit<ReferenceOptions, 'targetWidth' | 'targetHeight' | 'tileSize'> & {
    tileSize?: PixelSize;
  },
): Promise<PixelBuffer> {
  const img = await loadImage(source);
  const sampled = sampleImage(img, size, size);
  const palette =
    options.paletteId === 'auto'
      ? extractPalette(sampled, options.colorCount)
      : paletteRgba(options.paletteId);

  if (options.dither) floydSteinberg(sampled, palette);
  else quantizeBuffer(sampled, palette);
  return sampled;
}

/** Build a location map by placing unique modular tiles from a reference */
export function assembleMapFromTiles(
  tiles: PixelBuffer[],
  cols: number,
  rows: number,
  tileSize: number,
): PixelBuffer {
  const map = createBuffer(cols * tileSize, rows * tileSize);
  if (tiles.length === 0) return map;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) % tiles.length;
      blit(map, tiles[idx]!, col * tileSize, row * tileSize, false);
    }
  }
  return map;
}
