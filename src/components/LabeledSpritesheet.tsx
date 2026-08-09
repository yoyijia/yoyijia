import type { SheetClipRow } from '../lib/generators/character';
import { PixelPreview } from './PixelPreview';

interface Props {
  rows: SheetClipRow[];
  size: number;
  /** Show key-pose row instead (labels + single frames) */
  keyPoses?: { labels: string[]; frames: import('../types').PixelBuffer[] } | null;
  mode: 'clips' | 'keys';
}

/**
 * Renders a reference-style sheet:
 *   label
 *   [sprite]
 *   64x64
 */
export function LabeledSpritesheet({ rows, size, keyPoses, mode }: Props) {
  const dim = `${size}×${size}`;

  if (mode === 'keys' && keyPoses) {
    return (
      <div className="label-sheet">
        <div className="label-sheet__row">
          {keyPoses.frames.map((frame, i) => (
            <div key={keyPoses.labels[i]} className="label-sheet__cell">
              <span className="label-sheet__name">{keyPoses.labels[i]}</span>
              <div className="label-sheet__frame">
                <PixelPreview buffer={frame} scale={Math.max(1, Math.floor(96 / size))} checker={false} />
              </div>
              <span className="label-sheet__dim">{dim}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="label-sheet">
      {rows.map((row) => (
        <div key={row.id} className="label-sheet__block">
          <div className="label-sheet__clip-label">{row.label}</div>
          <div className="label-sheet__row">
            {row.frames.map((frame, i) => (
              <div key={`${row.id}-${i}`} className="label-sheet__cell">
                <div className="label-sheet__frame">
                  <PixelPreview
                    buffer={frame}
                    scale={Math.max(1, Math.floor(80 / size))}
                    checker={false}
                  />
                </div>
                <span className="label-sheet__dim">{dim}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
