import { useMemo, useState } from 'react';
import {
  generateItemsSheet,
  ITEM_CATEGORIES,
} from '../lib/generators/items';
import { downloadBuffer } from '../lib/pixelEngine';
import { PixelPreview } from '../components/PixelPreview';
import {
  ControlGroup,
  ExportButtons,
  PaletteSelect,
  SeedControl,
  SizeSelect,
} from '../components/Controls';
import type { ItemCategory, PixelSize } from '../types';

const ITEM_SIZES: PixelSize[] = [16, 32, 64, 128];

export function ItemsStudio() {
  const [tileSize, setTileSize] = useState<PixelSize>(32);
  const [seed, setSeed] = useState(99);
  const [category, setCategory] = useState<ItemCategory>('weapons');
  const [paletteId, setPaletteId] = useState('ember');
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(3);

  const { sheet, tiles } = useMemo(
    () =>
      generateItemsSheet({
        tileSize,
        seed,
        category,
        paletteId,
        cols,
        rows,
      }),
    [tileSize, seed, category, paletteId, cols, rows],
  );

  return (
    <div className="studio">
      <aside className="studio__controls">
        <ControlGroup label="Item size">
          <SizeSelect
            value={tileSize}
            options={ITEM_SIZES}
            onChange={(n) => setTileSize(n as PixelSize)}
          />
        </ControlGroup>

        <ControlGroup label="Category">
          <div className="chip-row">
            {ITEM_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${category === c.id ? 'chip--active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="Sheet columns">
          <input
            type="range"
            min={2}
            max={8}
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
          />
          <span className="control__value">{cols}</span>
        </ControlGroup>

        <ControlGroup label="Sheet rows">
          <input
            type="range"
            min={1}
            max={6}
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          />
          <span className="control__value">{rows}</span>
        </ControlGroup>

        <ControlGroup label="Palette">
          <PaletteSelect value={paletteId} onChange={setPaletteId} />
        </ControlGroup>

        <ControlGroup label="Seed">
          <SeedControl value={seed} onChange={setSeed} />
        </ControlGroup>

        <ExportButtons
          onPng={() =>
            downloadBuffer(tiles[0]!, `item-${category}-${tileSize}.png`, 1)
          }
          onSheet={() =>
            downloadBuffer(sheet, `items-${category}-${tileSize}-sheet.png`, 1)
          }
        />
      </aside>

      <section className="studio__stage">
        <header className="stage-header">
          <h2>Items Tilesheet</h2>
          <p>
            {category} · {cols}×{rows} · {tileSize}×{tileSize} tiles
          </p>
        </header>
        <PixelPreview
          buffer={sheet}
          scale={Math.max(1, Math.min(6, Math.floor(480 / sheet.width)))}
        />
      </section>
    </div>
  );
}
