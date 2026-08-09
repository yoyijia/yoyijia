import type { PixelBuffer, PixelSize, Rgba } from '../../types';
import { hexToRgba } from '../palettes';
import { createRng, type Rng } from '../rng';
import {
  blit,
  clear,
  createBuffer,
  fillRect,
  setPixel,
  stitchGrid,
  stitchRows,
} from '../pixelEngine';

/** Supermarket palette — warm store lighting, department color coding */
const C = {
  outline: hexToRgba('#2b2420'),
  floor: hexToRgba('#e8dcc8'),
  floorLine: hexToRgba('#d4c4a8'),
  floorAlt: hexToRgba('#f0e6d4'),
  wood: hexToRgba('#c49a6c'),
  woodDark: hexToRgba('#8b5e3c'),
  woodLight: hexToRgba('#e2c19a'),
  wallGreen: hexToRgba('#8fbf7a'),
  wallGreenDark: hexToRgba('#5f8f4e'),
  wallCream: hexToRgba('#f3efe4'),
  wallBrown: hexToRgba('#b08968'),
  wallGrey: hexToRgba('#9aa3a7'),
  brick: hexToRgba('#a86b5a'),
  navy: hexToRgba('#244a78'),
  navyDark: hexToRgba('#183453'),
  metal: hexToRgba('#8a949c'),
  metalLight: hexToRgba('#c5d0d6'),
  metalDark: hexToRgba('#555f66'),
  glass: hexToRgba('#a8d8e8'),
  glassDark: hexToRgba('#6aa8c0'),
  glassLight: hexToRgba('#d8f2f7'),
  white: hexToRgba('#f7f7f7'),
  black: hexToRgba('#2a2a2a'),
  red: hexToRgba('#d64545'),
  orange: hexToRgba('#e89a3c'),
  yellow: hexToRgba('#e8c84a'),
  green: hexToRgba('#5faf5a'),
  blue: hexToRgba('#4a8fd4'),
  purple: hexToRgba('#8a6bbf'),
  pink: hexToRgba('#e87aa8'),
  shadow: hexToRgba('#cbb89a'),
};

function px(size: number) {
  const s = size / 32;
  return (n: number) => Math.round(n * s);
}

function strokeRect(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgba,
) {
  for (let i = 0; i < w; i++) {
    setPixel(buf, x + i, y, color);
    setPixel(buf, x + i, y + h - 1, color);
  }
  for (let i = 0; i < h; i++) {
    setPixel(buf, x, y + i, color);
    setPixel(buf, x + w - 1, y + i, color);
  }
}

function colorMatches(data: Uint8ClampedArray, i: number, color: Rgba): boolean {
  return (
    i >= 0 &&
    i + 3 < data.length &&
    data[i] === color[0] &&
    data[i + 1] === color[1] &&
    data[i + 2] === color[2] &&
    data[i + 3] === color[3]
  );
}

/** Crisp three-tone material lighting for high-resolution 16-bit props. */
function shadeStoreAsset(buf: PixelBuffer): PixelBuffer {
  const source = new Uint8ClampedArray(buf.data);
  const ramps: [Rgba, Rgba, Rgba][] = [
    [C.metal, C.metalLight, C.metalDark],
    [C.wallGrey, C.metalLight, C.metal],
    [C.navy, C.blue, C.navyDark],
    [C.glass, C.glassLight, C.glassDark],
    [C.wood, C.woodLight, C.woodDark],
    [C.green, hexToRgba('#82cf72'), C.wallGreenDark],
    [C.red, hexToRgba('#ef6b5d'), hexToRgba('#9f302d')],
  ];

  for (const [base, light, dark] of ramps) {
    for (let y = 0; y < buf.height; y++) {
      for (let x = 0; x < buf.width; x++) {
        const i = (y * buf.width + x) * 4;
        if (!colorMatches(source, i, base)) continue;
        const up =
          y > 0 &&
          colorMatches(source, ((y - 1) * buf.width + x) * 4, base);
        const left =
          x > 0 &&
          colorMatches(source, (y * buf.width + x - 1) * 4, base);
        const down =
          y + 1 < buf.height &&
          colorMatches(source, ((y + 1) * buf.width + x) * 4, base);
        const right =
          x + 1 < buf.width &&
          colorMatches(source, (y * buf.width + x + 1) * 4, base);
        if ((!up || !left) && (x + y) % 3 !== 0) {
          setPixel(buf, x, y, light);
        } else if ((!down || !right) && (x + y) % 2 === 0) {
          setPixel(buf, x, y, dark);
        }
      }
    }
  }
  return buf;
}

