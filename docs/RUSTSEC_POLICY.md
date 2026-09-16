# RustSec informational-advisory policy

Infinite Five treats RustSec `informational = "unsound"` findings as blocking CI findings even though `cargo audit` does not fail on them by default.

The Security workflow therefore invokes `cargo audit --deny unsound` for both Rust lockfiles. Any new unsound advisory fails the required RustSec job unless it is explicitly reviewed and narrowly excepted.

## Temporary exception: `RUSTSEC-2024-0429`

GitHub Dependabot alert #10 / `GHSA-wrw7-89jp-8q8g` reports unsound `Iterator` and `DoubleEndedIterator` implementations for `glib::VariantStrIter`.

Affected range: `glib >=0.15.0,<0.20.0`.
First patched release: `glib 0.20.0`.

The application does not depend on `glib` directly. The affected crate is pulled into `src-tauri/Cargo.lock` by Tauri's target-specific Linux GTK3/WebKitGTK stack. The current Tauri/WebKitGTK dependency generation still requires gtk-rs/glib 0.18; forcing glib 0.20 into only part of that graph would mix incompatible gtk-rs generations and is not an acceptable fix.

Current Android and macOS production builds do not execute this Linux GTK3 path, but the dependency remains present in Cargo's cross-target lockfile and must stay visible as tracked technical debt.

For that reason, only `RUSTSEC-2024-0429` is temporarily ignored by the native `cargo audit --deny unsound` invocation. The game-core audit has no exception.

Before applying the ignore, CI runs the native audit without exceptions and requires it to fail while explicitly reporting `RUSTSEC-2024-0429`. This stale-exception guard means an upstream fix that removes the affected graph makes CI fail until the obsolete exception is deleted; the repository cannot silently retain a no-longer-needed advisory ignore.

### Expiry

The exception expires after **2026-12-31**. The Security workflow fails automatically once that date has passed, forcing a fresh review rather than allowing the exception to become permanent silently.

Re-evaluate earlier if:

- a stable compatible Tauri/Wry/WebKitGTK release can resolve `glib >=0.20`;
- Infinite Five begins shipping or supporting a Linux native build;
- the advisory's affected range, impact, or upstream workaround changes.

Tracking issue: #86.

Do not dismiss Dependabot alert #10 as fixed while the affected locked graph remains present. Remove this exception only when the lockfile no longer resolves an affected glib version, or when the affected dependency graph has been removed from the product entirely.
