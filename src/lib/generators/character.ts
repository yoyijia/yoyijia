import type {
  CharacterAnimName,
  CharacterArchetype,
  CharacterConfig,
  PixelBuffer,
  Rgba,
} from '../../types';
import { createRng, type Rng } from '../rng';
import { hexToRgba, paletteRgba } from '../palettes';
import {
  clear,
  cloneBuffer,
  createBuffer,
  fillCircle,
  fillRect,
  outlineOpaque,
  setPixel,
  shiftBuffer,
} from '../pixelEngine';

function bodyColors(palette: Rgba[], archetype: CharacterArchetype, rng: Rng) {
  const skin = palette[Math.min(palette.length - 1, 3)] ?? hexToRgba('#e8c39e');
  const shade = palette[Math.min(palette.length - 2, 2)] ?? hexToRgba('#c49a6c');
  const accent = palette[1] ?? hexToRgba('#e94560');
  const dark = palette[0] ?? hexToRgba('#1a1a2e');
  const light = palette[palette.length - 1] ?? hexToRgba('#ffffff');

  const outfits: Record<CharacterArchetype, Rgba> = {
    hero: accent,
    mage: palette[Math.min(2, palette.length - 1)]!,
    rogue: dark,
    knight: palette[Math.min(3, palette.length - 1)]!,
    creature: accent,
    robot: palette[Math.min(2, palette.length - 1)]!,
    npc: shade,
  };

  return {
    skin,
    shade,
    accent: outfits[archetype],
    dark,
    light,
    hair: rng.pick(palette),
    detail: rng.pick(palette),
  };
}

function drawBaseCharacter(
  size: number,
  archetype: CharacterArchetype,
  colors: ReturnType<typeof bodyColors>,
  rng: Rng,
): PixelBuffer {
  const buf = createBuffer(size, size);
  clear(buf);
  const s = size / 16;
  const px = (n: number) => Math.round(n * s);

  // legs
  fillRect(buf, px(5), px(11), px(2), px(4), colors.accent);
  fillRect(buf, px(9), px(11), px(2), px(4), colors.accent);
  fillRect(buf, px(5), px(14), px(2), px(1), colors.dark);
  fillRect(buf, px(9), px(14), px(2), px(1), colors.dark);

  // torso
  fillRect(buf, px(4), px(7), px(8), px(5), colors.accent);
  if (archetype === 'knight') {
    fillRect(buf, px(5), px(8), px(6), px(3), colors.light);
    fillRect(buf, px(7), px(7), px(2), px(5), colors.shade);
  } else if (archetype === 'mage') {
    fillRect(buf, px(3), px(7), px(10), px(7), colors.accent);
    fillRect(buf, px(6), px(8), px(4), px(2), colors.detail);
  } else if (archetype === 'rogue') {
    fillRect(buf, px(4), px(7), px(8), px(5), colors.dark);
    fillRect(buf, px(5), px(8), px(2), px(2), colors.accent);
  } else if (archetype === 'robot') {
    fillRect(buf, px(4), px(7), px(8), px(5), colors.shade);
    setPixel(buf, px(6), px(9), colors.detail);
    setPixel(buf, px(9), px(9), colors.detail);
  } else if (archetype === 'creature') {
    fillCircle(buf, px(8), px(10), px(4), colors.accent);
  }

  // arms
  fillRect(buf, px(2), px(7), px(2), px(4), colors.skin);
  fillRect(buf, px(12), px(7), px(2), px(4), colors.skin);

  // head
  fillRect(buf, px(5), px(2), px(6), px(5), colors.skin);
  fillRect(buf, px(5), px(2), px(6), px(2), colors.hair);
  if (archetype === 'mage') {
    // hat
    fillRect(buf, px(4), px(1), px(8), px(2), colors.accent);
    fillRect(buf, px(7), px(0), px(2), px(2), colors.detail);
  } else if (archetype === 'knight') {
    fillRect(buf, px(5), px(1), px(6), px(3), colors.shade);
    fillRect(buf, px(6), px(3), px(4), px(1), colors.dark);
  } else if (archetype === 'robot') {
    fillRect(buf, px(5), px(2), px(6), px(5), colors.shade);
    fillRect(buf, px(6), px(4), px(1), px(1), colors.light);
    fillRect(buf, px(9), px(4), px(1), px(1), colors.light);
  }

  // eyes
  if (archetype !== 'robot') {
    setPixel(buf, px(6), px(4), colors.dark);
    setPixel(buf, px(9), px(4), colors.dark);
  }

  // weapon / prop accents
  if (archetype === 'hero' || archetype === 'knight') {
    fillRect(buf, px(13), px(5), px(1), px(7), colors.shade);
    fillRect(buf, px(12), px(5), px(3), px(1), colors.light);
  } else if (archetype === 'mage') {
    fillRect(buf, px(13), px(4), px(1), px(8), colors.detail);
    fillCircle(buf, px(13), px(3), Math.max(1, px(1)), colors.light);
  } else if (archetype === 'rogue') {
    fillRect(buf, px(13), px(8), px(2), px(1), colors.light);
  }

  // noise speckles for personality
  for (let i = 0; i < Math.max(2, Math.floor(size / 16)); i++) {
    if (rng.chance(0.7)) {
      const x = rng.int(px(4), px(11));
      const y = rng.int(px(7), px(11));
      setPixel(buf, x, y, colors.shade);
    }
  }

  return buf;
}

