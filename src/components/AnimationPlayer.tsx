import { useEffect, useState } from 'react';
import type { PixelBuffer } from '../types';
import { PixelPreview } from './PixelPreview';

interface Props {
  frames: PixelBuffer[];
  fps: number;
  scale?: number;
  playing?: boolean;
}

export function AnimationPlayer({
  frames,
  fps,
  scale = 6,
  playing = true,
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [frames]);

  useEffect(() => {
    if (!playing || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, Math.max(16, Math.round(1000 / fps)));
    return () => window.clearInterval(id);
  }, [frames, fps, playing]);

  const current = frames[index] ?? null;

  return (
    <div className="anim-player">
      <PixelPreview buffer={current} scale={scale} />
      <div className="anim-player__strip">
        {frames.map((f, i) => (
          <button
            key={i}
            type="button"
            className={`anim-player__frame ${i === index ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
          >
            <PixelPreview buffer={f} scale={Math.max(1, Math.floor(48 / f.width))} checker />
            <span>F{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
