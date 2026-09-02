# Infinite Five product specification

## Product

Infinite Five is a minimal five-in-a-row game played on an unbounded square grid. The product should feel immediate, clean and equally natural on desktop and mobile. TypeScript/Vite provides the shared application and rendering layer, while one authoritative Rust core implements board rules, win detection and AI for both browser and native shells so platform expansion does not create separate game engines.

Current published release: **v0.6.2**.

## Core rules

- Two marks: X and O.
- X moves first.
- Players alternate turns.
- A move places the current mark on any empty cell.
- The board has no fixed boundaries.
- The first player with five or more consecutive marks wins.
- Winning directions are horizontal, vertical and both diagonals.
- A finished game accepts no additional moves.

The core game must not gain progression systems, resources, power-ups, world maps or other meta mechanics.

## Current web build

The current published web build provides:

- infinite Canvas board;
- local two-player play;
- computer opponent with Easy, Medium, Hard and Expert difficulty levels;
- background AI calculation through a Web Worker;
- strengthened Hard fork defense and Expert multi-profile iterative search;
- deterministic AI regression scenarios and short self-play smoke matches;
- X, O or random human side selection against AI;
- clear five-in-a-row win detection;
- last-move indication, animated winning-line highlight and post-game emphasis;
- cancellation-safe touch navigation with scale-aware movement thresholds that reduce accidental moves;
- normalized mouse-wheel zoom across pixel/line/page delta modes and stable pinch zoom;
- keyboard board navigation with arrow keys, Enter/Space placement, Home return and keyboard zoom;
- visible focus state and localized screen-reader guidance for keyboard board interaction;
- reduced-motion handling for winning-line, latest-move and recenter animations;
- smooth return to the latest move on desktop and mobile, with an immediate reduced-motion fallback;
- new game and AI undo;
- automatic unfinished-game persistence with an explicit continue prompt;
- cumulative AI win/loss statistics with win rate;
- bounded local history of the 20 most recent completed games;
- local history replay when a game fits the compact replay format;
- system, light and dark themes;
- automatic or manually selected Russian/English UI;
- optional result sound and distinct move, invalid-cell and result vibration feedback;
- game replay and compact URL sharing without a backend;
- Back/Escape-aware modal navigation for About, Settings, History, Resume and Result dialogs;
- visible-window Canvas rendering that avoids scanning the complete move history on every frame;
- animation-frame redraw coalescing for high-frequency pan and zoom input;
- responsive mobile layout with persistent 44 px controls, a dedicated compact toolbar row and short-landscape handling;
- installable PWA with standard and maskable icons, offline operation and update notification;
- GitHub Pages deployment.

Online multiplayer remains outside the current release and may be added later without changing the core rules.

## Cross-platform direction

The browser/PWA remains a first-class target. Native applications use Tauri 2 around the same compiled frontend and game core rather than separate Kotlin, Swift or desktop implementations.

Release v0.5.0 established the cross-platform Tauri foundation and native build verification. Release v0.5.1 added secret-backed Android signing, verified APK/AAB packaging, an ad-hoc signed universal macOS DMG, checksums, and native asset attachment. Release v0.5.2 added the repository-wide audit/refactor, immutable release-source verification, RuStore-oriented Android permission minimization, synchronized version metadata, privacy/application terms, and the first RuStore publication package. Release v0.5.3 added a compact localized About surface with version/developer/legal links. Release v0.5.4 hardens Android to `minSdk 26`, target/compile API 36, pinned NDK r29, an AAB-first signed release flow, ARM-only production ABIs (`arm64-v8a` + `armeabi-v7a`), and mandatory 16 KB ELF/APK/AAB compatibility verification. Release v0.6.0 hardens mobile/touch interaction, modal Back/Escape behavior, responsive touch targets and motion feedback without changing game, AI, persistence or native release contracts. Release v0.6.1 hardens Rust trust boundaries, external-state validation and release verification. Release v0.6.2 refreshes the application icon across Web/PWA and native targets from one canonical raster source while preserving game, AI, persistence and native identity. Android through RuStore is the active public native distribution target. Google Play and App Store remain planned until developer access is available. macOS direct distribution remains supported, with Developer ID signing/notarization pending Apple signing access. Windows and Linux may be evaluated later without changing the shared game implementation.

