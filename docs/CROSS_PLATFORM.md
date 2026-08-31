# Cross-platform foundation

Infinite Five keeps one TypeScript/Vite game implementation and uses Tauri 2 as the native application shell. The browser/PWA build remains a first-class target; native packaging must reuse the same game rules, AI, rendering, replay, history and localization code rather than creating platform-specific game engines.

The current published release is still v0.4.0 for the web. The Tauri integration is the foundation for later native releases and does not by itself mean that Android, macOS or iOS has been publicly released.

## Target model

```text
Shared TypeScript/Vite application
├── Web / PWA -> GitHub Pages
└── Tauri 2
    ├── Android -> RuStore first, Google Play later if available
    ├── macOS -> direct distribution first, store distribution optional later
    └── iOS -> TestFlight / App Store when distribution access is available
```

Windows and Linux can be evaluated later without changing the shared game core.

## Native build rules

- Native builds bundle the compiled frontend locally. Production native applications must not load GitHub Pages as their primary UI.
- The PWA plugin is disabled for Tauri builds. Service-worker installation and browser PWA update handling remain web-only.
- Native-specific APIs belong behind a small platform boundary. Do not fork game rules, AI or persistence formats per platform.
- Keep native plugins and permissions to the minimum required by a concrete feature.
- Never commit signing keys, certificates, passwords or store credentials.
- Preserve the same saved-game and replay formats across targets where practical.

The application identifier is currently `io.github.stanleyll0yd.infinitefive`. It must be intentionally frozen before the first store publication because changing it afterward creates a different application identity.

## Current Tauri setup

Tauri source lives in `src-tauri/`. The native shell uses the same `dist/` produced by Vite. The native Vite build uses a relative base path and disables PWA generation so packaged assets resolve inside the application bundle without a web server.

Useful commands:

```bash
npm ci
npm test
npm run build
npm run tauri:dev
npm run tauri:build
npm run tauri:android:build
```

Android platform files are generated under `src-tauri/gen/android`. Tauri icons are generated from the canonical `public/icon.svg` artwork.

## Android and RuStore

Android is the first planned native distribution target. The production application should be a self-contained APK/AAB with bundled frontend assets and offline gameplay.

Before a RuStore release, add only the native integrations that are actually needed. Expected items are Android lifecycle/back handling, native sharing and haptics, release signing, store-safe versioning and the RuStore update flow. RuStore-specific SDK access should be isolated in an Android/Kotlin Tauri plugin so the shared TypeScript game remains store-neutral.

The signing identity, package identifier and versioning strategy must be finalized before the first public RuStore build. Signing material belongs in the release environment or repository secrets, never in Git.

## macOS

macOS is a supported native target in the architecture even if it is not the first release target. Direct distribution can use a Tauri-generated application bundle/DMG without relying on the Mac App Store.

Unsigned or ad-hoc builds are suitable only for development and early technical testing. A normal public direct-distribution release should later use Apple Developer ID signing and notarization when the required Apple developer access is available.

A universal build should target both Apple Silicon and Intel when practical.

## iOS

iOS should reuse the same Tauri frontend and game core when distribution access becomes available. Platform work should be limited to the iOS shell, lifecycle, safe areas, haptics/sharing, signing and store requirements. Do not start a separate Swift game implementation.

## Sharing and links

Shared replay data must remain portable between platforms. Native builds should share a canonical web URL rather than a `tauri://` or other internal application URL so a recipient without the native application can still open the game in a browser.

Deep links / universal links can be added when online rooms or richer cross-platform sharing make them necessary.

## Validation gates

Before calling a native target supported for release, verify at minimum:

- reproducible dependency installation;
- existing game and AI tests;
- production frontend build;
- native package build for the target;
- offline startup from bundled assets;
- Canvas rendering and Web Worker AI;
- persistence across restart and application upgrade;
- touch/pointer/keyboard behavior appropriate to the platform;
- share/replay behavior;
- only necessary permissions in the final package;
- signing and update behavior for the intended distribution channel.

A successful CI package build is a compatibility signal, not a substitute for testing the application on real hardware.
