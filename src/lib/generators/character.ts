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
  outlineOpaque,
  setPixel,
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
};

const PRESET_COLORS: Record<CharacterPreset, CharColors> = {
  curly: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f0c8a0'),
    skinShade: hexToRgba('#d4a574'),
    hair: hexToRgba('#1a1a1a'),
    shirt: hexToRgba('#e87a7a'),
    shirtShade: hexToRgba('#c45c5c'),
    pants: hexToRgba('#2f4f8f'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#4caf6a'),
    accent2: hexToRgba('#3d8f55'),
  },
  worker: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f0c8a0'),
    skinShade: hexToRgba('#d4a574'),
    hair: hexToRgba('#1a1a1a'),
    shirt: hexToRgba('#d64545'),
    shirtShade: hexToRgba('#a83232'),
    pants: hexToRgba('#2a2a2a'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#1a1a1a'),
    accent2: hexToRgba('#ffffff'),
  },
  cap: {
    outline: hexToRgba('#1a1a1a'),
    skin: hexToRgba('#f0c8a0'),
    skinShade: hexToRgba('#d4a574'),
    hair: hexToRgba('#5c4030'),
    shirt: hexToRgba('#f2f2f2'),
    shirtShade: hexToRgba('#d0d0d0'),
    pants: hexToRgba('#3b6ea5'),
    shoes: hexToRgba('#1a1a1a'),
    accent: hexToRgba('#1a1a1a'),
    accent2: hexToRgba('#ffffff'),
  },
};

type Pose = {
  dir: CharacterDirection;
  arm: 'down' | 'swing-front' | 'swing-back' | 'wave' | 'think';
  leg: 'idle' | 'left-fwd' | 'right-fwd';
  bob: number;
};

function scaleOf(size: number) {
  const u = size / 32;
  const px = (n: number) => Math.round(n * u);
  return { px };
}

function drawOval(
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
      if (x * x / rx2 + y * y / ry2 <= 1.08) {
        setPixel(buf, cx + x, cy + y, color);
      }
    }
  }
}