function tileFloor(size: number, variant: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  const base = variant % 2 === 0 ? C.floor : C.floorAlt;
  fillRect(buf, 0, 0, size, size, base);
  // grout grid
  const cell = Math.max(4, p(8));
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x++) setPixel(buf, x, y, C.floorLine);
  }
  for (let x = 0; x < size; x += cell) {
    for (let y = 0; y < size; y++) setPixel(buf, x, y, C.floorLine);
  }
  return buf;
}

function tileWoodFloor(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  fillRect(buf, 0, 0, size, size, C.wood);
  const plank = Math.max(3, p(6));
  for (let y = 0; y < size; y += plank) {
    fillRect(buf, 0, y, size, 1, C.woodDark);
    for (let x = (y / plank) % 2 === 0 ? 0 : p(8); x < size; x += p(14)) {
      fillRect(buf, x, y + 1, 1, plank - 1, C.woodDark);
    }
  }
  return buf;
}

function tileStoneFloor(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  fillRect(buf, 0, 0, size, size, C.wallGrey);
  const cell = Math.max(6, p(10));
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      strokeRect(buf, x, y, Math.min(cell, size - x), Math.min(cell, size - y), C.metal);
      if ((x + y) % (cell * 2) === 0) {
        setPixel(buf, x + 1, y + 1, C.metalLight);
      }
    }
  }
  return buf;
}

function tileWall(
  size: number,
  scheme: 'green' | 'brown' | 'grey',
): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  const main =
    scheme === 'green' ? C.wallCream : scheme === 'brown' ? C.woodLight : C.wallGrey;
  const stripe =
    scheme === 'green' ? C.wallGreen : scheme === 'brown' ? C.wallBrown : C.brick;
  const stripeDark =
    scheme === 'green' ? C.wallGreenDark : scheme === 'brown' ? C.woodDark : C.outline;
  fillRect(buf, 0, 0, size, size, main);
  const bandY = Math.floor(size * 0.55);
  fillRect(buf, 0, bandY, size, p(5), stripe);
  fillRect(buf, 0, bandY, size, 1, stripeDark);
  fillRect(buf, 0, bandY + p(5) - 1, size, 1, stripeDark);
  // top trim
  fillRect(buf, 0, 0, size, p(2), stripeDark);
  return buf;
}

function tileWallCorner(size: number, scheme: 'green' | 'brown' | 'grey'): PixelBuffer {
  const wall = tileWall(size, scheme);
  const p = px(size);
  fillRect(wall, 0, 0, p(3), size, C.outline);
  return wall;
}

function tileDoor(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  fillRect(buf, 0, 0, size, size, C.wallCream);
  fillRect(buf, p(2), p(4), size - p(4), size - p(4), C.glass);
  strokeRect(buf, p(2), p(4), size - p(4), size - p(4), C.metal);
  fillRect(buf, Math.floor(size / 2) - 1, p(4), 2, size - p(4), C.metal);
  // EXIT hint
  fillRect(buf, p(6), p(6), size - p(12), p(3), C.green);
  return buf;
}

