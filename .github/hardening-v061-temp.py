from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if text.count(old) != 1:
        raise SystemExit(f"expected one match in {path}, found {text.count(old)}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_release_line(path: str, prefix: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    pattern = rf"^{re.escape(prefix)}.*$"
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise SystemExit(f"expected one release line in {path}, found {count}")
    file.write_text(updated, encoding="utf-8")


replace_once(
    "README.md",
    "[![Source version](https://img.shields.io/badge/source-0.6.0-16A34A?labelColor=111827)](package.json)",
    "[![Source version](https://img.shields.io/badge/source-0.6.1-16A34A?labelColor=111827)](package.json)",
)
replace_release_line(
    "README.md",
    "Current published release: **v0.6.0**",
    "Current published release: **v0.6.1** · Web + PWA · GitHub Pages + signed native release artifacts. v0.6.1 is the first native release built from the authoritative Rust game core after final trust-boundary and release hardening. Rust validates saved histories, move/coordinate bounds and external AI search limits; Rust dependencies are audited with RustSec; production web/native pipelines keep WASM optimization, source/debug leakage checks, Android R8/resource shrinking and 16 KB page compatibility. Android remains `minSdk 26`, `targetSdk 36`, `compileSdk 36`, NDK r29 and ARM-only (`arm64-v8a` + `armeabi-v7a`). macOS remains an ad-hoc signed universal DMG until Developer ID signing/notarization is available.",
)
replace_once(
    "README.md",
    "The authoritative Rust game core remains separate from Canvas rendering and platform-shell concerns. TypeScript owns UI orchestration, rendering caches, persistence and sharing, while rules, win detection and AI are tested in Rust and reused across supported targets.",
    "The authoritative Rust game core remains separate from Canvas rendering and platform-shell concerns. TypeScript owns UI orchestration, rendering caches, persistence and sharing, while rules, win detection and AI are tested in Rust and reused across supported targets. Core input hardening caps restored games at 2,000 moves and coordinates at ±1,000,000, bounds externally supplied AI time/depth requests without changing production difficulty settings, and rejects impossible post-win histories.",
)
replace_once(
    "README.md",
    "npm run build\n```",
    "npm run build\ncargo audit --file crates/game-core/Cargo.lock\ncargo audit --file src-tauri/Cargo.lock\n```",
)

replace_once(
    "README_RU.md",
    "[![Source version](https://img.shields.io/badge/source-0.6.0-16A34A?labelColor=111827)](package.json)",
    "[![Source version](https://img.shields.io/badge/source-0.6.1-16A34A?labelColor=111827)](package.json)",
)
replace_release_line(
    "README_RU.md",
    "Текущий опубликованный релиз: **v0.6.0**",
    "Текущий опубликованный релиз: **v0.6.1** · Web + PWA · GitHub Pages + подписанные нативные release-файлы. v0.6.1 — первый нативный релиз, собранный из authoritative Rust game core после финального trust-boundary и release hardening. Rust проверяет историю партии, границы количества ходов/координат и внешние параметры AI-поиска; Rust-зависимости проверяются через RustSec; production web/native pipeline сохраняет WASM optimization, проверки утечек source/debug-артефактов, Android R8/resource shrinking и совместимость с 16 KB memory pages. Android остаётся на `minSdk 26`, `targetSdk 36`, `compileSdk 36`, NDK r29 и ARM-only ABI (`arm64-v8a` + `armeabi-v7a`). macOS остаётся universal DMG с ad-hoc подписью до появления Developer ID signing/notarization.",
)
replace_once(
    "README_RU.md",
    "Авторитетный Rust game core отделён от Canvas-отрисовки и платформенной оболочки. TypeScript отвечает за UI, render cache, persistence и sharing, а правила, проверка победы и AI тестируются в Rust и переиспользуются на поддерживаемых платформах.",
    "Авторитетный Rust game core отделён от Canvas-отрисовки и платформенной оболочки. TypeScript отвечает за UI, render cache, persistence и sharing, а правила, проверка победы и AI тестируются в Rust и переиспользуются на поддерживаемых платформах. На границе core восстановленная партия ограничена 2 000 ходами и координатами ±1 000 000; внешние time/depth параметры AI ограничиваются безопасными пределами без изменения production-настроек сложности, а невозможная история с ходами после победы отклоняется.",
)
replace_once(
    "README_RU.md",
    "npm run build\n```",
    "npm run build\ncargo audit --file crates/game-core/Cargo.lock\ncargo audit --file src-tauri/Cargo.lock\n```",
)

replace_once(
    "SECURITY.md",
    "Security reports may cover the web application, PWA behavior, dependency or supply-chain risks, GitHub Actions workflows, and accidental exposure of secrets.",
    "Security reports may cover the web application, PWA behavior, Rust game-core trust boundaries, dependency or supply-chain risks, GitHub Actions workflows, native release packaging, and accidental exposure of secrets. npm dependencies are audited in CI and both Rust lockfiles are checked against RustSec advisories without blanket ignores.",
)

cross = Path("docs/CROSS_PLATFORM.md")
text = cross.read_text(encoding="utf-8")
section = """\n## Release hardening baseline\n\nThe authoritative rules and AI stay in the shared Rust core. External core state is bounded and validated before gameplay/search work, including impossible post-win histories, coordinate/move limits, and bounded AI request parameters. Rust lockfiles are monitored by Dependabot and audited against RustSec advisories.\n\nProduction web builds require optimized/stripped WebAssembly and verify the frontend bundle for source/debug leakage. Android release verification checks package identity, SDK/ABI policy, signing in the signed release workflow, 16 KB native alignment, stripped native libraries, source/WASM leakage and internal game-core symbol leakage. macOS release verification keeps equivalent universal-architecture and leakage checks; Developer ID notarization remains a future signing step rather than a v0.6.1 blocker.\n"""
if "## Release hardening baseline" not in text:
    cross.write_text(text.rstrip() + "\n" + section, encoding="utf-8")
