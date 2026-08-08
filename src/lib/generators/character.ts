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
  stitchHorizontal,
  stitchRows,
} from '../pixelEngine';

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
  highlight: Rgba;
};

const PRESET_COLORS: Record<CharacterPreset, CharColors> = {
  curly: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f4c89c'),
    skinShade: hexToRgba('#e2a87a'),
    hair: hexToRgba('#1a1a1a'),
    shirt: hexToRgba('#e56d6d'),
    shirtShade: hexToRgba('#c24f4f'),
    pants: hexToRgba('#2c4f8f'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#4caf6a'),
    accent2: hexToRgba('#3a8f54'),
    mouth: hexToRgba('#c24f4f'),
    highlight: hexToRgba('#ffe0c0'),
  },
  worker: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f4c89c'),
    skinShade: hexToRgba('#e2a87a'),
    hair: hexToRgba('#1a1a1a'),
    shirt: hexToRgba('#d63c3c'),
    shirtShade: hexToRgba('#a82e2e'),
    pants: hexToRgba('#222222'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#1f1f1f'),
    accent2: hexToRgba('#f5f5f5'),
    mouth: hexToRgba('#c24f4f'),
    highlight: hexToRgba('#ffe0c0'),
  },
  cap: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f4c89c'),
    skinShade: hexToRgba('#e2a87a'),
    hair: hexToRgba('#6b4634'),
    shirt: hexToRgba('#f5f5f5'),
    shirtShade: hexToRgba('#d8d8d8'),
    pants: hexToRgba('#3a6ea8'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#1a1a1a'),
    accent2: hexToRgba('#ffffff'),
    mouth: hexToRgba('#c24f4f'),
    highlight: hexToRgba('#ffe0c0'),
  },
};

export type AnimClipId =
  | 'walk_left'
  | 'walk_right'
  | 'walk_down'
  | 'walk_up'
  | 'left'
  | 'right'
  | 'down'
  | 'up'
  | 'wave'
  | 'thinking';

export interface AnimClip {
  id: AnimClipId;
  label: string;
  anim: CharacterAnimName;
  frames: number;
}

/** Reference sheet clip lists per character */
export const PRESET_CLIPS: Record<CharacterPreset, AnimClip[]> = {
  curly: [
    { id: 'walk_left', label: 'walk_left', anim: 'walk-left', frames: 5 },
    { id: 'walk_right', label: 'walk_right', anim: 'walk-right', frames: 5 },
    { id: 'walk_down', label: 'walk_down', anim: 'walk-down', frames: 5 },
    { id: 'walk_up', label: 'walk_up', anim: 'walk-up', frames: 5 },
  ],
  worker: [
    { id: 'wave', label: 'wave', anim: 'wave', frames: 5 },
    { id: 'left', label: 'left', anim: 'walk-left', frames: 4 },
    { id: 'right', label: 'right', anim: 'walk-right', frames: 4 },
    { id: 'up', label: 'up', anim: 'walk-up', frames: 4 },
    { id: 'down', label: 'down', anim: 'walk-down', frames: 4 },
    { id: 'thinking', label: 'thinking', anim: 'thinking', frames: 4 },
  ],
  cap: [
    { id: 'left', label: 'left', anim: 'walk-left', frames: 4 },
    { id: 'right', label: 'right', anim: 'walk-right', frames: 4 },
    { id: 'down', label: 'down', anim: 'walk-down', frames: 4 },
    { id: 'up', label: 'up', anim: 'walk-up', frames: 4 },
  ],
};

type Pose = {
  dir: CharacterDirection;
  arm: 'down' | 'swing-a' | 'swing-b' | 'wave' | 'think';
  /** -2..2 stride offset in design units */
  stride: number;
  bob: number;
  waveLift: number;
  thinkTilt: number;
  bustOnly?: boolean;
};

function u(size: number) {
  // Native design space is 64 units (matches reference 64×64)
  const s = size / 64;
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
      if (x * x / rx2 + y * y / ry2 <= 1.02) setPixel(buf, cx + x, cy + y, color);
    }
  }
}

function disc(buf: PixelBuffer, cx: number, cy: number, r: number, color: Rgba) {
  oval(buf, cx, cy, r, r, color);
}

