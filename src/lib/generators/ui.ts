import type { PixelBuffer, Rgba, UiConfig, UiElement, UiState } from '../../types';
import { createRng } from '../rng';
import { paletteRgba } from '../palettes';
import {
  clear,
  createBuffer,
  fillRect,
  setPixel,
  strokeRect,
} from '../pixelEngine';

function stateTint(base: Rgba, state: UiState): Rgba {
  if (state === 'hover') {
    return [
      Math.min(255, base[0] + 30),
      Math.min(255, base[1] + 30),
      Math.min(255, base[2] + 30),
      255,
    ];
  }
  if (state === 'pressed') {
    return [
      Math.max(0, base[0] - 30),
      Math.max(0, base[1] - 30),
      Math.max(0, base[2] - 30),
      255,
    ];
  }
  if (state === 'disabled') {
    const g = Math.round((base[0] + base[1] + base[2]) / 3);
    return [g, g, g, 180];
  }
  return base;
}

function drawPanel(buf: PixelBuffer, colors: Rgba[], state: UiState) {
  const bg = stateTint(colors[1] ?? [40, 50, 60, 255], state);
  const border = colors[0] ?? [10, 10, 10, 255];
  const hi = colors[colors.length - 1] ?? [240, 240, 240, 255];
  fillRect(buf, 0, 0, buf.width, buf.height, bg);
  strokeRect(buf, 0, 0, buf.width, buf.height, border);
  strokeRect(buf, 1, 1, buf.width - 2, buf.height - 2, hi);
  // corner studs
  const s = Math.max(1, Math.floor(buf.width / 16));
  fillRect(buf, 2, 2, s, s, hi);
  fillRect(buf, buf.width - 2 - s, 2, s, s, hi);
  fillRect(buf, 2, buf.height - 2 - s, s, s, hi);
  fillRect(buf, buf.width - 2 - s, buf.height - 2 - s, s, s, hi);
}

function drawButton(buf: PixelBuffer, colors: Rgba[], state: UiState) {
  const face = stateTint(colors[2] ?? [80, 140, 100, 255], state);
  const border = colors[0] ?? [10, 10, 10, 255];
  const hi = colors[colors.length - 1] ?? [240, 240, 240, 255];
  const shadow = colors[1] ?? [30, 30, 30, 255];
  const yOff = state === 'pressed' ? 1 : 0;

  fillRect(buf, 1, 2, buf.width - 2, buf.height - 3, shadow);
  fillRect(buf, 1, yOff, buf.width - 2, buf.height - 3, face);
  strokeRect(buf, 1, yOff, buf.width - 2, buf.height - 3, border);
  // highlight line
  for (let x = 2; x < buf.width - 2; x++) {
    setPixel(buf, x, yOff + 1, hi);
  }
  // label bar
  const lw = Math.floor(buf.width * 0.5);
  const lx = Math.floor((buf.width - lw) / 2);
  const ly = Math.floor(buf.height / 2) - 1 + yOff;
  fillRect(buf, lx, ly, lw, Math.max(1, Math.floor(buf.height / 8)), border);
}

function drawFrame(buf: PixelBuffer, colors: Rgba[]) {
  const border = colors[0]!;
  const mid = colors[2] ?? colors[1]!;
  const hi = colors[colors.length - 1]!;
  clear(buf);
  const t = Math.max(2, Math.floor(buf.width / 16));
  fillRect(buf, 0, 0, buf.width, t, mid);
  fillRect(buf, 0, buf.height - t, buf.width, t, mid);
  fillRect(buf, 0, 0, t, buf.height, mid);
  fillRect(buf, buf.width - t, 0, t, buf.height, mid);
  strokeRect(buf, 0, 0, buf.width, buf.height, border);
  strokeRect(buf, t - 1, t - 1, buf.width - 2 * t + 2, buf.height - 2 * t + 2, hi);
}

function drawBar(
  buf: PixelBuffer,
  colors: Rgba[],
  fillColor: Rgba,
  state: UiState,
) {
  const border = colors[0]!;
  const track = colors[1]!;
  fillRect(buf, 0, 0, buf.width, buf.height, track);
  strokeRect(buf, 0, 0, buf.width, buf.height, border);
  const pct = state === 'disabled' ? 0.2 : state === 'pressed' ? 0.45 : 0.72;
  const fw = Math.max(1, Math.floor((buf.width - 4) * pct));
  fillRect(buf, 2, 2, fw, buf.height - 4, stateTint(fillColor, state));
  // shine
  fillRect(buf, 2, 2, fw, Math.max(1, Math.floor((buf.height - 4) / 3)), [
    Math.min(255, fillColor[0] + 40),
    Math.min(255, fillColor[1] + 40),
    Math.min(255, fillColor[2] + 40),
    255,
  ]);
}

function drawSlot(buf: PixelBuffer, colors: Rgba[], state: UiState) {
  const bg = stateTint(colors[1]!, state);
  const border = colors[0]!;
  const hi = colors[colors.length - 1]!;
  fillRect(buf, 0, 0, buf.width, buf.height, bg);
  strokeRect(buf, 0, 0, buf.width, buf.height, border);
  strokeRect(buf, 1, 1, buf.width - 2, buf.height - 2, [
    Math.max(0, bg[0] - 20),
    Math.max(0, bg[1] - 20),
    Math.max(0, bg[2] - 20),
    255,
  ]);
  // empty diamond hint
  const cx = Math.floor(buf.width / 2);
  const cy = Math.floor(buf.height / 2);
  const r = Math.max(2, Math.floor(buf.width / 6));
  for (let i = -r; i <= r; i++) {
    setPixel(buf, cx + i, cy - (r - Math.abs(i)), hi);
    setPixel(buf, cx + i, cy + (r - Math.abs(i)), hi);
  }
}

