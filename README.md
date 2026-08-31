<div align="center">

# ∞5 INFINITE FIVE

### FIVE IN A ROW · INFINITE BOARD

<img src="docs/assets/readme/infinite-five-board.svg" alt="Infinite Five game board" width="100%">

[![CI](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/ci.yml?branch=main&label=CI&labelColor=111827&color=16A34A)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/codeql.yml?branch=main&label=CodeQL&labelColor=111827&color=2563EB)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/codeql.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/security.yml?branch=main&label=Security&labelColor=111827&color=E11D48)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/security.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2563EB?labelColor=111827&logo=githubpages&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![PWA](https://img.shields.io/badge/PWA-installable-E11D48?labelColor=111827&logo=pwa&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-2563EB?labelColor=111827&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Source version](https://img.shields.io/badge/source-0.3.0-16A34A?labelColor=111827)](package.json)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-E11D48?labelColor=111827)](LICENSE)

[![English](https://img.shields.io/badge/lang-EN-2563EB?labelColor=111827)](README.md)
[![Русский](https://img.shields.io/badge/lang-RU-E11D48?labelColor=111827)](README_RU.md)

A minimalist five-in-a-row game on a practically infinite board — in the browser, on desktop and mobile.

[**▶ Play now**](https://stanleyll0yd.github.io/infinite-five/)

</div>

**Infinite Five** keeps the familiar X-and-O idea but removes the limits of a fixed board. Players place marks on an unbounded grid, and the first player to connect five or more marks wins.

Current source version: **0.3.0** · Web + PWA · GitHub Pages

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
- **vs computer** mode with Easy, Medium, Hard, and **Expert** AI;
- stronger Medium and Hard tactical play;
- Expert AI combines aggressive, defensive, and spatial candidate views with deeper bounded minimax search;
- AI calculation runs in a Web Worker so deeper search does not block the board UI;
- choice of X, O, or a random side against the computer;
- local **two-player** play on one device;
- five-or-more win detection, latest-move indication, animated winning line, and post-game emphasis;
- post-game actions for new game, replay, and sharing;
- undo in AI games and local AI win/loss statistics;
- saved unfinished games with an explicit Continue / New game prompt;
- replay controls for completed and shared games;
- compact share links that reconstruct the move sequence without a backend;
- system/light/dark theme selection plus a quick theme toggle;
- automatic Russian/English UI with an optional manual language override;
- optional result sound and vibration;
- safer touch dragging with reduced accidental moves;
- mobile controls remain available as compact icon buttons instead of disappearing;
- installable PWA with dedicated 192 px, 512 px, maskable, and Apple touch icons;
- offline readiness and in-app update notification;
- automatic hardened GitHub Pages deployment.

## 🕹 Controls

| Action | Desktop | Phone / tablet |
| --- | --- | --- |
| Place a mark | Click a cell | Short tap |
| Move the board | Drag | One-finger drag |
| Zoom | Mouse wheel | Two-finger pinch |
| Return to latest move | `Center` | `◎` |
| Undo against AI | `Undo` | `↶` |
| Settings | `Settings` | `⚙` |
| Start over | `New game` | `＋` |
| Replay | Previous / Next | `←` / `→` |

Viewport movement never changes game coordinates: panning and zooming affect only what you see, not where the actual cells are stored.

## 🤖 AI levels

| Level | Behaviour |
| --- | --- |
| Easy | Tactical wins plus deliberate mistakes and imperfect blocking |
| Medium | Reliable immediate tactics and stronger heuristic positioning |
| Hard | Wider tactical candidate search, fork detection, and adversarial reply evaluation |
| Expert | Multi-profile candidate consensus, pseudo-randomized tie ordering, double-threat detection, and deeper alpha-beta search |

Expert search is deliberately bounded by time and candidate width. It is meant to be substantially harder without freezing mobile devices or making every turn excessively slow.

## 🌐 Web and PWA

The official hosted version is available at:

**https://stanleyll0yd.github.io/infinite-five/**

The site can be installed as a PWA through a supported browser. The manifest includes standard and maskable PNG icons, while the Service Worker precaches the application shell for offline startup. When a new version is waiting, the UI offers an update action instead of silently keeping an old application shell indefinitely.

There is no account, backend, analytics, advertising, or tracking. The current game, settings, and local AI statistics are stored only in the browser's `localStorage`. Shared games are encoded into the URL fragment and do not require a server.

## 🧱 Technology

| Category | Technology |
| --- | --- |
| Language | TypeScript 5.9 |
| Rendering | HTML5 Canvas |
| AI execution | Web Worker |
| Build | Vite 7 |
| PWA | vite-plugin-pwa / Workbox |
| Tests | Vitest |
| Persistence | localStorage |
| Sharing | URL fragment |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

Game logic remains separate from Canvas rendering and browser UI so board rules, win detection, sharing, and AI can be tested independently and later reused if the project is packaged for Android.

## 🗂 Architecture

```text
src/
├── game/
│   ├── ai.ts              AI evaluation and difficulty levels
│   ├── ai-client.ts       asynchronous AI worker client
│   ├── ai.worker.ts       background AI execution
│   ├── board.ts           infinite-board state
│   ├── share.ts           compact game URL encoding
│   ├── types.ts           game types
│   └── win.ts             winning-line detection
├── ui/
│   └── canvas-board.ts    Canvas rendering, gestures, and win animation
├── i18n.ts                Russian / English interface
├── main.ts                application state, settings, replay, and game flow
└── styles.css             visual layer and responsive layout
```

The full product specification is tracked in [`docs/PRODUCT.md`](docs/PRODUCT.md).

## 🛠 Development

Requirements:

- Node.js 22 or another version supported by the current Vite release;
- npm.

```bash
git clone https://github.com/StanleyLl0yd/infinite-five.git
cd infinite-five
npm ci
npm run dev
```

Run the main local verification:

```bash
npm audit --audit-level=high
npm test
npm run build
```

The committed `package-lock.json` keeps dependency resolution reproducible. The production build performs TypeScript validation before Vite creates the deployable bundle.

## ✅ Quality checks

Pushes and pull requests are verified by GitHub Actions with:

- reproducible dependency installation through `npm ci`;
- blocking npm audit for high and critical findings;
- Vitest unit tests;
- TypeScript validation and production build;
- CodeQL analysis with `security-extended` queries;
- Semgrep security and secret rules;
- Gitleaks full-history secret scanning.

A separate hardened workflow rebuilds, rechecks, and publishes GitHub Pages after changes land on `main`.

## 🔐 Security

Repository security is designed around least privilege and supply-chain protection:

- GitHub Secret Scanning and Push Protection are enabled;
- Dependabot monitors npm packages and GitHub Actions;
- the default `GITHUB_TOKEN` is read-only and workflows request only the permissions they need;
- third-party GitHub Actions are pinned to full commit SHAs;
- Verify, CodeQL, Semgrep, and Gitleaks are required checks for `main`;
- the active `Protect main` ruleset requires pull requests, linear history, resolved review threads, and squash merges while prohibiting force pushes and branch deletion.

Please report vulnerabilities privately and never through a public issue. See [`SECURITY.md`](SECURITY.md).

## 🌍 Languages

- **Auto** — Russian when Russian appears in browser/system locales, English otherwise;
- **Русский** — manual override;
- **English** — manual override.

The selected language is applied to rules, modes, difficulty, settings, buttons, status messages, replay, sharing, and post-game dialogs.

## 🗺 Roadmap

The immediate focus after this gameplay milestone is:

- continued Expert AI tuning against real player positions;
- accessibility and keyboard navigation;
- performance profiling for very long games;
- richer but still minimal local statistics;
- optional room-link online multiplayer without changing the core rules;
- later, optional Android packaging through Capacitor.

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