function drawShelf(size: number, stocked: boolean, rng: Rng): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // side posts
  fillRect(buf, p(2), p(2), p(2), size - p(4), C.metal);
  fillRect(buf, size - p(4), p(2), p(2), size - p(4), C.metal);
  // Department-colored header panel, as used in the reference props.
  const header = rng.pick([C.navy, C.green, C.orange, C.yellow, C.purple]);
  fillRect(buf, p(2), p(2), size - p(4), p(5), C.metalLight);
  fillRect(buf, p(4), p(3), size - p(8), p(3), header);
  strokeRect(buf, p(2), p(2), size - p(4), p(5), C.outline);
  // shelves
  for (let row = 0; row < 3; row++) {
    const y = p(6) + row * p(8);
    fillRect(buf, p(2), y, size - p(4), p(2), C.metal);
    fillRect(buf, p(2), y + p(2), size - p(4), p(1), C.black);
    if (stocked) {
      const colors = [C.red, C.orange, C.yellow, C.green, C.blue, C.purple, C.pink, C.white];
      for (let i = 0; i < 4; i++) {
        const col = rng.pick(colors);
        fillRect(buf, p(4) + i * p(6), y - p(4), p(5), p(4), col);
        strokeRect(buf, p(4) + i * p(6), y - p(4), p(5), p(4), C.outline);
      }
    }
  }
  // base
  fillRect(buf, p(1), size - p(4), size - p(2), p(3), C.metal);
  strokeRect(buf, p(1), p(2), size - p(2), size - p(3), C.outline);
  return buf;
}

function drawCheckout(size: number, rng: Rng): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // counter
  fillRect(buf, p(1), p(10), size - p(2), p(14), C.wallGrey);
  fillRect(buf, p(1), p(10), size - p(2), p(3), C.metalLight);
  strokeRect(buf, p(1), p(10), size - p(2), p(14), C.outline);
  // belt
  fillRect(buf, p(3), p(12), size - p(10), p(4), C.black);
  // register / monitor
  fillRect(buf, size - p(10), p(4), p(7), p(6), C.black);
  fillRect(buf, size - p(9), p(5), p(5), p(3), C.glass);
  // keypad
  fillRect(buf, size - p(10), p(14), p(6), p(4), C.black);
  for (let i = 0; i < 4; i++) {
    setPixel(buf, size - p(9) + (i % 2) * p(2), p(15) + Math.floor(i / 2) * p(1), rng.pick([C.red, C.green, C.yellow]));
  }
  // bagging area
  fillRect(buf, p(3), p(18), p(8), p(4), C.wood);
  return buf;
}

function drawCart(size: number, color: Rgba): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // basket
  fillRect(buf, p(4), p(8), p(18), p(12), color);
  strokeRect(buf, p(4), p(8), p(18), p(12), C.outline);
  // grid lines
  for (let x = p(6); x < p(20); x += p(3)) {
    fillRect(buf, x, p(9), 1, p(10), C.outline);
  }
  // handle
  fillRect(buf, p(20), p(6), p(6), p(2), C.metal);
  fillRect(buf, p(24), p(6), p(2), p(8), C.metal);
  // wheels
  fillRect(buf, p(6), p(20), p(3), p(3), C.black);
  fillRect(buf, p(16), p(20), p(3), p(3), C.black);
  return buf;
}

function drawBasket(size: number, color: Rgba): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(8), p(12), p(16), p(10), color);
  strokeRect(buf, p(8), p(12), p(16), p(10), C.outline);
  fillRect(buf, p(10), p(10), p(12), p(2), C.outline);
  return buf;
}

function drawFridge(size: number, doors: number, rng: Rng): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(1), p(1), size - p(2), size - p(2), C.metalLight);
  strokeRect(buf, p(1), p(1), size - p(2), size - p(2), C.outline);
  const doorW = Math.floor((size - p(4)) / doors);
  for (let d = 0; d < doors; d++) {
    const x = p(2) + d * doorW;
    fillRect(buf, x, p(3), doorW - p(1), size - p(8), C.glass);
    strokeRect(buf, x, p(3), doorW - p(1), size - p(8), C.glassDark);
    // drinks inside
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const drink = rng.pick([C.red, C.green, C.orange, C.blue, C.white]);
        fillRect(
          buf,
          x + p(2) + col * p(4),
          p(5) + row * p(7),
          p(3),
          p(5),
          drink,
        );
      }
    }
    // handle
    fillRect(buf, x + doorW - p(3), p(12), p(1), p(6), C.metal);
  }
  return buf;
}

