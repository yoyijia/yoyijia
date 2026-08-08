import { useState } from 'react';
import type { AssetKind } from './types';
import { CharacterStudio } from './studios/CharacterStudio';
import { UiStudio } from './studios/UiStudio';
import { EnvironmentStudio } from './studios/EnvironmentStudio';
import { ItemsStudio } from './studios/ItemsStudio';
import './App.css';

const TABS: { id: AssetKind; label: string; blurb: string }[] = [
  { id: 'character', label: 'Characters', blurb: 'Sized sprites + animation clips' },
  { id: 'ui', label: 'UI', blurb: 'Modular HUD modules' },
  { id: 'environment', label: 'Environment', blurb: 'Tiles & reference locations' },
  { id: 'items', label: 'Items', blurb: 'Loot tilesheets' },
];

export default function App() {
  const [tab, setTab] = useState<AssetKind>('character');

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />

      <header className="hero">
        <div className="hero__brand">
          <p className="hero__mark">PIXFORGE</p>
          <h1>Pixel art, forged to grid.</h1>
          <p className="hero__lede">
            Build characters, UI, environments, and item sheets — or drop a
            real-world photo and turn it into a modular pixel location.
          </p>
          <div className="hero__cta">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setTab('character')}
            >
              Start with characters
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setTab('environment')}
            >
              Generate from photo
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs" aria-label="Asset studios">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tabs__btn ${tab === t.id ? 'tabs__btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
            <small>{t.blurb}</small>
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'character' && <CharacterStudio />}
        {tab === 'ui' && <UiStudio />}
        {tab === 'environment' && <EnvironmentStudio />}
        {tab === 'items' && <ItemsStudio />}
      </main>

      <footer className="footer">
        <span>PIXFORGE</span>
        <span>Export PNG · tilesheets · animation strips</span>
      </footer>
    </div>
  );
}
