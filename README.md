# yoyijia

Personal projects for [Yijia](https://github.com/yoyijia).

## Sprig — intern daily log

A cute daily log for internship work, with a **dashboard**, day log, notes, and a **Fonts** tab for type specimens.

- Source: [`intern-log/`](./intern-log/)
- Free site (GitHub Pages): **https://yoyijia.github.io/yoyijia/**
- Same app also at: https://yoyijia.github.io/yoyijia/log/
- Fonts tab shortcut: https://yoyijia.github.io/yoyijia/?view=fonts (old `/fonts/` URL redirects here)
- Data stays in your browser (`localStorage` + IndexedDB for images) — nothing is uploaded.

### Local preview

```bash
cd intern-log
python3 -m http.server 5173
```

Then open http://localhost:5173

## Lantern — festival calendar

Open [`festivals/index.html`](festivals/index.html) (or serve the `festivals` folder) for a content-planning calendar of global festivals.

- Defaults to **Singapore**, with presets for Southeast Asia, Greater China, East Asia, and global commercial dates.
- Month view plus a 60-day “plan these next” pipeline, with hooks, visuals, and a copyable brief.
- Covers 2025–2027, including moving dates such as Mid-Autumn, Chinese New Year, Hari Raya, and Deepavali.

Lunar and Islamic dates can shift by a day with moon sighting. Singapore public holidays follow MOM gazettes.

## PIXFORGE

Pixel art generator (previous site) now lives at:
https://yoyijia.github.io/yoyijia/pixforge/
