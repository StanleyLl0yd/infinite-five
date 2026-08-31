# AGENTS.md

## Project rules

- Inspect the existing implementation before changing it.
- Preserve the core product: five in a row on an infinite board without progression systems, resources, power-ups, world maps, or unrelated meta mechanics unless explicitly approved.
- Keep the web implementation based on TypeScript, HTML5 Canvas, Vite, and PWA unless a change is explicitly approved.
- Keep game rules and AI logic independent from rendering and browser UI where practical.
- Keep AI candidate locality strictly as a search optimization; never turn it into a restriction on legal human moves.
- Keep expensive Hard/Expert AI work off the UI thread where Web Workers are available, and keep Expert search bounded for mobile use.
- Turn repeatable Hard or Expert mistakes into deterministic AI regression cases before or alongside the fix, and keep resolved cases in the suite unless the game rules change.
- Treat AI self-play as a regression and tuning signal, not as proof that one difficulty is objectively stronger from a small sample.
- Prefer the smallest correct implementation and avoid speculative abstractions.
- Do not introduce a dependency without a concrete need.
- Keep `package-lock.json` committed and use `npm ci` in automated verification and deployment.
- Treat high and critical dependency audit findings as blocking unless there is a documented, reviewed reason to accept the risk.
- Pin every third-party GitHub Action to a full-length commit SHA and keep checkout credentials disabled unless a narrowly scoped write operation explicitly requires them.
- Do not weaken CI, CodeQL, Semgrep, Gitleaks, secret scanning, push protection, dependency monitoring, or branch protection without an explicit and compelling reason.
- Do not add analytics, ads, accounts, backend services, tracking, or unnecessary network access unless explicitly requested.
- Preserve offline/PWA behavior and GitHub Pages compatibility.
- Maintain Russian and English user-facing text. Auto language selection must use Russian when the browser or resolved system locale includes Russian; English is the fallback. Manual language override may be offered but must not break Auto behavior.
- Preserve saved-game compatibility where practical and do not let shared replay links overwrite an unrelated local saved game.
- Add or update tests for game logic, AI behavior, locale handling, sharing formats, and regressions where practical.
- Run relevant tests, dependency audit, security checks where applicable, and the production build before considering a task complete.
- Never commit passwords, API keys, tokens, private keys, signing material, local environment files, or generated secrets.
- Comments must be minimal, necessary, current, and English-only.
- Do not keep commented-out code or obsolete TODOs.
- Source identifiers must be English.
- Keep `main` buildable and use focused commits and pull requests.
- After every release, review and update all repository text files so they accurately reflect the released state.
- Preserve the established formatting and visual presentation of text files during release updates; add, change, or remove formatting only when there is a compelling or urgent need.