function drawCursor(buf: PixelBuffer, colors: Rgba[]) {
  clear(buf);
  const c = colors[colors.length - 1]!;
  const d = colors[0]!;
  const points = [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 2],
    [2, 3],
    [2, 5],
    [3, 3],
    [3, 6],
    [4, 4],
    [4, 7],
  ];
  const scale = Math.max(1, Math.floor(buf.width / 8));
  for (const [x, y] of points) {
    fillRect(buf, x! * scale, y! * scale, scale, scale, c);
  }
  // outline
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      const i = (y * buf.width + x) * 4;
      if (buf.data[i + 3]! === 0) {
        const n =
          (x > 0 && buf.data[(y * buf.width + x - 1) * 4 + 3]! > 0) ||
          (x < buf.width - 1 && buf.data[(y * buf.width + x + 1) * 4 + 3]! > 0) ||
          (y > 0 && buf.data[((y - 1) * buf.width + x) * 4 + 3]! > 0) ||
          (y < buf.height - 1 && buf.data[((y + 1) * buf.width + x) * 4 + 3]! > 0);
        if (n) {
          buf.data[i] = d[0];
          buf.data[i + 1] = d[1];
          buf.data[i + 2] = d[2];
          buf.data[i + 3] = 255;
        }
      }
    }
  }
}

function drawWindow(buf: PixelBuffer, colors: Rgba[], state: UiState) {
  drawPanel(buf, colors, state);
  const titleH = Math.max(4, Math.floor(buf.height / 6));
  const accent = colors[2] ?? colors[1]!;
  fillRect(buf, 2, 2, buf.width - 4, titleH, stateTint(accent, state));
  // close button
  const bs = Math.max(2, Math.floor(titleH * 0.6));
  fillRect(buf, buf.width - 4 - bs, 3, bs, bs, colors[0]!);
}

function drawIconBadge(buf: PixelBuffer, colors: Rgba[], state: UiState, seed: number) {
  const rng = createRng(seed);
  clear(buf);
  const border = colors[0]!;
  const fill = stateTint(colors[Math.min(2, colors.length - 1)]!, state);
  const hi = colors[colors.length - 1]!;
  // circle-ish badge
  const cx = Math.floor(buf.width / 2);
  const cy = Math.floor(buf.height / 2);
  const r = Math.floor(Math.min(buf.width, buf.height) / 2) - 1;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(buf, cx + x, cy + y, fill);
    }
  }
  strokeRing(buf, cx, cy, r, border);
  // glyph
  const g = rng.int(0, 2);
  if (g === 0) {
    fillRect(buf, cx - 1, cy - Math.floor(r / 2), 2, r, hi);
    fillRect(buf, cx - Math.floor(r / 2), cy - 1, r, 2, hi);
  } else if (g === 1) {
    fillRect(buf, cx - Math.floor(r / 3), cy - Math.floor(r / 3), Math.floor((r * 2) / 3), Math.floor((r * 2) / 3), hi);
  } else {
    fillRect(buf, cx - 1, cy - Math.floor(r / 2), 2, r - 1, hi);
  }
}

function strokeRing(buf: PixelBuffer, cx: number, cy: number, r: number, color: Rgba) {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180;
    setPixel(buf, Math.round(cx + Math.cos(rad) * r), Math.round(cy + Math.sin(rad) * r), color);
  }
}

export function generateUi(config: UiConfig): PixelBuffer {
  const colors = paletteRgba(config.paletteId);
  const buf = createBuffer(config.size, config.size);
  clear(buf);

  const drawers: Record<UiElement, () => void> = {
    panel: () => drawPanel(buf, colors, config.state),
    button: () => drawButton(buf, colors, config.state),
    frame: () => drawFrame(buf, colors),
    'hp-bar': () => drawBar(buf, colors, [220, 60, 60, 255], config.state),
    'mp-bar': () => drawBar(buf, colors, [60, 120, 220, 255], config.state),
    slot: () => drawSlot(buf, colors, config.state),
    cursor: () => drawCursor(buf, colors),
    window: () => drawWindow(buf, colors, config.state),
    'icon-badge': () => drawIconBadge(buf, colors, config.state, config.seed),
  };

  drawers[config.element]();
  return buf;
}

export const UI_ELEMENTS: { id: UiElement; label: string }[] = [
  { id: 'panel', label: 'Panel' },
  { id: 'button', label: 'Button' },
  { id: 'frame', label: 'Frame' },
  { id: 'window', label: 'Window' },
  { id: 'hp-bar', label: 'HP Bar' },
  { id: 'mp-bar', label: 'MP Bar' },
  { id: 'slot', label: 'Item Slot' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'icon-badge', label: 'Icon Badge' },
];

export const UI_STATES: { id: UiState; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'hover', label: 'Hover' },
  { id: 'pressed', label: 'Pressed' },
  { id: 'disabled', label: 'Disabled' },
];

/** Generate a modular UI kit tilesheet (all elements × states) */
export function generateUiKit(
  size: UiConfig['size'],
  paletteId: string,
  seed: number,
): PixelBuffer[] {
  const tiles: PixelBuffer[] = [];
  for (const el of UI_ELEMENTS) {
    for (const st of UI_STATES) {
      tiles.push(
        generateUi({
          size,
          seed: seed + tiles.length * 17,
          element: el.id,
          paletteId,
          state: st.id,
        }),
      );
    }
  }
  return tiles;
}
