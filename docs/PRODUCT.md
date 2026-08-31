# Infinite Five product specification

## Product

Infinite Five is a minimal five-in-a-row game played on an unbounded square grid. The product should feel immediate, clean and equally natural on desktop and mobile. The web version is the primary implementation and must remain suitable for later packaging as an Android application with Capacitor.

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

The current web build provides:

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

The current game, UI settings, local AI statistics and the bounded recent-game history are stored in browser `localStorage`. Saved formats should be versioned and older supported formats should be migrated when practical.

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

- TypeScript for application and game logic.
- HTML5 Canvas for board rendering and input.
- Web Worker for non-blocking AI calculation.
- Vite for development and production builds.
- vite-plugin-pwa for installation, updates and offline support.
- Vitest for game, history, sharing, locale and AI regression tests.
- localStorage for local persistence and recent-game history.
- URL fragments for backend-free game sharing.
- GitHub Actions for CI, security verification and GitHub Pages deployment.

Game rules, AI evaluation, local history and sharing formats must remain independent from rendering and browser UI where practical so they can be tested separately and reused by an Android wrapper later.

## Development order

1. Stable infinite board and local two-player game. Completed.
2. Automated tests for board state and win detection. Completed.
3. AI engine and AI-specific undo/statistics. Completed.
4. Mobile UX, settings, side selection and stronger AI tiers. Completed in v0.3.0.
5. Post-game polish, saved-game continuation, PWA hardening, replay and sharing. Completed in v0.3.0.
6. AI Lab, tactical regression corpus, fork defense and iterative Expert tuning. Completed in v0.3.1.
7. Keyboard accessibility, reduced-motion support and long-game render hardening. Completed in v0.4.0.
8. Bounded local game history, history replay and richer local AI statistics. Completed in v0.4.0.
9. Release hardening and measured follow-up optimization where profiling identifies a real need.
10. Optional room-link online multiplayer.
11. Optional Capacitor Android packaging.

## Repository conventions

Keep implementation comments to the minimum necessary. Comments must be current, useful and written in English. Prefer clear names and small modules over explanatory comments. Do not commit generated build output, local environment files or secrets.

Keep the npm lockfile committed and use reproducible installs in automation. Third-party GitHub Actions must remain pinned to full commit SHAs, and high or critical dependency audit findings must block integration unless a reviewed exception is explicitly documented.
