import { useMemo, useState } from 'react';
import {
  generateUi,
  generateUiKit,
  UI_ELEMENTS,
  UI_STATES,
} from '../lib/generators/ui';
import { downloadBuffer, stitchGrid } from '../lib/pixelEngine';
import { PixelPreview } from '../components/PixelPreview';
import {
  ControlGroup,
  ExportButtons,
  PaletteSelect,
  SeedControl,
  SizeSelect,
} from '../components/Controls';
import type { PixelSize, UiElement, UiState } from '../types';

const UI_SIZES: PixelSize[] = [16, 32, 64, 128, 256, 512];

export function UiStudio() {
  const [size, setSize] = useState<PixelSize>(32);
  const [seed, setSeed] = useState(7);
  const [element, setElement] = useState<UiElement>('button');
  const [state, setState] = useState<UiState>('default');
  const [paletteId, setPaletteId] = useState('steel');
  const [kitMode, setKitMode] = useState(false);

  const preview = useMemo(
    () => generateUi({ size, seed, element, paletteId, state }),
    [size, seed, element, paletteId, state],
  );

  const kit = useMemo(
    () => (kitMode ? generateUiKit(size, paletteId, seed) : []),
    [kitMode, size, paletteId, seed],
  );

  const kitSheet = useMemo(
    () => (kit.length ? stitchGrid(kit, UI_STATES.length) : null),
    [kit],
  );

  return (
    <div className="studio">
      <aside className="studio__controls">
        <ControlGroup label="Module size">
          <SizeSelect
            value={size}
            options={UI_SIZES}
            onChange={(n) => setSize(n as PixelSize)}
          />
        </ControlGroup>

        <ControlGroup label="Element">
          <div className="chip-row">
            {UI_ELEMENTS.map((el) => (
              <button
                key={el.id}
                type="button"
                className={`chip ${element === el.id ? 'chip--active' : ''}`}
                onClick={() => setElement(el.id)}
              >
                {el.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="State">
          <div className="chip-row">
            {UI_STATES.map((st) => (
              <button
                key={st.id}
                type="button"
                className={`chip ${state === st.id ? 'chip--active' : ''}`}
                onClick={() => setState(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="Palette">
          <PaletteSelect value={paletteId} onChange={setPaletteId} />
        </ControlGroup>

        <ControlGroup label="Seed">
          <SeedControl value={seed} onChange={setSeed} />
        </ControlGroup>

        <label className="check">
          <input
            type="checkbox"
            checked={kitMode}
            onChange={(e) => setKitMode(e.target.checked)}
          />
          Show full modular UI kit
        </label>

        <ExportButtons
          onPng={() =>
            downloadBuffer(preview, `ui-${element}-${size}.png`, 1)
          }
          onSheet={() => {
            const tiles = generateUiKit(size, paletteId, seed);
            downloadBuffer(
              stitchGrid(tiles, UI_STATES.length),
              `ui-kit-${size}-sheet.png`,
              1,
            );
          }}
        />
      </aside>

      <section className="studio__stage">
        <header className="stage-header">
          <h2>UI Modules</h2>
          <p>Modular HUD pieces at {size}×{size}</p>
        </header>
        {kitMode && kitSheet ? (
          <PixelPreview
            buffer={kitSheet}
            scale={Math.max(1, Math.min(4, Math.floor(640 / kitSheet.width)))}
          />
        ) : (
          <PixelPreview
            buffer={preview}
            scale={Math.max(1, Math.floor(320 / size))}
          />
        )}
      </section>
    </div>
  );
}
