# Singapore Neighbourhood — 64px Modular Tileset

Clean Nintendo-like vector tileset for Singapore neighbourhood maps.

**64×64 base grid** · soft pastels · no outlines · dimetric 3/4 · transparent SVG + PNG

## Quick start

```bash
pip install -r requirements.txt
python3 scripts/generate_assets.py
open preview/index.html
```

## Grid

| | |
|---|---|
| Base tile | **64×64** px |
| Locations | Multiples of 64 (128 / 192 / 256) |
| Formats | SVG (source) + PNG (`tileset/png/`) |
| Background | Transparent |
| Ground tiles | Seamless edge-to-edge (tileable) |

## Contents

### Ground (64×64 seamless)
`grass` · `pavement` · `road-h` · `road-v` · `road-corner` · `road-t` · `road-cross` · `road-roundabout` · `zebra-h` · `zebra-v`

### Nature & props (64×64)
`tree` · `bush` · `bench` · `lamp` · `bin` · `bus-shelter` · `mrt-entrance` · `table-set` · `notice-board` · `flagpole` · `letterbox` · `atm`

### Architecture modules (64×64)
`wall` · `wall-window` · `wall-door` · `wall-hdb-window` (laundry poles) · `roof-red/orange/blue` · `door` · `window` · `awning` · `hdb-corridor` · `void-deck-pillar`

### Locations (snap to 64 grid)

| Category | Assets | Size |
|---|---|---|
| Food & Retail | Hawker, Wet Market, FairPrice, Sheng Siong | 256 / 192 |
| Transport | MRT, Bus Interchange, Bus Stop, Taxi | 192 / 256×192 / 128×64 |
| Healthcare | Polyclinic, GP, Guardian, Watsons, Unity | 192 / 128 |
| Community | CC, SingPost, Bank | 192 / 128 |
| Residential | HDB Void Deck, Letterbox, Park, PCN | 192×256 / 128 / 256 |

## Unity

1. Import `tileset/png/**`
2. **Pixels Per Unit = 64** (1 tile = 1 unit)
3. Ground sprites: mesh type Full Rect, wrap mode Clamp
4. Snap transforms to integer coordinates

## Figma

Drop SVGs onto a 64px grid. Locations already sized to whole tiles.

## Regenerate

`scripts/generate_assets.py` is the source of truth — edit & re-run to rebuild everything.

## Licence note

Brand marks are simplified stylised placeholders for prototypes, not official logos.