function drawHead(
  buf: PixelBuffer,
  preset: CharacterPreset,
  dir: CharacterDirection,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  top: number,
  expression: 'neutral' | 'smile' | 'think',
  tilt: number,
) {
  const headCx = cx + tilt;
  const headCy = top + px(14);
  const skin = dir === 'up' ? c.skinShade : c.skin;

  // Large chibi head (~half sprite)
  oval(buf, headCx, headCy, px(13), px(13), skin);
  // soft cheek shade
  if (dir !== 'up') {
    oval(buf, headCx - px(6), headCy + px(4), px(3), px(2), c.skinShade);
    oval(buf, headCx + px(6), headCy + px(4), px(3), px(2), c.skinShade);
  }

  if (preset === 'curly') {
    const curls: [number, number, number][] = [
      [0, -12, 9],
      [-8, -9, 8],
      [8, -9, 8],
      [-12, -2, 7],
      [12, -2, 7],
      [-11, 6, 7],
      [11, 6, 7],
      [-5, -14, 6],
      [5, -14, 6],
      [0, -16, 6],
      [-14, 2, 5],
      [14, 2, 5],
    ];
    for (const [ox, oy, r] of curls) {
      if (dir === 'left' && ox > 6) continue;
      if (dir === 'right' && ox < -6) continue;
      disc(buf, headCx + px(ox), headCy + px(oy), px(r), c.hair);
    }
    if (dir !== 'up') {
      oval(buf, headCx, headCy + px(2), px(9), px(9), skin);
    }
  } else if (preset === 'worker') {
    oval(buf, headCx, top + px(8), px(13), px(8), c.hair);
    disc(
      buf,
      headCx + (dir === 'left' ? -px(2) : dir === 'right' ? px(2) : 0),
      top + px(2),
      px(6),
      c.hair,
    );
    if (dir === 'down') {
      fillRect(buf, headCx - px(13), top + px(12), px(4), px(10), c.hair);
      fillRect(buf, headCx + px(9), top + px(12), px(4), px(10), c.hair);
    } else if (dir === 'up') {
      fillRect(buf, headCx - px(13), top + px(10), px(26), px(10), c.hair);
    } else {
      const back = dir === 'left' ? 1 : -1;
      fillRect(buf, headCx + back * px(10), top + px(12), px(4), px(10), c.hair);
    }
    // red visor
    if (dir !== 'up') {
      if (dir === 'down') {
        fillRect(buf, headCx - px(12), top + px(10), px(24), px(5), c.shirt);
        fillRect(buf, headCx - px(12), top + px(10), px(24), px(2), c.shirtShade);
      } else {
        const side = dir === 'left' ? -1 : 1;
        fillRect(
          buf,
          headCx + (side < 0 ? -px(12) : -px(2)),
          top + px(10),
          px(14),
          px(5),
          c.shirt,
        );
      }
    }
  } else {
    // cap (backwards on down)
    if (dir !== 'up') {
      fillRect(buf, headCx - px(10), top + px(10), px(20), px(5), c.hair);
    }
    oval(buf, headCx, top + px(8), px(13), px(7), c.accent);
    if (dir === 'down') {
      fillRect(buf, headCx - px(4), top + px(10), px(8), px(3), c.accent2);
      fillRect(buf, headCx + px(6), top + px(4), px(6), px(5), c.accent);
    } else if (dir === 'up') {
      fillRect(buf, headCx - px(14), top + px(10), px(28), px(5), c.accent);
    } else {
      const side = dir === 'left' ? -1 : 1;
      fillRect(buf, headCx + side * px(6), top + px(10), px(10), px(4), c.accent);
    }
  }

  if (dir === 'up') return;

  const eyeY = top + px(16);
  if (dir === 'down') {
    // soft eyes
    fillRect(buf, headCx - px(6), eyeY, px(3), px(3), c.outline);
    fillRect(buf, headCx + px(3), eyeY, px(3), px(3), c.outline);
    setPixel(buf, headCx - px(5), eyeY, c.highlight);
    setPixel(buf, headCx + px(4), eyeY, c.highlight);
    if (expression === 'smile') {
      fillRect(buf, headCx - px(3), eyeY + px(6), px(6), px(2), c.mouth);
      setPixel(buf, headCx - px(3), eyeY + px(5), c.mouth);
      setPixel(buf, headCx + px(2), eyeY + px(5), c.mouth);
    } else if (expression === 'think') {
      fillRect(buf, headCx + px(1), eyeY + px(6), px(3), px(1), c.outline);
    } else {
      fillRect(buf, headCx - px(1), eyeY + px(6), px(2), px(1), c.mouth);
    }
  } else {
    const side = dir === 'left' ? -1 : 1;
    fillRect(buf, headCx + side * px(5), eyeY, px(3), px(3), c.outline);
    setPixel(buf, headCx + side * px(5), eyeY, c.highlight);
    if (expression !== 'neutral') {
      setPixel(buf, headCx + side * px(3), eyeY + px(6), c.mouth);
    }
  }
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
  const torsoW = px(18);
  const torsoH = bustOnly ? px(10) : px(14);
  fillRect(buf, cx - Math.floor(torsoW / 2), torsoY, torsoW, torsoH, c.shirt);
  fillRect(
    buf,
    cx - Math.floor(torsoW / 2),
    torsoY + torsoH - px(3),
    torsoW,
    px(2),
    c.shirtShade,
  );

  if (preset === 'worker') {
    // overalls / apron
    fillRect(buf, cx - px(8), torsoY + px(4), px(16), bustOnly ? px(8) : px(12), c.accent);
    if (dir === 'down') {
      fillRect(buf, cx + px(2), torsoY + px(6), px(4), px(3), c.accent2);
      fillRect(buf, cx + px(2), torsoY + px(6), px(2), px(2), c.shirt);
    }
    if (dir === 'up') {
      // cross straps
      for (let i = 0; i < px(10); i++) {
        setPixel(buf, cx - px(6) + i, torsoY + px(2) + i, c.accent);
        setPixel(buf, cx - px(5) + i, torsoY + px(2) + i, c.accent);
        setPixel(buf, cx + px(6) - i, torsoY + px(2) + i, c.accent);
        setPixel(buf, cx + px(5) - i, torsoY + px(2) + i, c.accent);
      }
    }
  }

  if (preset === 'curly' && !bustOnly && dir !== 'up') {
    const bagX = dir === 'left' ? cx - px(16) : cx + px(8);
    fillRect(buf, bagX, torsoY + px(2), px(8), px(10), c.accent);
    fillRect(buf, bagX + px(1), torsoY + px(3), px(6), px(4), c.accent2);
    strokeMini(buf, bagX, torsoY + px(2), px(8), px(10), c.outline);
  }

  if (preset === 'cap' && !bustOnly) {
    if (dir === 'down') {
      for (let i = 0; i < px(14); i++) {
        setPixel(buf, cx - px(6) + i, torsoY + Math.floor(i * 0.55), c.accent2);
        setPixel(buf, cx - px(6) + i, torsoY + Math.floor(i * 0.55) + 1, c.accent2);
      }
      fillRect(buf, cx + px(6), torsoY + px(4), px(8), px(10), c.accent);
      strokeMini(buf, cx + px(6), torsoY + px(4), px(8), px(10), c.outline);
    } else if (dir === 'up') {
      for (let i = 0; i < px(14); i++) {
        setPixel(buf, cx + px(6) - i, torsoY + Math.floor(i * 0.55), c.accent2);
      }
      fillRect(buf, cx - px(14), torsoY + px(4), px(8), px(10), c.accent);
    } else if (dir === 'right') {
      fillRect(buf, cx - px(14), torsoY + px(3), px(6), px(10), c.accent);
    } else {
      fillRect(buf, cx + px(8), torsoY + px(3), px(6), px(10), c.accent);
    }
  }
}