function drawFreezer(size: number, topView: boolean, rng: Rng): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  if (topView) {
    fillRect(buf, p(2), p(4), size - p(4), size - p(8), C.metalLight);
    strokeRect(buf, p(2), p(4), size - p(4), size - p(8), C.outline);
    fillRect(buf, p(4), p(6), size - p(8), size - p(12), C.glass);
    fillRect(buf, Math.floor(size / 2) - 1, p(6), 2, size - p(12), C.metal);
  } else {
    fillRect(buf, p(1), p(8), size - p(2), p(16), C.metalLight);
    strokeRect(buf, p(1), p(8), size - p(2), p(16), C.outline);
    fillRect(buf, p(3), p(10), size - p(6), p(6), C.glass);
    for (let i = 0; i < 3; i++) {
      fillRect(buf, p(5) + i * p(8), p(12), p(5), p(3), rng.pick([C.white, C.blue, C.yellow]));
    }
  }
  return buf;
}

function drawCrate(
  size: number,
  fill: Rgba,
  accent: Rgba,
  kind: 'produce' | 'bakery' | 'can' | 'bottle' | 'box',
  rng: Rng,
): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // wooden crate
  fillRect(buf, p(3), p(8), size - p(6), size - p(11), C.wood);
  strokeRect(buf, p(3), p(8), size - p(6), size - p(11), C.woodDark);
  fillRect(buf, p(3), p(8), size - p(6), p(2), C.woodLight);

  if (kind === 'produce') {
    for (let i = 0; i < 5; i++) {
      const x = p(5) + rng.int(0, Math.max(1, size - p(12)));
      const y = p(10) + rng.int(0, Math.max(1, p(8)));
      fillRect(buf, x, y, p(4), p(4), fill);
      setPixel(buf, x + 1, y + 1, accent);
    }
  } else if (kind === 'bakery') {
    for (let i = 0; i < 3; i++) {
      fillRect(buf, p(5) + i * p(7), p(12), p(6), p(4), fill);
      fillRect(buf, p(5) + i * p(7), p(12), p(6), p(1), accent);
    }
  } else if (kind === 'can') {
    for (let i = 0; i < 4; i++) {
      fillRect(buf, p(5) + i * p(6), p(12), p(4), p(6), fill);
      fillRect(buf, p(5) + i * p(6), p(14), p(4), p(2), accent);
    }
  } else if (kind === 'bottle') {
    for (let i = 0; i < 3; i++) {
      fillRect(buf, p(6) + i * p(7), p(10), p(3), p(8), fill);
      fillRect(buf, p(7) + i * p(7), p(8), p(1), p(2), C.outline);
    }
  } else {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        fillRect(buf, p(5) + i * p(10), p(10) + j * p(7), p(8), p(6), fill);
        fillRect(buf, p(5) + i * p(10), p(10) + j * p(7), p(8), p(2), accent);
      }
    }
  }
  return buf;
}

function drawSign(size: number, labelColor: Rgba, board: Rgba): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // hanging board
  fillRect(buf, p(2), p(8), size - p(4), p(12), board);
  strokeRect(buf, p(2), p(8), size - p(4), p(12), C.outline);
  fillRect(buf, p(4), p(11), size - p(8), p(4), labelColor);
  // ropes
  fillRect(buf, p(6), p(4), p(1), p(5), C.outline);
  fillRect(buf, size - p(7), p(4), p(1), p(5), C.outline);
  return buf;
}

function drawAisleMarker(size: number, n: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(6), p(2), size - p(12), size - p(4), C.blue);
  strokeRect(buf, p(6), p(2), size - p(12), size - p(4), C.outline);
  fillRect(buf, p(8), p(4), size - p(16), p(8), C.white);
  // simple numeral bars
  const cx = Math.floor(size / 2);
  if (n === 1) fillRect(buf, cx, p(6), p(2), p(5), C.blue);
  else if (n === 2) {
    fillRect(buf, cx - p(2), p(6), p(5), p(1), C.blue);
    fillRect(buf, cx + p(2), p(7), p(1), p(2), C.blue);
    fillRect(buf, cx - p(2), p(8), p(5), p(1), C.blue);
    fillRect(buf, cx - p(2), p(9), p(1), p(2), C.blue);
    fillRect(buf, cx - p(2), p(10), p(5), p(1), C.blue);
  } else {
    fillRect(buf, cx - p(2), p(6), p(4), p(1), C.blue);
    fillRect(buf, cx + p(1), p(7), p(1), p(4), C.blue);
    fillRect(buf, cx - p(2), p(8), p(3), p(1), C.blue);
  }
  return buf;
}

