import type {
  CharacterAnimName,
  CharacterConfig,
  CharacterDirection,
  CharacterPreset,
  PixelBuffer,
  Rgba,
} from '../../types';
import { hexToRgba } from '../palettes';
import {
  centerSprite,
  clear,
  createBuffer,
  fillRect,
  getPixel,
  outlineOpaque,
  setPixel,
  stitchRows,
} from '../pixelEngine';

/**
 * Chibi reference style:
 * - head ~45–50% of sprite height
 * - short torso/legs
 * - thick black outline
 * - centered baseline for animation
 */

type CharColors = {
  outline: Rgba;
  skin: Rgba;
  skinShade: Rgba;
  hair: Rgba;
  shirt: Rgba;
  shirtShade: Rgba;
  pants: Rgba;
  shoes: Rgba;
  accent: Rgba;
  accent2: Rgba;
  mouth: Rgba;
};

const PRESET_COLORS: Record<CharacterPreset, CharColors> = {
  curly: {
    outline: hexToRgba('#1c1c1c'),
    skin: hexToRgba('#f3c79a'),
    skinShade: hexToRgba('#e0a978'),
    hair: hexToRgba('#1c1c1c'),
    shirt: hexToRgba('#e8837a'),
    shirtShade: hexToRgba('#c96660'),
    pants: hexToRgba('#2d4f8c'),
    shoes: hexToRgba('#1c1c1c'),
    accent: hexToRgba('#4faf6b'),
    accent2: hexToRgba('#3a8f54'),
    mouth: hexToRgba('#c96660'),
  },
  worker: {
    outline: hexToRgba('#1c1c1c'),
    skin: hexToRgba('#f3c79a'),
    skinShade: hexToRgba('#e0a978'),
    hair: hexToRgba('#1c1c1c'),
    shirt: hexToRgba('#d83c3c'),
    shirtShade: hexToRgba('#b02e2e'),
    pants: hexToRgba('#2a2a2a'),
    shoes: hexToRgba('#1c1c1c'),
    accent: hexToRgba('#222222'),
    accent2: hexToRgba('#f5f5f5'),
    mouth: hexToRgba('#c96660'),
  },
  cap: {
    outline: hexToRgba('#1c1c1c'),
    skin: hexToRgba('#f3c79a'),
    skinShade: hexToRgba('#e0a978'),
    hair: hexToRgba('#6a4634'),
    shirt: hexToRgba('#f4f4f4'),
    shirtShade: hexToRgba('#d8d8d8'),
    pants: hexToRgba('#3a6ea8'),
    shoes: hexToRgba('#1c1c1c'),
    accent: hexToRgba('#1c1c1c'),
    accent2: hexToRgba('#ffffff'),
    mouth: hexToRgba('#c96660'),
  },
};

type Pose = {
  dir: CharacterDirection;
  arm: 'down' | 'swing-a' | 'swing-b' | 'wave' | 'think';
  leg: 'idle' | 'a' | 'b';
  bob: number;
  bustOnly?: boolean;
};

function u(size: number) {
  // Design grid: 32 units tall. Head occupies ~0..14
  const s = size / 32;
  return (n: number) => Math.round(n * s);
}

function oval(
  buf: PixelBuffer,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: Rgba,
) {
  const rx2 = Math.max(1, rx * rx);
  const ry2 = Math.max(1, ry * ry);
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if (x * x / rx2 + y * y / ry2 <= 1.05) setPixel(buf, cx + x, cy + y, color);
    }
  }
}

function disc(buf: PixelBuffer, cx: number, cy: number, r: number, color: Rgba) {
  oval(buf, cx, cy, r, r, color);
}

