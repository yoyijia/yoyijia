import type { PixelBuffer, Rgba } from '../types';
import { nearestColor } from './palettes';

export function createBuffer(width: number, height: number): PixelBuffer {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

export function cloneBuffer(buf: PixelBuffer): PixelBuffer {
  return {
    width: buf.width,
    height: buf.height,
    data: new Uint8ClampedArray(buf.data),
  };
}

export function clear(buf: PixelBuffer, color: Rgba = [0, 0, 0, 0]): void {
  const { data } = buf;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
}

export function setPixel(
  buf: PixelBuffer,
  x: number,
  y: number,
  color: Rgba,
): void {
  if (x < 0 || y < 0 || x >= buf.width || y >= buf.height) return;
  const i = (y * buf.width + x) * 4;
  buf.data[i] = color[0];
  buf.data[i + 1] = color[1];
  buf.data[i + 2] = color[2];
  buf.data[i + 3] = color[3];
}

export function getPixel(buf: PixelBuffer, x: number, y: number): Rgba {
  if (x < 0 || y < 0 || x >= buf.width || y >= buf.height) {
    return [0, 0, 0, 0];
  }
  const i = (y * buf.width + x) * 4;
  return [buf.data[i]!, buf.data[i + 1]!, buf.data[i + 2]!, buf.data[i + 3]!];
}

export function fillRect(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgba,
): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(buf, px, py, color);
    }
  }
}

export function strokeRect(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgba,
): void {
  for (let px = x; px < x + w; px++) {
    setPixel(buf, px, y, color);
    setPixel(buf, px, y + h - 1, color);
  }
  for (let py = y; py < y + h; py++) {
    setPixel(buf, x, py, color);
    setPixel(buf, x + w - 1, py, color);
  }
}

export function fillCircle(
  buf: PixelBuffer,
  cx: number,
  cy: number,
  r: number,
  color: Rgba,
): void {
  const r2 = r * r;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r2) setPixel(buf, cx + x, cy + y, color);
    }
  }
}

export function drawLine(
  buf: PixelBuffer,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgba,
): void {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPixel(buf, x, y, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

export function blit(
  dest: PixelBuffer,
  src: PixelBuffer,
  dx: number,
  dy: number,
  ignoreTransparent = true,
): void {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const c = getPixel(src, x, y);
      if (ignoreTransparent && c[3] === 0) continue;
      setPixel(dest, dx + x, dy + y, c);
    }
  }
}

export function outlineOpaque(buf: PixelBuffer, color: Rgba): void {
  const mask: boolean[] = [];
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      mask.push(getPixel(buf, x, y)[3] > 0);
    }
  }
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      if (mask[y * buf.width + x]) continue;
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      if (
        neighbors.some(
          ([nx, ny]) =>
            nx! >= 0 &&
            ny! >= 0 &&
            nx! < buf.width &&
            ny! < buf.height &&
            mask[ny! * buf.width + nx!],
        )
      ) {
        setPixel(buf, x, y, color);
      }
    }
  }
}

export function scaleNearest(
  src: PixelBuffer,
  scale: number,
): PixelBuffer {
  const dest = createBuffer(src.width * scale, src.height * scale);
  for (let y = 0; y < dest.height; y++) {
    for (let x = 0; x < dest.width; x++) {
      setPixel(dest, x, y, getPixel(src, Math.floor(x / scale), Math.floor(y / scale)));
    }
  }
  return dest;
}

export function quantizeBuffer(buf: PixelBuffer, palette: Rgba[]): void {
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      const c = getPixel(buf, x, y);
      if (c[3] < 16) {
        setPixel(buf, x, y, [0, 0, 0, 0]);
        continue;
      }
      setPixel(buf, x, y, nearestColor(c, palette));
    }
  }
}

export function opaqueBounds(buf: PixelBuffer): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  let minX = buf.width;
  let minY = buf.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      if (getPixel(buf, x, y)[3]! > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

/**
 * Center a sprite in its frame: horizontally centered, feet on a shared baseline.
 * Keeps walk/wave animation cells aligned in a spritesheet.
 */
export function centerSprite(
  buf: PixelBuffer,
  options: { bottomPad?: number } = {},
): PixelBuffer {
  const bounds = opaqueBounds(buf);
  if (!bounds) return buf;
  const bottomPad =
    options.bottomPad ?? Math.max(1, Math.round(buf.height * 0.06));
  const spriteW = bounds.maxX - bounds.minX + 1;
  const spriteH = bounds.maxY - bounds.minY + 1;
  const dx = Math.round((buf.width - spriteW) / 2) - bounds.minX;
  const dy = buf.height - bottomPad - spriteH - bounds.minY;
  return shiftBuffer(buf, dx, dy);
}

export function stitchHorizontal(frames: PixelBuffer[]): PixelBuffer {
  if (frames.length === 0) return createBuffer(1, 1);
  const h = frames[0]!.height;
  const w = frames.reduce((s, f) => s + f.width, 0);
  const out = createBuffer(w, h);
  let x = 0;
  for (const f of frames) {
    blit(out, f, x, 0, false);
    x += f.width;
  }
  return out;
}

export function stitchRows(rows: PixelBuffer[][]): PixelBuffer {
  if (rows.length === 0) return createBuffer(1, 1);
  const strips = rows.map((row) => stitchHorizontal(row));
  const width = Math.max(...strips.map((s) => s.width));
  const height = strips.reduce((s, r) => s + r.height, 0);
  const out = createBuffer(width, height);
  let y = 0;
  for (const strip of strips) {
    blit(out, strip, 0, y, false);
    y += strip.height;
  }
  return out;
}

export function stitchGrid(
  tiles: PixelBuffer[],
  cols: number,
): PixelBuffer {
  if (tiles.length === 0) return createBuffer(1, 1);
  const tw = tiles[0]!.width;
  const th = tiles[0]!.height;
  const rows = Math.ceil(tiles.length / cols);
  const out = createBuffer(cols * tw, rows * th);
  tiles.forEach((tile, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    blit(out, tile, col * tw, row * th, false);
  });
  return out;
}

export function bufferToCanvas(buf: PixelBuffer): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = buf.width;
  canvas.height = buf.height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(buf.width, buf.height);
  imageData.data.set(buf.data);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function drawBufferToCanvas(
  canvas: HTMLCanvasElement,
  buf: PixelBuffer,
  scale = 1,
  checker = true,
): void {
  const w = buf.width * scale;
  const h = buf.height * scale;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  if (checker) {
    const cell = Math.max(4, scale);
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const odd = ((x / cell) | 0) + ((y / cell) | 0);
        ctx.fillStyle = odd % 2 === 0 ? '#1a242c' : '#141c22';
        ctx.fillRect(x, y, cell, cell);
      }
    }
  } else {
    ctx.clearRect(0, 0, w, h);
  }

  const tmp = bufferToCanvas(buf);
  ctx.drawImage(tmp, 0, 0, w, h);
}

export function downloadBuffer(
  buf: PixelBuffer,
  filename: string,
  scale = 1,
): void {
  const scaled = scale > 1 ? scaleNearest(buf, scale) : buf;
  const canvas = bufferToCanvas(scaled);
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export function shiftBuffer(
  src: PixelBuffer,
  dx: number,
  dy: number,
): PixelBuffer {
  const out = createBuffer(src.width, src.height);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      setPixel(out, x, y, getPixel(src, x - dx, y - dy));
    }
  }
  return out;
}