function drawPlant(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(10), p(18), p(12), p(8), C.woodDark);
  strokeRect(buf, p(10), p(18), p(12), p(8), C.outline);
  fillRect(buf, p(12), p(8), p(3), p(12), C.green);
  fillRect(buf, p(8), p(6), p(8), p(6), C.green);
  fillRect(buf, p(14), p(4), p(8), p(6), hexToRgba('#7ecf6a'));
  return buf;
}

function drawPromo(size: number, color: Rgba): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(6), p(4), size - p(12), size - p(8), color);
  strokeRect(buf, p(6), p(4), size - p(12), size - p(8), C.outline);
  fillRect(buf, p(8), p(8), size - p(16), p(4), C.white);
  fillRect(buf, p(8), p(14), size - p(16), p(6), C.yellow);
  return buf;
}

function drawServiceDoor(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(5), p(1), p(22), p(30), C.metalDark);
  fillRect(buf, p(7), p(4), p(18), p(27), hexToRgba('#6f7475'));
  strokeRect(buf, p(5), p(1), p(22), p(30), C.outline);
  // Blue header and inset window
  fillRect(buf, p(5), p(1), p(22), p(4), C.navy);
  fillRect(buf, p(10), p(8), p(12), p(8), C.glassDark);
  fillRect(buf, p(11), p(9), p(10), p(6), C.glass);
  fillRect(buf, p(12), p(9), p(6), p(1), C.glassLight);
  strokeRect(buf, p(10), p(8), p(12), p(8), C.outline);
  // Vertical paneling and handle
  for (let x = p(9); x < p(24); x += p(5)) {
    fillRect(buf, x, p(18), 1, p(12), C.metalDark);
  }
  fillRect(buf, p(22), p(19), p(2), p(5), C.metalLight);
  strokeRect(buf, p(22), p(19), p(2), p(5), C.outline);
  return shadeStoreAsset(buf);
}

function drawPoster(size: number, color: Rgba, sale: boolean): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(5), p(2), p(22), p(28), C.metalDark);
  fillRect(buf, p(7), p(4), p(18), p(24), color);
  strokeRect(buf, p(5), p(2), p(22), p(28), C.outline);
  fillRect(buf, p(9), p(7), p(14), p(4), C.white);
  fillRect(buf, p(10), p(8), p(12), p(2), sale ? C.red : C.navy);
  // Pixel-copy lines / price panel
  fillRect(buf, p(9), p(14), p(14), p(2), C.white);
  fillRect(buf, p(11), p(18), p(10), p(2), C.white);
  if (sale) {
    fillRect(buf, p(10), p(22), p(12), p(4), C.yellow);
    fillRect(buf, p(12), p(23), p(8), p(2), C.outline);
  } else {
    // check mark
    fillRect(buf, p(12), p(22), p(2), p(2), C.white);
    fillRect(buf, p(14), p(24), p(2), p(2), C.white);
    fillRect(buf, p(16), p(21), p(2), p(4), C.white);
  }
  return shadeStoreAsset(buf);
}

function drawCautionBoard(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // Fold-out A-frame
  fillRect(buf, p(10), p(4), p(12), p(3), C.orange);
  fillRect(buf, p(8), p(6), p(16), p(22), C.yellow);
  strokeRect(buf, p(8), p(6), p(16), p(22), C.outline);
  fillRect(buf, p(10), p(8), p(12), p(2), C.orange);
  // warning triangle
  for (let y = 0; y < p(8); y++) {
    const half = Math.floor((y / Math.max(1, p(8))) * p(6));
    fillRect(buf, p(16) - half, p(12) + y, half * 2 + 1, 1, C.outline);
  }
  fillRect(buf, p(15), p(15), p(2), p(4), C.yellow);
  setPixel(buf, p(16), p(20), C.yellow);
  fillRect(buf, p(10), p(24), p(12), p(2), C.outline);
  return buf;
}