function drawChibiHead(
  buf: PixelBuffer,
  preset: CharacterPreset,
  dir: CharacterDirection,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  top: number,
  expression: 'neutral' | 'smile' | 'think',
) {
  const headCy = top + px(7);
  const headRx = px(7);
  const headRy = px(7);
  const skin = dir === 'up' ? c.skinShade : c.skin;

  // big round head
  oval(buf, cx, headCy, headRx, headRy, skin);

  if (preset === 'curly') {
    // dense afro halo
    const curls: [number, number, number][] = [
      [0, -6, 5],
      [-5, -4, 4],
      [5, -4, 4],
      [-7, 0, 4],
      [7, 0, 4],
      [-6, 4, 4],
      [6, 4, 4],
      [-3, -7, 3],
      [3, -7, 3],
      [0, -8, 3],
    ];
    for (const [ox, oy, r] of curls) {
      if (dir === 'left' && ox > 3) continue;
      if (dir === 'right' && ox < -3) continue;
      disc(buf, cx + px(ox), headCy + px(oy), px(r), c.hair);
    }
    // face window
    if (dir !== 'up') {
      oval(buf, cx, headCy + px(1), px(5), px(5), skin);
    }
  } else if (preset === 'worker') {
    // hair bowl
    oval(buf, cx, top + px(4), px(7), px(4), c.hair);
    // bun
    disc(buf, cx + (dir === 'left' ? -px(1) : dir === 'right' ? px(1) : 0), top + px(1), px(3), c.hair);
    if (dir === 'down') {
      fillRect(buf, cx - px(7), top + px(6), px(2), px(5), c.hair);
      fillRect(buf, cx + px(5), top + px(6), px(2), px(5), c.hair);
    } else if (dir === 'up') {
      fillRect(buf, cx - px(7), top + px(5), px(14), px(5), c.hair);
    } else {
      const back = dir === 'left' ? 1 : -1;
      fillRect(buf, cx + back * px(5), top + px(6), px(2), px(5), c.hair);
    }
    // red visor over forehead
    if (dir !== 'up') {
      if (dir === 'down') {
        fillRect(buf, cx - px(6), top + px(5), px(12), px(3), c.shirt);
        fillRect(buf, cx - px(6), top + px(5), px(12), px(1), c.shirtShade);
      } else {
        const side = dir === 'left' ? -1 : 1;
        fillRect(
          buf,
          cx + (side < 0 ? -px(6) : -px(1)),
          top + px(5),
          px(7),
          px(3),
          c.shirt,
        );
      }
    }
  } else {
    // short hair under backwards cap
    if (dir !== 'up') {
      fillRect(buf, cx - px(5), top + px(5), px(10), px(3), c.hair);
    }
    oval(buf, cx, top + px(4), px(7), px(4), c.accent);
    if (dir === 'down') {
      // backwards: adjustable strap facing camera
      fillRect(buf, cx - px(2), top + px(5), px(4), px(2), c.accent2);
      fillRect(buf, cx + px(3), top + px(2), px(3), px(3), c.accent);
    } else if (dir === 'up') {
      fillRect(buf, cx - px(7), top + px(5), px(14), px(3), c.accent);
    } else {
      const side = dir === 'left' ? -1 : 1;
      fillRect(buf, cx + side * px(3), top + px(5), px(5), px(2), c.accent);
    }
  }

  if (dir === 'up') return;

  // eyes — simple dots, spaced for big head
  const eyeY = top + px(8);
  if (dir === 'down') {
    setPixel(buf, cx - px(3), eyeY, c.outline);
    setPixel(buf, cx - px(2), eyeY, c.outline);
    setPixel(buf, cx + px(2), eyeY, c.outline);
    setPixel(buf, cx + px(3), eyeY, c.outline);
    if (sizeHint(buf) >= 48) {
      setPixel(buf, cx - px(3), eyeY + px(1), c.outline);
      setPixel(buf, cx + px(3), eyeY + px(1), c.outline);
    }
    if (expression === 'smile') {
      fillRect(buf, cx - px(2), eyeY + px(3), px(4), px(1), c.mouth);
      setPixel(buf, cx - px(2), eyeY + px(2), c.mouth);
      setPixel(buf, cx + px(1), eyeY + px(2), c.mouth);
    } else if (expression === 'think') {
      setPixel(buf, cx + px(1), eyeY + px(3), c.outline);
    } else {
      setPixel(buf, cx, eyeY + px(3), c.mouth);
    }
  } else {
    const side = dir === 'left' ? -1 : 1;
    setPixel(buf, cx + side * px(3), eyeY, c.outline);
    setPixel(buf, cx + side * px(2), eyeY, c.outline);
    if (expression !== 'neutral') {
      setPixel(buf, cx + side * px(2), eyeY + px(3), c.mouth);
    }
  }
}

function sizeHint(buf: PixelBuffer) {
  return buf.width;
}

