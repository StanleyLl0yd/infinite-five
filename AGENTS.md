# AGENTS.md

## Project rules

- Inspect the existing implementation before changing it.
- Preserve the core product: five in a row on an infinite board without progression systems, resources, power-ups, world maps, or unrelated meta mechanics unless explicitly approved.
- Keep the web implementation based on TypeScript, HTML5 Canvas, Vite, and PWA unless a change is explicitly approved.
- Keep game rules and AI logic independent from rendering and browser UI where practical.
- Prefer the smallest correct implementation and avoid speculative abstractions.
- Do not introduce a dependency without a concrete need.
- Keep `package-lock.json` committed and use `npm ci` in automated verification and deployment.
- Treat high and critical dependency audit findings as blocking unless there is a documented, reviewed reason to accept the risk.
- Pin every third-party GitHub Action to a full-length commit SHA and keep checkout credentials disabled unless a narrowly scoped write operation explicitly requires them.
- Do not weaken CI, CodeQL, Semgrep, Gitleaks, secret scanning, push protection, dependency monitoring, or branch protection without an explicit and compelling reason.
- Do not add analytics, ads, accounts, backend services, tracking, or unnecessary network access unless explicitly requested.
- Preserve offline/PWA behavior and GitHub Pages compatibility.
- Maintain Russian and English user-facing text. Russian must be selected when the browser or resolved system locale includes Russian; English is the fallback.
- Add or update tests for game logic, AI behavior, locale handling, and regressions where practical.
- Run relevant tests, dependency audit, security checks where applicable, and the production build before considering a task complete.
- Never commit passwords, API keys, tokens, private keys, signing material, local environment files, or generated secrets.
- Comments must be minimal, necessary, current, and English-only.
- Do not keep commented-out code or obsolete TODOs.
- Source identifiers must be English.
- Keep `main` buildable and use focused commits and pull requests.
- After every release, review and update all repository text files so they accurately reflect the released state.
- Preserve the established formatting and visual presentation of text files during release updates; add, change, or remove formatting only when there is a compelling or urgent need.
