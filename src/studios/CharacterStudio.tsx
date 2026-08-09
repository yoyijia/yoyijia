import { useMemo, useState } from 'react';
import {
  ANIMATIONS,
  generateAnimationAtlas,
  generateCastSpritesheet,
  generateCharacter,
  generateCharacterClipSheet,
  generateCharacterKeyPoseSheet,
  generateWalkGrid,
  PRESET_CLIPS,
  PRESETS,
} from '../lib/generators/character';
import { downloadBuffer, stitchHorizontal } from '../lib/pixelEngine';
import { AnimationPlayer } from '../components/AnimationPlayer';
import { LabeledSpritesheet } from '../components/LabeledSpritesheet';
import { PixelPreview } from '../components/PixelPreview';
import {
  ControlGroup,
  ExportButtons,
  SizeSelect,
} from '../components/Controls';
import type { CharacterAnimName, CharacterPreset } from '../types';

const CHAR_SIZES = [16, 32, 64, 128, 256];

type SheetMode = 'keys' | 'clips' | 'atlas' | 'grid';

export function CharacterStudio() {
  const [size, setSize] = useState(64);
  const [preset, setPreset] = useState<CharacterPreset>('curly');
  const [outline, setOutline] = useState(true);
  const [animation, setAnimation] = useState<CharacterAnimName>('walk-down');
  const [frameCount, setFrameCount] = useState(6);
  const [fps, setFps] = useState(8);
  const [sheetMode, setSheetMode] = useState<SheetMode>('keys');

  const clips = PRESET_CLIPS[preset];

  const { frames } = useMemo(
    () =>
      generateCharacter({
        size,
        seed: 0,
        preset,
        outline,
        animation,
        frameCount,
        fps,
      }),
    [size, preset, outline, animation, frameCount, fps],
  );

  const clipSheet = useMemo(
    () => generateCharacterClipSheet(preset, size, outline),
    [preset, size, outline],
  );

  const atlas = useMemo(
    () => generateAnimationAtlas(preset, size, outline, { blackBackground: false }),
    [preset, size, outline],
  );

  const walkGrid = useMemo(
    () => generateWalkGrid(preset, size, outline),
    [preset, size, outline],
  );

  const keySheet = useMemo(
    () => generateCharacterKeyPoseSheet(preset, size, outline),
    [preset, size, outline],
  );

  function selectPreset(id: CharacterPreset) {
    setPreset(id);
    const first = PRESET_CLIPS[id][0]!;
    setAnimation(first.anim);
    setFrameCount(first.frames);
  }

  function exportSheet() {
    if (sheetMode === 'grid') {
      downloadBuffer(walkGrid, `character-${preset}-4x4-${size}.png`, 1);
    } else if (sheetMode === 'atlas') {
      downloadBuffer(atlas.sheet, `character-${preset}-atlas-${size}.png`, 1);
    } else if (sheetMode === 'keys') {
      downloadBuffer(keySheet.sheet, `character-${preset}-keyposes-${size}.png`, 1);
    } else {
      downloadBuffer(clipSheet.sheet, `character-${preset}-clips-${size}.png`, 1);
    }
  }

  return (
    <div className="studio">
      <aside className="studio__controls">
        <ControlGroup label="Canvas size">
          <SizeSelect
            value={size}
            options={CHAR_SIZES}
            onChange={setSize}
            allowCustom
          />
        </ControlGroup>

        <ControlGroup label="Character">
          <div className="chip-row">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${preset === p.id ? 'chip--active' : ''}`}
                onClick={() => selectPreset(p.id)}
                title={p.blurb}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="control-hint">{PRESETS.find((p) => p.id === preset)?.blurb}</p>
        </ControlGroup>

        <ControlGroup label="Animation">
          <div className="chip-row">
            {clips.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${animation === c.anim ? 'chip--active' : ''}`}
                onClick={() => {
                  setAnimation(c.anim);
                  setFrameCount(c.frames);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="chip-row" style={{ marginTop: '0.4rem' }}>
            {ANIMATIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`chip ${animation === a.id ? 'chip--active' : ''}`}
                onClick={() => {
                  setAnimation(a.id);
                  setFrameCount(a.frames);
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="FPS">
          <input
            type="range"
            min={2}
            max={16}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
          />
          <span className="control__value">{fps}</span>
        </ControlGroup>

        <label className="check">
          <input
            type="checkbox"
            checked={outline}
            onChange={(e) => setOutline(e.target.checked)}
          />
          Pixel outline
        </label>

        <ControlGroup label="Sheet layout">
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${sheetMode === 'keys' ? 'chip--active' : ''}`}
              onClick={() => setSheetMode('keys')}
            >
              Key poses
            </button>
            <button
              type="button"
              className={`chip ${sheetMode === 'clips' ? 'chip--active' : ''}`}
              onClick={() => setSheetMode('clips')}
            >
              Dir strips
            </button>
            <button
              type="button"
              className={`chip ${sheetMode === 'atlas' ? 'chip--active' : ''}`}
              onClick={() => setSheetMode('atlas')}
            >
              6-frame atlas
            </button>
            <button
              type="button"
              className={`chip ${sheetMode === 'grid' ? 'chip--active' : ''}`}
              onClick={() => setSheetMode('grid')}
            >
              4×4 grid
            </button>
          </div>
        </ControlGroup>

        <ExportButtons
          onPng={() =>
            downloadBuffer(frames[0]!, `character-${preset}-${animation}-${size}.png`, 1)
          }
          onSheet={exportSheet}
        />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            downloadBuffer(
              stitchHorizontal(frames),
              `character-${preset}-${animation}-strip-${size}.png`,
              1,
            )
          }
        >
          Export anim strip
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            downloadBuffer(
              generateCastSpritesheet({ size, outline }),
              `cast-spritesheet-${size}.png`,
              1,
            )
          }
        >
          Export full cast sheet
        </button>
      </aside>

      <section className="studio__stage">
        <header className="stage-header">
          <h2>Character</h2>
          <p>
            {size}×{size} · {preset} · {animation} · {frameCount} frames · centered
          </p>
        </header>

        <div className="char-layout">
          <div>
            <h3>Animation preview</h3>
            <AnimationPlayer
              frames={frames}
              fps={fps}
              scale={Math.max(2, Math.floor(256 / size))}
            />
          </div>

          <div className="char-layout__sheet">
            <h3>
              {sheetMode === 'keys' && 'Key poses (64×64 cells)'}
              {sheetMode === 'clips' && 'Directional strips'}
              {sheetMode === 'atlas' && '6-frame animation atlas'}
              {sheetMode === 'grid' && '4×4 walk grid'}
            </h3>
            <p className="control-hint">
              Centered in {size}×{size} cells — matching your reference sheets
            </p>

            {(sheetMode === 'keys' || sheetMode === 'clips' || sheetMode === 'atlas') && (
              <LabeledSpritesheet
                rows={sheetMode === 'atlas' ? atlas.rows : clipSheet.rows}
                size={size}
                mode={sheetMode === 'keys' ? 'keys' : 'clips'}
                keyPoses={keySheet}
              />
            )}

            {sheetMode === 'grid' && (
              <div className="label-sheet">
                <PixelPreview
                  buffer={walkGrid}
                  scale={Math.max(1, Math.min(3, Math.floor(420 / walkGrid.width)))}
                  checker={false}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
