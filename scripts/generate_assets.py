#!/usr/bin/env python3
"""
Singapore Neighbourhood Modular Asset Pack Generator
Clean Nintendo-like vector style: no outlines, soft pastels, dimetric 3/4 view.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
TILE = 256  # standard tile size (px)
BUILDING = 512  # larger location tiles

# ---------------------------------------------------------------------------
# Palette — soft pastel-plus tones matching the reference
# ---------------------------------------------------------------------------
C = {
    "cream": "#F7F4EE",
    "cream_side": "#E8E2D6",
    "cream_dark": "#D9D2C4",
    "white": "#FFFEFB",
    "white_side": "#F0EDE6",
    "road": "#B8BFC8",
    "road_dark": "#A5ADB8",
    "road_line": "#F5F7FA",
    "pavement": "#E8EBEF",
    "pavement_edge": "#D4D9E0",
    "grass": "#7BC47F",
    "grass_light": "#91D494",
    "grass_dark": "#5FA864",
    "bush": "#5EAA62",
    "bush_dark": "#4A8F4E",
    "tree_canopy": "#6BB86F",
    "tree_canopy_dark": "#549A58",
    "trunk": "#8B6B4A",
    "trunk_dark": "#6F5338",
    "red": "#E57373",
    "red_dark": "#C75A5A",
    "red_roof": "#E88B7A",
    "red_roof_side": "#D47262",
    "orange_roof": "#E8A06A",
    "orange_roof_side": "#D48852",
    "orange_tile": "#F0B07A",
    "blue": "#6BA3D9",
    "blue_dark": "#5489BE",
    "blue_awning": "#5B9BD5",
    "blue_awning_side": "#4A87BE",
    "blue_window": "#7EB3E0",
    "yellow": "#F5D76E",
    "yellow_dark": "#E0C255",
    "lemon": "#F7E08A",
    "green_dark": "#4A9B6E",
    "sg_red": "#ED2939",
    "sg_red_dark": "#C41E2A",
    "mrt_green": "#009645",
    "mrt_green_dark": "#007A38",
    "mrt_red": "#D42E12",
    "fairprice_red": "#E31C23",
    "fairprice_red_dark": "#C0151B",
    "sheng_green": "#00A651",
    "sheng_green_dark": "#008C44",
    "guardian_green": "#00A19A",
    "guardian_green_dark": "#008780",
    "watsons_blue": "#0077C8",
    "watsons_blue_dark": "#0060A3",
    "unity_orange": "#F36C00",
    "unity_orange_dark": "#D45E00",
    "singpost_red": "#ED1C24",
    "bank_blue": "#003DA5",
    "bank_blue_dark": "#002E7A",
    "shadow": "#00000018",
    "soft_shadow": "#00000010",
    "dark_grey": "#5A6270",
    "dark_grey_side": "#4A5160",
    "notice": "#4A5160",
    "stool_red": "#E57373",
    "stool_blue": "#6BA3D9",
    "fan": "#F5F5F5",
    "black": "#2C2C2C",
    "charcoal": "#3D4450",
}


def svg_open(w: int, h: int, name: str = "") -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" fill="none">\n'
        f'  <!-- {name} | tile {w}x{h} | dimetric vector | transparent bg -->\n'
    )


def svg_close() -> str:
    return "</svg>\n"


def round_rect(x, y, w, h, r, fill, opacity=1.0) -> str:
    op = f' opacity="{opacity}"' if opacity < 1 else ""
    return (
        f'  <rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
        f'rx="{r}" ry="{r}" fill="{fill}"{op}/>\n'
    )


def ellipse(cx, cy, rx, ry, fill, opacity=1.0) -> str:
    op = f' opacity="{opacity}"' if opacity < 1 else ""
    return (
        f'  <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" '
        f'fill="{fill}"{op}/>\n'
    )


def circle(cx, cy, r, fill, opacity=1.0) -> str:
    op = f' opacity="{opacity}"' if opacity < 1 else ""
    return f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}"{op}/>\n'


def path(d: str, fill: str, opacity=1.0) -> str:
    op = f' opacity="{opacity}"' if opacity < 1 else ""
    return f'  <path d="{d}" fill="{fill}"{op}/>\n'


def soft_shadow(cx, cy, rx, ry) -> str:
    return ellipse(cx, cy, rx, ry, C["shadow"], 1.0)


# ---------------------------------------------------------------------------
# Dimetric building primitives (cabinet / 3/4 top-down)
# Front face, right side (darker), roof top
# ---------------------------------------------------------------------------

def building_block(
    ox: float,
    oy: float,
    bw: float,
    bd: float,
    bh: float,
    front: str,
    side: str,
    roof: str,
    roof_side: str | None = None,
    corner: float = 12,
) -> str:
    """
    Draw a dimetric building block (3/4 top-down).
    ox,oy = origin; bw = front width; bd = depth; bh = wall height.
    """
    if roof_side is None:
        roof_side = roof
    dx = bd * 0.55
    dy = bd * 0.32
    roof_h = max(14, bd * 0.2)

    s = soft_shadow(ox + bw / 2 + dx * 0.25, oy + bh + dy * 0.35 + roof_h + 12, bw * 0.5 + dx * 0.15, 14)

    # Front wall
    s += round_rect(ox, oy + roof_h, bw, bh, corner, front)

    # Right side face
    s += path(
        f"M{ox+bw:.1f},{oy+roof_h+4:.1f} "
        f"L{ox+bw:.1f},{oy+roof_h+bh:.1f} "
        f"L{ox+bw+dx:.1f},{oy+roof_h+bh-dy:.1f} "
        f"L{ox+bw+dx:.1f},{oy+roof_h-dy+4:.1f} Z",
        side,
    )

    # Roof top parallelogram
    s += path(
        f"M{ox+6:.1f},{oy+roof_h:.1f} "
        f"L{ox+bw:.1f},{oy+roof_h:.1f} "
        f"L{ox+bw+dx:.1f},{oy+roof_h-dy:.1f} "
        f"L{ox+dx+6:.1f},{oy+roof_h-dy:.1f} Z",
        roof,
    )

    # Roof front lip
    lip = max(8, min(16, bh * 0.1))
    s += round_rect(ox, oy + roof_h, bw, lip, corner * 0.35, roof_side)

    return s


def plaza(ox, oy, w, h, r=24) -> str:
    """Integrated ground pad under a location tile."""
    return round_rect(ox, oy, w, h, r, C["pavement"]) + soft_shadow(ox + w / 2, oy + h - 4, w * 0.42, 14)


def windows_row(ox, oy, count, w=18, h=22, gap=12, color=None, r=4) -> str:
    color = color or C["blue_window"]
    s = ""
    for i in range(count):
        s += round_rect(ox + i * (w + gap), oy, w, h, r, color)
    return s


def door(ox, oy, w=28, h=40, fill=None, r=6) -> str:
    fill = fill or C["dark_grey"]
    return round_rect(ox, oy, w, h, r, fill)


def awning(ox, oy, w, h=18, fill=None, side_fill=None) -> str:
    fill = fill or C["blue_awning"]
    side_fill = side_fill or C["blue_awning_side"]
    s = round_rect(ox, oy, w, h, 6, fill)
    # slight underside
    s += round_rect(ox + 2, oy + h - 4, w - 4, 5, 3, side_fill)
    return s


def grass_base(ox, oy, w, h, r=18) -> str:
    s = round_rect(ox, oy, w, h, r, C["grass"])
    # subtle lighter dots (flowers/tufts)
    for px, py in [(ox + 20, oy + 18), (ox + w - 28, oy + h - 22), (ox + w * 0.45, oy + h * 0.4)]:
        s += circle(px, py, 3, C["grass_light"])
    return s


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  ✓ {path.relative_to(ROOT)}")


# ---------------------------------------------------------------------------
# FOOD & RETAIL
# ---------------------------------------------------------------------------

def make_hawker():
    w = h = BUILDING
    s = svg_open(w, h, "Hawker Centre / Kopitiam")
    s += plaza(36, 70, 440, 400, 28)

    # Multi-tier orange tiled roof building
    s += building_block(70, 50, 300, 100, 150, C["cream"], C["cream_side"], C["orange_roof"], C["orange_roof_side"], 14)
    # Mid / top roof tiers
    s += path("M100,42 L350,42 L390,18 L140,18 Z", C["orange_tile"])
    s += round_rect(100, 42, 250, 10, 4, C["orange_roof_side"])
    s += path("M145,28 L320,28 L345,10 L170,10 Z", C["orange_roof"])

    # Food stalls
    stall_colors = [C["red"], C["blue"], C["yellow"], C["green_dark"], C["sg_red"]]
    for i, col in enumerate(stall_colors):
        x = 95 + i * 52
        s += round_rect(x, 155, 44, 55, 8, C["white"])
        s += round_rect(x + 5, 161, 34, 12, 4, col)
        s += round_rect(x + 10, 181, 24, 20, 4, C["cream_dark"])

    # Ceiling fans (cross blades)
    for fx in (140, 230, 320):
        s += ellipse(fx, 140, 16, 5, C["fan"])
        s += ellipse(fx, 140, 5, 14, C["fan"])
        s += circle(fx, 140, 4, C["dark_grey"])

    # Outdoor tables on plaza
    for tx, ty in [(100, 320), (200, 350), (310, 325), (400, 355)]:
        s += soft_shadow(tx, ty + 16, 26, 7)
        s += ellipse(tx, ty, 24, 13, C["lemon"])
        s += ellipse(tx, ty + 3, 24, 9, C["yellow_dark"])
        for sx, sy, sc in [
            (tx - 26, ty + 8, C["stool_red"]),
            (tx + 26, ty + 8, C["stool_blue"]),
            (tx - 8, ty + 20, C["stool_red"]),
            (tx + 10, ty - 14, C["stool_blue"]),
        ]:
            s += ellipse(sx, sy, 7, 5, sc)

    # Tray return + dustbin
    s += round_rect(420, 280, 34, 48, 8, C["blue"])
    s += round_rect(426, 288, 22, 9, 3, C["white"])
    s += round_rect(426, 302, 22, 9, 3, C["white"])
    s += soft_shadow(445, 360, 14, 5)
    s += round_rect(434, 340, 24, 30, 10, C["bush"])
    s += round_rect(438, 345, 16, 10, 4, C["yellow"])

    s += svg_close()
    write(ASSETS / "food-retail" / "hawker-centre.svg", s)


def make_wet_market():
    w = h = BUILDING
    s = svg_open(w, h, "Wet Market")
    s += plaza(48, 80, 416, 380, 24)

    s += building_block(80, 70, 280, 100, 140, C["cream"], C["cream_side"], C["blue"], C["blue_dark"], 12)
    s += round_rect(60, 200, 100, 28, 8, C["blue_awning"])
    s += round_rect(290, 200, 100, 28, 8, C["blue_awning"])

    produce = [C["red"], C["yellow"], C["grass"], C["orange_roof"], C["blue"], C["sg_red"]]
    for i, col in enumerate(produce):
        x = 100 + (i % 3) * 80
        y = 230 + (i // 3) * 55
        s += round_rect(x, y, 68, 40, 8, C["white_side"])
        s += round_rect(x + 8, y + 8, 52, 18, 6, col)
        s += circle(x + 20, y + 30, 5, col)
        s += circle(x + 36, y + 30, 5, C["yellow"] if col != C["yellow"] else C["red"])

    s += round_rect(110, 360, 280, 40, 10, "#A8C8E0", 0.25)
    s += svg_close()
    write(ASSETS / "food-retail" / "wet-market.svg", s)


def make_fairprice():
    w = h = BUILDING
    s = svg_open(w, h, "NTUC FairPrice")
    s += plaza(60, 300, 360, 140, 24)
    s += building_block(90, 70, 280, 85, 200, C["white"], C["white_side"], C["fairprice_red"], C["fairprice_red_dark"], 14)

    s += round_rect(90, 110, 280, 48, 8, C["fairprice_red"])
    # Shopping cart icon
    s += round_rect(200, 122, 36, 22, 4, C["white"])
    s += path("M198,120 L190,120 L186,128 L198,128 Z", C["white"])
    s += circle(208, 148, 5, C["white"])
    s += circle(228, 148, 5, C["white"])
    s += round_rect(232, 118, 4, 18, 2, C["white"])

    s += round_rect(110, 185, 100, 70, 10, C["blue_window"])
    s += round_rect(250, 185, 100, 70, 10, C["blue_window"])
    s += door(200, 200, 36, 55, C["dark_grey"], 8)
    s += round_rect(160, 340, 140, 14, 5, C["road_line"])
    s += svg_close()
    write(ASSETS / "food-retail" / "ntuc-fairprice.svg", s)


def make_sheng_siong():
    w = h = BUILDING
    s = svg_open(w, h, "Sheng Siong")
    s += plaza(60, 300, 360, 140, 24)
    s += building_block(90, 70, 280, 85, 200, C["white"], C["white_side"], C["sheng_green"], C["sheng_green_dark"], 14)

    s += round_rect(90, 110, 280, 48, 8, C["sheng_green"])
    s += round_rect(200, 122, 18, 24, 5, C["white"])
    s += round_rect(226, 122, 18, 24, 5, C["white"])
    s += round_rect(205, 128, 8, 6, 2, C["sheng_green"])
    s += round_rect(231, 134, 8, 6, 2, C["sheng_green"])

    s += round_rect(110, 185, 100, 70, 10, C["blue_window"])
    s += round_rect(250, 185, 100, 70, 10, C["blue_window"])
    s += door(200, 200, 36, 55, C["dark_grey"], 8)
    s += svg_close()
    write(ASSETS / "food-retail" / "sheng-siong.svg", s)


# ---------------------------------------------------------------------------
# TRANSPORTATION
# ---------------------------------------------------------------------------

def make_mrt_station():
    w = h = BUILDING
    s = svg_open(w, h, "MRT Station")
    s += plaza(50, 280, 410, 170, 24)
    s += building_block(100, 50, 260, 95, 180, C["white"], C["white_side"], C["mrt_green"], C["mrt_green_dark"], 14)
    s += round_rect(100, 95, 260, 36, 6, C["mrt_green"])
    s += circle(230, 113, 14, C["white"])
    s += circle(230, 113, 9, C["mrt_red"])
    s += circle(230, 113, 4, C["white"])
    s += round_rect(130, 155, 80, 55, 10, C["blue_window"])
    s += round_rect(250, 155, 80, 55, 10, C["blue_window"])
    s += door(210, 160, 32, 50, C["charcoal"], 8)
    s += round_rect(180, 280, 100, 22, 8, C["dark_grey"])
    s += round_rect(190, 288, 80, 8, 3, C["mrt_green"])
    s += round_rect(70, 340, 370, 40, 12, C["road"])
    for x in range(90, 400, 55):
        s += round_rect(x, 352, 36, 10, 4, C["yellow"])
    s += svg_close()
    write(ASSETS / "transportation" / "mrt-station.svg", s)


def make_bus_interchange():
    w = h = BUILDING
    s = svg_open(w, h, "Bus Interchange")
    s += round_rect(40, 200, 430, 260, 24, C["road"])
    s += soft_shadow(256, 460, 180, 14)

    # Central concourse
    s += building_block(160, 60, 180, 70, 120, C["cream"], C["cream_side"], C["blue"], C["blue_dark"], 12)
    s += round_rect(160, 100, 180, 28, 6, C["blue"])
    s += round_rect(220, 108, 60, 12, 4, C["white"])

    # Bus bays (rounded lanes)
    for i, y in enumerate([240, 300, 360]):
        s += round_rect(60, y, 390, 40, 12, C["road_dark"])
        s += round_rect(80, y + 14, 50, 10, 3, C["road_line"])
        s += round_rect(160, y + 14, 50, 10, 3, C["road_line"])
        # Shelter
        s += round_rect(320, y - 8, 100, 20, 6, C["blue_awning"])
        s += round_rect(340, y + 12, 60, 16, 4, C["cream"])

    s += svg_close()
    write(ASSETS / "transportation" / "bus-interchange.svg", s)


def make_bus_stop():
    w = h = TILE
    s = svg_open(w, h, "Bus Stop")
    s += soft_shadow(128, 200, 70, 12)
    # Pavement pad
    s += round_rect(40, 160, 176, 60, 14, C["pavement"])
    # Shelter roof
    s += round_rect(55, 70, 146, 28, 10, C["blue_awning"])
    s += round_rect(60, 90, 136, 10, 4, C["blue_awning_side"])
    # Posts
    s += round_rect(68, 98, 10, 70, 4, C["dark_grey"])
    s += round_rect(178, 98, 10, 70, 4, C["dark_grey"])
    # Bench
    s += round_rect(90, 140, 76, 16, 6, C["red"])
    s += round_rect(96, 154, 8, 10, 2, C["black"])
    s += round_rect(152, 154, 8, 10, 2, C["black"])
    # Bus stop pole + sign
    s += round_rect(210, 50, 10, 130, 4, C["dark_grey"])
    s += round_rect(195, 40, 40, 36, 8, C["blue"])
    s += round_rect(202, 48, 26, 10, 3, C["white"])
    s += circle(215, 68, 6, C["white"])
    s += svg_close()
    write(ASSETS / "transportation" / "bus-stop.svg", s)


def make_taxi_pickup():
    w = h = TILE
    s = svg_open(w, h, "Taxi / Ride-Hailing Pick-up")
    s += soft_shadow(128, 200, 80, 12)
    s += round_rect(36, 140, 184, 80, 16, C["pavement"])
    # Marked bay
    s += round_rect(50, 155, 156, 50, 12, C["road"])
    s += round_rect(60, 168, 30, 8, 3, C["yellow"])
    s += round_rect(100, 168, 30, 8, 3, C["yellow"])
    s += round_rect(140, 168, 30, 8, 3, C["yellow"])
    # Sign post
    s += round_rect(118, 40, 10, 110, 4, C["dark_grey"])
    s += round_rect(95, 30, 56, 40, 10, C["yellow"])
    s += round_rect(105, 40, 36, 10, 3, C["charcoal"])
    # Small canopy
    s += round_rect(70, 100, 116, 18, 8, C["blue_awning"])
    s += svg_close()
    write(ASSETS / "transportation" / "taxi-pickup.svg", s)


# ---------------------------------------------------------------------------
# HEALTHCARE
# ---------------------------------------------------------------------------

def make_polyclinic():
    w = h = BUILDING
    s = svg_open(w, h, "Polyclinic")
    s += plaza(80, 320, 300, 120, 18)
    s += building_block(80, 60, 300, 90, 220, C["white"], C["white_side"], C["blue"], C["blue_dark"], 14)
    s += round_rect(80, 110, 300, 40, 6, C["blue"])
    s += round_rect(210, 116, 12, 28, 3, C["white"])
    s += round_rect(198, 128, 36, 12, 3, C["white"])
    for row in range(2):
        s += windows_row(110, 180 + row * 50, 5, 28, 32, 18, C["blue_window"], 6)
    s += door(210, 270, 40, 55, C["dark_grey"], 8)
    s += svg_close()
    write(ASSETS / "healthcare" / "polyclinic.svg", s)


def make_gp_clinic():
    w = h = TILE
    s = svg_open(w, h, "GP Clinic")
    s += soft_shadow(128, 210, 90, 12)
    s += building_block(50, 50, 140, 50, 120, C["cream"], C["cream_side"], C["red_roof"], C["red_roof_side"], 10)
    s += round_rect(50, 85, 140, 24, 5, C["blue"])
    s += round_rect(105, 90, 10, 14, 2, C["white"])
    s += round_rect(98, 95, 24, 8, 2, C["white"])
    s += round_rect(70, 125, 40, 36, 6, C["blue_window"])
    s += door(130, 130, 28, 40, C["dark_grey"], 5)
    s += round_rect(50, 195, 140, 30, 10, C["pavement"])
    s += svg_close()
    write(ASSETS / "healthcare" / "gp-clinic.svg", s)


def make_pharmacy(name: str, brand: str, brand_dark: str, filename: str, mark: str):
    w = h = TILE
    s = svg_open(w, h, name)
    s += soft_shadow(128, 210, 90, 12)
    s += building_block(48, 45, 145, 50, 125, C["white"], C["white_side"], brand, brand_dark, 10)
    s += round_rect(48, 80, 145, 32, 6, brand)
    if mark == "G":
        s += round_rect(100, 88, 40, 16, 6, C["white"])
    elif mark == "W":
        s += round_rect(95, 88, 50, 16, 6, C["white"])
        s += path("M105,92 L110,100 L115,92 L120,100 L125,92 L130,96 L120,104 L115,96 L110,104 L100,96 Z", brand)
    else:  # Unity
        s += circle(120, 96, 10, C["white"])
        s += round_rect(117, 88, 6, 16, 2, brand)
        s += round_rect(112, 93, 16, 6, 2, brand)
    s += round_rect(65, 130, 45, 40, 6, C["blue_window"])
    s += door(130, 135, 28, 40, C["dark_grey"], 5)
    s += round_rect(48, 195, 145, 30, 10, C["pavement"])
    s += svg_close()
    write(ASSETS / "healthcare" / filename, s)


# ---------------------------------------------------------------------------
# COMMUNITY
# ---------------------------------------------------------------------------

def make_community_club():
    w = h = BUILDING
    s = svg_open(w, h, "Community Club (CC)")
    s += plaza(90, 320, 280, 120, 18)
    s += building_block(90, 50, 280, 90, 210, C["white"], C["white_side"], C["red_roof"], C["red_roof_side"], 14)
    s += circle(230, 145, 22, C["sg_red"])
    for ang in range(0, 360, 60):
        rad = math.radians(ang)
        s += circle(230 + math.cos(rad) * 18, 145 + math.sin(rad) * 14, 8, C["sg_red"])
    s += circle(230, 145, 10, C["white"])
    s += windows_row(120, 195, 4, 32, 36, 20, C["blue_window"], 6)
    s += door(210, 255, 40, 55, C["dark_grey"], 8)
    s += round_rect(400, 90, 6, 160, 2, C["dark_grey"])
    s += round_rect(406, 95, 40, 24, 3, C["sg_red"])
    s += circle(418, 107, 5, C["white"])
    s += svg_close()
    write(ASSETS / "community" / "community-club.svg", s)


def make_singpost():
    w = h = TILE
    s = svg_open(w, h, "SingPost Office")
    s += soft_shadow(128, 210, 90, 12)
    s += building_block(50, 45, 140, 50, 125, C["cream"], C["cream_side"], C["singpost_red"], C["sg_red_dark"], 10)
    s += round_rect(50, 80, 140, 28, 5, C["singpost_red"])
    # Envelope icon
    s += round_rect(100, 86, 40, 18, 3, C["white"])
    s += path("M100,86 L120,98 L140,86 Z", C["singpost_red"])
    s += round_rect(70, 125, 40, 36, 6, C["blue_window"])
    s += door(130, 130, 28, 40, C["dark_grey"], 5)
    s += round_rect(50, 195, 140, 30, 10, C["pavement"])
    s += svg_close()
    write(ASSETS / "community" / "singpost-office.svg", s)


def make_bank():
    w = h = TILE
    s = svg_open(w, h, "Bank Branch")
    s += soft_shadow(128, 210, 90, 12)
    s += building_block(48, 40, 145, 55, 130, C["white"], C["white_side"], C["bank_blue"], C["bank_blue_dark"], 10)
    s += round_rect(48, 78, 145, 28, 5, C["bank_blue"])
    # Simple column marks
    for x in (70, 100, 130, 160):
        s += round_rect(x, 120, 10, 50, 3, C["cream_dark"])
    s += door(105, 140, 30, 42, C["dark_grey"], 5)
    s += round_rect(48, 195, 145, 30, 10, C["pavement"])
    s += svg_close()
    write(ASSETS / "community" / "bank-branch.svg", s)


def make_atm():
    w = h = TILE
    s = svg_open(w, h, "ATM")
    s += soft_shadow(128, 200, 40, 10)
    # Kiosk body
    s += round_rect(88, 60, 80, 140, 14, C["white"])
    s += round_rect(96, 60, 72, 140, 12, C["white_side"])  # side hint
    s += round_rect(88, 60, 80, 36, 12, C["bank_blue"])
    s += round_rect(100, 110, 56, 40, 6, C["blue_window"])
    s += round_rect(108, 160, 40, 10, 3, C["dark_grey"])  # card slot
    s += round_rect(112, 178, 32, 8, 3, C["yellow"])  # cash slot
    s += round_rect(80, 200, 96, 24, 8, C["pavement"])
    s += svg_close()
    write(ASSETS / "community" / "atm.svg", s)


# ---------------------------------------------------------------------------
# RESIDENTIAL
# ---------------------------------------------------------------------------

def make_hdb_void_deck():
    w = h = BUILDING
    s = svg_open(w, h, "HDB Void Deck")
    s += soft_shadow(256, 450, 180, 16)
    # Building mass above
    s += building_block(80, 40, 300, 80, 280, C["cream"], C["cream_side"], C["cream_dark"], C["cream_dark"], 12)
    # Blue window accents (upper floors)
    for row in range(4):
        s += windows_row(110, 80 + row * 42, 5, 28, 26, 18, C["blue_window"], 5)
    # Void deck open ground floor — pillars + open space
    s += round_rect(80, 280, 300, 100, 10, C["cream"])
    # Pillars
    for x in (100, 170, 240, 310):
        s += round_rect(x, 280, 18, 100, 6, C["cream_side"])
    # Open darker recess
    s += round_rect(120, 295, 200, 70, 8, C["cream_dark"])
    # Notice board
    s += round_rect(150, 310, 50, 40, 6, C["notice"])
    s += round_rect(156, 316, 16, 12, 2, C["red"])
    s += round_rect(176, 316, 16, 12, 2, C["yellow"])
    s += round_rect(156, 332, 16, 10, 2, C["blue"])
    s += round_rect(176, 332, 16, 10, 2, C["grass"])
    # Bench
    s += round_rect(230, 340, 70, 14, 6, C["red"])
    s += round_rect(80, 390, 300, 50, 14, C["pavement"])
    s += svg_close()
    write(ASSETS / "residential" / "hdb-void-deck.svg", s)


def make_letterbox():
    w = h = TILE
    s = svg_open(w, h, "Letterbox Area")
    s += soft_shadow(128, 210, 90, 12)
    s += round_rect(40, 160, 176, 60, 14, C["pavement"])
    # Letterbox bank
    s += round_rect(55, 70, 146, 100, 10, C["dark_grey"])
    s += round_rect(60, 75, 136, 90, 8, C["charcoal"])
    # Individual boxes
    colors = [C["cream"], C["white"], C["cream"], C["white"]]
    for row in range(3):
        for col in range(4):
            x = 70 + col * 30
            y = 85 + row * 26
            s += round_rect(x, y, 24, 20, 3, colors[col])
            s += round_rect(x + 8, y + 8, 8, 4, 1, C["dark_grey"])
    s += svg_close()
    write(ASSETS / "residential" / "letterbox-area.svg", s)


def make_neighbourhood_park():
    w = h = BUILDING
    s = svg_open(w, h, "Neighbourhood Park")
    s += grass_base(40, 40, 430, 430, 28)
    s += soft_shadow(256, 460, 160, 12)

    # Path
    s += round_rect(200, 60, 50, 390, 16, C["pavement"])
    s += round_rect(60, 220, 390, 45, 16, C["pavement"])

    # Trees
    for tx, ty in [(100, 120), (380, 110), (120, 340), (370, 350), (300, 180)]:
        s += soft_shadow(tx, ty + 30, 28, 8)
        s += round_rect(tx - 6, ty + 10, 12, 28, 4, C["trunk"])
        s += circle(tx, ty, 28, C["tree_canopy"])
        s += circle(tx - 12, ty + 6, 16, C["tree_canopy_dark"])
        s += circle(tx + 10, ty - 8, 14, C["grass_light"])

    # Bushes
    for bx, by in [(80, 250), (400, 260), (180, 400)]:
        s += circle(bx, by, 18, C["bush"])
        s += circle(bx + 14, by + 4, 14, C["bush_dark"])
        s += circle(bx + 6, by - 6, 4, C["orange_roof"])

    # Bench
    s += round_rect(230, 280, 70, 16, 8, C["red"])
    s += round_rect(238, 294, 8, 10, 2, C["black"])
    s += round_rect(284, 294, 8, 10, 2, C["black"])

    # Fitness corner
    s += round_rect(300, 300, 8, 40, 3, C["blue"])
    s += round_rect(340, 300, 8, 40, 3, C["blue"])
    s += round_rect(300, 295, 48, 8, 3, C["blue_dark"])
    s += ellipse(380, 330, 16, 10, C["blue"])
    s += round_rect(372, 310, 8, 30, 3, C["blue_dark"])

    s += svg_close()
    write(ASSETS / "residential" / "neighbourhood-park.svg", s)


def make_pcn():
    w = h = BUILDING
    s = svg_open(w, h, "Park Connector Network (PCN)")
    s += grass_base(30, 30, 450, 450, 24)
    # Winding path
    s += path(
        "M40,200 "
        "C120,180 160,140 220,160 "
        "C280,180 300,240 360,250 "
        "C420,260 460,220 480,200 "
        "L480,250 "
        "C440,270 400,300 360,290 "
        "C300,278 280,220 220,210 "
        "C160,200 100,240 40,250 Z",
        C["pavement"],
    )
    # Center dashed line
    for i in range(8):
        t = i / 7
        x = 60 + t * 400
        y = 210 + math.sin(t * math.pi * 1.5) * 30
        s += round_rect(x, y, 24, 6, 3, C["road_line"])

    # Trees along path
    for tx, ty in [(90, 120), (180, 100), (280, 130), (400, 150), (100, 340), (250, 360), (400, 340)]:
        s += soft_shadow(tx, ty + 22, 20, 6)
        s += round_rect(tx - 5, ty + 8, 10, 22, 3, C["trunk"])
        s += circle(tx, ty, 22, C["tree_canopy"])
        s += circle(tx + 8, ty - 4, 12, C["grass_light"])

    # Lamp posts
    for lx, ly in [(150, 200), (320, 240)]:
        s += round_rect(lx, ly - 40, 6, 50, 2, C["dark_grey"])
        s += ellipse(lx + 3, ly - 42, 12, 8, C["yellow"])

    s += svg_close()
    write(ASSETS / "residential" / "park-connector-network.svg", s)


# ---------------------------------------------------------------------------
# MODULAR — ROADS
# ---------------------------------------------------------------------------

def road_surface(size=TILE) -> str:
    return round_rect(16, 16, size - 32, size - 32, 28, C["road"])


def make_road_straight():
    w = h = TILE
    s = svg_open(w, h, "Road Straight")
    s += road_surface()
    # Center dashes
    for y in (40, 80, 120, 160, 200):
        s += round_rect(118, y, 20, 28, 6, C["road_line"])
    # Edge lips
    s += round_rect(16, 16, 10, 224, 4, C["pavement_edge"])
    s += round_rect(230, 16, 10, 224, 4, C["pavement_edge"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "road-straight.svg", s)


def make_road_straight_h():
    w = h = TILE
    s = svg_open(w, h, "Road Straight Horizontal")
    s += road_surface()
    for x in (40, 80, 120, 160, 200):
        s += round_rect(x, 118, 28, 20, 6, C["road_line"])
    s += round_rect(16, 16, 224, 10, 4, C["pavement_edge"])
    s += round_rect(16, 230, 224, 10, 4, C["pavement_edge"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "road-straight-h.svg", s)


def make_road_corner():
    w = h = TILE
    s = svg_open(w, h, "Road Corner")
    # L-shaped road with rounded outer/inner
    s += path(
        "M16,16 h120 a100,100 0 0 1 100,100 v120 h-80 "
        "a40,40 0 0 0 -40,-40 H16 Z",
        C["road"],
    )
    # Dashed curve approximation
    for i, (x, y) in enumerate([(60, 50), (100, 70), (140, 110), (160, 150)]):
        s += round_rect(x, y, 18, 14, 5, C["road_line"])
    s += round_rect(16, 16, 10, 140, 4, C["pavement_edge"])
    s += round_rect(140, 230, 100, 10, 4, C["pavement_edge"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "road-corner.svg", s)


def make_road_t():
    w = h = TILE
    s = svg_open(w, h, "Road T-Junction")
    s += round_rect(16, 70, 224, 116, 24, C["road"])
    s += round_rect(70, 16, 116, 180, 24, C["road"])
    for x in (40, 90, 140, 190):
        s += round_rect(x, 118, 24, 16, 5, C["road_line"])
    for y in (40, 80, 140):
        s += round_rect(118, y, 16, 24, 5, C["road_line"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "road-t-junction.svg", s)


def make_road_cross():
    w = h = TILE
    s = svg_open(w, h, "Road Crossroads")
    s += round_rect(16, 70, 224, 116, 24, C["road"])
    s += round_rect(70, 16, 116, 224, 24, C["road"])
    for x in (40, 90, 150, 190):
        s += round_rect(x, 118, 24, 16, 5, C["road_line"])
    for y in (40, 90, 150, 190):
        s += round_rect(118, y, 16, 24, 5, C["road_line"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "road-crossroads.svg", s)


def make_road_roundabout():
    w = h = TILE
    s = svg_open(w, h, "Road Roundabout")
    s += round_rect(16, 70, 224, 116, 24, C["road"])
    s += round_rect(70, 16, 116, 224, 24, C["road"])
    s += circle(128, 128, 48, C["grass"])
    s += circle(128, 128, 36, C["grass_light"])
    s += circle(128, 128, 14, C["bush"])
    # Ring dashes
    for ang in range(0, 360, 45):
        rad = math.radians(ang)
        x = 128 + math.cos(rad) * 58
        y = 128 + math.sin(rad) * 58
        s += circle(x, y, 5, C["road_line"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "road-roundabout.svg", s)


def make_zebra():
    w = h = TILE
    s = svg_open(w, h, "Zebra Crossing")
    s += round_rect(16, 70, 224, 116, 20, C["road"])
    for i in range(7):
        s += round_rect(40 + i * 26, 85, 16, 86, 4, C["road_line"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "zebra-crossing.svg", s)


def make_zebra_v():
    w = h = TILE
    s = svg_open(w, h, "Zebra Crossing Vertical")
    s += round_rect(70, 16, 116, 224, 20, C["road"])
    for i in range(7):
        s += round_rect(85, 40 + i * 26, 86, 16, 4, C["road_line"])
    s += svg_close()
    write(ASSETS / "modular" / "roads" / "zebra-crossing-v.svg", s)


# ---------------------------------------------------------------------------
# MODULAR — PAVEMENTS / GRASS / NATURE / PROPS
# ---------------------------------------------------------------------------

def make_pavement():
    w = h = TILE
    s = svg_open(w, h, "Pavement Tile")
    s += round_rect(8, 8, 240, 240, 20, C["pavement"])
    # subtle tile divisions
    s += round_rect(8, 124, 240, 4, 1, C["pavement_edge"], 0.5)
    s += round_rect(124, 8, 4, 240, 1, C["pavement_edge"], 0.5)
    s += svg_close()
    write(ASSETS / "modular" / "pavements" / "pavement.svg", s)


def make_pavement_corner():
    w = h = TILE
    s = svg_open(w, h, "Pavement Corner")
    s += path(
        "M8,8 h240 v120 a112,112 0 0 1 -112,112 H8 Z",
        C["pavement"],
    )
    s += svg_close()
    write(ASSETS / "modular" / "pavements" / "pavement-corner.svg", s)


def make_grass():
    w = h = TILE
    s = svg_open(w, h, "Grass Tile")
    s += grass_base(8, 8, 240, 240, 22)
    s += svg_close()
    write(ASSETS / "modular" / "nature" / "grass.svg", s)


def make_tree():
    w = h = TILE
    s = svg_open(w, h, "Tree")
    s += soft_shadow(128, 210, 40, 12)
    s += round_rect(118, 140, 20, 70, 8, C["trunk"])
    s += round_rect(122, 145, 12, 60, 5, C["trunk_dark"])
    s += circle(128, 110, 55, C["tree_canopy"])
    s += circle(100, 120, 30, C["tree_canopy_dark"])
    s += circle(150, 95, 28, C["grass_light"])
    s += circle(130, 85, 22, C["tree_canopy"])
    s += svg_close()
    write(ASSETS / "modular" / "nature" / "tree.svg", s)


def make_bush():
    w = h = TILE
    s = svg_open(w, h, "Bush")
    s += soft_shadow(128, 180, 50, 12)
    s += circle(100, 140, 40, C["bush"])
    s += circle(140, 145, 42, C["bush_dark"])
    s += circle(120, 120, 36, C["bush"])
    s += circle(110, 130, 6, C["orange_roof"])
    s += circle(145, 135, 5, C["orange_roof"])
    s += circle(125, 150, 4, C["yellow"])
    s += svg_close()
    write(ASSETS / "modular" / "nature" / "bush.svg", s)


def make_bench():
    w = h = TILE
    s = svg_open(w, h, "Bench")
    s += soft_shadow(128, 170, 55, 10)
    s += round_rect(60, 120, 136, 28, 12, C["red"])
    s += round_rect(60, 120, 136, 10, 8, C["red_dark"])
    s += round_rect(72, 148, 10, 22, 3, C["black"])
    s += round_rect(174, 148, 10, 22, 3, C["black"])
    s += svg_close()
    write(ASSETS / "modular" / "props" / "bench.svg", s)


def make_lamp_post():
    w = h = TILE
    s = svg_open(w, h, "Lamp Post")
    s += soft_shadow(128, 220, 18, 8)
    s += round_rect(122, 60, 12, 160, 5, C["dark_grey"])
    s += round_rect(124, 65, 8, 150, 4, C["charcoal"])
    s += ellipse(128, 50, 28, 18, C["yellow"])
    s += ellipse(128, 48, 20, 12, C["lemon"])
    s += circle(128, 48, 6, C["white"])
    s += svg_close()
    write(ASSETS / "modular" / "props" / "lamp-post.svg", s)


def make_dustbin():
    w = h = TILE
    s = svg_open(w, h, "Dustbin")
    s += soft_shadow(128, 200, 28, 10)
    s += round_rect(100, 90, 56, 100, 18, C["bush"])
    s += round_rect(108, 90, 48, 100, 16, C["bush_dark"])
    s += round_rect(100, 90, 56, 24, 12, C["green_dark"])
    # recycle mark
    s += round_rect(114, 125, 28, 28, 6, C["yellow"])
    s += path("M120,132 L136,132 L128,148 Z", C["bush"])
    s += svg_close()
    write(ASSETS / "modular" / "props" / "dustbin.svg", s)


def make_bus_shelter():
    w = h = TILE
    s = svg_open(w, h, "Bus Shelter")
    s += soft_shadow(128, 210, 80, 12)
    s += round_rect(40, 180, 176, 40, 12, C["pavement"])
    s += round_rect(50, 70, 156, 30, 12, C["blue_awning"])
    s += round_rect(55, 92, 146, 12, 4, C["blue_awning_side"])
    s += round_rect(60, 100, 10, 80, 4, C["dark_grey"])
    s += round_rect(186, 100, 10, 80, 4, C["dark_grey"])
    s += round_rect(85, 150, 86, 18, 8, C["red"])
    s += svg_close()
    write(ASSETS / "modular" / "props" / "bus-shelter.svg", s)


def make_mrt_entrance():
    w = h = TILE
    s = svg_open(w, h, "MRT Entrance")
    s += soft_shadow(128, 210, 70, 12)
    s += round_rect(50, 160, 156, 60, 14, C["pavement"])
    # Canopy
    s += round_rect(70, 70, 116, 40, 12, C["mrt_green"])
    s += round_rect(75, 100, 106, 14, 5, C["mrt_green_dark"])
    # Stairs into ground
    for i in range(4):
        s += round_rect(90 + i * 4, 120 + i * 10, 76 - i * 8, 12, 3, C["dark_grey"] if i % 2 == 0 else C["charcoal"])
    s += circle(128, 85, 10, C["white"])
    s += circle(128, 85, 6, C["mrt_red"])
    s += svg_close()
    write(ASSETS / "modular" / "props" / "mrt-entrance.svg", s)


# ---------------------------------------------------------------------------
# MODULAR — ARCHITECTURE PIECES
# ---------------------------------------------------------------------------

def make_hdb_corridor():
    w = h = TILE
    s = svg_open(w, h, "HDB Corridor")
    s += soft_shadow(128, 200, 100, 10)
    # Floor
    s += round_rect(20, 140, 216, 60, 10, C["pavement"])
    # Back wall
    s += round_rect(20, 60, 216, 90, 8, C["cream"])
    # Parapet railing
    s += round_rect(20, 140, 216, 12, 4, C["blue"])
    # Doors
    for x in (50, 110, 170):
        s += round_rect(x, 85, 36, 55, 6, C["dark_grey"])
        s += round_rect(x + 6, 95, 24, 20, 3, C["blue_window"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "hdb-corridor.svg", s)


def make_roof_red():
    w = h = TILE
    s = svg_open(w, h, "Roof Red")
    s += path("M30,140 L128,50 L226,140 L200,150 L128,80 L56,150 Z", C["red_roof"])
    s += path("M56,150 L128,80 L200,150 L226,140 L128,180 Z", C["red_roof_side"])
    s += round_rect(40, 140, 176, 20, 6, C["red_dark"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "roof-red.svg", s)


def make_roof_orange():
    w = h = TILE
    s = svg_open(w, h, "Roof Orange Tiled")
    s += path("M30,140 L128,50 L226,140 L200,150 L128,80 L56,150 Z", C["orange_roof"])
    s += path("M56,150 L128,80 L200,150 L226,140 L128,180 Z", C["orange_roof_side"])
    # Tile ridges
    for i in range(4):
        y = 100 + i * 14
        s += path(
            f"M{70+i*8:.0f},{y:.0f} L128,{y-30:.0f} L{186-i*8:.0f},{y:.0f} L128,{y+8:.0f} Z",
            C["orange_tile"] if i % 2 == 0 else C["orange_roof"],
        )
    s += round_rect(40, 140, 176, 20, 6, C["orange_roof_side"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "roof-orange.svg", s)


def make_roof_blue():
    w = h = TILE
    s = svg_open(w, h, "Roof Blue")
    s += path("M30,140 L128,50 L226,140 L200,150 L128,80 L56,150 Z", C["blue"])
    s += path("M56,150 L128,80 L200,150 L226,140 L128,180 Z", C["blue_dark"])
    s += round_rect(40, 140, 176, 20, 6, C["blue_dark"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "roof-blue.svg", s)


def make_wall():
    w = h = TILE
    s = svg_open(w, h, "Wall Front")
    s += soft_shadow(128, 210, 90, 10)
    s += round_rect(40, 50, 160, 160, 14, C["cream"])
    s += round_rect(200, 60, 30, 150, 8, C["cream_side"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "wall.svg", s)


def make_wall_side():
    w = h = TILE
    s = svg_open(w, h, "Wall Side")
    s += soft_shadow(128, 210, 50, 10)
    s += round_rect(90, 50, 80, 160, 12, C["cream_side"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "wall-side.svg", s)


def make_door():
    w = h = TILE
    s = svg_open(w, h, "Door")
    s += soft_shadow(128, 200, 30, 8)
    s += round_rect(95, 60, 66, 140, 12, C["dark_grey"])
    s += round_rect(105, 75, 46, 50, 6, C["blue_window"])
    s += circle(145, 140, 5, C["yellow"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "door.svg", s)


def make_window():
    w = h = TILE
    s = svg_open(w, h, "Window")
    s += soft_shadow(128, 160, 40, 8)
    s += round_rect(70, 70, 116, 100, 12, C["cream"])
    s += round_rect(82, 82, 92, 76, 8, C["blue_window"])
    # muntin
    s += round_rect(124, 82, 6, 76, 2, C["white"])
    s += round_rect(82, 116, 92, 6, 2, C["white"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "window.svg", s)


def make_window_blue_accent():
    w = h = TILE
    s = svg_open(w, h, "Window Blue Accent")
    s += soft_shadow(128, 160, 40, 8)
    s += round_rect(70, 70, 116, 100, 12, C["blue"])
    s += round_rect(82, 82, 92, 76, 8, C["blue_window"])
    s += round_rect(124, 82, 6, 76, 2, C["white"])
    s += round_rect(82, 116, 92, 6, 2, C["white"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "window-blue-accent.svg", s)


def make_awning():
    w = h = TILE
    s = svg_open(w, h, "Awning")
    s += soft_shadow(128, 150, 80, 10)
    s += round_rect(40, 90, 176, 40, 12, C["blue_awning"])
    s += round_rect(48, 120, 160, 14, 5, C["blue_awning_side"])
    s += svg_close()
    write(ASSETS / "modular" / "architecture" / "awning.svg", s)


# ---------------------------------------------------------------------------
# Manifest + Preview
# ---------------------------------------------------------------------------

MANIFEST = {
    "name": "Singapore Neighbourhood Modular Asset Pack",
    "version": "1.0.0",
    "style": {
        "description": "Clean Nintendo-like vector cartoon (Animal Crossing / Townscaper)",
        "perspective": "dimetric 3/4 top-down",
        "outlines": False,
        "shading": "two-tone front/side only",
        "corners": "soft rounded",
        "background": "transparent",
    },
    "grid": {
        "tileSize": TILE,
        "buildingSize": BUILDING,
        "units": "px",
        "pivot": "bottom-center",
    },
    "palette": C,
    "categories": {},
}


def collect_manifest():
    cats = {
        "food-retail": "Food & Retail",
        "transportation": "Transportation",
        "healthcare": "Healthcare",
        "community": "Community",
        "residential": "Residential",
        "modular/roads": "Roads",
        "modular/pavements": "Pavements",
        "modular/nature": "Nature",
        "modular/props": "Props",
        "modular/architecture": "Architecture Modules",
    }
    for rel, title in cats.items():
        folder = ASSETS / rel
        files = sorted(folder.glob("*.svg")) if folder.exists() else []
        assets = []
        for f in files:
            text = f.read_text(encoding="utf-8")
            size = BUILDING if f'width="{BUILDING}"' in text else TILE
            assets.append(
                {
                    "id": f.stem,
                    "file": str(f.relative_to(ROOT)).replace("\\", "/"),
                    "size": size,
                }
            )
        MANIFEST["categories"][rel] = {"title": title, "assets": assets}


def make_preview_html():
    collect_manifest()
    write(ROOT / "manifest.json", json.dumps(MANIFEST, indent=2) + "\n")

    sections = []
    for rel, data in MANIFEST["categories"].items():
        cards = []
        for a in data["assets"]:
            size = a["size"]
            cards.append(
                f"""
        <figure class="card">
          <div class="tile" style="--s:{size}px">
            <img src="../{a['file']}" alt="{a['id']}" width="{size}" height="{size}"/>
          </div>
          <figcaption>{a['id']}<span>{size}×{size}</span></figcaption>
        </figure>"""
            )
        sections.append(
            f"""
      <section>
        <h2>{data['title']}</h2>
        <div class="grid">{''.join(cards)}
        </div>
      </section>"""
        )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SG Neighbourhood Asset Pack — Preview</title>
<style>
  :root {{
    --bg: #E8F0E9;
    --ink: #2C3A2E;
    --muted: #5A6B5C;
    --panel: #F7FBF7;
    --tile-bg: repeating-conic-gradient(#dfe8e0 0% 25%, #f4f8f4 0% 50%) 50% / 16px 16px;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: "Avenir Next", "Segoe UI", "Nunito", sans-serif;
    background:
      radial-gradient(ellipse at 20% 0%, #d4ecd8 0%, transparent 50%),
      radial-gradient(ellipse at 90% 10%, #fde8d8 0%, transparent 40%),
      var(--bg);
    color: var(--ink);
    min-height: 100vh;
    padding: 48px 32px 80px;
  }}
  header {{ max-width: 1200px; margin: 0 auto 48px; }}
  header h1 {{
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 8px;
  }}
  header p {{ color: var(--muted); max-width: 52ch; line-height: 1.5; font-size: 1.05rem; }}
  .meta {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }}
  .meta span {{
    background: var(--panel); border-radius: 999px; padding: 6px 14px;
    font-size: 0.85rem; color: var(--muted);
  }}
  section {{ max-width: 1200px; margin: 0 auto 40px; }}
  h2 {{
    font-size: 1.25rem; margin-bottom: 16px; padding-bottom: 8px;
    border-bottom: 2px solid #c5d9c7;
  }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }}
  .card {{
    background: var(--panel); border-radius: 20px; padding: 16px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }}
  .tile {{
    width: 100%; aspect-ratio: 1; background: var(--tile-bg);
    border-radius: 14px; display: grid; place-items: center; overflow: hidden;
  }}
  .tile img {{ width: 90%; height: 90%; object-fit: contain; }}
  figcaption {{
    font-size: 0.8rem; font-weight: 600; text-align: center;
    display: flex; flex-direction: column; gap: 2px;
  }}
  figcaption span {{ font-weight: 500; color: var(--muted); font-size: 0.7rem; }}
  .hero {{
    max-width: 1200px; margin: 0 auto 48px;
    border-radius: 24px; overflow: hidden;
    background: var(--panel); padding: 12px;
  }}
  .hero img {{ width: 100%; height: auto; border-radius: 16px; display: block; }}
</style>
</head>
<body>
  <header>
    <h1>Singapore Neighbourhood Pack</h1>
    <p>Modular game-ready vector tiles — clean Nintendo-like style, soft pastels, no outlines, dimetric 3/4 view. Transparent backgrounds, {TILE}px / {BUILDING}px grid.</p>
    <div class="meta">
      <span>No outlines</span>
      <span>Two-tone shading</span>
      <span>Rounded corners</span>
      <span>Transparent SVG + PNG</span>
      <span>Unity / Figma</span>
    </div>
  </header>
  <div class="hero">
    <img src="renders/sample-neighbourhood.png" alt="Sample neighbourhood composition"/>
  </div>
  {''.join(sections)}
</body>
</html>
"""
    write(ROOT / "preview" / "index.html", html)


