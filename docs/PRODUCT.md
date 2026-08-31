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

## MVP

The first public version should provide:

- infinite Canvas board;
- local two-player play;
- computer opponent with three difficulty levels;
- clear five-in-a-row win detection;
- last-move indication and winning-line highlight;
- drag navigation;
- mouse-wheel and pinch zoom;
- return to the latest move;
- new game;
- undo against the computer;
- automatic unfinished-game persistence;
- basic win/loss statistics for AI games;
- light and dark themes;
- responsive mobile layout;
- installable PWA and offline operation;
- GitHub Pages deployment.

Online multiplayer is outside the first MVP and may be added later without changing the core rules.

## Interaction principles

A short tap places a mark. A drag moves the board. Pinch zooms on touch devices and the mouse wheel zooms on desktop. Camera movement must never alter board coordinates. The interface should preserve as much screen area as possible for the board.

The player must always be able to identify whose turn it is, the latest move and the winning sequence. No modal confirmation should interrupt ordinary moves.

## Board model

Only occupied cells are stored. Coordinates use signed integer pairs and are independent of the rendered viewport. Rendering is limited to the visible area while the game state remains unbounded for practical play.

A move is represented as:

```ts
interface Move {
  x: number;
  y: number;
  mark: 'X' | 'O';
}
```

Win detection starts from the latest move and scans the four relevant axes. The whole board is never scanned after a move.

## Architecture

- TypeScript for application and game logic.
- HTML5 Canvas for board rendering and input.
- Vite for development and production builds.
- vite-plugin-pwa for installation and offline support.
- localStorage for the initial local persistence layer.
- GitHub Actions for GitHub Pages deployment.

Game rules must remain independent from rendering and browser UI so the engine can be tested separately and reused by an Android wrapper later.

## Development order

1. Stable infinite board and local two-player game.
2. Automated tests for board state and win detection.
3. AI engine with three difficulty levels.
4. AI-specific undo, statistics and settings.
5. PWA/offline validation and mobile polish.
6. Accessibility, performance and release hardening.
7. Optional Capacitor Android packaging.

## Repository conventions

Keep implementation comments to the minimum necessary. Comments must be current, useful and written in English. Prefer clear names and small modules over explanatory comments. Do not commit generated build output, local environment files or secrets.
