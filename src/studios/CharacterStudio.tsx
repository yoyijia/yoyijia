import { useMemo, useState } from 'react';
import {
  ANIMATIONS,
  ARCHETYPES,
  generateCharacter,
} from '../lib/generators/character';
import { downloadBuffer, stitchHorizontal } from '../lib/pixelEngine';
import { AnimationPlayer } from '../components/AnimationPlayer';
import {
  ControlGroup,
  ExportButtons,
  PaletteSelect,
  SeedControl,
  SizeSelect,
} from '../components/Controls';
import type { CharacterAnimName, CharacterArchetype } from '../types';

const CHAR_SIZES = [16, 32, 64, 128, 256];

export function CharacterStudio() {
  const [size, setSize] = useState(32);
  const [seed, setSeed] = useState(42);
  const [archetype, setArchetype] = useState<CharacterArchetype>('hero');
  const [paletteId, setPaletteId] = useState('sunset');
  const [outline, setOutline] = useState(true);
  const [animation, setAnimation] = useState<CharacterAnimName>('idle');
  const [frameCount, setFrameCount] = useState(4);
  const [fps, setFps] = useState(8);

  const { frames } = useMemo(
    () =>
      generateCharacter({
        size,
        seed,
        archetype,
        paletteId,
        outline,
        animation,
        frameCount,
        fps,
      }),
    [size, seed, archetype, paletteId, outline, animation, frameCount, fps],
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

        <ControlGroup label="Archetype">
          <div className="chip-row">
            {ARCHETYPES.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`chip ${archetype === a.id ? 'chip--active' : ''}`}
                onClick={() => setArchetype(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup label="Animation">
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
            max={12}
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
          />
          <span className="control__value">{frameCount}</span>
        </ControlGroup>

        <ControlGroup label="FPS">
          <input
            type="range"
            min={2}
            max={24}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
          />
          <span className="control__value">{fps}</span>
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
            checked={outline}
            onChange={(e) => setOutline(e.target.checked)}
          />
          Pixel outline
        </label>

        <ExportButtons
          onPng={() =>
            downloadBuffer(frames[0]!, `character-${archetype}-${size}.png`, 1)
          }
          onSheet={() =>
            downloadBuffer(
              stitchHorizontal(frames),
              `character-${archetype}-${animation}-sheet.png`,
              1,
            )
          }
        />
      </aside>

      <section className="studio__stage">
        <header className="stage-header">
          <h2>Character</h2>
          <p>
            {size}×{size} · {archetype} · {animation} · {frameCount} frames
          </p>
        </header>
        <AnimationPlayer frames={frames} fps={fps} scale={Math.max(2, Math.floor(320 / size))} />
      </section>
    </div>
  );
}