function strokeMini(
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

function drawArms(
  buf: PixelBuffer,
  pose: Pose,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  torsoY: number,
) {
  const baseY = torsoY + px(2);
  if (pose.dir === 'down' || pose.dir === 'up') {
    if (pose.arm === 'wave') {
      fillRect(buf, cx - px(12), baseY, px(4), px(8), c.skin);
      const lift = px(10) + pose.waveLift;
      fillRect(buf, cx + px(8), baseY - lift, px(4), px(12), c.skin);
      fillRect(buf, cx + px(8), baseY - lift - px(2), px(6), px(4), c.skin);
    } else if (pose.arm === 'think') {
      fillRect(buf, cx - px(12), baseY, px(4), px(6), c.skin);
      fillRect(buf, cx + px(4), baseY - px(6), px(4), px(10), c.skin);
      fillRect(buf, cx, torsoY - px(2), px(6), px(4), c.skin);
    } else {
      const a = pose.arm === 'swing-a' ? px(2) : pose.arm === 'swing-b' ? -px(2) : 0;
      fillRect(buf, cx - px(12), baseY + a, px(4), px(8), c.skin);
      fillRect(buf, cx + px(8), baseY - a, px(4), px(8), c.skin);
    }
  } else {
    const front = pose.dir === 'left' ? -1 : 1;
    let ax = cx + front * px(2);
    let ay = baseY;
    if (pose.arm === 'swing-a') {
      ax += front * px(4);
      ay += px(2);
    } else if (pose.arm === 'swing-b') {
      ax -= front * px(2);
      ay -= px(1);
    } else if (pose.arm === 'wave') {
      ay -= px(10) + pose.waveLift;
      ax += front * px(4);
    } else if (pose.arm === 'think') {
      ay -= px(6);
      ax += front * px(4);
    }
    fillRect(buf, ax, ay, px(4), px(8), c.skin);
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
  const pantH = short ? px(6) : px(10);
  const w = px(5);
  const stride = pose.stride;

  if (pose.dir === 'left' || pose.dir === 'right') {
    const fwd = stride;
    const back = -Math.round(stride * 0.6);
    fillRect(buf, cx - px(2) + back, hipY, w, pantH, c.pants);
    fillRect(buf, cx - px(2) + back, hipY + pantH, w, px(3), c.shoes);
    fillRect(buf, cx - px(2) + fwd, hipY, w, pantH, c.pants);
    fillRect(buf, cx - px(2) + fwd, hipY + pantH, w, px(3), c.shoes);
    return;
  }

  // front/back facing: stride as vertical offset + slight horizontal
  const ly = stride > 0 ? -px(1) : stride < 0 ? px(1) : 0;
  const ry = -ly;
  const lx = stride > 0 ? px(1) : stride < 0 ? -px(1) : 0;
  fillRect(buf, cx - px(8) + lx, hipY + ly, w, pantH, c.pants);
  fillRect(buf, cx + px(3) - lx, hipY + ry, w, pantH, c.pants);
  fillRect(buf, cx - px(8) + lx, hipY + pantH + ly, w, px(3), c.shoes);
  fillRect(buf, cx + px(3) - lx, hipY + pantH + ry, w, px(3), c.shoes);
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

  const top = px(4) + pose.bob;
  const torsoY = top + px(28);
  const hipY = torsoY + (pose.bustOnly ? px(8) : px(12));
  const expr =
    pose.arm === 'wave' ? 'smile' : pose.arm === 'think' ? 'think' : 'neutral';

  if (pose.dir === 'up') {
    drawArms(buf, pose, c, px, cx, torsoY);
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY, !!pose.bustOnly);
    drawHead(buf, preset, pose.dir, c, px, cx, top, expr, pose.thinkTilt);
  } else {
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY, !!pose.bustOnly);
    drawArms(buf, pose, c, px, cx, torsoY);
    drawHead(buf, preset, pose.dir, c, px, cx, top, expr, pose.thinkTilt);
  }

  if (outline) outlineOpaque(buf, c.outline);
  return centerSprite(buf, { bottomPad: Math.max(2, px(2)) });
}

