# Infinite Five AI Lab

## Purpose

AI Lab is the regression and tuning layer for the computer opponent. Its goal is not to prove that a difficulty is unbeatable. It exists to make AI behaviour measurable, deterministic where required, and resistant to previously discovered tactical mistakes.

Every position that exposes a repeatable Hard or Expert mistake should become a regression case before the AI is changed. Once fixed, the case remains in the suite so the same weakness does not silently return.

## Current coverage

The automated corpus covers:

- immediate winning moves;
- mandatory immediate blocks;
- broken-four completion;
- offensive double-threat intersections;
- defensive double-threat intersections;
- deterministic Expert choices for the same position and seed when the requested search iteration completes;
- board immutability during search;
- bounded Expert search diagnostics;
- short bounded Expert-vs-Hard and Hard-vs-Expert self-play smoke matches.

The self-play checks verify legal search behaviour and integration stability. They are not used as a standalone strength rating because a small self-play sample can be misleading. Production search is deliberately limited by wall-clock time, so two repeated self-play runs are not required to produce an identical full move sequence if one run completes a deeper iteration before the deadline and another does not.

## Running the lab

Run the complete project test suite:

```bash
npm test
```

Run only the AI Lab scenarios:

```bash
npm run test:ai-lab
```

Production verification still requires the normal dependency audit and build in addition to tests.

## Expert search model

Expert starts with several independent candidate views that intentionally weight attack, defense and wider spatial context differently. Candidate moves that recur across several views receive an intersection bonus. Seeded ordering is used only to separate near-equal alternatives reproducibly; it does not replace tactical evaluation.

Before deep search, Expert checks immediate wins, mandatory blocks and double-threat moves for both sides. Remaining candidates are evaluated with iterative deepening. A depth is accepted only when every root candidate for that iteration has completed within the time budget, so an unfinished deeper pass cannot unfairly favor candidates searched earlier.

The production Web Worker gives Expert a larger time budget than the synchronous fallback. Search remains bounded by candidate width, depth and time so the browser stays responsive.

## Adding a real-game regression

When a shared or replayed game reveals a repeatable AI error:

1. reconstruct the position immediately before the bad AI move as an ordered `Move[]` sequence;
2. identify the AI mark and the expected move or set of acceptable moves;
3. add the smallest deterministic case to the Rust core test suite in `crates/game-core/src/ai.rs` or `crates/game-core/src/lib.rs`;
4. use an explicit seed and a bounded `timeBudgetMs`;
5. confirm that the test fails before the fix and passes after it;
6. keep the case permanently unless the game rules themselves change.

Prefer the shortest position that reproduces the tactical problem. A regression should test the decision that was wrong, not an entire long game unless the full sequence is necessary.

## Diagnostics

The Rust core AI response includes diagnostics for test and profiling use. Expert can report:

- evaluated search nodes;
- deepest fully completed iterative depth;
- root candidate count;
- elapsed search time;
- whether the deadline interrupted a deeper iteration.

These values are intended for relative tuning and regression investigation. Exact timings must not be used as strict CI thresholds because runner and device performance varies.