Native builds must bundle the frontend locally, remain usable without loading the hosted website, and must not register the PWA service worker. Native-only integrations such as store updates, signing, lifecycle behavior, native sharing or haptics should remain isolated behind small platform boundaries. Cross-platform conventions and validation gates are documented in `docs/CROSS_PLATFORM.md`.

The stable native Application ID / Bundle ID is **`com.sl.infinitefive`**. Tauri configuration, Android Gradle namespace and applicationId, Kotlin package declarations, generated package paths, tests, workflows and documentation must remain aligned with it. Changing this identity requires an explicit migration decision because a different store identifier represents a different application.

Unsigned CI AAB/APK/DMG builds remain packaging-compatibility signals. Release Android packages are signed and certificate-verified from GitHub Secrets, with the AAB treated as the primary store artifact and the APK as supplemental direct-install output. The Android pipeline also verifies the release ABI set and 16 KB native packaging compatibility. The current universal macOS DMG is ad-hoc signed and is not Developer ID notarized.

## AI principles

Easy may make deliberate mistakes. Medium should reliably handle immediate tactical wins and blocks. Hard should evaluate a wider set of tactical candidates, opponent responses and forks. Expert should be materially stronger than Hard while remaining bounded for browser and mobile use.

Expert combines multiple candidate views with different attack/defense weights, promotes moves that recur across those views, adds seeded pseudo-random ordering for near-equal candidates, detects immediate wins, mandatory blocks and double threats for both sides, and applies alpha-beta search to the strongest remaining branches. Root candidates are evaluated with iterative deepening: a deeper iteration becomes authoritative only if every root candidate in that iteration completes inside the time budget. This prevents an expired search from favoring moves that happened to be examined earlier.

Search depth, branch width and time are bounded. AI computation must stay outside the UI thread where Web Workers are available. The worker receives a larger Expert time budget than the synchronous fallback so unsupported Worker environments remain usable without making the UI unresponsive for excessive periods.

AI candidate generation may stay local to existing stones as a search optimization. This must never become a rule restricting where a human player may move.

## AI regression policy

Repeatable Hard or Expert mistakes should become deterministic regression cases. Prefer the shortest move sequence that recreates the decision and use a fixed seed plus a bounded search budget. Resolved cases remain in the test corpus so the same tactical weakness cannot silently return.

The current AI Lab covers immediate wins and blocks, broken fours, offensive and defensive double-threat intersections, deterministic seeded choices, search-state immutability, bounded search diagnostics and short Expert-versus-Hard self-play smoke matches.

Self-play is a tuning and integration signal, not a strength proof. Small samples must not be used to claim that one difficulty is objectively stronger. AI Lab usage and regression-case conventions are documented in `docs/AI_LAB.md`.

## Interaction principles

A short tap places a mark. A drag moves the board. Cancelled pointer gestures must never create a move. Pinch zooms on touch devices and normalized mouse-wheel input zooms on desktop. Camera movement must never alter board coordinates. The interface should preserve as much screen area as possible for the board.

Keyboard users can focus the board, move a cell cursor with arrow keys, place a mark with Enter or Space, return to the latest move with Home and zoom with plus/minus. Keyboard interaction must retain an obvious focus indicator and localized assistive text. Motion that is purely decorative must respect the user's reduced-motion preference.

Important controls must remain reachable on compact screens; labels may collapse to icons instead of disappearing, but touch targets must remain comfortably sized. The player must always be able to identify whose turn it is, the latest move and the winning sequence. Escape and platform/browser Back should close an open application dialog before navigating away. No modal confirmation should interrupt ordinary moves.

A completed game may be replayed step by step or shared as a URL. Opening a shared or local-history replay must not overwrite an unrelated locally saved game.

## Persistence and privacy

The current game, UI settings, local AI statistics and the bounded recent-game history are stored in browser-compatible local storage. Saved formats should be versioned and older supported formats should be migrated when practical. Native packaging must preserve those formats where practical so the shared game layer does not fork by platform.

Recent history stores at most 20 completed games. A compact replay payload is retained when the game fits the existing share codec; exceptionally long completed games may remain in history as result metadata without a replay payload.