function drawTrashBin(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(9), p(7), p(14), p(21), C.wallGreenDark);
  fillRect(buf, p(8), p(5), p(16), p(4), C.green);
  strokeRect(buf, p(9), p(7), p(14), p(21), C.outline);
  strokeRect(buf, p(8), p(5), p(16), p(4), C.outline);
  // inset trash icon
  fillRect(buf, p(14), p(14), p(5), p(8), C.white);
  fillRect(buf, p(13), p(13), p(7), p(2), C.white);
  fillRect(buf, p(15), p(11), p(3), p(2), C.white);
  return shadeStoreAsset(buf);
}

function drawBarrier(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(4), p(12), p(24), p(5), C.metalLight);
  strokeRect(buf, p(4), p(12), p(24), p(5), C.outline);
  fillRect(buf, p(5), p(15), p(2), p(12), C.metal);
  fillRect(buf, p(25), p(15), p(2), p(12), C.metal);
  fillRect(buf, p(3), p(26), p(6), p(3), C.metalDark);
  fillRect(buf, p(23), p(26), p(6), p(3), C.metalDark);
  return shadeStoreAsset(buf);
}

function drawFlatbed(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(4), p(18), p(22), p(7), C.metalLight);
  strokeRect(buf, p(4), p(18), p(22), p(7), C.outline);
  // raised handle
  fillRect(buf, p(24), p(6), p(3), p(14), C.metal);
  fillRect(buf, p(25), p(4), p(5), p(3), C.metal);
  strokeRect(buf, p(24), p(5), p(3), p(15), C.outline);
  // wheels
  discPixel(buf, p(8), p(27), p(2), C.outline);
  discPixel(buf, p(23), p(27), p(2), C.outline);
  return shadeStoreAsset(buf);
}

function discPixel(
  buf: PixelBuffer,
  cx: number,
  cy: number,
  r: number,
  color: Rgba,
): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(buf, cx + x, cy + y, color);
    }
  }
}

function drawRollCage(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(7), p(3), p(3), p(24), C.metalDark);
  fillRect(buf, p(22), p(3), p(3), p(24), C.metalDark);
  fillRect(buf, p(7), p(3), p(18), p(3), C.metalDark);
  fillRect(buf, p(7), p(24), p(18), p(3), C.metalDark);
  // wire grid
  for (let x = p(11); x < p(22); x += p(4)) {
    fillRect(buf, x, p(5), 1, p(20), C.metal);
  }
  for (let y = p(8); y < p(24); y += p(4)) {
    fillRect(buf, p(9), y, p(15), 1, C.metal);
  }
  discPixel(buf, p(10), p(28), p(2), C.outline);
  discPixel(buf, p(22), p(28), p(2), C.outline);
  return shadeStoreAsset(buf);
}

function drawCardboardBin(size: number): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  fillRect(buf, p(9), p(8), p(14), p(20), C.wood);
  strokeRect(buf, p(9), p(8), p(14), p(20), C.outline);
  fillRect(buf, p(12), p(11), p(8), p(5), C.woodLight);
  fillRect(buf, p(14), p(12), p(4), p(2), C.outline);
  fillRect(buf, p(10), p(23), p(12), p(2), C.woodDark);
  return shadeStoreAsset(buf);
}

function drawProduceStand(size: number, rng: Rng): PixelBuffer {
  const buf = createBuffer(size, size);
  const p = px(size);
  clear(buf);
  // table
  fillRect(buf, p(2), p(14), size - p(4), p(10), C.wood);
  strokeRect(buf, p(2), p(14), size - p(4), p(10), C.woodDark);
  // crates on top
  const colors = [
    [C.red, C.orange],
    [C.green, hexToRgba('#7ecf6a')],
    [C.orange, C.yellow],
    [C.purple, C.pink],
  ] as const;
  for (let i = 0; i < 2; i++) {
    const [a, b] = rng.pick(colors);
    const crate = drawCrate(Math.floor(size / 2), a, b, 'produce', rng);
    blit(buf, crate, i * Math.floor(size / 2), p(2), true);
  }
  return buf;
}

export type SupermarketSection =
  | 'floors'
  | 'walls'
  | 'shelves'
  | 'checkout'
  | 'cold'
  | 'produce'
  | 'bakery'
  | 'goods'
  | 'signs'
  | 'props';

