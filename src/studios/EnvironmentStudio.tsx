import { useEffect, useMemo, useState } from 'react';
import {
  BIOMES,
  ENV_SIZES,
  generateEnvironmentMap,
} from '../lib/generators/environment';
import {
  generateSupermarketTileset,
  type SupermarketSection,
} from '../lib/generators/supermarket';
import { referenceToPixelMap } from '../lib/imageToPixel';
import { downloadBuffer } from '../lib/pixelEngine';
import { PixelPreview } from '../components/PixelPreview';
import { ReferenceUpload } from '../components/ReferenceUpload';
import {
  ControlGroup,
  ExportButtons,
  PaletteSelect,
  SeedControl,
  SizeSelect,
} from '../components/Controls';
import type { Biome, PixelBuffer, PixelSize } from '../types';

type EnvMode = 'supermarket' | 'procedural' | 'reference';

export function EnvironmentStudio() {
  const [tileSize, setTileSize] = useState<PixelSize>(64);
  const [seed, setSeed] = useState(128);
  const [biome, setBiome] = useState<Biome>('village');
  const [paletteId, setPaletteId] = useState('forest');
  const [mapCols, setMapCols] = useState(8);
  const [mapRows, setMapRows] = useState(6);
  const [mode, setMode] = useState<EnvMode>('supermarket');
  const [section, setSection] = useState<SupermarketSection | 'all'>('props');
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refUrl, setRefUrl] = useState<string | null>(null);
  const [refPalette, setRefPalette] = useState<string>('auto');
  const [colorCount, setColorCount] = useState(12);
  const [dither, setDither] = useState(true);
  const [refResult, setRefResult] = useState<{
    map: PixelBuffer;
    sheet: PixelBuffer;
    tiles: PixelBuffer[];
    palette: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const market = useMemo(
    () => generateSupermarketTileset({ tileSize, seed }),
    [tileSize, seed],
  );

  const procedural = useMemo(
    () =>
      generateEnvironmentMap({
        tileSize,
        seed,
        biome,
        paletteId,
        mapCols,
        mapRows,
        mode: 'procedural',
      }),
    [tileSize, seed, biome, paletteId, mapCols, mapRows],
  );

  useEffect(() => {
    if (!refFile || mode !== 'reference') return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    referenceToPixelMap(refFile, {
      targetWidth: mapCols * tileSize,
      targetHeight: mapRows * tileSize,
      tileSize,
      colorCount,
      dither,
      paletteId: refPalette,
    })
      .then((result) => {
        if (!cancelled) setRefResult(result);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Failed to process reference');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refFile, mode, tileSize, mapCols, mapRows, colorCount, dither, refPalette]);

  function onFile(file: File) {
    if (refUrl) URL.revokeObjectURL(refUrl);
    setRefUrl(URL.createObjectURL(file));
    setRefFile(file);
    setMode('reference');
  }

  const activeSection =
    section === 'all'
      ? null
      : market.sections.find((s) => s.id === section) ?? null;

  const activeMap =
    mode === 'supermarket'
      ? market.map
      : mode === 'reference' && refResult
        ? refResult.map
        : procedural.map;

  const activeSheet =
    mode === 'supermarket'
      ? activeSection
        ? activeSection.sheet
        : market.atlas
      : mode === 'reference' && refResult
        ? refResult.sheet
        : procedural.sheet;

  return (
    <div className="studio">
      <aside className="studio__controls">
        <ControlGroup label="Mode">
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${mode === 'supermarket' ? 'chip--active' : ''}`}
              onClick={() => setMode('supermarket')}
            >
              Supermarket
            </button>
            <button
              type="button"
              className={`chip ${mode === 'procedural' ? 'chip--active' : ''}`}
              onClick={() => setMode('procedural')}
            >
              Biome
            </button>
            <button
              type="button"
              className={`chip ${mode === 'reference' ? 'chip--active' : ''}`}
              onClick={() => setMode('reference')}
            >
              From Reference
            </button>
          </div>
        </ControlGroup>

        <ControlGroup label="Tile size">
          <SizeSelect
            value={tileSize}
            options={ENV_SIZES}
            onChange={(n) => setTileSize(n as PixelSize)}
          />
        </ControlGroup>

        {mode === 'supermarket' && (
          <>
            <ControlGroup label="Sheet section">
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${section === 'all' ? 'chip--active' : ''}`}
                  onClick={() => setSection('all')}
                >
                  Full atlas
                </button>
                {market.sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${section === s.id ? 'chip--active' : ''}`}
                    onClick={() => setSection(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </ControlGroup>
            <ControlGroup label="Seed">
              <SeedControl value={seed} onChange={setSeed} />
            </ControlGroup>
            <p className="control-hint">
              Modular store kit: floors, walls, shelves, checkout, cold cases,
              produce, bakery, goods, signs — assembled into a location preview.
            </p>
          </>
        )}

        {mode === 'procedural' && (
          <>
            <ControlGroup label="Biome">
              <div className="chip-row">
                {BIOMES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`chip ${biome === b.id ? 'chip--active' : ''}`}
                    onClick={() => setBiome(b.id)}
                  >
                    {b.label}
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
          </>
        )}

        {mode === 'reference' && (
          <>
            <ReferenceUpload
              onFile={onFile}
              previewUrl={refUrl}
              hint="Street, park, room, skyline — converted into modular pixel tiles"
            />
            <ControlGroup label="Color source">
              <PaletteSelect
                value={refPalette}
                onChange={setRefPalette}
                allowAuto
              />
            </ControlGroup>
            <ControlGroup label="Auto colors">
              <input
                type="range"
                min={4}
                max={24}
                value={colorCount}
                onChange={(e) => setColorCount(Number(e.target.value))}
                disabled={refPalette !== 'auto'}
              />
              <span className="control__value">{colorCount}</span>
            </ControlGroup>
            <label className="check">
              <input
                type="checkbox"
                checked={dither}
                onChange={(e) => setDither(e.target.checked)}
              />
              Dithering
            </label>
          </>
        )}

        {mode !== 'supermarket' && (
          <>
            <ControlGroup label="Map columns">
              <input
                type="range"
                min={4}
                max={16}
                value={mapCols}
                onChange={(e) => setMapCols(Number(e.target.value))}
              />
              <span className="control__value">{mapCols}</span>
            </ControlGroup>
            <ControlGroup label="Map rows">
              <input
                type="range"
                min={4}
                max={12}
                value={mapRows}
                onChange={(e) => setMapRows(Number(e.target.value))}
              />
              <span className="control__value">{mapRows}</span>
            </ControlGroup>
          </>
        )}

        <ExportButtons
          onPng={() =>
            downloadBuffer(
              activeMap,
              mode === 'supermarket'
                ? `supermarket-map-${tileSize}.png`
                : `environment-map-${tileSize}.png`,
              1,
            )
          }
          onSheet={() =>
            downloadBuffer(
              activeSheet,
              mode === 'supermarket'
                ? `supermarket-${section}-${tileSize}.png`
                : `environment-tiles-${tileSize}.png`,
              1,
            )
          }
        />
      </aside>

      <section className="studio__stage">
        <header className="stage-header">
          <h2>Environment</h2>
          <p>
            {mode === 'supermarket'
              ? 'Supermarket modular tileset'
              : mode === 'reference'
                ? 'Location from real-world reference'
                : `${biome} biome`}{' '}
            · tiles {tileSize}×{tileSize}
            {busy ? ' · processing…' : ''}
          </p>
        </header>

        {error && <p className="error-banner">{error}</p>}

        <div className="stage-split">
          <div>
            <h3>
              {mode === 'supermarket' ? 'Store layout preview' : 'Location map'}
            </h3>
            <PixelPreview
              buffer={activeMap}
              scale={Math.max(1, Math.min(3, Math.floor(520 / activeMap.width)))}
              checker={false}
            />
          </div>
          <div>
            <h3>
              {mode === 'supermarket'
                ? section === 'all'
                  ? 'Full modular atlas'
                  : activeSection?.label
                : 'Modular tilesheet'}
            </h3>
            <PixelPreview
              buffer={activeSheet}
              scale={Math.max(
                1,
                Math.min(3, Math.floor(360 / Math.max(1, activeSheet.width))),
              )}
            />
            {mode === 'reference' && refResult && (
              <div className="extracted-palette">
                {refResult.palette.map((c) => (
                  <i key={c} style={{ background: c }} title={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