function drawBody(
  buf: PixelBuffer,
  preset: CharacterPreset,
  dir: CharacterDirection,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  torsoY: number,
  bustOnly: boolean,
) {
  const torsoW = px(9);
  const torsoH = bustOnly ? px(5) : px(7);
  fillRect(buf, cx - Math.floor(torsoW / 2), torsoY, torsoW, torsoH, c.shirt);
  fillRect(
    buf,
    cx - Math.floor(torsoW / 2),
    torsoY + torsoH - px(2),
    torsoW,
    px(1),
    c.shirtShade,
  );

  if (preset === 'worker') {
    // apron panel
    fillRect(buf, cx - px(4), torsoY + px(2), px(8), bustOnly ? px(4) : px(6), c.accent);
    if (dir === 'down') {
      fillRect(buf, cx + px(1), torsoY + px(3), px(2), px(2), c.accent2);
      setPixel(buf, cx + px(1), torsoY + px(3), c.shirt);
    }
    if (dir === 'up') {
      for (let i = 0; i < px(5); i++) {
        setPixel(buf, cx - px(3) + i, torsoY + px(1) + i, c.accent);
        setPixel(buf, cx + px(3) - i, torsoY + px(1) + i, c.accent);
      }
    }
  }

  if (preset === 'curly' && !bustOnly) {
    const bagX = dir === 'left' ? cx - px(8) : dir === 'right' ? cx + px(4) : cx + px(4);
    if (dir !== 'up') {
      fillRect(buf, bagX, torsoY + px(1), px(4), px(5), c.accent);
      fillRect(buf, bagX + px(1), torsoY + px(2), px(2), px(2), c.accent2);
    }
  }

  if (preset === 'cap' && !bustOnly) {
    if (dir === 'down') {
      for (let i = 0; i < px(7); i++) {
        setPixel(buf, cx - px(3) + i, torsoY + Math.floor(i * 0.6), c.accent2);
      }
      fillRect(buf, cx + px(3), torsoY + px(2), px(4), px(5), c.accent);
    } else if (dir === 'up') {
      for (let i = 0; i < px(7); i++) {
        setPixel(buf, cx + px(3) - i, torsoY + Math.floor(i * 0.6), c.accent2);
      }
      fillRect(buf, cx - px(7), torsoY + px(2), px(4), px(5), c.accent);
    } else if (dir === 'right') {
      fillRect(buf, cx - px(7), torsoY + px(1), px(3), px(5), c.accent);
    } else {
      fillRect(buf, cx + px(4), torsoY + px(1), px(3), px(5), c.accent);
    }
  }
}

function drawArms(
  buf: PixelBuffer,
  pose: Pose,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  torsoY: number,
) {
  const baseY = torsoY + px(1);
  if (pose.dir === 'down' || pose.dir === 'up') {
    if (pose.arm === 'wave') {
      fillRect(buf, cx - px(6), baseY, px(2), px(4), c.skin);
      fillRect(buf, cx + px(4), baseY - px(5), px(2), px(6), c.skin);
      fillRect(buf, cx + px(4), baseY - px(6), px(3), px(2), c.skin);
    } else if (pose.arm === 'think') {
      fillRect(buf, cx - px(6), baseY, px(2), px(3), c.skin);
      fillRect(buf, cx + px(2), baseY - px(3), px(2), px(5), c.skin);
      fillRect(buf, cx, torsoY - px(1), px(3), px(2), c.skin);
    } else {
      const a = pose.arm === 'swing-a' ? px(1) : pose.arm === 'swing-b' ? -px(1) : 0;
      fillRect(buf, cx - px(6), baseY + a, px(2), px(4), c.skin);
      fillRect(buf, cx + px(4), baseY - a, px(2), px(4), c.skin);
    }
  } else {
    const front = pose.dir === 'left' ? -1 : 1;
    let ax = cx + front * px(1);
    let ay = baseY;
    if (pose.arm === 'swing-a') {
      ax += front * px(2);
      ay += px(1);
    } else if (pose.arm === 'swing-b') {
      ax -= front * px(1);
    } else if (pose.arm === 'wave') {
      ay -= px(5);
      ax += front * px(2);
    } else if (pose.arm === 'think') {
      ay -= px(3);
      ax += front * px(2);
    }
    fillRect(buf, ax, ay, px(2), px(4), c.skin);
  }
}