export function generateSupermarketTileset(options: {
  tileSize: PixelSize;
  seed: number;
}): {
  sections: { id: SupermarketSection; label: string; sheet: PixelBuffer; tiles: PixelBuffer[] }[];
  atlas: PixelBuffer;
  map: PixelBuffer;
} {
  const { tileSize: size, seed } = options;
  const rng = createRng(seed);

  const floors = [
    tileFloor(size, 0),
    tileFloor(size, 1),
    tileWoodFloor(size),
    tileStoneFloor(size),
  ];

  const walls = [
    tileWall(size, 'green'),
    tileWall(size, 'brown'),
    tileWall(size, 'grey'),
    tileWallCorner(size, 'green'),
    tileDoor(size),
  ];

  const shelves = [
    drawShelf(size, true, rng),
    drawShelf(size, true, createRng(seed + 11)),
    drawShelf(size, false, rng),
    drawProduceStand(size, createRng(seed + 21)),
  ].map(shadeStoreAsset);

  const checkout = [
    drawCheckout(size, rng),
    drawCart(size, C.metal),
    drawCart(size, C.green),
    drawCart(size, C.orange),
    drawBasket(size, C.red),
    drawBasket(size, C.green),
  ].map(shadeStoreAsset);

  const cold = [
    drawFridge(size, 3, createRng(seed + 31)),
    drawFridge(size, 2, createRng(seed + 32)),
    drawFreezer(size, false, createRng(seed + 33)),
    drawFreezer(size, true, createRng(seed + 34)),
  ].map(shadeStoreAsset);

  const produceColors: [Rgba, Rgba][] = [
    [C.red, C.orange], // tomato
    [C.orange, C.yellow], // orange
    [C.yellow, hexToRgba('#f0e080')], // banana
    [C.green, hexToRgba('#7ecf6a')], // lettuce
    [C.purple, C.pink], // grape
    [hexToRgba('#6aa84f'), C.green], // melon
    [C.orange, hexToRgba('#f0c070')], // carrot
    [C.yellow, C.green], // corn
  ];
  const produce = produceColors.map(([a, b], i) =>
    drawCrate(size, a, b, 'produce', createRng(seed + 40 + i)),
  );

  const bakery = [
    drawCrate(size, C.woodLight, C.wood, 'bakery', createRng(seed + 50)),
    drawCrate(size, hexToRgba('#f0d0a0'), C.orange, 'bakery', createRng(seed + 51)),
    drawCrate(size, C.pink, C.white, 'bakery', createRng(seed + 52)),
    drawCrate(size, C.yellow, C.wood, 'bakery', createRng(seed + 53)),
  ];

  const goods = [
    ...[C.red, C.blue, C.green, C.yellow, C.orange, C.purple].map((col, i) =>
      drawCrate(size, col, C.white, 'can', createRng(seed + 60 + i)),
    ),
    ...[C.red, C.green, C.orange, C.blue].map((col, i) =>
      drawCrate(size, col, C.metalLight, 'bottle', createRng(seed + 70 + i)),
    ),
    ...[C.yellow, C.red, C.blue, C.purple].map((col, i) =>
      drawCrate(size, col, C.white, 'box', createRng(seed + 80 + i)),
    ),
  ];

  const signs = [
    drawSign(size, C.green, C.wood),
    drawSign(size, C.orange, C.wood),
    drawSign(size, C.blue, C.wood),
    drawSign(size, C.red, C.wood),
    drawAisleMarker(size, 1),
    drawAisleMarker(size, 2),
    drawAisleMarker(size, 3),
    drawAisleMarker(size, 4),
  ];

  const props = [
    drawServiceDoor(size),
    drawPoster(size, C.navy, false),
    drawPoster(size, C.red, true),
    drawCautionBoard(size),
    drawTrashBin(size),
    drawBarrier(size),
    drawFlatbed(size),
    drawRollCage(size),
    drawCardboardBin(size),
    shadeStoreAsset(drawPlant(size)),
    shadeStoreAsset(drawPromo(size, C.red)),
    shadeStoreAsset(drawPromo(size, C.blue)),
    drawBasket(size, C.orange),
  ];

  const sections: {
    id: SupermarketSection;
    label: string;
    sheet: PixelBuffer;
    tiles: PixelBuffer[];
  }[] = [
    { id: 'floors', label: 'Floors', tiles: floors, sheet: stitchGrid(floors, 4) },
    { id: 'walls', label: 'Walls & doors', tiles: walls, sheet: stitchGrid(walls, 5) },
    { id: 'shelves', label: 'Shelves', tiles: shelves, sheet: stitchGrid(shelves, 4) },
    { id: 'checkout', label: 'Checkout & carts', tiles: checkout, sheet: stitchGrid(checkout, 3) },
    { id: 'cold', label: 'Fridges & freezers', tiles: cold, sheet: stitchGrid(cold, 4) },
    { id: 'produce', label: 'Fruits & vegetables', tiles: produce, sheet: stitchGrid(produce, 4) },
    { id: 'bakery', label: 'Bakery', tiles: bakery, sheet: stitchGrid(bakery, 4) },
    { id: 'goods', label: 'Dry goods & drinks', tiles: goods, sheet: stitchGrid(goods, 6) },
    { id: 'signs', label: 'Signs', tiles: signs, sheet: stitchGrid(signs, 4) },
    { id: 'props', label: 'High-res location props', tiles: props, sheet: stitchGrid(props, 5) },
  ];

  // Atlas: stack section sheets (padded to common width)
  const maxW = Math.max(...sections.map((s) => s.sheet.width));
  const atlasRows = sections.map((s) => {
    if (s.sheet.width === maxW) return [s.sheet];
    const pad = createBuffer(maxW, s.sheet.height);
    clear(pad);
    blit(pad, s.sheet, 0, 0, false);
    return [pad];
  });
  const atlas = stitchRows(atlasRows);

  const map = buildStoreMap(size, seed, {
    floor: floors[0]!,
    wall: walls[0]!,
    shelf: shelves[0]!,
    checkout: checkout[0]!,
    fridge: cold[0]!,
    freezer: cold[2]!,
    produce: shelves[3]!,
    door: walls[4]!,
  });

  return { sections, atlas, map };
}

