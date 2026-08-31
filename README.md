<div align="center">

# ∞5 INFINITE FIVE

### FIVE IN A ROW · INFINITE BOARD

<img src="docs/assets/readme/infinite-five-board.svg" alt="Infinite Five game board" width="100%">

[![CI](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/ci.yml?branch=main&label=CI&labelColor=111827&color=16A34A)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/ci.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2563EB?labelColor=111827&logo=githubpages&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![PWA](https://img.shields.io/badge/PWA-installable-E11D48?labelColor=111827&logo=pwa&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-2563EB?labelColor=111827&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Source version](https://img.shields.io/badge/source-0.2.0-16A34A?labelColor=111827)](package.json)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-E11D48?labelColor=111827)](LICENSE)

[![English](https://img.shields.io/badge/lang-EN-2563EB?labelColor=111827)](README.md)
[![Русский](https://img.shields.io/badge/lang-RU-E11D48?labelColor=111827)](README_RU.md)

A minimalist five-in-a-row game on a practically infinite board — in the browser, on desktop and mobile.

[**▶ Play now**](https://stanleyll0yd.github.io/infinite-five/)

</div>

**Infinite Five** keeps the familiar X-and-O idea but removes the limits of a fixed board. Players place marks on an unbounded grid, and the first player to connect five or more marks wins.

Current source version: **0.2.0** · Web + PWA · GitHub Pages

## 🎯 Rules

1. **X moves first.**
2. Players alternate placing X and O on empty cells.
3. The board has no fixed boundaries.
4. The first player to make **5 or more** consecutive marks wins.
5. A winning line may be horizontal, vertical, or diagonal.
6. After the result, a new game can be started immediately.

> No levels, resources, power-ups, or meta systems — just the board, two marks, and five in a row.

## ✨ Current build

- infinite Canvas board;
- **vs computer** mode;
- Easy, Medium, and Hard AI difficulties;
- local **two-player** play on one device;
- five-or-more win detection;
- latest-move and winning-line highlights;
- post-game dialog offering a new game;
- undo in AI games;
- AI win/loss statistics;
- unfinished-game persistence;
- light and dark themes;
- mouse/touch board dragging;
- mouse-wheel and pinch zoom;
- responsive desktop and mobile UI;
- Russian UI when Russian is present in browser/system locales, English otherwise;
- installable PWA with offline support after loading;
- automatic GitHub Pages deployment.

## 🕹 Controls

| Action | Desktop | Phone / tablet |
| --- | --- | --- |
| Place a mark | Click a cell | Short tap |
| Move the board | Drag | One-finger drag |
| Zoom | Mouse wheel | Two-finger pinch |
| Return to latest move | `Center` | `Center` |
| Undo against AI | `Undo` | `Undo` |
| Start over | `New game` | `New game` |

Viewport movement never changes game coordinates: panning and zooming affect only what you see, not where the actual cells are stored.

## 🌐 Web and PWA

The official hosted version is available at:

**https://stanleyll0yd.github.io/infinite-five/**

The site can be installed as a PWA through a supported browser. After the application assets are cached by the Service Worker, the game can start without an active connection.

There is no account, backend, analytics, advertising, or tracking. The current game, settings, and local AI statistics are stored only in the browser's `localStorage`.

## 🧱 Technology

| Category | Technology |
| --- | --- |
| Language | TypeScript 5.9 |
| Rendering | HTML5 Canvas |
| Build | Vite 7 |
| PWA | vite-plugin-pwa / Workbox |
| Tests | Vitest |
| Persistence | localStorage |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

Game logic is kept separate from Canvas rendering and browser UI so board rules, win detection, and AI can be tested independently and later reused if the project is packaged for Android.

## 🗂 Architecture

```text
src/
├── game/
│   ├── ai.ts              AI and difficulty levels
│   ├── board.ts           infinite-board state
│   ├── types.ts           game types
│   └── win.ts             winning-line detection
├── ui/
│   └── canvas-board.ts    Canvas rendering and input
├── i18n.ts                Russian / English interface
├── main.ts                application state and game flow
└── styles.css             visual layer
```

The full product specification is tracked in [`docs/PRODUCT.md`](docs/PRODUCT.md).

## 🛠 Development

Requirements:

- a Node.js version supported by the current Vite release;
- npm.

```bash
git clone https://github.com/StanleyLl0yd/infinite-five.git
cd infinite-five
npm install
npm run dev
```

Run the main local verification:

```bash
npm test
npm run build
```

The production build performs TypeScript validation before Vite creates the deployable bundle.

## ✅ Quality checks

Pushes and pull requests are verified by GitHub Actions with:

- dependency installation;
- Vitest unit tests;
- TypeScript validation;
- production build.

A separate workflow builds and publishes GitHub Pages after changes land on `main`.

## 🌍 Languages

- **Русский** — when Russian appears in the browser language list or resolved system locale;
- **English** — fallback for every other locale.

The selected language is applied to rules, game modes, difficulty, buttons, status messages, statistics, and the post-game dialog.

## 🗺 Roadmap

The immediate focus is quality of the existing game:

- mobile ergonomics and accessibility;
- performance for long games;
- further AI difficulty tuning;
- additional PWA and offline validation;
- preparation for a complete web release;
- later, optional Android packaging through Capacitor.

Online multiplayer may be added later, but it must not change the core Infinite Five rules.

## 📄 License

Copyright © 2026 **Stanley Lloyd**. All rights reserved.

This repository is publicly visible for source inspection. Public availability **does not grant permission** to copy, modify, adapt, translate, distribute, publish, mirror, create derivative works, incorporate the code into another product, or otherwise reuse repository contents.

Only end-user use of the officially hosted Infinite Five application is permitted. Any other use requires prior written permission from the copyright holder. See [`LICENSE`](LICENSE) for the authoritative terms.

## 👨‍💻 Author

**Stanley Lloyd** · [@StanleyLl0yd](https://github.com/StanleyLl0yd)

---

<div align="center">

**X · O · X · O · FIVE IN A ROW · ∞**

</div>