function drawLegs(
  buf: PixelBuffer,
  pose: Pose,
  preset: CharacterPreset,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  hipY: number,
) {
  if (pose.bustOnly) return;
  const short = preset === 'curly';
  const pantH = short ? px(3) : px(5);
  const w = px(3);

  if (pose.dir === 'left' || pose.dir === 'right') {
    const fwd = pose.leg === 'idle' ? 0 : px(2);
    const back = pose.leg === 'idle' ? 0 : -px(1);
    fillRect(buf, cx - px(1) + back, hipY, w, pantH, c.pants);
    fillRect(buf, cx - px(1) + back, hipY + pantH, w, px(2), c.shoes);
    fillRect(buf, cx - px(1) + fwd, hipY, w, pantH, c.pants);
    fillRect(buf, cx - px(1) + fwd, hipY + pantH, w, px(2), c.shoes);
    return;
  }

  let ly = 0;
  let ry = 0;
  if (pose.leg === 'a') {
    ly = -px(1);
    ry = px(1);
  } else if (pose.leg === 'b') {
    ly = px(1);
    ry = -px(1);
  }
  fillRect(buf, cx - px(4), hipY + ly, w, pantH, c.pants);
  fillRect(buf, cx + px(1), hipY + ry, w, pantH, c.pants);
  fillRect(buf, cx - px(4), hipY + pantH + ly, w, px(2), c.shoes);
  fillRect(buf, cx + px(1), hipY + pantH + ry, w, px(2), c.shoes);
}

function drawCharacterPose(
  size: number,
  preset: CharacterPreset,
  pose: Pose,
  outline: boolean,
): PixelBuffer {
  const buf = createBuffer(size, size);
  clear(buf);
  const px = u(size);
  const c = PRESET_COLORS[preset];
  const cx = Math.floor(size / 2);

  // Head dominates upper half; body tucked under
  const top = px(2) + pose.bob;
  const torsoY = top + px(14);
  const hipY = torsoY + (pose.bustOnly ? px(4) : px(6));
  const expr =
    pose.arm === 'wave' ? 'smile' : pose.arm === 'think' ? 'think' : 'neutral';

  if (pose.dir === 'up') {
    drawArms(buf, pose, c, px, cx, torsoY);
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY, !!pose.bustOnly);
    drawChibiHead(buf, preset, pose.dir, c, px, cx, top, expr);
  } else {
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY, !!pose.bustOnly);
    drawArms(buf, pose, c, px, cx, torsoY);
    drawChibiHead(buf, preset, pose.dir, c, px, cx, top, expr);
  }

  if (outline) outlineOpaque(buf, c.outline);

  // Ensure outline didn't leave stray edge pixels uncentered
  return centerSprite(buf, { bottomPad: Math.max(1, px(1)) });
}

function animToPose(
  anim: CharacterAnimName,
  frame: number,
  frameCount: number,
  size: number,
): Pose {
  const t = frame / Math.max(1, frameCount);
  const bob = Math.max(0, Math.round(size / 64));
  const phase = Math.sin(t * Math.PI * 2);

  if (anim === 'wave') {
    return {
      dir: 'down',
      arm: 'wave',
      leg: 'idle',
      bob: Math.round(Math.sin(t * Math.PI * 2) * bob),
    };
  }
  if (anim === 'thinking') {
    return {
      dir: 'down',
      arm: 'think',
      leg: 'idle',
      bob: Math.round(Math.sin(t * Math.PI * 2) * bob * 0.5),
      bustOnly: true,
    };
  }

  const dir = anim.split('-')[1] as CharacterDirection;
  const walk = anim.startsWith('walk');
  if (!walk) {
    return {
      dir,
      arm: 'down',
      leg: 'idle',
      bob: Math.round(Math.sin(t * Math.PI * 2) * bob * 0.5),
    };
  }
  return {
    dir,
    arm: phase >= 0 ? 'swing-a' : 'swing-b',
    leg: phase >= 0 ? 'a' : 'b',
    bob: Math.round(Math.abs(phase) * bob),
  };
}

export function generateCharacter(config: CharacterConfig): {
  frames: PixelBuffer[];
  preview: PixelBuffer;
} {
  const frames: PixelBuffer[] = [];
  for (let i = 0; i < config.frameCount; i++) {
    frames.push(
      drawCharacterPose(
        config.size,
        config.preset,
        animToPose(config.animation, i, config.frameCount, config.size),
        config.outline,
      ),
    );
  }
  return { frames, preview: frames[0]! };
}

