# AGENTS.md

## Project rules

- Inspect the existing implementation before changing it.
- Preserve the core product: five in a row on an infinite board without progression systems, resources, power-ups, world maps, or unrelated meta mechanics unless explicitly approved.
- Keep the web implementation based on TypeScript, HTML5 Canvas, Vite, and PWA unless a change is explicitly approved.
- Treat the TypeScript/Vite application as the shared game implementation for web and native targets; do not create separate platform-specific game engines.
- Use Tauri 2 as the native application shell for Android, macOS, iOS, and any later desktop targets unless a platform constraint is demonstrated and an alternative is explicitly approved.
- Keep the native Application ID / Bundle ID fixed as `com.sl.infinitefive` unless an identifier migration is explicitly approved. Android namespace, applicationId, Kotlin package declarations, generated package paths, tests, workflows, and documentation must stay aligned with it.
- Keep native integrations minimal and isolated behind platform boundaries. Native Kotlin/Swift/Rust code must not duplicate game rules, AI, replay, history, or localization logic without a compelling platform requirement.
- Native production builds must bundle the frontend locally and must not load GitHub Pages as their primary application UI.
- Keep PWA service workers, install prompts, and web update handling browser-only; native package updates belong to the platform distribution channel.
- Build release APK/AAB/DMG files only from an immutable release tag through the controlled native release workflow; do not publish native release files built from an arbitrary moving branch.
- Keep Android signing material exclusively in GitHub Secrets or another approved release secret store. Restore keystores only on ephemeral runners, verify expected certificate fingerprints before signing, and never commit generated signing property files.
- Keep the Android application-signing key and AAB upload key logically distinct even when both aliases live in one keystore. The APK must use the application-signing key and the AAB must use the upload key unless an explicitly reviewed store requirement says otherwise.
- Treat ad-hoc macOS signing only as an interim direct-testing/distribution mode. Once Developer ID access exists, use Developer ID signing and notarization for normal public macOS distribution.
- Keep game rules and AI logic independent from rendering and browser UI where practical.
- Keep AI candidate locality strictly as a search optimization; never turn it into a restriction on legal human moves.
- Keep expensive Hard/Expert AI work off the UI thread where Web Workers are available, and keep Expert search bounded for mobile use.
- Turn repeatable Hard or Expert mistakes into deterministic AI regression cases before or alongside the fix, and keep resolved cases in the suite unless the game rules change.
- Treat AI self-play as a regression and tuning signal, not as proof that one difficulty is objectively stronger from a small sample.
- Preserve keyboard board operation, visible focus, localized assistive guidance, and reduced-motion behavior when changing Canvas input or rendering.
- Keep the Canvas render path bounded to the visible coordinate window; do not regress to scanning the full move history per frame without measured evidence and an explicit reason.
- Keep local completed-game history bounded and versioned, and do not let history or shared replays overwrite an unrelated saved game.
- Prefer the smallest correct implementation and avoid speculative abstractions.
- Do not introduce a dependency without a concrete need.
- Keep `package-lock.json` and native lockfiles committed where applicable, and use reproducible installs in automated verification and deployment.
- Treat high and critical dependency audit findings as blocking unless there is a documented, reviewed reason to accept the risk.
- Pin every third-party GitHub Action to a full-length commit SHA and keep checkout credentials disabled unless a narrowly scoped write operation explicitly requires them.
- Do not weaken CI, CodeQL, Semgrep, Gitleaks, secret scanning, push protection, dependency monitoring, or branch protection without an explicit and compelling reason.
- Do not add analytics, ads, accounts, backend services, tracking, or unnecessary network access unless explicitly requested.
- Preserve offline/PWA behavior and GitHub Pages compatibility.
- Maintain Russian and English user-facing text. Auto language selection must use Russian when the browser or resolved system locale includes Russian; English is the fallback. Manual language override may be offered but must not break Auto behavior.
- Preserve saved-game compatibility where practical and do not let shared replay links overwrite an unrelated local saved game.
- Add or update tests for game logic, AI behavior, locale handling, sharing formats, local history, bounded rendering, native identity, and regressions where practical.
- Run relevant tests, dependency audit, security checks where applicable, the production web build, and affected native build checks before considering a task complete.
- Never commit passwords, API keys, tokens, private keys, signing material, local environment files, or generated secrets.
- Comments must be minimal, necessary, current, and English-only.
- Do not keep commented-out code or obsolete TODOs.
- Source identifiers must be English.
- Keep `main` buildable and use focused commits and pull requests.
- Keep repository history tidy: close superseded automated pull requests and remove branches after their work is merged or intentionally abandoned; keep only active work branches.
- After every release, review and update all repository text files so they accurately reflect the released state.
- Preserve the established formatting and visual presentation of text files during release updates; add, change, or remove formatting only when there is a compelling or urgent need.

## Mandatory full-audit and deep-refactoring rule

When a task requests a full repository audit, cleanup, optimization, or deep refactor, apply the following rules to the entire repository rather than only recently changed files.

### Goal and invariants