def _svg_inner(path: Path) -> str:
    """Extract drawable content from an asset SVG (strip xml/svg wrappers)."""
    text = path.read_text(encoding="utf-8")
    start = text.find(">", text.find("<svg")) + 1
    end = text.rfind("</svg>")
    return text[start:end]


def make_sample_scene():
    """Compose a neighbourhood demo by inlining modular tiles (no external refs)."""
    W, H = 1280, 960
    s = svg_open(W, H, "Sample Neighbourhood Scene")
    s += f'  <rect width="{W}" height="{H}" fill="#E5F0E6"/>\n'

    def place(rel: str, x: float, y: float, size: float):
        src = ROOT / rel
        if not src.exists():
            return ""
        # Detect native size
        native = BUILDING if f'width="{BUILDING}"' in src.read_text(encoding="utf-8")[:300] else TILE
        scale = size / native
        inner = _svg_inner(src)
        return (
            f'  <g transform="translate({x},{y}) scale({scale:.4f})">\n'
            f"{inner}\n"
            f"  </g>\n"
        )

    # Grass grid
    for gy in range(0, H, 256):
        for gx in range(0, W, 256):
            s += place("assets/modular/nature/grass.svg", gx, gy, 256)

    # Roads
    for x in range(0, W, 256):
        s += place("assets/modular/roads/road-straight-h.svg", x, 352, 256)
    for y in range(0, H, 256):
        s += place("assets/modular/roads/road-straight.svg", 512, y, 256)
    s += place("assets/modular/roads/road-crossroads.svg", 512, 352, 256)
    s += place("assets/modular/roads/zebra-crossing.svg", 256, 352, 256)

    # Locations
    s += place("assets/food-retail/hawker-centre.svg", 20, 20, 340)
    s += place("assets/food-retail/ntuc-fairprice.svg", 780, 20, 320)
    s += place("assets/transportation/mrt-station.svg", 760, 500, 320)
    s += place("assets/residential/hdb-void-deck.svg", 20, 540, 300)
    s += place("assets/community/community-club.svg", 300, 560, 260)
    s += place("assets/modular/nature/tree.svg", 680, 180, 130)
    s += place("assets/modular/nature/tree.svg", 180, 260, 110)
    s += place("assets/modular/nature/bush.svg", 620, 280, 90)
    s += place("assets/modular/props/bench.svg", 400, 240, 100)
    s += place("assets/modular/props/lamp-post.svg", 470, 260, 90)
    s += place("assets/modular/props/dustbin.svg", 640, 300, 80)
    s += place("assets/transportation/bus-stop.svg", 720, 280, 150)
    s += place("assets/healthcare/guardian.svg", 900, 300, 160)

    s += svg_close()
    write(ROOT / "preview" / "sample-neighbourhood.svg", s)


