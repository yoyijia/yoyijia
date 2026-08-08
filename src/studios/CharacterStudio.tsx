import { useMemo, useState } from 'react';
import {
  ANIMATIONS,
  generateCastSpritesheet,
  generateCharacter,
  generateCharacterClipSheet,
  generateCharacterKeyPoseSheet,
  PRESET_CLIPS,
  PRESETS,
} from '../lib/generators/character';
import { downloadBuffer, stitchHorizontal } from '../lib/pixelEngine';
import { AnimationPlayer } from '../components/AnimationPlayer';
import { LabeledSpritesheet } from '../components/LabeledSpritesheet';
import {
  ControlGroup,
  ExportButtons,
  SizeSelect,
} from '../components/Controls';
import type { CharacterAnimName, CharacterPreset } from '../types';

const CHAR_SIZES = [16, 32, 64, 128, 256];

export function CharacterStudio() {
  const [size, setSize] = useState(64);
  const [preset, setPreset] = useState<CharacterPreset>('curly');
  const [outline, setOutline] = useState(true);
  const [animation, setAnimation] = useState<CharacterAnimName>('walk-left');
  const [frameCount, setFrameCount] = useState(5);
  const [fps, setFps] = useState(8);
  const [sheetMode, setSheetMode] = useState<'clips' | 'keys'>('clips');

  // Sync default frames when switching preset
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

        <ControlGroup label="Animation clip">
          <div className="chip-row">
            {clips.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${animation === c.anim && frameCount === c.frames ? 'chip--active' : ''}`}
                onClick={() => {
                  setAnimation(c.anim);
                  setFrameCount(c.frames);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="All animations">
          <div className="chip-row">
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
              className={`chip ${sheetMode === 'clips' ? 'chip--active' : ''}`}
              onClick={() => setSheetMode('clips')}
            >
              Anim strips
            </button>
            <button
              type="button"
              className={`chip ${sheetMode === 'keys' ? 'chip--active' : ''}`}
              onClick={() => setSheetMode('keys')}
            >
              Key poses
            </button>
          </div>
        </ControlGroup>

        <ExportButtons
          onPng={() =>
            downloadBuffer(frames[0]!, `character-${preset}-${animation}-${size}.png`, 1)
          }
          onSheet={() =>
            downloadBuffer(
              clipSheet.sheet,
              `character-${preset}-spritesheet-${size}.png`,
              1,
            )
          }
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
              keySheet.sheet,
              `character-${preset}-keyposes-${size}.png`,
              1,
            )
          }
        >
          Export key poses
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
              {sheetMode === 'clips' ? 'Spritesheet (anim strips)' : 'Key poses'}
            </h3>
            <p className="control-hint">
              Each cell is {size}×{size}, centered — same layout as your reference
            </p>
            <LabeledSpritesheet
              rows={clipSheet.rows}
              size={size}
              mode={sheetMode}
              keyPoses={keySheet}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
