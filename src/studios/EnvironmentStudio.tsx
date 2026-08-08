import { useEffect, useMemo, useState } from 'react';
import {
  BIOMES,
  ENV_SIZES,
  generateEnvironmentMap,
} from '../lib/generators/environment';
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

export function EnvironmentStudio() {
  const [tileSize, setTileSize] = useState<PixelSize>(32);
  const [seed, setSeed] = useState(128);
  const [biome, setBiome] = useState<Biome>('forest');
  const [paletteId, setPaletteId] = useState('forest');
  const [mapCols, setMapCols] = useState(8);
  const [mapRows, setMapRows] = useState(6);
  const [mode, setMode] = useState<'procedural' | 'reference'>('procedural');
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

  const activeMap = mode === 'reference' && refResult ? refResult.map : procedural.map;
  const activeSheet =
    mode === 'reference' && refResult ? refResult.sheet : procedural.sheet;

  return (
    <div className="studio">
      <aside className="studio__controls">
        <ControlGroup label="Mode">
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${mode === 'procedural' ? 'chip--active' : ''}`}
              onClick={() => setMode('procedural')}
            >
              Procedural
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

        {mode === 'procedural' ? (
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
        ) : (
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

        <ExportButtons
          onPng={() =>
            downloadBuffer(activeMap, `environment-map-${tileSize}.png`, 1)
          }
          onSheet={() =>
            downloadBuffer(activeSheet, `environment-tiles-${tileSize}.png`, 1)
          }
        />
      </aside>

      <section className="studio__stage">
        <header className="stage-header">
          <h2>Environment</h2>
          <p>
            {mode === 'reference'
              ? 'Location from real-world reference'
              : `${biome} biome`}{' '}
            · tiles {tileSize}×{tileSize}
            {busy ? ' · processing…' : ''}
          </p>
        </header>

        {error && <p className="error-banner">{error}</p>}

        <div className="stage-split">
          <div>
            <h3>Location map</h3>
            <PixelPreview
              buffer={activeMap}
              scale={Math.max(1, Math.min(4, Math.floor(480 / activeMap.width)))}
              checker={false}
            />
          </div>
          <div>
            <h3>Modular tilesheet</h3>
            <PixelPreview
              buffer={activeSheet}
              scale={Math.max(1, Math.min(4, Math.floor(280 / activeSheet.width)))}
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
