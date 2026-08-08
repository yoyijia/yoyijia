export type AssetKind = 'character' | 'ui' | 'environment' | 'items';

export type PixelSize = 8 | 16 | 32 | 64 | 128 | 256 | 512;

export type Rgba = [number, number, number, number];

export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface Palette {
  id: string;
  name: string;
  colors: string[];
}

export interface AnimationClip {
  id: string;
  name: string;
  frameCount: number;
  fps: number;
  frames: PixelBuffer[];
}

export interface CharacterConfig {
  size: number;
  seed: number;
  archetype: CharacterArchetype;
  paletteId: string;
  outline: boolean;
  animation: CharacterAnimName;
  frameCount: number;
  fps: number;
}

export type CharacterArchetype =
  | 'hero'
  | 'mage'
  | 'rogue'
  | 'knight'
  | 'creature'
  | 'robot'
  | 'npc';

export type CharacterAnimName = 'idle' | 'walk' | 'attack' | 'jump' | 'hurt';

export interface UiConfig {
  size: PixelSize;
  seed: number;
  element: UiElement;
  paletteId: string;
  state: UiState;
}

export type UiElement =
  | 'panel'
  | 'button'
  | 'frame'
  | 'hp-bar'
  | 'mp-bar'
  | 'slot'
  | 'cursor'
  | 'window'
  | 'icon-badge';

export type UiState = 'default' | 'hover' | 'pressed' | 'disabled';

export interface EnvironmentConfig {
  tileSize: PixelSize;
  seed: number;
  biome: Biome;
  paletteId: string;
  mapCols: number;
  mapRows: number;
  mode: 'procedural' | 'reference';
}

export type Biome =
  | 'grassland'
  | 'forest'
  | 'desert'
  | 'coast'
  | 'mountain'
  | 'cave'
  | 'village'
  | 'ruins';

export interface ItemsConfig {
  tileSize: PixelSize;
  seed: number;
  category: ItemCategory;
  paletteId: string;
  cols: number;
  rows: number;
}

export type ItemCategory =
  | 'weapons'
  | 'armor'
  | 'potions'
  | 'tools'
  | 'food'
  | 'gems'
  | 'misc';

export interface ReferenceOptions {
  targetWidth: number;
  targetHeight: number;
  tileSize: PixelSize;
  colorCount: number;
  dither: boolean;
  paletteId: string | 'auto';
}
