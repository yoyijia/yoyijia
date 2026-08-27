# yoyijia

Personal projects for [Yijia](https://github.com/yoyijia).

## Sprig — intern daily log

A cute daily log for internship work, with a **dashboard** plus a day log for **things to do**, **things done**, mood, and a soft note.

- Source: [`intern-log/`](./intern-log/)
- Free site (GitHub Pages): **https://yoyijia.github.io/yoyijia/**
- Same app also at: https://yoyijia.github.io/yoyijia/log/
- Data stays in your browser (`localStorage`) — nothing is uploaded.

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

## Specimen — font image library

Save screenshots of fonts, tag them by type (serif, sans, display, script…), and filter your shelf.

- Source: [`fonts/`](./fonts/)
- Preview: serve the `fonts` folder, or after Pages deploy: **https://yoyijia.github.io/yoyijia/fonts/**
- Images stay on this device (IndexedDB); tags/metadata in `localStorage`.

### Local preview

```bash
cd fonts
python3 -m http.server 5174
```

Then open http://localhost:5174

## PIXFORGE

Pixel art generator (previous site) now lives at:
https://yoyijia.github.io/yoyijia/pixforge/