def export_pngs():
    try:
        import cairosvg
    except ImportError:
        print("  (cairosvg not installed — skipping PNG export)")
        return

    png_root = ASSETS / "png"
    renders = ROOT / "preview" / "renders"
    renders.mkdir(parents=True, exist_ok=True)

    for svg in sorted(ASSETS.rglob("*.svg")):
        if "png" in svg.parts:
            continue
        rel = svg.relative_to(ASSETS)
        out = png_root / rel.with_suffix(".png")
        out.parent.mkdir(parents=True, exist_ok=True)
        text = svg.read_text(encoding="utf-8")
        size = BUILDING if f'width="{BUILDING}"' in text else TILE
        cairosvg.svg2png(url=str(svg), write_to=str(out), output_width=size, output_height=size)

    sample = ROOT / "preview" / "sample-neighbourhood.svg"
    if sample.exists():
        cairosvg.svg2png(
            url=str(sample),
            write_to=str(renders / "sample-neighbourhood.png"),
            output_width=1280,
            output_height=960,
        )

    # Key QA renders
    for rel in [
        "food-retail/hawker-centre.svg",
        "food-retail/ntuc-fairprice.svg",
        "transportation/mrt-station.svg",
        "residential/neighbourhood-park.svg",
        "residential/hdb-void-deck.svg",
        "community/community-club.svg",
        "modular/roads/road-crossroads.svg",
        "modular/nature/tree.svg",
        "modular/props/bench.svg",
        "healthcare/polyclinic.svg",
    ]:
        src = ASSETS / rel
        if src.exists():
            cairosvg.svg2png(
                url=str(src),
                write_to=str(renders / f"{src.stem}.png"),
                output_width=512,
                output_height=512,
            )
    print("  ✓ assets/png/** + preview/renders/**")


