# PIXFORGE

Pixel art generator for game-ready assets:

- **Characters** — custom sizes (16×16 through 256×256+), archetypes, and animation clips (idle, walk, attack, jump, hurt)
- **UI** — modular HUD pieces (panels, buttons, bars, slots, windows) at 16–512
- **Environment** — procedural biome tilesets + **real-world reference photos** converted into modular pixel locations
- **Items** — weapons, armor, potions, tools, and more as exportable tilesheets

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Workflow tips

1. Pick a studio tab.
2. Choose tile/sprite size and palette.
3. Reroll the seed until you like the result.
4. For environments, switch to **From Reference**, drop a photo, and export the map + modular tilesheet.
5. Export PNG or full tilesheet / animation strip.
