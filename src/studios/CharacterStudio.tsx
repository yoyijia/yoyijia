import { useMemo, useState } from 'react';
import {
  ANIMATIONS,
  generateCastSpritesheet,
  generateCharacter,
  generateCharacterSpritesheet,
  PRESETS,
} from '../lib/generators/character';
import { downloadBuffer, stitchHorizontal } from '../lib/pixelEngine';
import { AnimationPlayer } from '../components/AnimationPlayer';
import { PixelPreview } from '../components/PixelPreview';
import {
  ControlGroup,
  ExportButtons,
  SizeSelect,
} from '../components/Controls';
import type { CharacterAnimName, CharacterPreset } from '../types';

const CHAR_SIZES = [16, 32, 64, 128, 256];

export function CharacterStudio() {
  const [size, setSize] = useState(32);
  const [preset, setPreset] = useState<CharacterPreset>('curly');
  const [outline, setOutline] = useState(true);
  const [animation, setAnimation] = useState<CharacterAnimName>('walk-down');
  const [frameCount, setFrameCount] = useState(4);
  const [fps, setFps] = useState(8);
  const [showSheet, setShowSheet] = useState(true);

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

  const { sheet } = useMemo(
    () =>
      generateCharacterSpritesheet({
        size,
        seed: 0,
        preset,
        outline,
        fps,
        walkFrames: 4,
      }),
    [size, preset, outline, fps],
  );

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
                onClick={() => setPreset(p.id)}
                title={p.blurb}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="control-hint">
            {PRESETS.find((p) => p.id === preset)?.blurb}
          </p>
        </ControlGroup>

        <ControlGroup label="Animation (centered)">
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

        <ControlGroup label="Frames">
          <input
            type="range"
            min={2}
            max={8}
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
          />
          <span className="control__value">{frameCount}</span>
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

        <label className="check">
          <input
            type="checkbox"
            checked={showSheet}
            onChange={(e) => setShowSheet(e.target.checked)}
          />
          Show full spritesheet
        </label>

        <ExportButtons
          onPng={() =>
            downloadBuffer(frames[0]!, `character-${preset}-${animation}.png`, 1)
          }
          onSheet={() =>
            downloadBuffer(sheet, `character-${preset}-spritesheet.png`, 1)
          }
        />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            downloadBuffer(
              stitchHorizontal(frames),
              `character-${preset}-${animation}-strip.png`,
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
              generateCastSpritesheet({ size, outline, walkFrames: 4 }),
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
            {size}×{size} · {preset} · {animation} · frames centered on baseline
          </p>
        </header>

        <div className="stage-split stage-split--char">
          <div>
            <h3>Animation preview</h3>
            <AnimationPlayer
              frames={frames}
              fps={fps}
              scale={Math.max(2, Math.floor(280 / size))}
            />
          </div>
          {showSheet && (
            <div>
              <h3>Spritesheet</h3>
              <p className="control-hint">
                Rows: left · right · down · up · idle/wave/think
              </p>
              <PixelPreview
                buffer={sheet}
                scale={Math.max(1, Math.min(3, Math.floor(420 / sheet.width)))}
                checker
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
