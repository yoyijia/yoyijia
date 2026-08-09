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
  blit,
  centerSprite,
  clear,
  createBuffer,
  fillRect,
  getPixel,
  outlineOpaque,
  setPixel,
  stitchGrid,
  stitchHorizontal,
  stitchRows,
} from '../pixelEngine';

type CharColors = {
  outline: Rgba;
  skin: Rgba;
  skinShade: Rgba;
  blush: Rgba;
  eyeWhite: Rgba;
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
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f6c9a0'),
    skinShade: hexToRgba('#e8b086'),
    blush: hexToRgba('#f2a0a8'),
    eyeWhite: hexToRgba('#ffffff'),
    hair: hexToRgba('#1a1a1a'),
    shirt: hexToRgba('#e87a7a'),
    shirtShade: hexToRgba('#c85c5c'),
    pants: hexToRgba('#2d508f'),
    shoes: hexToRgba('#2a2a2a'),
    accent: hexToRgba('#7ecf4a'),
    accent2: hexToRgba('#5faf38'),
    mouth: hexToRgba('#e05656'),
  },
  worker: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f6c9a0'),
    skinShade: hexToRgba('#e8b086'),
    blush: hexToRgba('#f2a0a8'),
    eyeWhite: hexToRgba('#ffffff'),
    hair: hexToRgba('#1a1a1a'),
    shirt: hexToRgba('#d64545'),
    shirtShade: hexToRgba('#a83232'),
    pants: hexToRgba('#222222'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#1f1f1f'),
    accent2: hexToRgba('#f5f5f5'),
    mouth: hexToRgba('#e05656'),
  },
  cap: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f6c9a0'),
    skinShade: hexToRgba('#e8b086'),
    blush: hexToRgba('#f2a0a8'),
    eyeWhite: hexToRgba('#ffffff'),
    hair: hexToRgba('#6b4634'),
    shirt: hexToRgba('#f5f5f5'),
    shirtShade: hexToRgba('#d8d8d8'),
    pants: hexToRgba('#3a6ea8'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#1a1a1a'),
    accent2: hexToRgba('#ffffff'),
    mouth: hexToRgba('#e05656'),
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
  | 'thinking'
  | 'idle_down'
  | 'idle_up'
  | 'side';

export interface AnimClip {
  id: AnimClipId;
  label: string;
  anim: CharacterAnimName;
  frames: number;
}

/** Reference-style clips: 6-frame loops */
export const PRESET_CLIPS: Record<CharacterPreset, AnimClip[]> = {
  curly: [
    { id: 'walk_left', label: 'left', anim: 'walk-left', frames: 6 },
    { id: 'walk_right', label: 'right', anim: 'walk-right', frames: 6 },
    { id: 'walk_down', label: 'down', anim: 'walk-down', frames: 6 },
    { id: 'walk_up', label: 'up', anim: 'walk-up', frames: 6 },
  ],
  worker: [
    { id: 'wave', label: 'wave', anim: 'wave', frames: 6 },
    { id: 'left', label: 'left', anim: 'walk-left', frames: 6 },
    { id: 'right', label: 'right', anim: 'walk-right', frames: 6 },
    { id: 'up', label: 'up', anim: 'walk-up', frames: 6 },
    { id: 'down', label: 'down', anim: 'walk-down', frames: 6 },
    { id: 'thinking', label: 'thinking', anim: 'thinking', frames: 6 },
  ],
  cap: [
    { id: 'left', label: 'left', anim: 'walk-left', frames: 6 },
    { id: 'right', label: 'right', anim: 'walk-right', frames: 6 },
    { id: 'down', label: 'down', anim: 'walk-down', frames: 6 },
    { id: 'up', label: 'up', anim: 'walk-up', frames: 6 },
  ],
};

/** Full game sheet rows (side / front / back) like the 6-column reference */
export const PRESET_SHEET_ROWS: Record<
  CharacterPreset,
  { label: string; anim: CharacterAnimName; frames: number }[]
> = {
  curly: [
    { label: 'side', anim: 'walk-right', frames: 6 },
    { label: 'front', anim: 'walk-down', frames: 6 },
    { label: 'back', anim: 'walk-up', frames: 6 },
  ],
  worker: [
    { label: 'side', anim: 'walk-right', frames: 6 },
    { label: 'wave', anim: 'wave', frames: 6 },
    { label: 'back', anim: 'walk-up', frames: 6 },
  ],
  cap: [
    { label: 'side', anim: 'walk-right', frames: 6 },
    { label: 'front', anim: 'walk-down', frames: 6 },
  ],
};

type Pose = {
  dir: CharacterDirection;
  arm: 'down' | 'swing-a' | 'swing-b' | 'wave' | 'think';
  /** leg phase 0..1 */
  legPhase: number;
  bob: number;
  waveLift: number;
  thinkTilt: number;
  mouthOpen?: boolean;
  bustOnly?: boolean;
};

function u(size: number) {
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

function strokeRect(
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

function drawAfro(
  buf: PixelBuffer,
  cx: number,
  cy: number,
  px: (n: number) => number,
  c: CharColors,
  dir: CharacterDirection,
) {
  // Dense curly mass — matches reference rounded afro
  const curls: [number, number, number][] = [
    [0, -2, 16],
    [-8, -6, 11],
    [8, -6, 11],
    [-12, 0, 10],
    [12, 0, 10],
    [-10, 8, 9],
    [10, 8, 9],
    [0, -12, 10],
    [-5, -14, 8],
    [5, -14, 8],
    [-14, 4, 7],
    [14, 4, 7],
    [-6, 12, 7],
    [6, 12, 7],
  ];
  for (const [ox, oy, r] of curls) {
    if (dir === 'left' && ox > 8) continue;
    if (dir === 'right' && ox < -8) continue;
    disc(buf, cx + px(ox), cy + px(oy), px(r), c.hair);
  }
}

function drawHead(
  buf: PixelBuffer,
  preset: CharacterPreset,
  dir: CharacterDirection,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  top: number,
  expression: 'neutral' | 'smile' | 'think' | 'open',
  tilt: number,
) {
  const headCx = cx + tilt;
  const headCy = top + px(16);
  const skin = dir === 'up' ? c.skinShade : c.skin;

  // Big round face
  oval(buf, headCx, headCy, px(14), px(14), skin);

  if (preset === 'curly') {
    drawAfro(buf, headCx, headCy - px(2), px, c, dir);
    // Face window through hair
    if (dir !== 'up') {
      oval(buf, headCx, headCy + px(2), px(11), px(11), skin);
    }
  } else if (preset === 'worker') {
    oval(buf, headCx, top + px(10), px(14), px(8), c.hair);
    disc(
      buf,
      headCx + (dir === 'left' ? -px(2) : dir === 'right' ? px(2) : 0),
      top + px(3),
      px(6),
      c.hair,
    );
    if (dir === 'down') {
      fillRect(buf, headCx - px(14), top + px(14), px(4), px(10), c.hair);
      fillRect(buf, headCx + px(10), top + px(14), px(4), px(10), c.hair);
    } else if (dir === 'up') {
      fillRect(buf, headCx - px(14), top + px(12), px(28), px(12), c.hair);
    } else {
      const back = dir === 'left' ? 1 : -1;
      fillRect(buf, headCx + back * px(11), top + px(14), px(4), px(10), c.hair);
    }
    if (dir !== 'up') {
      if (dir === 'down') {
        fillRect(buf, headCx - px(13), top + px(12), px(26), px(5), c.shirt);
        fillRect(buf, headCx - px(13), top + px(12), px(26), px(2), c.shirtShade);
      } else {
        const side = dir === 'left' ? -1 : 1;
        fillRect(
          buf,
          headCx + (side < 0 ? -px(13) : -px(2)),
          top + px(12),
          px(15),
          px(5),
          c.shirt,
        );
      }
    }
  } else {
    if (dir !== 'up') {
      fillRect(buf, headCx - px(11), top + px(12), px(22), px(5), c.hair);
    }
    oval(buf, headCx, top + px(10), px(14), px(7), c.accent);
    if (dir === 'down') {
      fillRect(buf, headCx - px(4), top + px(12), px(8), px(3), c.accent2);
      fillRect(buf, headCx + px(7), top + px(6), px(6), px(5), c.accent);
    } else if (dir === 'up') {
      fillRect(buf, headCx - px(15), top + px(12), px(30), px(5), c.accent);
    } else {
      const side = dir === 'left' ? -1 : 1;
      fillRect(buf, headCx + side * px(7), top + px(12), px(11), px(4), c.accent);
    }
  }

  if (dir === 'up') return;

  // Eyebrows
  const browY = top + px(14);
  if (dir === 'down') {
    fillRect(buf, headCx - px(8), browY, px(5), px(1), c.outline);
    fillRect(buf, headCx + px(3), browY, px(5), px(1), c.outline);
  } else {
    const side = dir === 'left' ? -1 : 1;
    fillRect(buf, headCx + side * px(4), browY, px(4), px(1), c.outline);
  }

  // Big white eyes + pupils (reference style)
  const eyeY = top + px(17);
  if (dir === 'down') {
    oval(buf, headCx - px(6), eyeY, px(4), px(5), c.eyeWhite);
    oval(buf, headCx + px(6), eyeY, px(4), px(5), c.eyeWhite);
    disc(buf, headCx - px(6), eyeY + px(1), px(2), c.outline);
    disc(buf, headCx + px(6), eyeY + px(1), px(2), c.outline);
    setPixel(buf, headCx - px(7), eyeY, c.eyeWhite);
    setPixel(buf, headCx + px(5), eyeY, c.eyeWhite);
  } else {
    const side = dir === 'left' ? -1 : 1;
    oval(buf, headCx + side * px(5), eyeY, px(4), px(5), c.eyeWhite);
    disc(buf, headCx + side * px(5), eyeY + px(1), px(2), c.outline);
    setPixel(buf, headCx + side * px(6), eyeY, c.eyeWhite);
  }

  // Blush
  if (dir === 'down') {
    oval(buf, headCx - px(10), eyeY + px(5), px(3), px(2), c.blush);
    oval(buf, headCx + px(10), eyeY + px(5), px(3), px(2), c.blush);
  } else {
    const side = dir === 'left' ? -1 : 1;
    oval(buf, headCx + side * px(8), eyeY + px(5), px(3), px(2), c.blush);
  }

  // Mouth
  const mouthY = eyeY + px(8);
  if (expression === 'open') {
    oval(buf, headCx, mouthY, px(3), px(2), c.mouth);
  } else if (expression === 'smile' || expression === 'neutral') {
    fillRect(buf, headCx - px(2), mouthY, px(4), px(1), c.mouth);
    setPixel(buf, headCx - px(3), mouthY - px(1), c.mouth);
    setPixel(buf, headCx + px(2), mouthY - px(1), c.mouth);
  } else if (expression === 'think') {
    fillRect(buf, headCx + px(1), mouthY, px(3), px(1), c.outline);
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
  const torsoH = bustOnly ? px(10) : px(13);
  fillRect(buf, cx - Math.floor(torsoW / 2), torsoY, torsoW, torsoH, c.shirt);
  // sleeve hints
  if (dir === 'down' || dir === 'up') {
    fillRect(buf, cx - Math.floor(torsoW / 2) - px(1), torsoY, px(3), px(5), c.shirt);
    fillRect(buf, cx + Math.floor(torsoW / 2) - px(2), torsoY, px(3), px(5), c.shirt);
  }
  fillRect(
    buf,
    cx - Math.floor(torsoW / 2),
    torsoY + torsoH - px(3),
    torsoW,
    px(2),
    c.shirtShade,
  );

  if (preset === 'worker') {
    fillRect(buf, cx - px(8), torsoY + px(3), px(16), bustOnly ? px(8) : px(12), c.accent);
    if (dir === 'down') {
      fillRect(buf, cx + px(2), torsoY + px(5), px(4), px(3), c.accent2);
      fillRect(buf, cx + px(2), torsoY + px(5), px(2), px(2), c.shirt);
    }
    if (dir === 'up') {
      for (let i = 0; i < px(11); i++) {
        setPixel(buf, cx - px(6) + i, torsoY + px(2) + i, c.accent);
        setPixel(buf, cx - px(5) + i, torsoY + px(2) + i, c.accent);
        setPixel(buf, cx + px(6) - i, torsoY + px(2) + i, c.accent);
        setPixel(buf, cx + px(5) - i, torsoY + px(2) + i, c.accent);
      }
    }
  }

  if (preset === 'cap' && !bustOnly) {
    if (dir === 'down') {
      for (let i = 0; i < px(14); i++) {
        setPixel(buf, cx - px(6) + i, torsoY + Math.floor(i * 0.55), c.accent2);
        setPixel(buf, cx - px(6) + i, torsoY + Math.floor(i * 0.55) + 1, c.accent2);
      }
      fillRect(buf, cx + px(6), torsoY + px(4), px(8), px(10), c.accent);
      strokeRect(buf, cx + px(6), torsoY + px(4), px(8), px(10), c.outline);
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

function drawBag(
  buf: PixelBuffer,
  dir: CharacterDirection,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  handY: number,
) {
  // Lime lunchbox with handle — held in character's left (viewer's right on down)
  if (dir === 'up') return;
  let bagX: number;
  if (dir === 'down') bagX = cx + px(10);
  else if (dir === 'left') bagX = cx - px(18);
  else bagX = cx + px(10);

  const bagY = handY;
  fillRect(buf, bagX, bagY, px(10), px(9), c.accent);
  fillRect(buf, bagX, bagY, px(10), px(2), c.accent2);
  strokeRect(buf, bagX, bagY, px(10), px(9), c.outline);
  // handle
  fillRect(buf, bagX + px(2), bagY - px(3), px(6), px(1), c.outline);
  setPixel(buf, bagX + px(2), bagY - px(2), c.outline);
  setPixel(buf, bagX + px(7), bagY - px(2), c.outline);
}

function drawArms(
  buf: PixelBuffer,
  pose: Pose,
  preset: CharacterPreset,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  torsoY: number,
) {
  const baseY = torsoY + px(2);
  if (pose.dir === 'down' || pose.dir === 'up') {
    if (pose.arm === 'wave') {
      fillRect(buf, cx - px(12), baseY, px(4), px(8), c.skin);
      const lift = px(11) + pose.waveLift;
      fillRect(buf, cx + px(8), baseY - lift, px(4), px(12), c.skin);
      fillRect(buf, cx + px(8), baseY - lift - px(2), px(6), px(4), c.skin);
    } else if (pose.arm === 'think') {
      fillRect(buf, cx - px(12), baseY, px(4), px(6), c.skin);
      fillRect(buf, cx + px(4), baseY - px(7), px(4), px(11), c.skin);
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
      ax += front * px(3);
      ay += px(2);
    } else if (pose.arm === 'swing-b') {
      ax -= front * px(2);
    } else if (pose.arm === 'wave') {
      ay -= px(11) + pose.waveLift;
      ax += front * px(3);
    } else if (pose.arm === 'think') {
      ay -= px(7);
      ax += front * px(3);
    }
    fillRect(buf, ax, ay, px(4), px(8), c.skin);
  }

  if (preset === 'curly' && !pose.bustOnly) {
    drawBag(buf, pose.dir, c, px, cx, baseY + px(4));
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
  const pantH = short ? px(7) : px(11);
  const w = px(5);
  // Subtle walk: sin phase → small stride
  const stride = Math.round(Math.sin(pose.legPhase * Math.PI * 2) * px(3));

  if (pose.dir === 'left' || pose.dir === 'right') {
    const fwd = stride;
    const back = -Math.round(stride * 0.5);
    fillRect(buf, cx - px(2) + back, hipY, w, pantH, c.pants);
    fillRect(buf, cx - px(2) + back, hipY + pantH, w, px(3), c.shoes);
    fillRect(buf, cx - px(2) + fwd, hipY, w, pantH, c.pants);
    fillRect(buf, cx - px(2) + fwd, hipY + pantH, w, px(3), c.shoes);
    return;
  }

  const ly = stride > 0 ? -px(1) : stride < 0 ? px(1) : 0;
  const ry = -ly;
  fillRect(buf, cx - px(8), hipY + ly, w, pantH, c.pants);
  fillRect(buf, cx + px(3), hipY + ry, w, pantH, c.pants);
  fillRect(buf, cx - px(8), hipY + pantH + ly, w, px(3), c.shoes);
  fillRect(buf, cx + px(3), hipY + pantH + ry, w, px(3), c.shoes);
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

  const top = px(3) + pose.bob;
  const torsoY = top + px(30);
  const hipY = torsoY + (pose.bustOnly ? px(8) : px(11));
  const expr: 'neutral' | 'smile' | 'think' | 'open' =
    pose.mouthOpen
      ? 'open'
      : pose.arm === 'wave'
        ? 'smile'
        : pose.arm === 'think'
          ? 'think'
          : 'smile';

  if (pose.dir === 'up') {
    drawArms(buf, pose, preset, c, px, cx, torsoY);
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY, !!pose.bustOnly);
    drawHead(buf, preset, pose.dir, c, px, cx, top, expr, pose.thinkTilt);
  } else {
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY, !!pose.bustOnly);
    drawArms(buf, pose, preset, c, px, cx, torsoY);
    drawHead(buf, preset, pose.dir, c, px, cx, top, expr, pose.thinkTilt);
  }

  if (outline) outlineOpaque(buf, c.outline);
  return centerSprite(buf, { bottomPad: Math.max(2, px(2)) });
}

function animToPose(
  anim: CharacterAnimName,
  frame: number,
  frameCount: number,
  size: number,
): Pose {
  const px = u(size);
  const phase = frame / Math.max(1, frameCount);
  const wave = phase * Math.PI * 2;

  if (anim === 'wave') {
    return {
      dir: 'down',
      arm: 'wave',
      legPhase: 0,
      bob: Math.round(Math.sin(wave) * px(1)),
      waveLift: Math.round((Math.sin(wave) * 0.5 + 0.5) * px(3)),
      thinkTilt: 0,
      mouthOpen: frame % 3 === 1,
    };
  }
  if (anim === 'thinking') {
    return {
      dir: 'down',
      arm: 'think',
      legPhase: 0,
      bob: Math.round(Math.sin(wave) * px(0.5)),
      waveLift: 0,
      thinkTilt: Math.round(Math.sin(wave) * px(1)),
      bustOnly: true,
    };
  }

  const dir = anim.split('-')[1] as CharacterDirection;
  const walk = anim.startsWith('walk');
  if (!walk) {
    return {
      dir,
      arm: 'down',
      legPhase: 0,
      bob: Math.round(Math.sin(wave) * px(0.5)),
      waveLift: 0,
      thinkTilt: 0,
    };
  }

  return {
    dir,
    arm: Math.sin(wave) >= 0 ? 'swing-a' : 'swing-b',
    legPhase: phase,
    bob: Math.round(Math.abs(Math.sin(wave)) * px(1)),
    waveLift: 0,
    thinkTilt: 0,
    mouthOpen: frame === 1,
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
  id: string;
  label: string;
  frames: PixelBuffer[];
}

function makeFrames(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
  anim: CharacterAnimName,
  count: number,
): PixelBuffer[] {
  const frames: PixelBuffer[] = [];
  for (let i = 0; i < count; i++) {
    frames.push(
      drawCharacterPose(
        size,
        preset,
        animToPose(anim, i, count, size),
        outline,
      ),
    );
  }
  return frames;
}

export function generateCharacterClipSheet(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
): { rows: SheetClipRow[]; sheet: PixelBuffer } {
  const clips = PRESET_CLIPS[preset];
  const rows: SheetClipRow[] = clips.map((clip) => ({
    id: clip.id,
    label: clip.label,
    frames: makeFrames(preset, size, outline, clip.anim, clip.frames),
  }));

  const maxFrames = Math.max(...rows.map((r) => r.frames.length));
  const padded = rows.map((r) => {
    const cells = [...r.frames];
    while (cells.length < maxFrames) cells.push(createBuffer(size, size));
    return cells;
  });

  return { rows, sheet: stitchRows(padded) };
}

/** 6-column animation atlas matching the multi-row reference sheet */
export function generateAnimationAtlas(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
  options: { blackBackground?: boolean } = {},
): { rows: SheetClipRow[]; sheet: PixelBuffer } {
  const defs = PRESET_SHEET_ROWS[preset];
  const rows: SheetClipRow[] = defs.map((d) => ({
    id: d.label,
    label: d.label,
    frames: makeFrames(preset, size, outline, d.anim, d.frames),
  }));

  let sheet = stitchRows(rows.map((r) => r.frames));
  if (options.blackBackground) {
    sheet = onBackground(sheet, hexToRgba('#000000'));
  }
  return { rows, sheet };
}

/** 4×4 walk grid like the black-background reference */
export function generateWalkGrid(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
): PixelBuffer {
  const frames = makeFrames(preset, size, outline, 'walk-down', 16);
  const sheet = stitchGrid(frames, 4);
  return onBackground(sheet, hexToRgba('#000000'));
}

export function generateCharacterKeyPoseSheet(
  preset: CharacterPreset,
  size: number,
  outline: boolean,
): { labels: string[]; frames: PixelBuffer[]; sheet: PixelBuffer } {
  const keyClips: { label: string; anim: CharacterAnimName; frame: number; total: number }[] =
    preset === 'worker'
      ? [
          { label: 'wave', anim: 'wave', frame: 2, total: 6 },
          { label: 'left', anim: 'walk-left', frame: 1, total: 6 },
          { label: 'right', anim: 'walk-right', frame: 1, total: 6 },
          { label: 'up', anim: 'walk-up', frame: 0, total: 6 },
          { label: 'down', anim: 'walk-down', frame: 0, total: 6 },
          { label: 'thinking', anim: 'thinking', frame: 1, total: 6 },
        ]
      : preset === 'cap'
        ? [{ label: 'down', anim: 'walk-down', frame: 0, total: 6 }]
        : [
            { label: 'left', anim: 'walk-left', frame: 1, total: 6 },
            { label: 'right', anim: 'walk-right', frame: 1, total: 6 },
            { label: 'down', anim: 'walk-down', frame: 0, total: 6 },
            { label: 'up', anim: 'walk-up', frame: 0, total: 6 },
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
): { sheet: PixelBuffer; rows: SheetClipRow[] } {
  return generateAnimationAtlas(config.preset, config.size, config.outline);
}

export function generateCastSpritesheet(options: {
  size: number;
  outline: boolean;
}): PixelBuffer {
  const presets: CharacterPreset[] = ['curly', 'worker', 'cap'];
  const sheets = presets.map(
    (preset) => generateAnimationAtlas(preset, options.size, options.outline).sheet,
  );
  const maxW = Math.max(...sheets.map((s) => s.width));
  const padded = sheets.map((s) => {
    if (s.width === maxW) return s;
    const out = createBuffer(maxW, s.height);
    clear(out);
    blit(out, s, 0, 0, false);
    return out;
  });
  return stitchRows(padded.map((s) => [s]));
}

function onBackground(src: PixelBuffer, color: Rgba): PixelBuffer {
  const out = createBuffer(src.width, src.height);
  clear(out, color);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const p = getPixel(src, x, y);
      if (p[3]! > 0) setPixel(out, x, y, p);
    }
  }
  return out;
}

export const PRESETS: { id: CharacterPreset; label: string; blurb: string }[] = [
  { id: 'curly', label: 'Curly', blurb: 'Afro · white eyes · green bag · 6-frame walks' },
  { id: 'worker', label: 'Worker', blurb: 'Visor · overalls · wave · thinking' },
  { id: 'cap', label: 'Cap', blurb: 'Backwards cap · messenger bag' },
];

export const ANIMATIONS: {
  id: CharacterAnimName;
  label: string;
  frames: number;
}[] = [
  { id: 'idle-down', label: 'Idle ↓', frames: 6 },
  { id: 'idle-up', label: 'Idle ↑', frames: 6 },
  { id: 'idle-left', label: 'Idle ←', frames: 6 },
  { id: 'idle-right', label: 'Idle →', frames: 6 },
  { id: 'walk-down', label: 'Walk ↓', frames: 6 },
  { id: 'walk-up', label: 'Walk ↑', frames: 6 },
  { id: 'walk-left', label: 'Walk ←', frames: 6 },
  { id: 'walk-right', label: 'Walk →', frames: 6 },
  { id: 'wave', label: 'Wave', frames: 6 },
  { id: 'thinking', label: 'Thinking', frames: 6 },
];
