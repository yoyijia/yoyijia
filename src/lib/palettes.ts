import type { Palette, Rgba } from '../types';

export const PALETTES: Palette[] = [
  {
    id: 'gameboy',
    name: 'Phosphor',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  {
    id: 'sunset',
    name: 'Sunset Arcade',
    colors: ['#1a1a2e', '#e94560', '#ff9a3c', '#f6e58d', '#3d5a80', '#ffffff'],
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    colors: ['#1b1b1b', '#2d4a22', '#5a8f3c', '#a8d08d', '#c4a35a', '#efe9d9'],
  },
  {
    id: 'ocean',
    name: 'Tide Pool',
    colors: ['#0a1628', '#1b4f72', '#2e86ab', '#5ad1e6', '#a8e6cf', '#f0f7f4'],
  },
  {
    id: 'ember',
    name: 'Ember Forge',
    colors: ['#1c1210', '#5c2a1a', '#c45c26', '#f0a500', '#ffe7a0', '#fff8e7'],
  },
  {
    id: 'mono',
    name: 'Ink Wash',
    colors: ['#0d0d0d', '#3a3a3a', '#7a7a7a', '#b8b8b8', '#ebebeb'],
  },
  {
    id: 'candy',
    name: 'Candy Pop',
    colors: ['#2b1e3e', '#ff6b9d', '#ffc93c', '#6bcb77', '#4d96ff', '#ffffff'],
  },
  {
    id: 'steel',
    name: 'Steel City',
    colors: ['#12151a', '#2c3540', '#5c6b7a', '#8fa3b5', '#d4e0ea', '#ffb347'],
  },
];

export function hexToRgba(hex: string): Rgba {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function rgbaToHex([r, g, b]: Rgba): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

export function paletteRgba(id: string): Rgba[] {
  return getPalette(id).colors.map(hexToRgba);
}

export function nearestColor(color: Rgba, palette: Rgba[]): Rgba {
  let best = palette[0]!;
  let bestDist = Infinity;
  for (const p of palette) {
    const dr = color[0] - p[0];
    const dg = color[1] - p[1];
    const db = color[2] - p[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}