function animateFrame(
  base: PixelBuffer,
  anim: CharacterAnimName,
  frame: number,
  frameCount: number,
  size: number,
): PixelBuffer {
  const t = frame / Math.max(1, frameCount);
  const s = size / 16;
  const px = (n: number) => Math.round(n * s);
  let out = cloneBuffer(base);

  switch (anim) {
    case 'idle': {
      const bob = Math.round(Math.sin(t * Math.PI * 2) * px(0.5));
      out = shiftBuffer(base, 0, bob);
      break;
    }
    case 'walk': {
      const phase = Math.sin(t * Math.PI * 2);
      const bob = Math.round(Math.abs(phase) * px(1));
      const sway = Math.round(phase * px(0.5));
      out = shiftBuffer(base, sway, -bob);
      // leg stride hint: clear bottom and redraw offset feet
      const footY = out.height - Math.max(1, px(2));
      for (let x = 0; x < out.width; x++) {
        for (let y = footY; y < out.height; y++) {
          setPixel(out, x, y, [0, 0, 0, 0]);
        }
      }
      const c = getOpaqueSample(base, Math.floor(base.width / 2), footY - 1);
      fillRect(out, px(5) + Math.round(phase * px(1)), footY, px(2), px(2), c);
      fillRect(out, px(9) - Math.round(phase * px(1)), footY, px(2), px(2), c);
      break;
    }
    case 'attack': {
      const lunge = frame < frameCount / 2 ? px(2) : 0;
      out = shiftBuffer(base, lunge, 0);
      if (frame >= frameCount / 2) {
        // slash flash
        const flash: Rgba = [255, 240, 180, 220];
        fillRect(out, px(12), px(4), px(3), px(1), flash);
        fillRect(out, px(13), px(5), px(2), px(1), flash);
      }
      break;
    }
    case 'jump': {
      const apex = Math.sin(t * Math.PI);
      out = shiftBuffer(base, 0, -Math.round(apex * px(3)));
      break;
    }
    case 'hurt': {
      const shake = frame % 2 === 0 ? px(1) : -px(1);
      out = shiftBuffer(base, shake, 0);
      // flash red tint on some pixels
      if (frame % 2 === 0) {
        for (let y = 0; y < out.height; y++) {
          for (let x = 0; x < out.width; x++) {
            const i = (y * out.width + x) * 4;
            if (out.data[i + 3]! > 0) {
              out.data[i] = Math.min(255, out.data[i]! + 80);
            }
          }
        }
      }
      break;
    }
  }

  return out;
}

function getOpaqueSample(buf: PixelBuffer, x: number, y: number): Rgba {
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const i = ((y - dy) * buf.width + (x + dx)) * 4;
      if (i >= 0 && buf.data[i + 3]! > 0) {
        return [buf.data[i]!, buf.data[i + 1]!, buf.data[i + 2]!, 255];
      }
    }
  }
  return [60, 60, 60, 255];
}

export function generateCharacter(config: CharacterConfig): {
  frames: PixelBuffer[];
  preview: PixelBuffer;
} {
  const rng = createRng(config.seed);
  const palette = paletteRgba(config.paletteId);
  const colors = bodyColors(palette, config.archetype, rng);
  const base = drawBaseCharacter(config.size, config.archetype, colors, rng);

  if (config.outline) {
    outlineOpaque(base, colors.dark);
  }

  const frames: PixelBuffer[] = [];
  for (let i = 0; i < config.frameCount; i++) {
    frames.push(
      animateFrame(base, config.animation, i, config.frameCount, config.size),
    );
  }

  return { frames, preview: frames[0]! };
}

export const ARCHETYPES: { id: CharacterArchetype; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'mage', label: 'Mage' },
  { id: 'rogue', label: 'Rogue' },
  { id: 'knight', label: 'Knight' },
  { id: 'creature', label: 'Creature' },
  { id: 'robot', label: 'Robot' },
  { id: 'npc', label: 'NPC' },
];

export const ANIMATIONS: { id: CharacterAnimName; label: string; frames: number }[] = [
  { id: 'idle', label: 'Idle', frames: 4 },
  { id: 'walk', label: 'Walk', frames: 6 },
  { id: 'attack', label: 'Attack', frames: 4 },
  { id: 'jump', label: 'Jump', frames: 4 },
  { id: 'hurt', label: 'Hurt', frames: 3 },
];