function buildStoreMap(
  size: number,
  seed: number,
  tiles: {
    floor: PixelBuffer;
    wall: PixelBuffer;
    shelf: PixelBuffer;
    checkout: PixelBuffer;
    fridge: PixelBuffer;
    freezer: PixelBuffer;
    produce: PixelBuffer;
    door: PixelBuffer;
  },
): PixelBuffer {
  const cols = 12;
  const rows = 10;
  const map = createBuffer(cols * size, rows * size);
  const rng = createRng(seed + 999);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      blit(map, tiles.floor, c * size, r * size, false);
    }
  }
  // top wall
  for (let c = 0; c < cols; c++) {
    blit(map, tiles.wall, c * size, 0, false);
  }
  // exit doors
  blit(map, tiles.door, 5 * size, 0, false);
  blit(map, tiles.door, 6 * size, 0, false);

  // aisle shelves
  for (let aisle = 0; aisle < 3; aisle++) {
    const x = (2 + aisle * 3) * size;
    for (let r = 2; r <= 6; r++) {
      blit(map, tiles.shelf, x, r * size, true);
    }
  }

  // produce left
  blit(map, tiles.produce, 1 * size, 2 * size, true);
  blit(map, tiles.produce, 1 * size, 3 * size, true);

  // cold right
  blit(map, tiles.fridge, 10 * size, 2 * size, true);
  blit(map, tiles.fridge, 10 * size, 3 * size, true);
  blit(map, tiles.freezer, 10 * size, 5 * size, true);
  blit(map, tiles.freezer, 9 * size, 5 * size, true);

  // checkout bottom
  blit(map, tiles.checkout, 4 * size, 8 * size, true);
  blit(map, tiles.checkout, 6 * size, 8 * size, true);

  // sprinkle shadow noise for life
  for (let i = 0; i < 20; i++) {
    if (rng.chance(0.5)) {
      /* keep map clean */
    }
  }

  return map;
}

export const SUPERMARKET_SIZES: PixelSize[] = [16, 32, 64, 128, 256, 512];
