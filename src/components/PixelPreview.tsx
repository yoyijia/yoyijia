import { useEffect, useRef } from 'react';
import type { PixelBuffer } from '../types';
import { drawBufferToCanvas } from '../lib/pixelEngine';

interface Props {
  buffer: PixelBuffer | null;
  scale?: number;
  checker?: boolean;
  className?: string;
  label?: string;
}

export function PixelPreview({
  buffer,
  scale = 4,
  checker = true,
  className = '',
  label,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !buffer) return;
    drawBufferToCanvas(ref.current, buffer, scale, checker);
  }, [buffer, scale, checker]);

  return (
    <div className={`pixel-preview ${className}`}>
      {label && <span className="pixel-preview__label">{label}</span>}
      <canvas ref={ref} />
    </div>
  );
}
