#!/usr/bin/env python3
"""
Singapore Neighbourhood 64×64 Modular Tileset
Clean Nintendo-like vector style matching the reference:
soft pastels, no outlines, minimal two-tone shading, rounded corners,
dimetric 3/4 view, soft coloured shadows (not black).
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TILESET = ROOT / "tileset"
T = 64  # base tile size

# ---------------------------------------------------------------------------
# Palette — soft pastel-plus from reference
# ---------------------------------------------------------------------------
C = {
    "cream": "#F5F1E8",
    "cream_side": "#E6E0D4",
    "cream_dark": "#D4CDC0",
    "white": "#FFFEFB",
    "white_side": "#F0EBE3",
    "road": "#B7BEC8",
    "road_dark": "#A4ACB8",
    "road_line": "#F2F5F8",
    "pavement": "#E6E9EE",
    "pavement_edge": "#D2D7DF",
    "grass": "#7BC96F",
    "grass_light": "#93D988",
    "grass_dark": "#5FAF55",
    "grass_shadow": "#4E9A45",
    "bush": "#4F9A4A",
    "bush_dark": "#3E7D3A",
    "bush_light": "#6BB366",
    "tree": "#5AAA54",
    "tree_dark": "#478B42",
    "tree_light": "#78C072",
    "trunk": "#8B6848",
    "trunk_dark": "#6E5238",
    "red": "#E56B6B",
    "red_dark": "#C95555",
    "red_roof": "#E88778",
    "red_roof_side": "#D06E60",
    "orange_roof": "#E9A06A",
    "orange_roof_side": "#D48852",
    "orange_tile": "#F0B47C",
    "orange_tile_line": "#E09860",
    "blue": "#5B9FD4",
    "blue_dark": "#4788BB",
    "blue_light": "#7BB5E0",
    "blue_window": "#8EC4E8",
    "yellow": "#F5D56A",
    "yellow_dark": "#E0C050",
    "lemon": "#F8E28C",
    "stool_red": "#E57373",
    "stool_blue": "#6BA8D9",
    "sg_red": "#ED2939",
    "sg_red_dark": "#C41E2A",
    "mrt_green": "#009645",
    "mrt_green_dark": "#007A38",
    "mrt_red": "#D42E12",
    "fairprice": "#E31C23",
    "fairprice_dark": "#C0151B",
    "sheng": "#00A651",
    "sheng_dark": "#008C44",
    "guardian": "#00A19A",
    "guardian_dark": "#008780",
    "watsons": "#0077C8",
    "watsons_dark": "#0060A3",
    "unity": "#F36C00",
    "unity_dark": "#D45E00",
    "singpost": "#ED1C24",
    "bank": "#003DA5",
    "bank_dark": "#002E7A",
    "notice": "#4A5160",
    "charcoal": "#3D4450",
    "dark": "#5A6270",
    "black": "#2C3238",
    "court": "#6BB86A",
    "court_key": "#E57373",
    "shadow": "#3A4A3828",       # soft coloured shadow
    "shadow_soft": "#3A4A3818",
}


def svg(w: int, h: int, name: str, body: str) -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" fill="none">\n'
        f'  <!-- {name} | {w}x{h} | 64-grid modular tileset -->\n'
        f"{body}</svg>\n"
    )


def rr(x, y, w, h, r, fill, op=1.0) -> str:
    o = f' opacity="{op}"' if op < 1 else ""
    return (
        f'  <rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" '
        f'rx="{r}" ry="{r}" fill="{fill}"{o}/>\n'
    )


def el(cx, cy, rx, ry, fill, op=1.0) -> str:
    o = f' opacity="{op}"' if op < 1 else ""
    return (
        f'  <ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" '
        f'fill="{fill}"{o}/>\n'
    )


def cir(cx, cy, r, fill, op=1.0) -> str:
    o = f' opacity="{op}"' if op < 1 else ""
    return f'  <circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{fill}"{o}/>\n'


def pth(d, fill, op=1.0) -> str:
    o = f' opacity="{op}"' if op < 1 else ""
    return f'  <path d="{d}" fill="{fill}"{o}/>\n'


def shadow(cx, cy, rx, ry, soft=False) -> str:
    return el(cx, cy, rx, ry, C["shadow_soft"] if soft else C["shadow"])


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  ✓ {path.relative_to(ROOT)}")


# ===========================================================================
# GROUND — seamless 64×64 (edge-to-edge, tileable)
# ===========================================================================

def ground_grass():
    b = rr(0, 0, T, T, 0, C["grass"])
    # subtle leaf / tuft dots (stay inside so seams stay clean)
    for x, y in [(12, 14), (28, 40), (48, 18), (18, 50), (44, 46), (36, 10)]:
        b += cir(x, y, 1.6, C["grass_light"])
    for x, y in [(22, 28), (50, 34)]:
        b += cir(x, y, 1.2, C["yellow"])
    write(TILESET / "ground" / "grass.svg", svg(T, T, "Grass", b))


def ground_pavement():
    b = rr(0, 0, T, T, 0, C["pavement"])
    # subtle slab lines (not crossing edges harshly)
    b += rr(0, 31, T, 1.5, 0, C["pavement_edge"], 0.45)
    b += rr(31, 0, 1.5, T, 0, C["pavement_edge"], 0.45)
    write(TILESET / "ground" / "pavement.svg", svg(T, T, "Pavement", b))


def _road_base():
    return rr(0, 0, T, T, 0, C["road"])


def ground_road_h():
    b = _road_base()
    # horizontal dashed center line
    b += rr(6, 29, 18, 5, 2, C["road_line"])
    b += rr(40, 29, 18, 5, 2, C["road_line"])
    write(TILESET / "ground" / "road-h.svg", svg(T, T, "Road Horizontal", b))


def ground_road_v():
    b = _road_base()
    b += rr(29, 6, 5, 18, 2, C["road_line"])
    b += rr(29, 40, 5, 18, 2, C["road_line"])
    write(TILESET / "ground" / "road-v.svg", svg(T, T, "Road Vertical", b))


def ground_road_corner():
    # L: fills bottom+right into top-left curve — full tile road with grass cut
    b = rr(0, 0, T, T, 0, C["grass"])
    b += rr(0, 0, T, T, 0, C["road"])
    # cut grass quadrant (top-right empty for corner going down+left style: NW grass)
    b += pth(f"M{T},0 L{T},{T*0.35} Q{T*0.65},{T*0.35} {T*0.35},{T*0.35} L{T*0.35},0 Z", C["grass"])
    # Actually cleaner: draw road as two arms meeting
    b = rr(0, 0, T, T, 0, C["grass"])
    b += rr(0, 16, T, 32, 0, C["road"])  # horizontal arm
    b += rr(16, 16, 32, 48, 0, C["road"])  # vertical arm down
    # rounded inner corner fill
    b += cir(16, 16, 0, C["road"])  # noop
    b += rr(8, 28, 14, 6, 2, C["road_line"])
    b += rr(28, 40, 6, 14, 2, C["road_line"])
    write(TILESET / "ground" / "road-corner.svg", svg(T, T, "Road Corner", b))


def ground_road_t():
    b = rr(0, 0, T, T, 0, C["grass"])
    b += rr(0, 16, T, 32, 0, C["road"])
    b += rr(16, 0, 32, 48, 0, C["road"])
    b += rr(8, 28, 14, 6, 2, C["road_line"])
    b += rr(42, 28, 14, 6, 2, C["road_line"])
    b += rr(29, 6, 5, 14, 2, C["road_line"])
    write(TILESET / "ground" / "road-t.svg", svg(T, T, "Road T-Junction", b))


def ground_road_cross():
    b = rr(0, 0, T, T, 0, C["grass"])
    b += rr(0, 16, T, 32, 0, C["road"])
    b += rr(16, 0, 32, T, 0, C["road"])
    b += rr(6, 29, 14, 5, 2, C["road_line"])
    b += rr(44, 29, 14, 5, 2, C["road_line"])
    b += rr(29, 6, 5, 14, 2, C["road_line"])
    b += rr(29, 44, 5, 14, 2, C["road_line"])
    write(TILESET / "ground" / "road-cross.svg", svg(T, T, "Road Crossroads", b))


def ground_road_roundabout():
    b = rr(0, 0, T, T, 0, C["grass"])
    b += rr(0, 16, T, 32, 0, C["road"])
    b += rr(16, 0, 32, T, 0, C["road"])
    b += cir(32, 32, 14, C["grass"])
    b += cir(32, 32, 8, C["grass_light"])
    b += cir(32, 32, 4, C["bush"])
    write(TILESET / "ground" / "road-roundabout.svg", svg(T, T, "Road Roundabout", b))


def ground_zebra_h():
    b = rr(0, 0, T, T, 0, C["road"])
    for i in range(5):
        b += rr(4 + i * 12, 14, 7, 36, 2, C["road_line"])
    write(TILESET / "ground" / "zebra-h.svg", svg(T, T, "Zebra Crossing H", b))


def ground_zebra_v():
    b = rr(0, 0, T, T, 0, C["road"])
    for i in range(5):
        b += rr(14, 4 + i * 12, 36, 7, 2, C["road_line"])
    write(TILESET / "ground" / "zebra-v.svg", svg(T, T, "Zebra Crossing V", b))


# ===========================================================================
# NATURE / PROPS — 64×64, soft coloured shadows
# ===========================================================================

def prop_tree():
    b = shadow(32, 56, 14, 5)
    b += rr(28, 34, 8, 20, 3, C["trunk"])
    b += rr(30, 36, 4, 16, 2, C["trunk_dark"])
    b += cir(32, 26, 18, C["tree"])
    b += cir(22, 30, 10, C["tree_dark"])
    b += cir(40, 20, 9, C["tree_light"])
    b += cir(34, 18, 6, C["tree"])
    write(TILESET / "nature" / "tree.svg", svg(T, T, "Tree", b))


def prop_bush():
    b = shadow(32, 50, 18, 5)
    b += cir(24, 38, 14, C["bush"])
    b += cir(40, 40, 15, C["bush_dark"])
    b += cir(32, 30, 13, C["bush_light"])
    b += cir(28, 36, 2.5, C["orange_roof"])
    b += cir(42, 38, 2, C["yellow"])
    write(TILESET / "nature" / "bush.svg", svg(T, T, "Bush", b))


def prop_bench():
    b = shadow(32, 44, 20, 4)
    b += rr(10, 28, 44, 12, 5, C["red"])
    b += rr(10, 28, 44, 4, 3, C["red_dark"])
    b += rr(14, 40, 5, 8, 1.5, C["black"])
    b += rr(45, 40, 5, 8, 1.5, C["black"])
    write(TILESET / "props" / "bench.svg", svg(T, T, "Bench", b))


def prop_lamp():
    b = shadow(32, 58, 6, 3)
    b += rr(29, 14, 6, 42, 2, C["dark"])
    b += rr(30, 16, 4, 38, 1.5, C["charcoal"])
    b += el(32, 12, 10, 7, C["yellow"])
    b += el(32, 11, 6, 4, C["lemon"])
    write(TILESET / "props" / "lamp.svg", svg(T, T, "Lamp Post", b))


def prop_bin():
    b = shadow(32, 54, 10, 4)
    b += rr(20, 18, 24, 34, 8, C["bush"])
    b += rr(24, 18, 18, 34, 7, C["bush_dark"])
    b += rr(20, 18, 24, 10, 6, C["grass_dark"])
    b += rr(26, 30, 12, 12, 3, C["yellow"])
    b += pth("M28,33 L36,33 L32,40 Z", C["bush"])
    write(TILESET / "props" / "bin.svg", svg(T, T, "Dustbin", b))


def prop_bus_shelter():
    b = shadow(32, 56, 24, 4)
    b += rr(6, 48, 52, 10, 4, C["pavement"])
    b += rr(8, 10, 48, 12, 5, C["blue"])
    b += rr(10, 20, 44, 5, 2, C["blue_dark"])
    b += rr(12, 24, 5, 26, 2, C["dark"])
    b += rr(47, 24, 5, 26, 2, C["dark"])
    b += rr(18, 38, 28, 8, 3, C["red"])
    write(TILESET / "props" / "bus-shelter.svg", svg(T, T, "Bus Shelter", b))


def prop_mrt_entrance():
    b = shadow(32, 56, 20, 4)
    b += rr(10, 44, 44, 14, 5, C["pavement"])
    b += rr(14, 12, 36, 16, 5, C["mrt_green"])
    b += rr(16, 24, 32, 6, 2, C["mrt_green_dark"])
    for i in range(3):
        b += rr(20 + i * 2, 30 + i * 5, 24 - i * 4, 6, 2, C["dark"] if i % 2 == 0 else C["charcoal"])
    b += cir(32, 18, 5, C["white"])
    b += cir(32, 18, 3, C["mrt_red"])
    write(TILESET / "props" / "mrt-entrance.svg", svg(T, T, "MRT Entrance", b))


def prop_table_set():
    """Hawker table + stools — single 64 tile."""
    b = shadow(32, 48, 18, 5)
    b += el(32, 34, 14, 8, C["lemon"])
    b += el(32, 36, 14, 6, C["yellow_dark"])
    for sx, sy, sc in [(16, 40, C["stool_red"]), (48, 40, C["stool_blue"]),
                       (24, 48, C["stool_blue"]), (40, 24, C["stool_red"])]:
        b += el(sx, sy, 5, 3.5, sc)
    write(TILESET / "props" / "table-set.svg", svg(T, T, "Table Set", b))


def prop_notice_board():
    b = shadow(32, 54, 14, 4)
    b += rr(14, 10, 36, 40, 4, C["notice"])
    b += rr(18, 14, 12, 10, 2, C["red"])
    b += rr(34, 14, 12, 10, 2, C["yellow"])
    b += rr(18, 28, 12, 10, 2, C["blue"])
    b += rr(34, 28, 12, 10, 2, C["grass"])
    write(TILESET / "props" / "notice-board.svg", svg(T, T, "Notice Board", b))


def prop_flagpole():
    b = shadow(20, 58, 5, 3)
    b += rr(17, 8, 4, 50, 1.5, C["dark"])
    b += rr(21, 10, 28, 16, 2, C["sg_red"])
    b += cir(30, 16, 3.5, C["white"])
    # crescent hint
    b += cir(31.5, 16, 2.5, C["sg_red"])
    write(TILESET / "props" / "flagpole.svg", svg(T, T, "SG Flagpole", b))


def prop_letterbox():
    b = shadow(32, 54, 18, 4)
    b += rr(12, 12, 40, 40, 5, C["dark"])
    b += rr(15, 15, 34, 34, 3, C["charcoal"])
    for row in range(3):
        for col in range(3):
            x, y = 18 + col * 10, 18 + row * 10
            b += rr(x, y, 8, 8, 1.5, C["cream"] if (row + col) % 2 == 0 else C["white"])
            b += rr(x + 2.5, y + 3, 3, 2, 0.5, C["dark"])
    write(TILESET / "props" / "letterbox.svg", svg(T, T, "Letterbox", b))


def prop_atm():
    b = shadow(32, 56, 12, 4)
    b += rr(18, 8, 28, 46, 6, C["white"])
    b += rr(22, 8, 22, 46, 5, C["white_side"])
    b += rr(18, 8, 28, 12, 5, C["bank"])
    b += rr(22, 26, 20, 14, 3, C["blue_window"])
    b += rr(24, 44, 16, 4, 1.5, C["dark"])
    write(TILESET / "props" / "atm.svg", svg(T, T, "ATM", b))


# ===========================================================================
# ARCHITECTURE MODULES — 64×64 walls / roofs / doors / windows
# ===========================================================================

def arch_wall():
    b = shadow(32, 58, 22, 4, soft=True)
    b += rr(6, 8, 42, 48, 6, C["cream"])
    b += rr(48, 12, 10, 44, 3, C["cream_side"])
    write(TILESET / "architecture" / "wall.svg", svg(T, T, "Wall", b))


def arch_wall_window():
    b = shadow(32, 58, 22, 4, soft=True)
    b += rr(6, 8, 42, 48, 6, C["cream"])
    b += rr(48, 12, 10, 44, 3, C["cream_side"])
    b += rr(14, 18, 26, 22, 4, C["blue"])
    b += rr(17, 21, 20, 16, 3, C["blue_window"])
    write(TILESET / "architecture" / "wall-window.svg", svg(T, T, "Wall + Window", b))


def arch_wall_door():
    b = shadow(32, 58, 22, 4, soft=True)
    b += rr(6, 8, 42, 48, 6, C["cream"])
    b += rr(48, 12, 10, 44, 3, C["cream_side"])
    b += rr(16, 22, 22, 34, 5, C["dark"])
    b += rr(20, 26, 14, 12, 2, C["blue_window"])
    b += cir(32, 44, 2, C["yellow"])
    write(TILESET / "architecture" / "wall-door.svg", svg(T, T, "Wall + Door", b))


def arch_wall_blue_window():
    """HDB-style blue-framed window + laundry poles."""
    b = shadow(32, 58, 22, 4, soft=True)
    b += rr(6, 8, 42, 48, 6, C["cream"])
    b += rr(48, 12, 10, 44, 3, C["cream_side"])
    b += rr(12, 16, 30, 24, 4, C["blue"])
    b += rr(15, 19, 24, 18, 3, C["blue_window"])
    # laundry poles
    b += rr(44, 22, 14, 3, 1, C["red"])
    b += rr(44, 28, 12, 3, 1, C["yellow"])
    b += rr(44, 34, 10, 3, 1, C["blue_light"])
    write(TILESET / "architecture" / "wall-hdb-window.svg", svg(T, T, "HDB Window + Laundry", b))


def arch_roof(name, file, top, side):
    b = pth("M4,40 L32,10 L60,40 L50,44 L32,22 L14,44 Z", top)
    b += pth("M14,44 L32,22 L50,44 L60,40 L32,54 Z", side)
    b += rr(8, 40, 48, 8, 3, side)
    # tile lines for orange roofs
    if "orange" in file:
        for i in range(3):
            y = 22 + i * 6
            b += pth(
                f"M{16+i*3:.0f},{y:.0f} L32,{y-12:.0f} L{48-i*3:.0f},{y:.0f} L32,{y+3:.0f} Z",
                C["orange_tile"] if i % 2 == 0 else top,
            )
    write(TILESET / "architecture" / file, svg(T, T, name, b))


def arch_door():
    b = shadow(32, 56, 10, 3)
    b += rr(18, 8, 28, 46, 5, C["dark"])
    b += rr(22, 12, 20, 16, 3, C["blue_window"])
    b += cir(38, 36, 2.5, C["yellow"])
    write(TILESET / "architecture" / "door.svg", svg(T, T, "Door", b))


def arch_window():
    b = shadow(32, 48, 14, 3, soft=True)
    b += rr(12, 12, 40, 36, 5, C["cream"])
    b += rr(16, 16, 32, 28, 4, C["blue_window"])
    b += rr(30, 16, 3, 28, 1, C["white"])
    b += rr(16, 28, 32, 3, 1, C["white"])
    write(TILESET / "architecture" / "window.svg", svg(T, T, "Window", b))


def arch_awning():
    b = shadow(32, 40, 24, 4, soft=True)
    b += rr(4, 20, 56, 14, 5, C["blue"])
    b += rr(6, 32, 52, 6, 2, C["blue_dark"])
    write(TILESET / "architecture" / "awning.svg", svg(T, T, "Awning", b))


def arch_hdb_corridor():
    b = shadow(32, 56, 26, 4, soft=True)
    b += rr(2, 28, 60, 24, 4, C["pavement"])
    b += rr(2, 8, 60, 24, 4, C["cream"])
    b += rr(2, 28, 60, 5, 2, C["blue"])
    for x in (10, 28, 46):
        b += rr(x, 12, 12, 16, 3, C["dark"])
        b += rr(x + 2, 14, 8, 6, 1.5, C["blue_window"])
    write(TILESET / "architecture" / "hdb-corridor.svg", svg(T, T, "HDB Corridor", b))


def arch_void_deck_pillar():
    b = rr(22, 4, 20, 56, 5, C["cream"])
    b += rr(26, 4, 12, 56, 4, C["cream_side"])
    write(TILESET / "architecture" / "void-deck-pillar.svg", svg(T, T, "Void Deck Pillar", b))


# ===========================================================================
# LOCATION COMPOSITIONS — multiples of 64
# Dimetric buildings sitting on plaza pads
# ===========================================================================

def building(
    ox, oy, bw, bd, bh, front, side, roof, roof_side=None, corner=8
) -> str:
    """Dimetric building block. Returns SVG body fragment."""
    if roof_side is None:
        roof_side = roof
    dx = bd * 0.5
    dy = bd * 0.3
    rh = max(8, bd * 0.18)
    s = shadow(ox + bw / 2 + dx * 0.2, oy + bh + rh + 6, bw * 0.42, 6)
    s += rr(ox, oy + rh, bw, bh, corner, front)
    s += pth(
        f"M{ox+bw:.1f},{oy+rh+3:.1f} L{ox+bw:.1f},{oy+rh+bh:.1f} "
        f"L{ox+bw+dx:.1f},{oy+rh+bh-dy:.1f} L{ox+bw+dx:.1f},{oy+rh-dy+3:.1f} Z",
        side,
    )
    s += pth(
        f"M{ox+4:.1f},{oy+rh:.1f} L{ox+bw:.1f},{oy+rh:.1f} "
        f"L{ox+bw+dx:.1f},{oy+rh-dy:.1f} L{ox+dx+4:.1f},{oy+rh-dy:.1f} Z",
        roof,
    )
    s += rr(ox, oy + rh, bw, max(5, rh * 0.6), corner * 0.4, roof_side)
    return s


def loc_hawker():
    W, H = T * 4, T * 4  # 256×256
    b = rr(8, 8, W - 16, H - 16, 16, C["pavement"])
    # multi-tier orange roof
    b += building(28, 20, 160, 50, 80, C["cream"], C["cream_side"], C["orange_roof"], C["orange_roof_side"], 10)
    b += pth("M48,18 L170,18 L190,6 L68,6 Z", C["orange_tile"])
    b += rr(48, 18, 122, 6, 2, C["orange_roof_side"])
    b += pth("M70,10 L155,10 L168,2 L83,2 Z", C["orange_roof"])
    # stalls
    for i, col in enumerate([C["red"], C["blue"], C["yellow"], C["grass_dark"], C["sg_red"]]):
        x = 40 + i * 28
        b += rr(x, 70, 24, 30, 4, C["white"])
        b += rr(x + 3, 73, 18, 7, 2, col)
        b += rr(x + 5, 84, 14, 10, 2, C["cream_dark"])
    # fans
    for fx in (60, 108, 156):
        b += el(fx, 58, 8, 2.5, C["white"])
        b += el(fx, 58, 2.5, 7, C["white"])
        b += cir(fx, 58, 2, C["dark"])
    # tables
    for tx, ty in [(48, 160), (100, 180), (160, 165), (210, 185)]:
        b += shadow(tx, ty + 10, 12, 4)
        b += el(tx, ty, 12, 7, C["lemon"])
        b += el(tx, ty + 2, 12, 5, C["yellow_dark"])
        for sx, sy, sc in [(tx - 14, ty + 6, C["stool_red"]), (tx + 14, ty + 6, C["stool_blue"]),
                           (tx - 4, ty + 14, C["stool_red"]), (tx + 6, ty - 10, C["stool_blue"])]:
            b += el(sx, sy, 4, 3, sc)
    # tray return + bin
    b += rr(210, 130, 20, 28, 4, C["blue"])
    b += rr(214, 135, 12, 6, 1.5, C["white"])
    b += rr(214, 144, 12, 6, 1.5, C["white"])
    b += rr(220, 168, 14, 20, 6, C["bush"])
    b += rr(223, 171, 8, 6, 2, C["yellow"])
    write(TILESET / "locations" / "food-retail" / "hawker-centre.svg", svg(W, H, "Hawker Centre", b))


def loc_wet_market():
    W, H = T * 3, T * 3  # 192
    b = rr(6, 6, W - 12, H - 12, 12, C["pavement"])
    b += building(24, 16, 120, 45, 70, C["cream"], C["cream_side"], C["blue"], C["blue_dark"], 8)
    b += rr(12, 70, 40, 14, 4, C["blue"])
    b += rr(120, 70, 40, 14, 4, C["blue"])
    for i, col in enumerate([C["red"], C["yellow"], C["grass"], C["orange_roof"], C["blue"], C["sg_red"]]):
        x = 28 + (i % 3) * 42
        y = 100 + (i // 3) * 36
        b += rr(x, y, 36, 24, 5, C["white_side"])
        b += rr(x + 4, y + 4, 28, 10, 3, col)
        b += cir(x + 10, y + 18, 3, col)
        b += cir(x + 22, y + 18, 3, C["yellow"] if col != C["yellow"] else C["red"])
    write(TILESET / "locations" / "food-retail" / "wet-market.svg", svg(W, H, "Wet Market", b))


def loc_shop(name, file, brand, brand_dark, icon_body):
    W, H = T * 3, T * 3
    b = rr(8, H - 56, W - 16, 48, 10, C["pavement"])
    b += building(28, 12, 120, 40, 90, C["white"], C["white_side"], brand, brand_dark, 8)
    b += rr(28, 40, 120, 22, 4, brand)
    b += icon_body
    b += rr(40, 75, 40, 30, 5, C["blue_window"])
    b += rr(96, 75, 40, 30, 5, C["blue_window"])
    b += rr(78, 80, 16, 28, 4, C["dark"])
    write(TILESET / "locations" / "food-retail" / file, svg(W, H, name, b))


def loc_fairprice():
    # Clearer shopping-cart silhouette
    icon = (
        rr(76, 46, 20, 10, 2, C["white"])
        + pth("M74,44 L68,44 L66,50 L74,50 Z", C["white"])
        + cir(80, 58, 3.2, C["white"])
        + cir(92, 58, 3.2, C["white"])
        + rr(94, 42, 3, 12, 1.2, C["white"])
    )
    loc_shop("NTUC FairPrice", "ntuc-fairprice.svg", C["fairprice"], C["fairprice_dark"], icon)


def loc_sheng():
    icon = (
        rr(78, 44, 10, 14, 3, C["white"])
        + rr(92, 44, 10, 14, 3, C["white"])
        + rr(80, 48, 5, 3, 1, C["sheng"])
        + rr(94, 52, 5, 3, 1, C["sheng"])
    )
    loc_shop("Sheng Siong", "sheng-siong.svg", C["sheng"], C["sheng_dark"], icon)


def loc_mrt():
    W, H = T * 3, T * 3
    b = rr(8, H - 64, W - 16, 56, 10, C["pavement"])
    b += building(30, 10, 110, 45, 85, C["white"], C["white_side"], C["mrt_green"], C["mrt_green_dark"], 8)
    b += rr(30, 38, 110, 18, 3, C["mrt_green"])
    b += cir(85, 47, 8, C["white"])
    b += cir(85, 47, 5, C["mrt_red"])
    b += cir(85, 47, 2.5, C["white"])
    b += rr(42, 68, 32, 26, 5, C["blue_window"])
    b += rr(96, 68, 32, 26, 5, C["blue_window"])
    b += rr(76, 72, 14, 24, 4, C["charcoal"])
    b += rr(60, 118, 50, 12, 4, C["dark"])
    b += rr(64, 122, 42, 5, 2, C["mrt_green"])
    b += rr(20, 140, 150, 20, 6, C["road"])
    for x in range(28, 160, 28):
        b += rr(x, 146, 16, 6, 2, C["yellow"])
    write(TILESET / "locations" / "transportation" / "mrt-station.svg", svg(W, H, "MRT Station", b))


def loc_bus_interchange():
    W, H = T * 4, T * 3  # 256×192
    b = rr(4, 40, W - 8, H - 48, 12, C["road"])
    b += building(70, 8, 100, 35, 55, C["cream"], C["cream_side"], C["blue"], C["blue_dark"], 7)
    b += rr(70, 28, 100, 14, 3, C["blue"])
    b += rr(100, 32, 40, 6, 2, C["white"])
    for i, y in enumerate([70, 110, 150]):
        b += rr(16, y, W - 32, 28, 8, C["road_dark"])
        b += rr(28, y + 10, 24, 6, 2, C["road_line"])
        b += rr(70, y + 10, 24, 6, 2, C["road_line"])
        b += rr(180, y - 4, 50, 12, 4, C["blue"])
        b += rr(188, y + 10, 34, 10, 3, C["cream"])
    write(TILESET / "locations" / "transportation" / "bus-interchange.svg", svg(W, H, "Bus Interchange", b))


def loc_bus_stop():
    # 128×64 — two tiles wide
    W, H = T * 2, T
    b = shadow(64, 56, 40, 5)
    b += rr(8, 44, 112, 16, 5, C["pavement"])
    b += rr(16, 8, 80, 14, 5, C["blue"])
    b += rr(18, 20, 76, 5, 2, C["blue_dark"])
    b += rr(22, 24, 5, 22, 2, C["dark"])
    b += rr(85, 24, 5, 22, 2, C["dark"])
    b += rr(32, 34, 40, 8, 3, C["red"])
    b += rr(108, 4, 6, 48, 2, C["dark"])
    b += rr(100, 2, 22, 18, 4, C["blue"])
    b += rr(104, 6, 14, 5, 1.5, C["white"])
    b += cir(111, 14, 3.5, C["white"])
    write(TILESET / "locations" / "transportation" / "bus-stop.svg", svg(W, H, "Bus Stop", b))


def loc_taxi():
    W, H = T * 2, T
    b = shadow(64, 56, 42, 5)
    b += rr(6, 36, 116, 24, 6, C["pavement"])
    b += rr(14, 40, 100, 16, 5, C["road"])
    for x in (22, 48, 74):
        b += rr(x, 45, 16, 5, 2, C["yellow"])
    b += rr(58, 4, 6, 36, 2, C["dark"])
    b += rr(44, 2, 34, 18, 5, C["yellow"])
    b += rr(50, 7, 22, 6, 2, C["charcoal"])
    b += rr(28, 24, 72, 10, 4, C["blue"])
    write(TILESET / "locations" / "transportation" / "taxi-pickup.svg", svg(W, H, "Taxi Pick-up", b))


def loc_polyclinic():
    W, H = T * 3, T * 3
    b = rr(8, H - 48, W - 16, 40, 10, C["pavement"])
    b += building(24, 8, 130, 45, 100, C["white"], C["white_side"], C["blue"], C["blue_dark"], 8)
    b += rr(24, 36, 130, 18, 3, C["blue"])
    b += rr(82, 39, 6, 12, 1.5, C["white"])
    b += rr(76, 44, 18, 6, 1.5, C["white"])
    for row in range(2):
        for col in range(4):
            b += rr(36 + col * 28, 68 + row * 28, 18, 18, 3, C["blue_window"])
    b += rr(78, 118, 20, 28, 5, C["dark"])
    write(TILESET / "locations" / "healthcare" / "polyclinic.svg", svg(W, H, "Polyclinic", b))


def loc_gp():
    W, H = T * 2, T * 2
    b = rr(6, H - 36, W - 12, 30, 8, C["pavement"])
    b += building(18, 8, 80, 30, 60, C["cream"], C["cream_side"], C["red_roof"], C["red_roof_side"], 6)
    b += rr(18, 28, 80, 14, 3, C["blue"])
    b += rr(52, 30, 5, 10, 1, C["white"])
    b += rr(48, 34, 14, 5, 1, C["white"])
    b += rr(28, 50, 22, 20, 3, C["blue_window"])
    b += rr(62, 52, 16, 22, 3, C["dark"])
    write(TILESET / "locations" / "healthcare" / "gp-clinic.svg", svg(W, H, "GP Clinic", b))


def loc_pharmacy(name, file, brand, brand_dark, mark):
    W, H = T * 2, T * 2
    b = rr(6, H - 36, W - 12, 30, 8, C["pavement"])
    b += building(16, 6, 80, 30, 62, C["white"], C["white_side"], brand, brand_dark, 6)
    b += rr(16, 28, 80, 16, 3, brand)
    if mark == "G":
        b += rr(44, 32, 24, 8, 3, C["white"])
    elif mark == "W":
        b += rr(40, 32, 28, 8, 3, C["white"])
    else:
        b += cir(56, 36, 6, C["white"])
        b += rr(54, 31, 4, 10, 1, brand)
        b += rr(51, 34, 10, 4, 1, brand)
    b += rr(26, 54, 24, 20, 3, C["blue_window"])
    b += rr(60, 56, 16, 22, 3, C["dark"])
    write(TILESET / "locations" / "healthcare" / file, svg(W, H, name, b))


def loc_cc():
    W, H = T * 3, T * 3
    b = rr(8, H - 48, W - 16, 40, 10, C["pavement"])
    b += building(28, 10, 120, 42, 95, C["white"], C["white_side"], C["red_roof"], C["red_roof_side"], 8)
    # flower logo
    b += cir(88, 55, 12, C["sg_red"])
    for ang in range(0, 360, 60):
        rad = math.radians(ang)
        b += cir(88 + math.cos(rad) * 10, 55 + math.sin(rad) * 8, 5, C["sg_red"])
    b += cir(88, 55, 5, C["white"])
    for col in range(3):
        b += rr(42 + col * 30, 80, 20, 20, 4, C["blue_window"])
    b += rr(78, 108, 20, 28, 5, C["dark"])
    # flag
    b += rr(170, 30, 4, 80, 1, C["dark"])
    b += rr(174, 32, 22, 14, 2, C["sg_red"])
    b += cir(182, 38, 3, C["white"])
    write(TILESET / "locations" / "community" / "community-club.svg", svg(W, H, "Community Club", b))


def loc_singpost():
    W, H = T * 2, T * 2
    b = rr(6, H - 36, W - 12, 30, 8, C["pavement"])
    b += building(18, 8, 78, 30, 58, C["cream"], C["cream_side"], C["singpost"], C["sg_red_dark"], 6)
    b += rr(18, 28, 78, 14, 3, C["singpost"])
    b += rr(44, 32, 26, 10, 2, C["white"])
    b += pth("M44,32 L57,40 L70,32 Z", C["singpost"])
    b += rr(28, 52, 22, 18, 3, C["blue_window"])
    b += rr(62, 54, 16, 20, 3, C["dark"])
    write(TILESET / "locations" / "community" / "singpost.svg", svg(W, H, "SingPost", b))


def loc_bank():
    W, H = T * 2, T * 2
    b = rr(6, H - 36, W - 12, 30, 8, C["pavement"])
    b += building(16, 6, 82, 32, 62, C["white"], C["white_side"], C["bank"], C["bank_dark"], 6)
    b += rr(16, 28, 82, 14, 3, C["bank"])
    for x in (28, 44, 60, 76):
        b += rr(x, 50, 6, 24, 2, C["cream_dark"])
    b += rr(50, 58, 14, 20, 3, C["dark"])
    write(TILESET / "locations" / "community" / "bank.svg", svg(W, H, "Bank Branch", b))


def loc_hdb_void_deck():
    W, H = T * 3, T * 4  # 192×256 tall
    b = rr(8, H - 40, W - 16, 32, 8, C["pavement"])
    b += building(20, 8, 130, 40, 180, C["cream"], C["cream_side"], C["cream_dark"], C["cream_dark"], 8)
    # windows with laundry
    for row in range(5):
        for col in range(4):
            x, y = 32 + col * 28, 28 + row * 26
            b += rr(x, y, 18, 16, 3, C["blue"])
            b += rr(x + 2, y + 2, 14, 12, 2, C["blue_window"])
            if (row + col) % 3 == 0:
                b += rr(x + 16, y + 4, 10, 2, 1, C["red"])
                b += rr(x + 16, y + 8, 8, 2, 1, C["yellow"])
    # void deck
    b += rr(20, 170, 130, 50, 6, C["cream"])
    for x in (32, 60, 98, 126):
        b += rr(x, 170, 10, 50, 3, C["cream_side"])
    b += rr(44, 180, 80, 32, 4, C["cream_dark"])
    # notice + bench
    b += rr(50, 186, 22, 20, 3, C["notice"])
    b += rr(53, 189, 7, 6, 1, C["red"])
    b += rr(62, 189, 7, 6, 1, C["yellow"])
    b += rr(53, 197, 7, 5, 1, C["blue"])
    b += rr(62, 197, 7, 5, 1, C["grass"])
    b += rr(90, 198, 28, 8, 3, C["red"])
    write(TILESET / "locations" / "residential" / "hdb-void-deck.svg", svg(W, H, "HDB Void Deck", b))


def loc_letterbox_area():
    W, H = T * 2, T * 2
    b = rr(6, 6, W - 12, H - 12, 10, C["pavement"])
    b += shadow(64, 100, 36, 6)
    b += rr(24, 24, 80, 70, 6, C["dark"])
    b += rr(28, 28, 72, 62, 4, C["charcoal"])
    for row in range(4):
        for col in range(4):
            x, y = 34 + col * 16, 34 + row * 14
            b += rr(x, y, 12, 10, 2, C["cream"] if (row + col) % 2 == 0 else C["white"])
            b += rr(x + 4, y + 4, 4, 2, 0.5, C["dark"])
    write(TILESET / "locations" / "residential" / "letterbox-area.svg", svg(W, H, "Letterbox Area", b))


def loc_park():
    W, H = T * 4, T * 4
    b = rr(4, 4, W - 8, H - 8, 14, C["grass"])
    # paths
    b += rr(112, 16, 32, W - 32, 10, C["pavement"])
    b += rr(16, 112, W - 32, 32, 10, C["pavement"])
    # trees
    for tx, ty in [(48, 48), (200, 52), (56, 190), (196, 188), (160, 80)]:
        b += shadow(tx, ty + 18, 12, 4)
        b += rr(tx - 3, ty + 6, 6, 16, 2, C["trunk"])
        b += cir(tx, ty, 16, C["tree"])
        b += cir(tx - 7, ty + 4, 8, C["tree_dark"])
        b += cir(tx + 6, ty - 5, 7, C["tree_light"])
    # bushes
    for bx, by in [(40, 120), (220, 130)]:
        b += cir(bx, by, 12, C["bush"])
        b += cir(bx + 8, by + 2, 10, C["bush_dark"])
        b += cir(bx + 3, by - 3, 2.5, C["orange_roof"])
    # bench
    b += rr(120, 150, 36, 10, 4, C["red"])
    b += rr(124, 160, 4, 6, 1, C["black"])
    b += rr(148, 160, 4, 6, 1, C["black"])
    # fitness
    b += rr(170, 160, 5, 24, 2, C["blue"])
    b += rr(196, 160, 5, 24, 2, C["blue"])
    b += rr(170, 156, 31, 5, 2, C["blue_dark"])
    b += el(220, 178, 10, 6, C["blue"])
    # basketball court corner
    b += rr(16, 170, 56, 64, 6, C["court"])
    b += rr(16, 190, 20, 24, 3, C["court_key"])
    b += rr(68, 188, 4, 28, 1.5, C["dark"])
    b += el(70, 186, 8, 4, C["red"])
    b += el(70, 186, 5, 2.5, C["white"])
    write(TILESET / "locations" / "residential" / "neighbourhood-park.svg", svg(W, H, "Neighbourhood Park", b))


def loc_pcn():
    W, H = T * 4, T * 3  # 256×192
    b = rr(4, 4, W - 8, H - 8, 12, C["grass"])
    # winding path
    b += pth(
        "M0,80 C60,70 90,50 130,60 C170,70 190,110 230,115 "
        "C250,118 256,100 256,100 L256,130 C240,145 210,155 180,145 "
        "C150,135 140,100 110,95 C70,88 30,110 0,115 Z",
        C["pavement"],
    )
    for i in range(7):
        t = i / 6
        x = 20 + t * 220
        y = 95 + math.sin(t * math.pi * 1.4) * 18
        b += rr(x, y, 14, 4, 2, C["road_line"])
    for tx, ty in [(40, 40), (100, 30), (180, 45), (220, 50), (50, 150), (160, 155)]:
        b += shadow(tx, ty + 14, 10, 3)
        b += rr(tx - 2.5, ty + 4, 5, 14, 2, C["trunk"])
        b += cir(tx, ty, 12, C["tree"])
        b += cir(tx + 5, ty - 3, 6, C["tree_light"])
    for lx, ly in [(90, 90), (190, 110)]:
        b += rr(lx, ly - 24, 4, 30, 1.5, C["dark"])
        b += el(lx + 2, ly - 26, 7, 5, C["yellow"])
    write(TILESET / "locations" / "residential" / "park-connector.svg", svg(W, H, "Park Connector", b))


# ===========================================================================
# Manifest, preview, PNG export
# ===========================================================================

def collect_assets():
    cats = {}
    for folder in [
        "ground", "nature", "props", "architecture",
        "locations/food-retail", "locations/transportation",
        "locations/healthcare", "locations/community", "locations/residential",
    ]:
        path = TILESET / folder
        assets = []
        for f in sorted(path.glob("*.svg")):
            text = f.read_text(encoding="utf-8")
            # parse width/height
            import re
            m = re.search(r'width="(\d+)".*?height="(\d+)"', text)
            w = int(m.group(1)) if m else T
            h = int(m.group(2)) if m else T
            assets.append({
                "id": f.stem,
                "file": str(f.relative_to(ROOT)).replace("\\", "/"),
                "width": w,
                "height": h,
                "tilesW": w // T,
                "tilesH": h // T,
            })
        cats[folder] = assets
    return cats


def write_manifest(cats):
    titles = {
        "ground": "Ground (64×64 seamless)",
        "nature": "Nature",
        "props": "Props",
        "architecture": "Architecture Modules",
        "locations/food-retail": "Food & Retail",
        "locations/transportation": "Transportation",
        "locations/healthcare": "Healthcare",
        "locations/community": "Community",
        "locations/residential": "Residential",
    }
    manifest = {
        "name": "Singapore Neighbourhood 64px Modular Tileset",
        "version": "2.0.0",
        "tileSize": T,
        "style": {
            "perspective": "dimetric 3/4 top-down",
            "outlines": False,
            "shading": "two-tone + soft coloured shadows",
            "corners": "soft rounded",
            "background": "transparent",
        },
        "palette": C,
        "categories": {
            k: {"title": titles.get(k, k), "assets": v} for k, v in cats.items()
        },
    }
    write(ROOT / "manifest.json", json.dumps(manifest, indent=2) + "\n")
    return manifest


def make_preview(manifest):
    sections = []
    for key, data in manifest["categories"].items():
        cards = []
        for a in data["assets"]:
            cards.append(f"""
        <figure class="card">
          <div class="tile"><img src="../{a['file']}" alt="{a['id']}"/></div>
          <figcaption>{a['id']}<span>{a['width']}×{a['height']} · {a['tilesW']}×{a['tilesH']} tiles</span></figcaption>
        </figure>""")
        sections.append(f"""
      <section>
        <h2>{data['title']}</h2>
        <div class="grid">{''.join(cards)}</div>
      </section>""")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SG 64px Modular Tileset</title>
<style>
  :root {{
    --bg: #E4EFE5; --ink: #2A3A2C; --muted: #5A6B5C; --panel: #F6FBF6;
    --check: repeating-conic-gradient(#d8e4d9 0% 25%, #f3f8f3 0% 50%) 50%/14px 14px;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: "Avenir Next","Segoe UI",Nunito,sans-serif;
    background: radial-gradient(ellipse at 15% 0%,#cfe8d4,transparent 45%),
                radial-gradient(ellipse at 90% 5%,#fde6d4,transparent 40%), var(--bg);
    color: var(--ink); padding: 40px 28px 72px;
  }}
  header {{ max-width: 1100px; margin: 0 auto 36px; }}
  h1 {{ font-size: clamp(1.8rem,3.5vw,2.6rem); font-weight: 800; letter-spacing: -.03em; }}
  header p {{ color: var(--muted); margin-top: 8px; max-width: 54ch; line-height: 1.5; }}
  .meta {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }}
  .meta span {{ background:var(--panel); border-radius:999px; padding:5px 12px; font-size:.8rem; color:var(--muted); }}
  .hero {{ max-width:1100px; margin:0 auto 40px; background:var(--panel); border-radius:20px; padding:10px; }}
  .hero img {{ width:100%; border-radius:14px; display:block; image-rendering:auto; }}
  section {{ max-width:1100px; margin:0 auto 36px; }}
  h2 {{ font-size:1.15rem; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #c4d8c6; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:14px; }}
  .card {{ background:var(--panel); border-radius:16px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:8px; }}
  .tile {{ width:100%; aspect-ratio:1; background:var(--check); border-radius:10px; display:grid; place-items:center; }}
  .tile img {{ max-width:88%; max-height:88%; image-rendering:auto; }}
  figcaption {{ font-size:.72rem; font-weight:600; text-align:center; display:flex; flex-direction:column; gap:2px; }}
  figcaption span {{ font-weight:500; color:var(--muted); font-size:.65rem; }}
</style>
</head>
<body>
  <header>
    <h1>Singapore 64px Modular Tileset</h1>
    <p>Game-ready Nintendo-like vector tiles. Seamless 64×64 ground, modular architecture pieces, multi-tile locations. Transparent SVG + PNG.</p>
    <div class="meta">
      <span>64×64 grid</span><span>No outlines</span><span>Soft pastel</span>
      <span>Dimetric 3/4</span><span>Unity / Figma</span>
    </div>
  </header>
  <div class="hero"><img src="renders/sample-neighbourhood.png" alt="Sample scene"/></div>
  {''.join(sections)}
</body>
</html>"""
    write(ROOT / "preview" / "index.html", html)