Shared games encode only the move coordinates required to reconstruct alternating X/O play into the URL fragment. No account, analytics, tracking, advertising, backend or unnecessary network request is required for the core product.

## Board model

Only occupied cells are stored. Coordinates use signed integer pairs and are independent of the rendered viewport. Rendering requests only occupied cells in the visible coordinate window while the game state remains unbounded for practical play.

A move is represented as:

```ts
interface Move {
  x: number;
  y: number;
  mark: 'X' | 'O';
}
```

Win detection starts from the latest move and scans the four relevant axes. The whole board is never scanned after a move. Canvas rendering must likewise avoid work proportional to total move history when only a small viewport is visible. Performance conventions are documented in `docs/PERFORMANCE.md`.

## Architecture

- TypeScript for shared application orchestration, rendering, persistence and sharing.
- Rust for authoritative board rules, win detection and AI.
- HTML5 Canvas for board rendering and input.
- WebAssembly in a Web Worker for non-blocking browser AI calculation; native builds call the same Rust core through Tauri.
- Vite for development and production builds.
- vite-plugin-pwa for browser installation, updates and offline support.
- Tauri 2 for native application shells and packaging.
- Tauri 2 / Rust for the native shell and native bridge to the same game core; Kotlin/Swift only for native integrations that actually require them.
- Cargo tests for game-core and AI regressions, plus Vitest for frontend state, history, sharing, locale and native-identity regressions.
- localStorage-compatible persistence for current local state and recent-game history.
- URL fragments for backend-free game sharing.
- GitHub Actions for CI, security verification, native package verification and GitHub Pages deployment.

The Rust rules/AI core, local history and sharing formats must remain independent from rendering and browser/native shell concerns where practical so the same implementations serve every target.

## Development order

1. Stable infinite board and local two-player game. Completed.
2. Automated tests for board state and win detection. Completed.
3. AI engine and AI-specific undo/statistics. Completed.
4. Mobile UX, settings, side selection and stronger AI tiers. Completed in v0.3.0.
5. Post-game polish, saved-game continuation, PWA hardening, replay and sharing. Completed in v0.3.0.
6. AI Lab, tactical regression corpus, fork defense and iterative Expert tuning. Completed in v0.3.1.
7. Keyboard accessibility, reduced-motion support and long-game render hardening. Completed in v0.4.0.
8. Bounded local game history, history replay and richer local AI statistics. Completed in v0.4.0.
9. Cross-platform Tauri foundation, stable native identity and build validation for Android/macOS. Completed in v0.5.0.
10. Android release signing and final APK/AAB packaging. Completed in v0.5.1.
11. RuStore release preparation, Android manifest hardening, privacy/terms and publication package. Completed in v0.5.2.
12. Localized About UI with version/developer/legal links. Completed in v0.5.3.
13. Android API 26/36 baseline, pinned NDK r29, AAB-first release packaging, ARM-only production ABIs and 16 KB compatibility gates. Completed in v0.5.4.
14. Mobile/touch UX hardening, safer gesture cancellation, responsive 44 px controls, motion feedback and Back/Escape-aware dialogs. Completed in v0.6.0.
15. Rust trust-boundary hardening, bounded external-state validation and RustSec release verification. Completed in v0.6.1.
16. Canonical raster app-icon refresh and deterministic Web/PWA/native icon generation. Completed in v0.6.2.
17. RuStore console signing enrollment, real-device validation and publication.
18. macOS direct-distribution packaging with Developer ID signing/notarization when available.
19. Google Play and iOS/App Store distribution when the required developer access is available.
20. Optional room-link online multiplayer across supported platforms.
21. Ongoing repository maintenance, dependency review and measured performance/AI follow-up.

## Repository conventions

Keep implementation comments to the minimum necessary. Comments must be current, useful and written in English. Prefer clear names and small modules over explanatory comments. Do not commit generated build output other than required generated platform source/configuration, local environment files or secrets.

Keep dependency lockfiles committed and use reproducible installs in automation. Third-party GitHub Actions must remain pinned to full commit SHAs, and high or critical dependency audit findings must block integration unless a reviewed exception is explicitly documented.

Close superseded automated pull requests and remove stale branches after work is merged or intentionally abandoned. Keep only branches and update pull requests that still represent active work.