function drawHead(
  buf: PixelBuffer,
  preset: CharacterPreset,
  dir: CharacterDirection,
  c: CharColors,
  px: (n: number) => number,
  cx: number,
  headTop: number,
  expression: 'neutral' | 'smile' | 'think',
) {
  const headCx = cx;
  const headCy = headTop + px(5);
  const skin = dir === 'up' ? c.skinShade : c.skin;

  // skull
  drawOval(buf, headCx, headCy, px(5), px(5), skin);

  if (preset === 'curly') {
    // curly afro mass around head
    const bumps: [number, number, number][] = [
      [0, -4, 4],
      [-4, -2, 3],
      [4, -2, 3],
      [-6, 1, 3],
      [6, 1, 3],
      [-5, 4, 3],
      [5, 4, 3],
      [0, -6, 3],
    ];
    for (const [ox, oy, r] of bumps) {
      if (dir === 'left' && ox > 2) continue;
      if (dir === 'right' && ox < -2) continue;
      drawOval(buf, headCx + px(ox), headTop + px(oy + 5), px(r), px(r), c.hair);
    }
    // forehead
    if (dir !== 'up') {
      fillRect(buf, headCx - px(3), headTop + px(4), px(6), px(2), skin);
    }
  } else if (preset === 'worker') {
    // hair bowl + bun
    drawOval(buf, headCx, headTop + px(3), px(6), px(3), c.hair);
    if (dir === 'down') {
      drawOval(buf, headCx, headTop - px(1), px(3), px(3), c.hair);
      // side bangs
      fillRect(buf, headCx - px(5), headTop + px(4), px(2), px(4), c.hair);
      fillRect(buf, headCx + px(3), headTop + px(4), px(2), px(4), c.hair);
    } else if (dir === 'up') {
      drawOval(buf, headCx, headTop - px(1), px(3), px(3), c.hair);
      fillRect(buf, headCx - px(5), headTop + px(4), px(10), px(3), c.hair);
    } else {
      const side = dir === 'left' ? -1 : 1;
      drawOval(buf, headCx + side * px(1), headTop - px(1), px(3), px(3), c.hair);
      fillRect(buf, headCx - side * px(4), headTop + px(4), px(2), px(4), c.hair);
    }
    // red visor (after hair/skin)
    if (dir !== 'up') {
      if (dir === 'down') {
        fillRect(buf, headCx - px(5), headTop + px(3), px(10), px(2), c.shirt);
      } else {
        const side = dir === 'left' ? -1 : 1;
        fillRect(
          buf,
          headCx + (side < 0 ? -px(5) : -px(1)),
          headTop + px(3),
          px(6),
          px(2),
          c.shirt,
        );
      }
    }
  } else {
    // short hair + backwards cap
    if (dir !== 'up') {
      fillRect(buf, headCx - px(4), headTop + px(3), px(8), px(2), c.hair);
    } else {
      fillRect(buf, headCx - px(4), headTop + px(3), px(8), px(3), c.hair);
    }
    drawOval(buf, headCx, headTop + px(2), px(6), px(3), c.accent);
    if (dir === 'down') {
      // backwards: buckle on front-ish, brim hint back
      fillRect(buf, headCx + px(2), headTop + px(1), px(3), px(2), c.accent);
      fillRect(buf, headCx - px(2), headTop + px(3), px(3), px(1), c.accent2);
    } else if (dir === 'up') {
      fillRect(buf, headCx - px(6), headTop + px(3), px(12), px(2), c.accent);
    } else {
      const side = dir === 'left' ? -1 : 1;
      fillRect(buf, headCx + side * px(3), headTop + px(3), px(4), px(2), c.accent);
    }
  }

  // face
  if (dir === 'up') return;
  const eyeY = headTop + px(6);
  if (dir === 'down') {
    setPixel(buf, headCx - px(2), eyeY, c.outline);
    setPixel(buf, headCx + px(2), eyeY, c.outline);
    if (expression === 'smile') {
      setPixel(buf, headCx - px(1), eyeY + px(2), c.shirtShade);
      setPixel(buf, headCx, eyeY + px(2), c.shirtShade);
      setPixel(buf, headCx + px(1), eyeY + px(2), c.shirtShade);
    } else if (expression === 'think') {
      setPixel(buf, headCx + px(1), eyeY + px(2), c.outline);
    }
  } else {
    const side = dir === 'left' ? -1 : 1;
    setPixel(buf, headCx + side * px(2), eyeY, c.outline);
    if (expression === 'smile' || expression === 'think') {
      setPixel(buf, headCx + side * px(1), eyeY + px(2), c.outline);
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
) {
  const torsoW = px(10);
  const torsoH = px(8);
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
    fillRect(buf, cx - px(4), torsoY + px(2), px(8), px(7), c.accent);
    if (dir === 'down') {
      fillRect(buf, cx + px(1), torsoY + px(3), px(2), px(2), c.accent2);
    }
    if (dir === 'up') {
      for (let i = 0; i < px(6); i++) {
        setPixel(buf, cx - px(3) + i, torsoY + i, c.accent);
        setPixel(buf, cx + px(3) - i, torsoY + i, c.accent);
      }
    }
  }

  if (preset === 'curly' && dir !== 'up') {
    const bagX = dir === 'left' ? cx - px(8) : cx + px(4);
    if (dir === 'down') {
      fillRect(buf, cx + px(4), torsoY + px(2), px(4), px(5), c.accent);
      fillRect(buf, cx + px(4), torsoY + px(2), px(4), px(1), c.accent2);
    } else {
      fillRect(buf, bagX, torsoY + px(2), px(4), px(5), c.accent);
      fillRect(buf, bagX, torsoY + px(2), px(4), px(1), c.accent2);
    }
  }

  if (preset === 'cap') {
    if (dir === 'down') {
      for (let i = 0; i < px(8); i++) {
        setPixel(buf, cx - px(4) + i, torsoY + Math.floor(i * 0.7), c.accent2);
      }
      fillRect(buf, cx + px(3), torsoY + px(3), px(4), px(5), c.accent);
    } else if (dir === 'up') {
      for (let i = 0; i < px(8); i++) {
        setPixel(buf, cx + px(4) - i, torsoY + Math.floor(i * 0.7), c.accent2);
      }
      fillRect(buf, cx - px(7), torsoY + px(3), px(4), px(5), c.accent);
    } else if (dir === 'right') {
      fillRect(buf, cx - px(7), torsoY + px(2), px(3), px(5), c.accent);
    } else {
      fillRect(buf, cx + px(4), torsoY + px(2), px(3), px(5), c.accent);
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
  const armY = torsoY + px(1);
  if (pose.dir === 'down' || pose.dir === 'up') {
    const swing =
      pose.arm === 'swing-front' ? px(1) : pose.arm === 'swing-back' ? -px(1) : 0;
    if (pose.arm === 'wave') {
      fillRect(buf, cx - px(7), armY, px(2), px(4), c.skin);
      fillRect(buf, cx + px(5), armY - px(5), px(2), px(6), c.skin);
      fillRect(buf, cx + px(5), armY - px(6), px(3), px(2), c.skin);
    } else if (pose.arm === 'think') {
      fillRect(buf, cx - px(7), armY, px(2), px(3), c.skin);
      fillRect(buf, cx + px(3), armY - px(2), px(2), px(5), c.skin);
      fillRect(buf, cx + px(1), torsoY - px(1), px(3), px(2), c.skin);
    } else {
      fillRect(buf, cx - px(7), armY + swing, px(2), px(5), c.skin);
      fillRect(buf, cx + px(5), armY - swing, px(2), px(5), c.skin);
    }
  } else {
    const front = pose.dir === 'left' ? -1 : 1;
    let ay = armY;
    let ax = cx + front * px(1);
    if (pose.arm === 'swing-front') {
      ax += front * px(2);
      ay += px(1);
    } else if (pose.arm === 'swing-back') {
      ax -= front * px(1);
    } else if (pose.arm === 'wave') {
      ay -= px(4);
      ax += front * px(2);
    } else if (pose.arm === 'think') {
      ay -= px(2);
      ax += front * px(2);
    }
    fillRect(buf, ax, ay, px(2), px(5), c.skin);
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
  const isShorts = preset === 'curly';
  const pantH = isShorts ? px(4) : px(6);
  const legW = px(3);

  if (pose.dir === 'left' || pose.dir === 'right') {
    const fwd = pose.leg === 'idle' ? 0 : px(2);
    const back = pose.leg === 'idle' ? 0 : -px(1);
    fillRect(buf, cx - px(1) + back, hipY, legW, pantH, c.pants);
    fillRect(buf, cx - px(1) + back, hipY + pantH, legW, px(2), c.shoes);
    fillRect(buf, cx - px(1) + fwd, hipY, legW, pantH, c.pants);
    fillRect(buf, cx - px(1) + fwd, hipY + pantH, legW, px(2), c.shoes);
    return;
  }

  let leftY = 0;
  let rightY = 0;
  if (pose.leg === 'left-fwd') {
    leftY = -px(1);
    rightY = px(1);
  } else if (pose.leg === 'right-fwd') {
    leftY = px(1);
    rightY = -px(1);
  }

  fillRect(buf, cx - px(4), hipY + leftY, legW, pantH, c.pants);
  fillRect(buf, cx + px(1), hipY + rightY, legW, pantH, c.pants);
  fillRect(buf, cx - px(4), hipY + pantH + leftY, legW, px(2), c.shoes);
  fillRect(buf, cx + px(1), hipY + pantH + rightY, legW, px(2), c.shoes);
}

function drawCharacterPose(
  size: number,
  preset: CharacterPreset,
  pose: Pose,
  outline: boolean,
): PixelBuffer {
  const buf = createBuffer(size, size);
  clear(buf);
  const { px } = scaleOf(size);
  const c = PRESET_COLORS[preset];
  const cx = Math.floor(size / 2);
  const headTop = px(4) + pose.bob;
  const torsoY = headTop + px(10);
  const hipY = torsoY + px(7);
  const expr =
    pose.arm === 'wave' ? 'smile' : pose.arm === 'think' ? 'think' : 'neutral';

  if (pose.dir === 'up') {
    drawArms(buf, pose, c, px, cx, torsoY);
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY);
    drawHead(buf, preset, pose.dir, c, px, cx, headTop, expr);
  } else {
    drawLegs(buf, pose, preset, c, px, cx, hipY);
    drawBody(buf, preset, pose.dir, c, px, cx, torsoY);
    drawArms(buf, pose, c, px, cx, torsoY);
    drawHead(buf, preset, pose.dir, c, px, cx, headTop, expr);
  }

  if (outline) outlineOpaque(buf, c.outline);
  return centerSprite(buf);
}

function animToPose(
  anim: CharacterAnimName,
  frame: number,
  frameCount: number,
  size: number,
): Pose {
  const t = frame / Math.max(1, frameCount);
  const bobUnit = Math.max(0, Math.round(size / 32));
  const phase = Math.sin(t * Math.PI * 2);

  if (anim === 'wave') {
    return {
      dir: 'down',
      arm: 'wave',
      leg: 'idle',
      bob: Math.round(Math.sin(t * Math.PI * 2) * bobUnit),
    };
  }
  if (anim === 'thinking') {
    return {
      dir: 'down',
      arm: 'think',
      leg: 'idle',
      bob: Math.round(Math.sin(t * Math.PI * 2) * bobUnit * 0.5),
    };
  }

  const dir = anim.split('-')[1] as CharacterDirection;
  const isWalk = anim.startsWith('walk');
  if (!isWalk) {
    return {
      dir,
      arm: 'down',
      leg: 'idle',
      bob: Math.round(Math.sin(t * Math.PI * 2) * bobUnit * 0.5),
    };
  }

  return {
    dir,
    arm: phase >= 0 ? 'swing-back' : 'swing-front',
    leg: phase >= 0 ? 'left-fwd' : 'right-fwd',
    bob: Math.round(Math.abs(phase) * bobUnit),
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
  const clips: { id: CharacterAnimName; label: string; frames: number }[] = [
    { id: 'walk-left', label: 'left', frames: walkFrames },
    { id: 'walk-right', label: 'right', frames: walkFrames },
    { id: 'walk-down', label: 'down', frames: walkFrames },
    { id: 'walk-up', label: 'up', frames: walkFrames },
    { id: 'idle-down', label: 'idle-down', frames: 2 },
    { id: 'idle-up', label: 'idle-up', frames: 2 },
    { id: 'wave', label: 'wave', frames: 4 },
    { id: 'thinking', label: 'thinking', frames: 4 },
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

  const sheetRows: PixelBuffer[][] = [
    rows[0]!.frames,
    rows[1]!.frames,
    rows[2]!.frames,
    rows[3]!.frames,
    [
      rows[4]!.frames[0]!,
      rows[5]!.frames[0]!,
      rows[6]!.frames[0]!,
      rows[7]!.frames[0]!,
    ],
  ];

  return { sheet: stitchRows(sheetRows), rows };
}

/** Stack all three reference characters into one cast spritesheet */
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
  return stitchRows(sheets.map((s) => [s]));
}

export const PRESETS: { id: CharacterPreset; label: string; blurb: string }[] = [
  { id: 'curly', label: 'Curly', blurb: 'Afro · pink tee · green bag' },
  { id: 'worker', label: 'Worker', blurb: 'Bun · visor · apron' },
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