/** Map frame index into a smooth walk / wave / think pose */
function animToPose(
  anim: CharacterAnimName,
  frame: number,
  frameCount: number,
  size: number,
): Pose {
  const px = u(size);
  const phase = (frame / Math.max(1, frameCount)) * Math.PI * 2;

  if (anim === 'wave') {
    // hand bob across frames
    const lift = Math.round((Math.sin(phase) * 0.5 + 0.5) * px(3));
    return {
      dir: 'down',
      arm: 'wave',
      stride: 0,
      bob: Math.round(Math.sin(phase) * px(1)),
      waveLift: lift,
      thinkTilt: 0,
    };
  }
  if (anim === 'thinking') {
    return {
      dir: 'down',
      arm: 'think',
      stride: 0,
      bob: Math.round(Math.sin(phase) * px(0.5)),
      waveLift: 0,
      thinkTilt: Math.round(Math.sin(phase) * px(1)),
      bustOnly: true,
    };
  }

  const dir = anim.split('-')[1] as CharacterDirection;
  const walk = anim.startsWith('walk');
  if (!walk) {
    return {
      dir,
      arm: 'down',
      stride: 0,
      bob: Math.round(Math.sin(phase) * px(0.5)),
      waveLift: 0,
      thinkTilt: 0,
    };
  }

  // Multi-frame walk: stride oscillates, arms opposite
  const stride = Math.round(Math.sin(phase) * px(4));
  const arm: Pose['arm'] = Math.sin(phase) >= 0 ? 'swing-a' : 'swing-b';
  return {
    dir,
    arm,
    stride,
    bob: Math.round(Math.abs(Math.sin(phase)) * px(1)),
    waveLift: 0,
    thinkTilt: 0,
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

export interface SheetClipRow {
  id: AnimClipId;
  label: string;
  frames: PixelBuffer[];
}

export function generateCharacterClipSheet(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
): {
  rows: SheetClipRow[];
  /** Game-ready sheet: rows of equal cell size, no labels */
  sheet: PixelBuffer;
} {
  const clips = PRESET_CLIPS[preset];
  const rows: SheetClipRow[] = clips.map((clip) => {
    const frames: PixelBuffer[] = [];
    for (let i = 0; i < clip.frames; i++) {
      frames.push(
        drawCharacterPose(
          size,
          preset,
          animToPose(clip.anim, i, clip.frames, size),
          outline,
        ),
      );
    }
    return { id: clip.id, label: clip.label, frames };
  });

  // Pad all rows to the same frame count so the sheet is a clean grid
  const maxFrames = Math.max(...rows.map((r) => r.frames.length));
  const paddedRows = rows.map((r) => {
    const cells = [...r.frames];
    while (cells.length < maxFrames) {
      cells.push(createBuffer(size, size));
    }
    return cells;
  });

  return {
    rows,
    sheet: stitchRows(paddedRows),
  };
}

/** Key-pose sheet like the second reference (one frame per direction/action) */
export function generateCharacterKeyPoseSheet(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
): { labels: string[]; frames: PixelBuffer[]; sheet: PixelBuffer } {
  const keyClips: { label: string; anim: CharacterAnimName; frame: number; total: number }[] =
    preset === 'worker'
      ? [
          { label: 'wave', anim: 'wave', frame: 2, total: 5 },
          { label: 'left', anim: 'walk-left', frame: 1, total: 4 },
          { label: 'right', anim: 'walk-right', frame: 1, total: 4 },
          { label: 'up', anim: 'walk-up', frame: 1, total: 4 },
          { label: 'down', anim: 'walk-down', frame: 0, total: 4 },
          { label: 'thinking', anim: 'thinking', frame: 1, total: 4 },
        ]
      : preset === 'cap'
        ? [{ label: 'down', anim: 'walk-down', frame: 0, total: 4 }]
        : [
            { label: 'left', anim: 'walk-left', frame: 1, total: 5 },
            { label: 'right', anim: 'walk-right', frame: 1, total: 5 },
            { label: 'down', anim: 'walk-down', frame: 0, total: 5 },
            { label: 'up', anim: 'walk-up', frame: 0, total: 5 },
          ];

  const labels = keyClips.map((k) => k.label);
  const frames = keyClips.map((k) =>
    drawCharacterPose(
      size,
      preset,
      animToPose(k.anim, k.frame, k.total, size),
      outline,
    ),
  );
  return { labels, frames, sheet: stitchHorizontal(frames) };
}

export function generateCharacterSpritesheet(
  config: Omit<CharacterConfig, 'animation' | 'frameCount'> & {
    walkFrames?: number;
  },
): {
  sheet: PixelBuffer;
  rows: SheetClipRow[];
} {
  const { sheet, rows } = generateCharacterClipSheet(
    config.preset,
    config.size,
    config.outline,
  );
  return { sheet, rows };
}

export function generateCastSpritesheet(options: {
  size: number;
  outline: boolean;
}): PixelBuffer {
  const presets: CharacterPreset[] = ['curly', 'worker', 'cap'];
  const sheets = presets.map(
    (preset) => generateCharacterClipSheet(preset, options.size, options.outline).sheet,
  );
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
  { id: 'curly', label: 'Curly', blurb: 'walk_left/right/down/up · 5 frames · 64×64' },
  { id: 'worker', label: 'Worker', blurb: 'wave · left/right/up/down · thinking' },
  { id: 'cap', label: 'Cap', blurb: 'left/right/down/up · 4 frames' },
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
  { id: 'walk-down', label: 'Walk ↓', frames: 5 },
  { id: 'walk-up', label: 'Walk ↑', frames: 5 },
  { id: 'walk-left', label: 'Walk ←', frames: 5 },
  { id: 'walk-right', label: 'Walk →', frames: 5 },
  { id: 'wave', label: 'Wave', frames: 5 },
  { id: 'thinking', label: 'Thinking', frames: 4 },
];
