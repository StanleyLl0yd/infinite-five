<div align="center">

# ∞5 INFINITE FIVE

### FIVE IN A ROW · INFINITE BOARD

<img src="docs/assets/readme/infinite-five-board.svg" alt="Infinite Five game board" width="100%">

[![CI](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/ci.yml?branch=main&label=CI&labelColor=111827&color=16A34A)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/codeql.yml?branch=main&label=CodeQL&labelColor=111827&color=2563EB)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/codeql.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/security.yml?branch=main&label=Security&labelColor=111827&color=E11D48)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/security.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2563EB?labelColor=111827&logo=githubpages&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![PWA](https://img.shields.io/badge/PWA-installable-E11D48?labelColor=111827&logo=pwa&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-2563EB?labelColor=111827&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Source version](https://img.shields.io/badge/source-0.5.2-16A34A?labelColor=111827)](package.json)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-E11D48?labelColor=111827)](LICENSE)

[![English](https://img.shields.io/badge/lang-EN-2563EB?labelColor=111827)](README.md)
[![Русский](https://img.shields.io/badge/lang-RU-E11D48?labelColor=111827)](README_RU.md)

A minimalist five-in-a-row game on a practically infinite board — in the browser, on desktop and mobile.

[**▶ Play now**](https://stanleyll0yd.github.io/infinite-five/)

</div>

**Infinite Five** keeps the familiar X-and-O idea but removes the limits of a fixed board. Players place marks on an unbounded grid, and the first player to connect five or more marks wins.

Current published release: **v0.5.2** · Web + PWA · GitHub Pages + signed native release artifacts. v0.5.2 includes the repository-wide audit and refactor, hardened immutable-source release verification, a RuStore-ready Android production manifest, store/privacy documentation, signed APK/AAB packaging, and an ad-hoc signed universal macOS DMG. Android publication through RuStore is the active distribution step. Google Play and App Store remain planned until the required developer access is available; macOS Developer ID signing/notarization also remains pending Apple signing access.

## 🎯 Rules

1. **X moves first.**
2. Players alternate placing X and O on empty cells.
3. The board has no fixed boundaries.
4. The first player to make **5 or more** consecutive marks wins.
5. A winning line may be horizontal, vertical, or diagonal.
6. After the result, a new game can be started immediately.

> No levels, resources, power-ups, or meta systems — just the board, two marks, and five in a row.

## ✨ Current build

- infinite Canvas board with visible-window rendering for long-game responsiveness;
- **vs computer** mode with Easy, Medium, Hard, and **Expert** AI;
- stronger Medium and Hard tactical play with explicit fork defense;
- Expert AI combines five attack/defense/spatial candidate views, double-threat detection, and iterative alpha-beta deepening;
- AI calculation runs in a Web Worker so deeper search does not block the board UI;
- deterministic AI regression corpus, search diagnostics, and short Expert-vs-Hard self-play smoke tests;
- choice of X, O, or a random side against the computer;
- local **two-player** play on one device;
- five-or-more win detection, latest-move indication, winning-line animation, and post-game emphasis;
- keyboard-accessible board navigation with arrows, Enter/Space placement, Home return, and keyboard zoom;
- visible keyboard focus, localized assistive guidance, and reduced-motion support;
- post-game actions for new game, replay, and sharing;
- undo in AI games and cumulative local AI wins, losses, and win rate;
- local history of the **20 most recent completed games**, including replay when the compact replay format is available;
- saved unfinished games with an explicit Continue / New game prompt;
- replay controls for completed, shared, and recent-history games;
- compact share links that reconstruct the move sequence without a backend;
- system/light/dark theme selection plus a quick theme toggle;
- automatic Russian/English UI with an optional manual language override;
- optional result sound and vibration;
- safer touch dragging with reduced accidental moves;
- mobile controls remain available as compact icon buttons instead of disappearing;
- installable PWA with offline readiness and in-app update notification;
- automatic hardened GitHub Pages deployment;
- shared Tauri 2 shell for Android and macOS package validation without forking the game core;
- signed Android APK/AAB release packaging from GitHub Secrets with certificate and package-identity verification;
- universal macOS DMG release packaging with ad-hoc signing until Developer ID signing/notarization is available.

## 🕹 Controls

| Action | Desktop / keyboard | Phone / tablet |
| --- | --- | --- |
| Place a mark | Click, `Enter`, or `Space` | Short tap |
| Move the board | Drag or move keyboard cursor with arrows | One-finger drag |
| Zoom | Mouse wheel or `+` / `-` | Two-finger pinch |
| Return to latest move | `Center` or `Home` | `◎` |
| Undo against AI | `Undo` | `↶` |
| History | `History` | `☷` |
| Settings | `Settings` | `⚙` |
| Start over | `New game` | `＋` |
| Replay | Previous / Next | `←` / `→` |

Viewport movement never changes game coordinates: panning and zooming affect only what you see, not where the actual cells are stored.

## 🤖 AI levels

| Level | Behaviour |
| --- | --- |
| Easy | Tactical wins plus deliberate mistakes and imperfect blocking |
| Medium | Reliable immediate tactics and stronger heuristic positioning |
| Hard | Wider tactical candidate search, fork defense, fork creation and adversarial reply evaluation |
| Expert | Five-profile candidate consensus, seeded tie ordering, two-sided double-threat detection and iterative alpha-beta deepening |

Expert search is deliberately bounded by time, depth and candidate width. The production Web Worker gets a larger search budget than the synchronous fallback. A deeper Expert iteration is used only after every root candidate at that depth has been evaluated, which makes time-limited decisions more balanced.

Real positions that expose repeatable Hard or Expert mistakes should become permanent regression cases. See [`docs/AI_LAB.md`](docs/AI_LAB.md) for the tuning and regression workflow.

## ♿ Accessibility and performance

The Canvas board can be focused and operated from the keyboard. Arrow keys move a visible cell cursor, Enter or Space places a mark, Home returns to the latest move, and plus/minus changes zoom. The same guidance is localized for assistive technology, and result animation respects `prefers-reduced-motion`.

Long-game rendering does not scan the complete move history on every frame. The board queries only occupied cells in the visible coordinate window, while pan/zoom redraw requests are coalesced with `requestAnimationFrame`. A regression test exercises bounded queries with 5,000 stored moves. Profiling and regression rules are documented in [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

## 🕘 Local history

The browser-compatible local store keeps a bounded history of the 20 most recent completed games. Each entry records the result, move count, time, and AI difficulty when applicable. AI history feeds a compact win-rate summary. Games that fit the existing compact share codec can be replayed directly from history; exceptionally long games remain as result metadata without an oversized replay payload.

History remains local to the device and opening a history replay does not overwrite an unrelated saved game.

## 🌐 Web and PWA

The official hosted version is available at:

**https://stanleyll0yd.github.io/infinite-five/**

The site can be installed as a PWA through a supported browser. The Service Worker precaches the application shell for offline startup. When a new version is waiting, the UI offers an update action instead of silently keeping an old application shell indefinitely.

There is no account, backend, analytics, advertising, or tracking. The current game, settings, local AI statistics, and recent-game history are stored only in the browser's `localStorage`. Shared games are encoded into the URL fragment and do not require a server.

## 🧩 Cross-platform foundation

The same TypeScript/Vite application is packaged natively with **Tauri 2**. Native packages bundle the frontend locally instead of using the hosted GitHub Pages site as their primary UI. PWA generation is disabled for native builds so browser service-worker updates remain separate from store/package updates.

The stable native Application ID / Bundle ID is **`com.sl.infinitefive`**. Tauri configuration, Android Gradle namespace/applicationId, Kotlin package paths, tests, workflows, and documentation are kept aligned with that identity.

The planned public distribution order is Android through **RuStore** first, macOS direct distribution as another native target, and iOS or additional Android stores when the required distribution access is available. Native release files are attached to the matching GitHub Release with SHA-256 checksums. Android APK/AAB files are signed from GitHub Secrets; the current macOS DMG is ad-hoc signed and is not Developer ID notarized. Native Kotlin/Swift/Rust code stays limited to platform integration such as lifecycle, sharing, haptics, signing, and store updates; game rules and AI remain shared.

See [`docs/CROSS_PLATFORM.md`](docs/CROSS_PLATFORM.md) for target architecture, build rules, identifiers, and native validation gates.

## 🧱 Technology

| Category | Technology |
| --- | --- |
| Language | TypeScript 7.0 |
| Rendering | HTML5 Canvas |
| AI execution | Web Worker |
| Build | Vite 8 |
| PWA | vite-plugin-pwa / Workbox |
| Native shell | Tauri 2 / Rust |
| Tests | Vitest 4 |
| Persistence | localStorage-compatible local storage |
| Sharing | URL fragment |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

Game logic remains separate from Canvas rendering and platform-shell concerns so board rules, win detection, local history, sharing, and AI can be tested once and reused across supported targets.

## 🗂 Architecture

```text
src/
├── game/
│   ├── ai.ts              AI evaluation, tactical checks and bounded search
│   ├── ai-client.ts       asynchronous AI worker client
│   ├── ai.worker.ts       background AI execution
│   ├── ai.test.ts         tactical AI regression corpus
│   ├── ai.lab.test.ts     self-play smoke tests and diagnostics
│   ├── board.ts           sparse infinite-board state and bounded viewport queries
│   ├── history.ts         bounded local completed-game history
│   ├── share.ts           compact game URL encoding
│   ├── types.ts           game types
│   └── win.ts             winning-line detection
├── ui/
│   └── canvas-board.ts    Canvas rendering, gestures, keyboard input and win animation
├── i18n.ts                Russian / English interface
├── main.ts                application state, history, settings, replay and game flow
├── native-config.test.ts  native identifier and generated Android path regression
└── styles.css             visual layer, accessibility and responsive layout

src-tauri/
├── src/                    minimal Tauri native shell
├── capabilities/           native capability policy
├── gen/android/            generated Android project
├── icons/                  native platform icons
├── Cargo.toml / Cargo.lock Rust dependencies
└── tauri.conf.json         cross-platform native configuration
```

The full product specification is tracked in [`docs/PRODUCT.md`](docs/PRODUCT.md). Cross-platform conventions are documented in [`docs/CROSS_PLATFORM.md`](docs/CROSS_PLATFORM.md), AI tuning conventions in [`docs/AI_LAB.md`](docs/AI_LAB.md), and long-game profiling guidance in [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

## 🛠 Development

Web development requirements:

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

Run the dedicated AI Lab scenarios when tuning Hard or Expert:

```bash
npm run test:ai-lab
```

Native development additionally requires the Tauri prerequisites and the toolchain for the target platform. Common Tauri commands are:

```bash
npm run tauri:dev
npm run tauri:build
npm run tauri:android:build
```

The committed npm and Cargo lockfiles keep dependency resolution reproducible. The production web build performs TypeScript validation before Vite creates the deployable bundle.

## ✅ Quality checks

Pushes and pull requests are verified by GitHub Actions with:

- reproducible dependency installation through `npm ci`;
- blocking npm audit for high and critical findings;
- Vitest unit and regression tests for board state, history, sharing, locales, native identity, AI tactics, and AI Lab smoke scenarios;
- a 5,000-move bounded-render query regression;
- TypeScript validation and production build;
- Android APK and universal macOS DMG package-build verification for native changes;
- CodeQL analysis with `security-extended` queries;
- Semgrep security and secret rules;
- Gitleaks full-history secret scanning.

A separate hardened workflow rebuilds, rechecks, and publishes GitHub Pages after changes land on `main`. Native package checks validate packaging compatibility. Release packaging additionally verifies Android signatures and `com.sl.infinitefive`, produces signed APK/AAB files plus an ad-hoc signed universal macOS DMG, generates SHA-256 checksums, and attaches the files to the matching GitHub Release.

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

The selected language is applied to rules, modes, difficulty, settings, buttons, status messages, accessibility guidance, history, replay, sharing, and post-game dialogs.

## 🗺 Roadmap

Completed in **v0.5.0**: shared Tauri 2 native shell, stable `com.sl.infinitefive` application identity, generated Android project, native identity regression coverage, and Android/macOS package-build validation.

Completed in **v0.5.1**: secret-backed Android release signing, verified APK/AAB packaging, universal macOS DMG packaging, release checksums, and automatic native asset attachment to GitHub Releases.

Completed in **v0.5.2**: full repository audit/refactor, release-source hardening, RuStore-oriented Android manifest minimization, synchronized release metadata, publication checklist, privacy policy, application terms, and the first RuStore release candidate.

Next priorities:

- complete RuStore AAB signing enrollment, real-device release smoke testing, store media/forms, and submit v0.5.2 for moderation;
- prepare macOS direct distribution with Developer ID signing/notarization when available;
- add Google Play and iOS/App Store distribution when the required developer access is available;
- continue adding real-player AI regression positions and measured performance follow-up;
- later, optional room-link online multiplayer across supported platforms without changing the core rules.

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
