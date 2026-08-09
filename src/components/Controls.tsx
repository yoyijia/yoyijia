import type { ReactNode } from 'react';
import { PALETTES } from '../lib/palettes';

export function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="control">
      <span className="control__label">{label}</span>
      {children}
    </label>
  );
}

export function SizeSelect({
  value,
  options,
  onChange,
  allowCustom = false,
}: {
  value: number;
  options: number[];
  onChange: (n: number) => void;
  allowCustom?: boolean;
}) {
  const isCustom = !options.includes(value);
  return (
    <div className="size-select">
      <div className="chip-row">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${value === s ? 'chip--active' : ''}`}
            onClick={() => onChange(s)}
          >
            {s}×{s}
          </button>
        ))}
        {allowCustom && (
          <button
            type="button"
            className={`chip ${isCustom ? 'chip--active' : ''}`}
            onClick={() => {
              if (!isCustom) onChange(48);
            }}
          >
            Custom
          </button>
        )}
      </div>
      {allowCustom && isCustom && (
        <input
          type="number"
          min={8}
          max={512}
          step={8}
          value={value}
          onChange={(e) =>
            onChange(Math.max(8, Math.min(512, Number(e.target.value) || 16)))
          }
        />
      )}
    </div>
  );
}

export function PaletteSelect({
  value,
  onChange,
  allowAuto = false,
}: {
  value: string;
  onChange: (id: string) => void;
  allowAuto?: boolean;
}) {
  return (
    <div className="palette-select">
      {allowAuto && (
        <button
          type="button"
          className={`palette-swatch ${value === 'auto' ? 'palette-swatch--active' : ''}`}
          onClick={() => onChange('auto')}
          title="Auto from reference"
        >
          <span className="palette-swatch__ramp palette-swatch__ramp--auto" />
          <span>Auto</span>
        </button>
      )}
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`palette-swatch ${value === p.id ? 'palette-swatch--active' : ''}`}
          onClick={() => onChange(p.id)}
          title={p.name}
        >
          <span className="palette-swatch__ramp">
            {p.colors.map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  );
}

export function SeedControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="seed-control">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onChange(Math.floor(Math.random() * 1_000_000))}
      >
        Reroll
      </button>
    </div>
  );
}

export function ExportButtons({
  onPng,
  onSheet,
  sheetDisabled,
}: {
  onPng: () => void;
  onSheet?: () => void;
  sheetDisabled?: boolean;
}) {
  return (
    <div className="export-row">
      <button type="button" className="btn btn--primary" onClick={onPng}>
        Export PNG
      </button>
      {onSheet && (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onSheet}
          disabled={sheetDisabled}
        >
          Export Tilesheet
        </button>
      )}
    </div>
  );
}
