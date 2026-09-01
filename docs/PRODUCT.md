# Infinite Five product specification

## Product

Infinite Five is a minimal five-in-a-row game played on an unbounded square grid. The product should feel immediate, clean and equally natural on desktop and mobile. The TypeScript/Vite implementation is the shared game implementation for the browser and native application shells so platform expansion does not create separate game engines.

Current published release: **v0.5.1**.

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
- drag navigation with touch movement thresholds that reduce accidental moves;
- mouse-wheel and pinch zoom;
- keyboard board navigation with arrow keys, Enter/Space placement, Home return and keyboard zoom;
- visible focus state and localized screen-reader guidance for keyboard board interaction;
- reduced-motion handling for winning-line animation;
- return to the latest move on desktop and mobile;
- new game and AI undo;
- automatic unfinished-game persistence with an explicit continue prompt;
- cumulative AI win/loss statistics with win rate;
- bounded local history of the 20 most recent completed games;
- local history replay when a game fits the compact replay format;
- system, light and dark themes;
- automatic or manually selected Russian/English UI;
- optional result sound and vibration;
- game replay and compact URL sharing without a backend;
- visible-window Canvas rendering that avoids scanning the complete move history on every frame;
- animation-frame redraw coalescing for high-frequency pan and zoom input;
- responsive mobile layout with persistent compact controls;
- installable PWA with standard and maskable icons, offline operation and update notification;
- GitHub Pages deployment.

Online multiplayer remains outside the current release and may be added later without changing the core rules.

## Cross-platform direction

The browser/PWA remains a first-class target. Native applications use Tauri 2 around the same compiled frontend and game core rather than separate Kotlin, Swift or desktop implementations.

Release v0.5.0 established the cross-platform Tauri foundation, generated Android project and native build verification. Release v0.5.1 adds secret-backed Android release signing, verified APK/AAB packaging, an ad-hoc signed universal macOS DMG, SHA-256 checksums, and automatic attachment of native files to the matching GitHub Release. The first planned public native distribution target is Android through RuStore. macOS direct distribution is kept as an architectural target and can precede any Mac App Store publication. iOS and additional Android stores can be added when the required distribution access is available. Windows and Linux may be evaluated later without changing the shared game implementation.

Native builds must bundle the frontend locally, remain usable without loading the hosted website, and must not register the PWA service worker. Native-only integrations such as store updates, signing, lifecycle behavior, native sharing or haptics should remain isolated behind small platform boundaries. Cross-platform conventions and validation gates are documented in `docs/CROSS_PLATFORM.md`.

The stable native Application ID / Bundle ID is **`com.sl.infinitefive`**. Tauri configuration, Android Gradle namespace and applicationId, Kotlin package declarations, generated package paths, tests, workflows and documentation must remain aligned with it. Changing this identity requires an explicit migration decision because a different store identifier represents a different application.

Unsigned CI APK/DMG builds remain packaging-compatibility signals. Release APK/AAB files are signed and certificate-verified from GitHub Secrets; the current universal macOS DMG is ad-hoc signed and is not Developer ID notarized.

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

A short tap places a mark. A drag moves the board. Pinch zooms on touch devices and the mouse wheel zooms on desktop. Camera movement must never alter board coordinates. The interface should preserve as much screen area as possible for the board.

Keyboard users can focus the board, move a cell cursor with arrow keys, place a mark with Enter or Space, return to the latest move with Home and zoom with plus/minus. Keyboard interaction must retain an obvious focus indicator and localized assistive text. Motion that is purely decorative must respect the user's reduced-motion preference.

Important controls must remain reachable on compact screens; labels may collapse to icons instead of disappearing. The player must always be able to identify whose turn it is, the latest move and the winning sequence. No modal confirmation should interrupt ordinary moves.

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

- TypeScript for shared application and game logic.
- HTML5 Canvas for board rendering and input.
- Web Worker for non-blocking AI calculation.
- Vite for development and production builds.
- vite-plugin-pwa for browser installation, updates and offline support.
- Tauri 2 for native application shells and packaging.
- Rust for the minimal shared Tauri shell; Kotlin/Swift only for native integrations that actually require them.
- Vitest for game, history, sharing, locale, native identity and AI regression tests.
- localStorage-compatible persistence for current local state and recent-game history.
- URL fragments for backend-free game sharing.
- GitHub Actions for CI, security verification, native package verification and GitHub Pages deployment.

Game rules, AI evaluation, local history and sharing formats must remain independent from rendering and browser/native shell concerns where practical so the same implementation serves every target.

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
11. RuStore integration, validation and publication.
12. macOS direct-distribution packaging with Developer ID signing/notarization when available.
13. iOS packaging and distribution when the required Apple access is available.
14. Optional room-link online multiplayer across supported platforms.
15. Ongoing repository maintenance, dependency review and measured performance/AI follow-up.

## Repository conventions

Keep implementation comments to the minimum necessary. Comments must be current, useful and written in English. Prefer clear names and small modules over explanatory comments. Do not commit generated build output other than required generated platform source/configuration, local environment files or secrets.

Keep dependency lockfiles committed and use reproducible installs in automation. Third-party GitHub Actions must remain pinned to full commit SHAs, and high or critical dependency audit findings must block integration unless a reviewed exception is explicitly documented.

Close superseded automated pull requests and remove stale branches after work is merged or intentionally abandoned. Keep only branches and update pull requests that still represent active work.