def _inner(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.find(">", text.find("<svg")) + 1
    end = text.rfind("</svg>")
    return text[start:end]


def make_sample_scene():
    W, H = 20 * T, 14 * T  # 1280×896
    s = f'  <rect width="{W}" height="{H}" fill="#DCECDC"/>\n'

    def place(rel, x, y, nw=None, nh=None):
        src = ROOT / rel
        if not src.exists():
            return ""
        import re
        text = src.read_text(encoding="utf-8")
        m = re.search(r'width="(\d+)".*?height="(\d+)"', text)
        sw = int(m.group(1)) if m else T
        sh = int(m.group(2)) if m else T
        sx = (nw or sw) / sw
        sy = (nh or sh) / sh
        return f'  <g transform="translate({x},{y}) scale({sx:.4f},{sy:.4f})">\n{_inner(src)}\n  </g>\n'

    # grass field
    for gy in range(0, H, T):
        for gx in range(0, W, T):
            s += place("tileset/ground/grass.svg", gx, gy)

    # roads
    road_y = 6 * T
    road_x = 10 * T
    for x in range(0, W, T):
        s += place("tileset/ground/road-h.svg", x, road_y)
    for y in range(0, H, T):
        s += place("tileset/ground/road-v.svg", road_x, y)
    s += place("tileset/ground/road-cross.svg", road_x, road_y)
    s += place("tileset/ground/zebra-h.svg", 6 * T, road_y)

    # pavement strip near road
    for x in range(0, W, T):
        if abs(x - road_x) > T:
            s += place("tileset/ground/pavement.svg", x, road_y - T)
            s += place("tileset/ground/pavement.svg", x, road_y + T)

    # locations
    s += place("tileset/locations/food-retail/hawker-centre.svg", T, T)
    s += place("tileset/locations/food-retail/ntuc-fairprice.svg", 13 * T, T)
    s += place("tileset/locations/transportation/mrt-station.svg", 13 * T, 8 * T)
    s += place("tileset/locations/residential/hdb-void-deck.svg", T, 8 * T)
    s += place("tileset/locations/community/community-club.svg", 5 * T, 8 * T)
    s += place("tileset/locations/healthcare/guardian.svg", 16 * T, 5 * T)

    # props
    s += place("tileset/nature/tree.svg", 9 * T, 3 * T)
    s += place("tileset/nature/tree.svg", 4 * T, 4 * T)
    s += place("tileset/nature/bush.svg", 8 * T, 4 * T)
    s += place("tileset/props/bench.svg", 7 * T, 3 * T)
    s += place("tileset/props/lamp.svg", 9 * T, 5 * T)
    s += place("tileset/props/bin.svg", 8 * T, 5 * T)
    s += place("tileset/locations/transportation/bus-stop.svg", 11 * T, 5 * T)
    s += place("tileset/props/flagpole.svg", 8 * T, 9 * T)
    s += place("tileset/props/notice-board.svg", 4 * T, 10 * T)

    write(ROOT / "preview" / "sample-neighbourhood.svg", svg(W, H, "Sample Neighbourhood", s))


def export_pngs():
    try:
        import cairosvg
    except ImportError:
        print("  (skip PNG — install cairosvg)")
        return

    png_root = TILESET / "png"
    renders = ROOT / "preview" / "renders"
    renders.mkdir(parents=True, exist_ok=True)

    for svg_path in sorted(TILESET.rglob("*.svg")):
        if "png" in svg_path.parts:
            continue
        rel = svg_path.relative_to(TILESET)
        out = png_root / rel.with_suffix(".png")
        out.parent.mkdir(parents=True, exist_ok=True)
        import re
        text = svg_path.read_text(encoding="utf-8")
        m = re.search(r'width="(\d+)".*?height="(\d+)"', text)
        w = int(m.group(1)) if m else T
        h = int(m.group(2)) if m else T
        # export at 2× for crisp Unity import option, but also native
        cairosvg.svg2png(url=str(svg_path), write_to=str(out), output_width=w, output_height=h)

    sample = ROOT / "preview" / "sample-neighbourhood.svg"
    if sample.exists():
        cairosvg.svg2png(url=str(sample), write_to=str(renders / "sample-neighbourhood.png"),
                         output_width=1280, output_height=896)

    for rel in [
        "locations/food-retail/hawker-centre.svg",
        "locations/food-retail/ntuc-fairprice.svg",
        "locations/transportation/mrt-station.svg",
        "locations/residential/hdb-void-deck.svg",
        "locations/residential/neighbourhood-park.svg",
        "locations/community/community-club.svg",
        "ground/road-cross.svg",
        "ground/grass.svg",
        "nature/tree.svg",
        "props/bench.svg",
        "architecture/wall-hdb-window.svg",
    ]:
        src = TILESET / rel
        if src.exists():
            import re
            text = src.read_text(encoding="utf-8")
            m = re.search(r'width="(\d+)".*?height="(\d+)"', text)
            w = int(m.group(1)) if m else T
            h = int(m.group(2)) if m else T
            scale = max(2, 256 // max(w, h))
            cairosvg.svg2png(url=str(src), write_to=str(renders / f"{src.stem}.png"),
                             output_width=w * scale, output_height=h * scale)
    print("  ✓ tileset/png/** + preview/renders/**")


def main():
    print("Generating 64×64 Singapore Modular Tileset...\n")

    # Ground
    ground_grass()
    ground_pavement()
    ground_road_h()
    ground_road_v()
    ground_road_corner()
    ground_road_t()
    ground_road_cross()
    ground_road_roundabout()
    ground_zebra_h()
    ground_zebra_v()

    # Nature / props
    prop_tree()
    prop_bush()
    prop_bench()
    prop_lamp()
    prop_bin()
    prop_bus_shelter()
    prop_mrt_entrance()
    prop_table_set()
    prop_notice_board()
    prop_flagpole()
    prop_letterbox()
    prop_atm()

    # Architecture
    arch_wall()
    arch_wall_window()
    arch_wall_door()
    arch_wall_blue_window()
    arch_roof("Roof Red", "roof-red.svg", C["red_roof"], C["red_roof_side"])
    arch_roof("Roof Orange", "roof-orange.svg", C["orange_roof"], C["orange_roof_side"])
    arch_roof("Roof Blue", "roof-blue.svg", C["blue"], C["blue_dark"])
    arch_door()
    arch_window()
    arch_awning()
    arch_hdb_corridor()
    arch_void_deck_pillar()

    # Locations
    loc_hawker()
    loc_wet_market()
    loc_fairprice()
    loc_sheng()
    loc_mrt()
    loc_bus_interchange()
    loc_bus_stop()
    loc_taxi()
    loc_polyclinic()
    loc_gp()
    loc_pharmacy("Guardian", "guardian.svg", C["guardian"], C["guardian_dark"], "G")
    loc_pharmacy("Watsons", "watsons.svg", C["watsons"], C["watsons_dark"], "W")
    loc_pharmacy("Unity Pharmacy", "unity.svg", C["unity"], C["unity_dark"], "U")
    loc_cc()
    loc_singpost()
    loc_bank()
    loc_hdb_void_deck()
    loc_letterbox_area()
    loc_park()
    loc_pcn()

    cats = collect_assets()
    manifest = write_manifest(cats)
    make_sample_scene()
    make_preview(manifest)
    export_pngs()

    total = sum(len(v) for v in cats.values())
    print(f"\nDone — {total} tiles on a {T}px grid.")


if __name__ == "__main__":
    main()