def main():
    print("Generating Singapore Neighbourhood Asset Pack...\n")

    # Food & Retail
    make_hawker()
    make_wet_market()
    make_fairprice()
    make_sheng_siong()

    # Transportation
    make_mrt_station()
    make_bus_interchange()
    make_bus_stop()
    make_taxi_pickup()

    # Healthcare
    make_polyclinic()
    make_gp_clinic()
    make_pharmacy("Guardian", C["guardian_green"], C["guardian_green_dark"], "guardian.svg", "G")
    make_pharmacy("Watsons", C["watsons_blue"], C["watsons_blue_dark"], "watsons.svg", "W")
    make_pharmacy("Unity Pharmacy", C["unity_orange"], C["unity_orange_dark"], "unity-pharmacy.svg", "U")

    # Community
    make_community_club()
    make_singpost()
    make_bank()
    make_atm()

    # Residential
    make_hdb_void_deck()
    make_letterbox()
    make_neighbourhood_park()
    make_pcn()

    # Modular roads
    make_road_straight()
    make_road_straight_h()
    make_road_corner()
    make_road_t()
    make_road_cross()
    make_road_roundabout()
    make_zebra()
    make_zebra_v()

    # Pavements / nature / props
    make_pavement()
    make_pavement_corner()
    make_grass()
    make_tree()
    make_bush()
    make_bench()
    make_lamp_post()
    make_dustbin()
    make_bus_shelter()
    make_mrt_entrance()

    # Architecture modules
    make_hdb_corridor()
    make_roof_red()
    make_roof_orange()
    make_roof_blue()
    make_wall()
    make_wall_side()
    make_door()
    make_window()
    make_window_blue_accent()
    make_awning()

    make_sample_scene()
    make_preview_html()
    export_pngs()
    print("\nDone.")


if __name__ == "__main__":
    main()
