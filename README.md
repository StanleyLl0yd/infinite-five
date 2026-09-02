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
[![Source version](https://img.shields.io/badge/source-0.6.1-16A34A?labelColor=111827)](package.json)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-E11D48?labelColor=111827)](LICENSE)

[![English](https://img.shields.io/badge/lang-EN-2563EB?labelColor=111827)](README.md)
[![Русский](https://img.shields.io/badge/lang-RU-E11D48?labelColor=111827)](README_RU.md)

A minimalist five-in-a-row game on a practically infinite board — in the browser, on desktop and mobile.

[**▶ Play now**](https://stanleyll0yd.github.io/infinite-five/)

</div>

**Infinite Five** keeps the familiar X-and-O idea but removes the limits of a fixed board. Players place marks on an unbounded grid, and the first player to connect five or more marks wins.

Current published release: **v0.6.1** · Web + PWA · GitHub Pages + signed native release artifacts. v0.6.1 is the first native release built from the authoritative Rust game core after final trust-boundary and release hardening. Rust validates saved histories, move/coordinate bounds and external AI search limits; Rust dependencies are audited with RustSec; production web/native pipelines keep WASM optimization, source/debug leakage checks, Android R8/resource shrinking and 16 KB page compatibility. Android remains `minSdk 26`, `targetSdk 36`, `compileSdk 36`, NDK r29 and ARM-only (`arm64-v8a` + `armeabi-v7a`). macOS remains an ad-hoc signed universal DMG until Developer ID signing/notarization is available.

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
- post-game actions for new game, replay, and sharing, with Back/Escape-aware modal navigation;
- undo in AI games and cumulative local AI wins, losses, and win rate;
- local history of the **20 most recent completed games**, including replay when the compact replay format is available;
- saved unfinished games with an explicit Continue / New game prompt;
- replay controls for completed, shared, and recent-history games;
- compact share links that reconstruct the move sequence without a backend;
- system/light/dark theme selection plus a quick theme toggle;
- automatic Russian/English UI with an optional manual language override;
- optional result sound and distinct move, invalid-cell and result haptics;
- safer touch input with cancellation-safe taps, an adaptive drag threshold and stable drag/pinch handling;
- mobile controls use persistent 44 px touch targets with a dedicated compact toolbar row and short-landscape handling;
- installable PWA with offline readiness and in-app update notification;
- automatic hardened GitHub Pages deployment;
- shared Tauri 2 shell for Android and macOS package validation without forking the game core;
- signed Android AAB-first release packaging from GitHub Secrets with certificate/package verification, `arm64-v8a` + `armeabi-v7a`, and enforced 16 KB native compatibility;
- supplemental signed APK packaging for direct installation and GitHub releases;
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

The same TypeScript/Vite UI is packaged natively with **Tauri 2**, while board rules, win detection and AI live in one shared Rust core. Web builds execute that core as WebAssembly; native builds call the same Rust implementation through a Tauri command. Native packages bundle the frontend locally instead of using the hosted GitHub Pages site as their primary UI. PWA generation is disabled for native builds so browser service-worker updates remain separate from store/package updates.

The stable native Application ID / Bundle ID is **`com.sl.infinitefive`**. Tauri configuration, Android Gradle namespace/applicationId, Kotlin package paths, tests, workflows, and documentation are kept aligned with that identity.

The planned public distribution order is Android through **RuStore** first, macOS direct distribution as another native target, and iOS or additional Android stores when the required distribution access is available. Native release files are attached to the matching GitHub Release with SHA-256 checksums. Android APK/AAB files are signed from GitHub Secrets; the current macOS DMG is ad-hoc signed and is not Developer ID notarized. Native Kotlin/Swift code stays limited to platform integration such as lifecycle, sharing, haptics, signing, and store updates. Game rules, win detection and AI remain shared in the Rust core instead of being duplicated in TypeScript or platform code.

See [`docs/CROSS_PLATFORM.md`](docs/CROSS_PLATFORM.md) for target architecture, build rules, identifiers, and native validation gates.

## 🧱 Technology

| Category | Technology |
| --- | --- |
| Languages | TypeScript 7.0 + Rust |
| Rendering | HTML5 Canvas |
| AI execution | Rust core via WebAssembly Web Worker / Tauri command |
| Build | Vite 8 |
| PWA | vite-plugin-pwa / Workbox |
| Native shell | Tauri 2 / Rust |
| Tests | Vitest 4 |
| Persistence | localStorage-compatible local storage |
| Sharing | URL fragment |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

The authoritative Rust game core remains separate from Canvas rendering and platform-shell concerns. TypeScript owns UI orchestration, rendering caches, persistence and sharing, while rules, win detection and AI are tested in Rust and reused across supported targets. Core input hardening caps restored games at 2,000 moves and coordinates at ±1,000,000, bounds externally supplied AI time/depth requests without changing production difficulty settings, and rejects impossible post-win histories.

## 🗂 Architecture

```text
crates/game-core/
├── src/ai.rs              AI evaluation, tactics and bounded search
├── src/board.rs           authoritative sparse board state
├── src/win.rs             winning-line detection
├── src/types.rs           shared game-core types
└── src/lib.rs             JSON dispatch API for WebAssembly and Tauri

src/
├── game/
│   ├── ai.ts              type-only AI compatibility facade
│   ├── ai-client.ts       asynchronous AI routing
│   ├── ai.worker.ts       WebAssembly AI worker
│   ├── core-client.ts     shared Rust-core bridge
│   ├── core-wasm.ts       browser WebAssembly loader
│   ├── board.ts           render cache and bounded viewport queries
│   ├── history.ts         bounded local completed-game history
│   ├── share.ts           compact game URL encoding
│   └── types.ts           frontend/shared transport types
├── ui/
│   └── canvas-board.ts    Canvas rendering, gestures, keyboard input and win animation
├── i18n.ts                Russian / English interface
├── main.ts                application state, history, settings, replay and game flow
├── native-config.test.ts  native identifier and generated Android path regression
└── styles.css             visual layer, accessibility and responsive layout

src-tauri/
├── src/                    Tauri shell and Rust-core command bridge
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
- npm;
- a current stable Rust toolchain. Production web builds also require Binaryen (`wasm-opt`).

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
cargo audit --file crates/game-core/Cargo.lock
cargo audit --file src-tauri/Cargo.lock
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
- Android AAB/APK and universal macOS DMG package-build verification for native changes;
- CodeQL analysis with `security-extended` queries;
- Semgrep security and secret rules;
- Gitleaks full-history secret scanning.

A separate hardened workflow rebuilds, rechecks, and publishes GitHub Pages after changes land on `main`. Native package checks validate packaging compatibility. Release packaging additionally verifies Android signatures, `com.sl.infinitefive`, SDK levels, release ABIs, ELF 16 KB LOAD alignment, APK 16 KB zip alignment, and AAB `PAGE_ALIGNMENT_16K`; it publishes the signed AAB as the primary Android artifact, a supplemental signed APK, an ad-hoc signed universal macOS DMG, and SHA-256 checksums to the matching GitHub Release.

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

Completed in **v0.5.3**: compact localized About UI with application version, developer, GitHub, privacy-policy and terms links.

Completed in **v0.5.4**: Android 8.0+ baseline (`minSdk 26`), API 36 target/compile baseline, pinned NDK r29, AAB-first signed releases, ARM-only production ABI set, and mandatory 16 KB ELF/APK/AAB compatibility gates.

Completed in **v0.6.0**: mobile/touch UX hardening, cancellation-safe gestures, normalized wheel zoom, smooth recentering, latest-move animation, richer haptics, Back/Escape-aware dialogs, 44 px mobile targets, compact-landscape handling, and dedicated UX regression coverage.

Next priorities:

- complete RuStore AAB signing enrollment, real-device release smoke testing, store media/forms, and submit v0.6.0 for moderation;
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
