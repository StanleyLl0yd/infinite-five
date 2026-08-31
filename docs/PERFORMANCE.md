# Infinite Five performance notes

## Goal

Long games should remain responsive as the number of recorded moves grows. Performance work must preserve the unbounded board model and must not introduce artificial restrictions on legal moves.

## Rendering model

The board stores only occupied cells in a sparse map. Canvas rendering asks the board only for occupied cells inside the visible coordinate window through `Board.getMovesInBounds` instead of scanning the entire move history on every frame.

At the minimum supported zoom, the render cost is therefore bounded primarily by the visible grid area rather than by the total length of the game. Panning and wheel/pinch input also coalesce redraw requests through `requestAnimationFrame` so repeated pointer events do not force redundant synchronous paints.

The automated board regression suite includes a position with 5,000 stored moves and verifies that a bounded query returns only cells in the requested viewport.

## Accessibility and animation

Winning-line animation respects `prefers-reduced-motion`. When reduced motion is requested, the final winning state is drawn immediately. This both improves accessibility and avoids unnecessary animation work for users who prefer a static result.

## Profiling workflow

When changing board rendering or camera input:

1. create or load a position with thousands of moves;
2. record a browser Performance trace while panning and zooming;
3. confirm that rendering work scales with the visible coordinate window rather than total move history;
4. check for repeated long tasks or unnecessary redraws during pointer movement;
5. verify desktop mouse input and mobile-style pointer/pinch input;
6. rerun the complete test suite and production build.

Do not put exact wall-clock frame-time thresholds into CI. GitHub-hosted runners and user devices have different performance characteristics, so automated tests should verify bounded work and behavioral regressions rather than fragile timing numbers.

## Regression rules

- Do not replace visible-window rendering with a full `getMoves()` scan in the Canvas render path.
- Keep redraw coalescing for high-frequency camera input unless profiling demonstrates a better approach.
- Keep the board state sparse and independent of the viewport.
- Preserve high-DPI Canvas rendering and practical zoom bounds.
- Profile before adding caches or spatial indexes; introduce extra complexity only when measured long-game behavior justifies it.