- Minimize necessary complexity, code volume, duplication, and maintenance cost while preserving 100% of current functionality, behavior, UI/UX, public interfaces, data formats, edge-case behavior, and documented capabilities.
- Do not pursue line-count reduction at the expense of clarity. This is not code golf.
- If code can be proven unnecessary, remove it. If it can be simplified, simplify it. If two implementations can be safely unified, unify them. If a change merely makes the code different without making it objectively smaller, clearer, safer, or faster, do not make it.
- When uncertain whether code is truly unused, preserve it until its removal is justified by architecture, framework conventions, configuration, build behavior, tests, and call paths.

### Repository-wide scope

Inspect all relevant repository content before refactoring:

- application source code;
- tests and test utilities;
- configuration;
- build scripts and generated-build integration points;
- CI/CD and release workflows;
- dependencies and devDependencies;
- documentation;
- assets and resources;
- platform-specific/native code;
- directory structure and obsolete files.

Establish the actual architecture and current feature set before deleting or consolidating anything.

### Removal candidates

Actively look for and safely remove:

- dead or unreachable code;
- unused functions, classes, methods, variables, constants, types, interfaces, imports, exports, and files;
- legacy code that no longer participates in the application;
- temporary workarounds that are no longer needed;
- duplicate or near-duplicate implementations;
- unnecessary abstraction layers;
- redundant wrappers and helpers;
- redundant data transformations;
- repeated validation of already validated state;
- defensive checks made unnecessary by types, architecture, or earlier validation;
- repeated checks of the same condition;
- obsolete or unnecessary fallbacks;
- unused dependencies and devDependencies;
- obsolete configuration options;
- unnecessary feature flags;
- commented-out old code;
- obsolete TODO/FIXME items;
- unused assets and resources.

Do not treat a failed textual search as proof that code is unused. Check indirect use through callbacks, events, framework conventions, dynamic loading, reflection-like mechanisms, configuration, build systems, generated code, native integration, and platform-specific entry points.

### Simplification candidates

Look for opportunities to:

- shorten code without reducing readability;
- simplify control flow;
- reduce state and branching;
- merge modules or helpers that no longer justify separate layers;
- replace custom logic with standard language/framework/library capabilities where that is objectively simpler;
- remove unnecessary intermediate objects, DTO/model conversions, copies, loops, passes, and transformations;
- centralize genuinely shared logic only when doing so reduces total code and complexity;
- reduce component coupling;
- remove repeated business logic;
- collapse wrapper-to-wrapper call chains;
- remove redundant try/catch blocks when they add no useful behavior.

### Architecture review

Verify that:

- historical components or layers are still necessary;
- abstractions are justified by current use rather than hypothetical future needs;
- classes or modules cannot be safely deleted or merged;
- the design is not prematurely generalized;
- there is no architecture maintained only for possible future features;
- implementation complexity matches the actual complexity of the product.

Do not perform a large rewrite solely because another architecture looks cleaner.

### Performance review

Optimize only where the benefit is practical, measurable, or obvious. Look for:

- repeated computations;
- repeated queries or reads;
- avoidable allocations;
- unnecessary re-renders, rebuilds, or recomputations;
- repeated parsing or conversion of the same data;
- inefficient data structures for current access patterns;
- operations that can safely be performed once instead of repeatedly.

Do not introduce readability regressions for insignificant micro-optimizations.

### Dependency review

- Determine which dependencies are actually used.
- Remove unused dependencies.
- Remove duplicate libraries serving the same purpose when one is sufficient.
- Replace a dependency with standard or very small local code only when that objectively reduces project complexity and maintenance burden.
- Do not replace a mature, well-maintained library with custom code without a strong reason.

### Functional safety constraints

The refactored application must behave the same as before. Do not:

- remove user-facing features;
- change existing UX;
- change business logic;
- change public APIs or contracts without absolute necessity;
- change stored or shared data formats;
- change edge-case behavior intentionally;
- reduce functionality merely to shrink the codebase;
- add unrelated features;
- add abstractions merely to satisfy generic best practices.

### Required workflow

1. Inspect the full repository and map its architecture and existing features.
2. Build an internal candidate list for removal, consolidation, simplification, and performance improvement.
3. For every removal, verify direct and indirect usage before deleting it.
4. Apply changes in small, coherent logical groups.
5. After each meaningful group, run the relevant available tests, lint, typecheck, builds, and static analysis.
6. If critical behavior lacks sufficient coverage for a safe change, add the smallest regression test that captures current behavior before refactoring it.
7. After the first refactoring pass, perform a second full pass over the already-refactored repository to find remaining dead code, duplication, unnecessary abstraction, redundant checks, unused dependencies, and legacy residue.
8. Finish with the full available project verification: clean build, complete test suite, lint, typecheck, dependency/security checks, and project-specific validation.

### Comments

- Follow the repository comment rules.
- Do not add comments that narrate obvious code.
- Remove stale or useless comments.
- Keep comments only when they explain a non-obvious reason, constraint, or important contract.

### Required final report

For a completed full audit/refactor, report:

1. what was removed;
2. what was merged or consolidated;
3. what was simplified;
4. which dependencies were removed;
5. which possible legacy components were identified;
6. what was intentionally left unchanged and why;
7. which tests, builds, lint, typecheck, audits, and other checks were run;
8. which areas could not be safely optimized without more information or stronger tests;
9. trustworthy before/after statistics when available, including file count, source lines, dependency count, test count, and production/build artifact size.

A full-audit task is not complete if it only produces recommendations. Safe improvements must be implemented directly in the project.