export function generateCharacterSpritesheet(
  config: Omit<CharacterConfig, 'animation' | 'frameCount'> & {
    walkFrames?: number;
  },
): {
  sheet: PixelBuffer;
  rows: { label: string; frames: PixelBuffer[] }[];
} {
  const walkFrames = config.walkFrames ?? 4;
  // Reference layout: labeled directional poses + specials
  const clips: { id: CharacterAnimName; label: string; frames: number }[] = [
    { id: 'walk-left', label: 'left', frames: walkFrames },
    { id: 'walk-right', label: 'right', frames: walkFrames },
    { id: 'idle-down', label: 'down', frames: 1 },
    { id: 'idle-up', label: 'up', frames: 1 },
    { id: 'wave', label: 'wave', frames: walkFrames },
    { id: 'thinking', label: 'thinking', frames: walkFrames },
    { id: 'walk-down', label: 'walk-down', frames: walkFrames },
    { id: 'walk-up', label: 'walk-up', frames: walkFrames },
  ];

  const rows = clips.map((clip) => {
    const frames: PixelBuffer[] = [];
    for (let i = 0; i < clip.frames; i++) {
      frames.push(
        drawCharacterPose(
          config.size,
          config.preset,
          animToPose(clip.id, i, clip.frames, config.size),
          config.outline,
        ),
      );
    }
    return { label: clip.label, frames };
  });

  // Match reference sheet composition per character:
  // row1: left, right, down, up (single key poses — use mid walk / idle)
  // For worker also wave + thinking; for others keep walk cycles in extra rows
  const keyLeft = rows[0]!.frames[Math.floor(walkFrames / 2)]!;
  const keyRight = rows[1]!.frames[Math.floor(walkFrames / 2)]!;
  const keyDown = rows[2]!.frames[0]!;
  const keyUp = rows[3]!.frames[0]!;
  const wave = rows[4]!.frames[0]!;
  const think = rows[5]!.frames[0]!;

  const sheetRows: PixelBuffer[][] =
    config.preset === 'worker'
      ? [
          [wave, keyLeft, keyRight, keyUp, keyDown, think],
          rows[0]!.frames,
          rows[1]!.frames,
          rows[6]!.frames,
          rows[7]!.frames,
        ]
      : config.preset === 'cap'
        ? [[keyDown], rows[0]!.frames, rows[1]!.frames, rows[6]!.frames, rows[7]!.frames]
        : [
            [keyLeft, keyRight, keyDown, keyUp],
            rows[0]!.frames,
            rows[1]!.frames,
            rows[6]!.frames,
            rows[7]!.frames,
          ];

  return { sheet: stitchRows(sheetRows), rows };
}

export function generateCastSpritesheet(options: {
  size: number;
  outline: boolean;
  walkFrames?: number;
}): PixelBuffer {
  const presets: CharacterPreset[] = ['curly', 'worker', 'cap'];
  const sheets = presets.map(
    (preset) =>
      generateCharacterSpritesheet({
        size: options.size,
        seed: 0,
        preset,
        outline: options.outline,
        fps: 8,
        walkFrames: options.walkFrames ?? 4,
      }).sheet,
  );

  // Pad rows to equal width for a clean cast sheet
  const maxW = Math.max(...sheets.map((s) => s.width));
  const padded = sheets.map((s) => {
    if (s.width === maxW) return s;
    const out = createBuffer(maxW, s.height);
    clear(out);
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        setPixel(out, x, y, getPixel(s, x, y));
      }
    }
    return out;
  });
  return stitchRows(padded.map((s) => [s]));
}

export const PRESETS: { id: CharacterPreset; label: string; blurb: string }[] = [
  { id: 'curly', label: 'Curly', blurb: 'Afro · pink tee · green bag' },
  { id: 'worker', label: 'Worker', blurb: 'Bun · visor · apron · wave/think' },
  { id: 'cap', label: 'Cap', blurb: 'Backwards cap · messenger bag' },
];

export const ANIMATIONS: {
  id: CharacterAnimName;
  label: string;
  frames: number;
}[] = [
  { id: 'idle-down', label: 'Idle ↓', frames: 4 },
  { id: 'idle-up', label: 'Idle ↑', frames: 4 },
  { id: 'idle-left', label: 'Idle ←', frames: 4 },
  { id: 'idle-right', label: 'Idle →', frames: 4 },
  { id: 'walk-down', label: 'Walk ↓', frames: 4 },
  { id: 'walk-up', label: 'Walk ↑', frames: 4 },
  { id: 'walk-left', label: 'Walk ←', frames: 4 },
  { id: 'walk-right', label: 'Walk →', frames: 4 },
  { id: 'wave', label: 'Wave', frames: 4 },
  { id: 'thinking', label: 'Thinking', frames: 4 },
];
