# Singapore Neighbourhood Modular Asset Pack

Clean Nintendo-like vector tiles for Singapore neighbourhood scenes — soft pastels, **no outlines**, minimal two-tone shading, rounded corners, dimetric 3/4 top-down view.

Designed for **Unity**, **Figma**, and grid-based map editors.

## Quick start

```bash
python3 scripts/generate_assets.py
```

Requires Python 3.10+. Optional PNG export: `pip install cairosvg`.

Open `preview/index.html` to browse the atlas.

## Grid & format

| | |
|---|---|
| Standard tile | **256×256** px |
| Location / building tile | **512×512** px |
| Format | SVG (source) + PNG (raster) |
| Background | Transparent |
| Pivot | Bottom-center (recommended) |
| Perspective | Dimetric 3/4 (front + side + roof) |

## Style rules

- No stroke outlines — shapes defined by colour blocks only
- Soft pastel-plus palette (cream buildings, cherry/orange roofs, cornflower awnings, leaf grass)
- Two-tone depth: front lighter, side slightly darker
- Consistent corner radius across modules
- Soft oval ground shadows baked under props

## Contents (49 tiles)

### Food & Retail
Hawker Centre / Kopitiam · Wet Market · NTUC FairPrice · Sheng Siong

### Transportation
MRT Station · Bus Interchange · Bus Stop · Taxi / Ride-Hailing Pick-up

### Healthcare
Polyclinic · GP Clinic · Guardian · Watsons · Unity Pharmacy

### Community
Community Club (CC) · SingPost Office · Bank Branch · ATM

### Residential
HDB Void Deck · Letterbox Area · Neighbourhood Park · Park Connector Network (PCN)

### Bonus modular
- **Roads:** straight (V/H), corner, T-junction, crossroads, roundabout, zebra crossings
- **Pavements** · **Grass** · **Trees** · **Bushes**
- **Props:** benches, lamp posts, dustbins, bus shelters, MRT entrances
- **Architecture:** HDB corridor, roofs (red/orange/blue), walls, doors, windows, awnings

## Folder layout

```
assets/
  food-retail/          # SVG location tiles
  transportation/
  healthcare/
  community/
  residential/
  modular/
    roads/
    pavements/
    nature/
    props/
    architecture/
  png/                  # Raster twin of every SVG (same relative paths)
preview/
  index.html            # Interactive atlas
  sample-neighbourhood.svg
  renders/              # QA / demo PNGs
manifest.json           # Machine-readable catalogue + palette
scripts/generate_assets.py
```

## Unity

1. Import `assets/png/**` (or SVGs via a vector importer).
2. Set **Pixels Per Unit** so 256px = 1 world unit (or your grid cell).
3. Use sprite pivots at bottom-center for props/buildings.
4. Snap placements to a 1×1 (or 2×2 for 512px locations) grid.

## Figma

Drag SVGs into a 256px grid frame. Components stay editable vectors. Brand colours live in `manifest.json` → `palette`.

## Regenerate

Edit `scripts/generate_assets.py`, then re-run. All SVGs, PNGs, `manifest.json`, and the preview atlas are overwritten from the script — treat the script as source of truth.

## Licence note

Brand marks (FairPrice, Sheng Siong, Guardian, Watsons, Unity, SingPost, MRT) are simplified **stylised placeholders** for game prototype use — not official logos.
