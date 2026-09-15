# Cross-platform foundation

Infinite Five keeps one TypeScript/Vite application layer and one authoritative Rust game core, with Tauri 2 as the native application shell. The browser/PWA build remains a first-class target: the Rust core is compiled to WebAssembly for web use, while native packages call the same Rust implementation directly through Tauri. Rendering, replay, history and localization remain shared TypeScript code rather than platform-specific implementations.

Release v0.5.0 established the Tauri cross-platform foundation and native build validation. Release v0.5.1 added the signed native release pipeline. Release v0.5.2 hardened release-source verification, minimized the production Android manifest for RuStore, synchronized version metadata, and added the store publication/privacy package. Release v0.5.3 added the localized About surface. Release v0.5.4 moves Android to `minSdk 26`, target/compile API 36 and NDK r29, makes the signed AAB the primary Android release artifact, restricts production packages to `arm64-v8a` + `armeabi-v7a`, and enforces 16 KB native package compatibility. Release v0.6.0 improves mobile/touch interaction and platform Back/Escape handling while preserving the same native identity, Android baseline and release artifact contract. Release v0.6.1 moves authoritative game rules and AI into the shared Rust core. Release v0.6.2 hardens extreme-coordinate validation and raster icon generation, and v0.6.3 fixes Android launcher resource precedence. RuStore submission is the active Android distribution step; Google Play and App Store remain deferred until developer access is available, while macOS Developer ID notarization still requires Apple signing access.

## Target model

```text
Shared TypeScript/Vite UI + Rust game core
├── Web / PWA -> Rust core as WebAssembly -> GitHub Pages
└── Tauri 2 -> Rust core directly
    ├── Android -> RuStore first, Google Play later if available
    ├── macOS -> direct distribution first, store distribution optional later
    └── iOS -> TestFlight / App Store when distribution access is available
```

Windows and Linux can be evaluated later without changing the shared game core.

## Application identity

The stable Application ID / Bundle ID is **`com.sl.infinitefive`**. It is the canonical native identity for Infinite Five and must not be changed without an explicit identifier migration decision.

For Android this means all of the following stay aligned:

- Tauri `identifier`: `com.sl.infinitefive`;
- Gradle `namespace`: `com.sl.infinitefive`;
- Gradle `applicationId`: `com.sl.infinitefive`;
- `MainActivity` package: `com.sl.infinitefive`;
- generated Kotlin build-support package: `com.sl.infinitefive.kotlin`;
- generated source paths under `com/sl/infinitefive/`.

The same canonical identifier should be used as the native bundle identity on future supported platforms unless a platform requirement forces an explicitly reviewed exception. Changing an identifier after a public store publication creates a different application identity and is therefore treated as a breaking distribution change.

## Native build rules

- Native builds bundle the compiled frontend locally. Production native applications must not load GitHub Pages as their primary UI.
- The PWA plugin is disabled for Tauri builds. Service-worker installation and browser PWA update handling remain web-only.
- Native-specific APIs belong behind a small platform boundary. Do not fork game rules, AI or persistence formats per platform.
- Keep native plugins and permissions to the minimum required by a concrete feature.
- Never commit signing keys, certificates, passwords or store credentials.
- Preserve the same saved-game and replay formats across targets where practical.
- Native identity tests and workflows must fail if generated Android namespace, applicationId or package paths drift from `com.sl.infinitefive`.

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

Android platform files are generated under `src-tauri/gen/android`. Tauri icons are generated from the canonical `branding/infinite-five-icon-master.png` raster master.

## Android and RuStore

Android is the first planned native distribution target. The production application should be a self-contained APK/AAB with bundled frontend assets and offline gameplay. Its fixed RuStore application identity is `com.sl.infinitefive`.

For the first RuStore release, keep native integrations limited to what is already required by the game and distribution: lifecycle/back handling, sharing/haptics where used, release signing, store-safe versioning and minimum Android permissions. The RuStore In-App Updates SDK is intentionally deferred until the first RuStore application entry exists and its real update flow can be validated. Any later RuStore-specific SDK integration must stay isolated in the Android/Kotlin native layer so the shared TypeScript UI and Rust game core remain store-neutral.

Release AABs and supplemental APKs are produced only from the tagged release source. The AAB is the primary store artifact and uses the upload-key alias expected by the store workflow; the APK is supplemental direct-install output and uses the application-signing alias. Android production packages contain only `arm64-v8a` and `armeabi-v7a`. The project baseline is `minSdk 26`, `targetSdk 36`, `compileSdk 36`, with NDK `29.0.14206865`. The release workflow verifies certificate SHA-256 fingerprints against the reviewed `.github/android-signing-identities.json` source of truth before building, verifies the resulting signatures against the same committed identities, and rejects artifacts that fail the expected ABI set, 16 KB ELF LOAD alignment, APK 16 KB zip alignment, or AAB `PAGE_ALIGNMENT_16K` checks.

The private Android release secret contract is:

- `ANDROID_KEYSTORE_BASE64` — base64-encoded Java keystore;
- `ANDROID_KEYSTORE_PASSWORD` — keystore password;
- `ANDROID_APP_KEY_ALIAS` — application-signing alias used for the APK;
- `ANDROID_APP_KEY_PASSWORD` — application-signing key password;
- `ANDROID_UPLOAD_KEY_ALIAS` — upload-key alias used for the AAB;
- `ANDROID_UPLOAD_KEY_PASSWORD` — upload-key password.

The canonical public signing identities are committed separately in `.github/android-signing-identities.json`. For the current v0.6.3 signing lineage, both the supplemental APK application-signing certificate and the AAB upload certificate have SHA-256 fingerprint `f02571c40741e2cb071564f5b63fd3dc38a875d0eda11a8c42269ed635bc2a58`. The two roles remain separate config fields even while they resolve to the same certificate. Any future signing-key rotation must update the relevant committed fingerprint through an explicit reviewed migration change; aliases, keystore bytes and passwords remain private.

If the initial keystore contains only one suitable key, the app and upload aliases can temporarily point to the same key, but a separate upload key is preferred for the RuStore AAB lifecycle. RuStore may additionally require the encrypted application-signing key export and upload certificate during first-time AAB signing setup; those store enrollment files are separate from GitHub release artifacts.

`keystore.properties`, keystores and certificate containers are ignored by Git and are generated only on the ephemeral CI runner. Private signing material belongs in GitHub Secrets or the release environment, never in Git. Native Release runs dependency audit and frontend/Rust tests before decoding the JKS; it loads and validates the reviewed public fingerprints first, restores and verifies private signing material only immediately before the signed Android build, and removes the temporary keystore/properties with an `always()` cleanup. The workflow verifies the keystore aliases against the committed certificate fingerprints before signing and validates the resulting APK/AAB signatures against those same fingerprints before publishing.

## macOS

macOS is a supported native target in the architecture even if it is not the first public native release target. Direct distribution can use a Tauri-generated application bundle/DMG without relying on the Mac App Store. The canonical bundle identity is `com.sl.infinitefive`.

Release v0.6.3 produces a universal Apple Silicon + Intel DMG with an ad-hoc signature. It is usable for direct testing and manual distribution, but macOS can still require the user to allow the application in Privacy & Security. It is not equivalent to a Developer ID signed and notarized public release.

GitHub native/release jobs pin `DEVELOPER_DIR` to Xcode 16.4 (`16F6`) and fail closed unless that toolchain reports macOS SDK 15.5. The `macos-15` runner label may continue to receive image updates, but those updates must not silently switch the compiler/SDK used for the verified DMG. Any Xcode or macOS SDK upgrade is a reviewed toolchain change and must pass the universal DMG build and verification gates before adoption.

When the required Apple developer access becomes available, replace ad-hoc signing with a `Developer ID Application` certificate stored in CI secrets and enable notarization. The game code and bundle identifier must remain unchanged during that transition.

## Native release artifacts

`.github/workflows/native-release.yml` is the single controlled release path. It is intentionally push-only: a version-changing push to protected `main` runs preflight for that exact `GITHUB_SHA`, creates the matching GitHub Release as a draft when needed, and makes Android and macOS jobs check out the preflight-recorded source SHA rather than re-resolving the draft tag. The same workflow builds and verifies the native packages, stages the expected files and `SHA256SUMS.txt` on the draft release, and publishes only after the complete verified artifact set is present. Repository Release Immutability must be enabled so publication locks the release tag and attached assets.

For each successful run the controlled pipeline builds and verifies:

```text
Infinite-Five-v<version>-Android.aab
Infinite-Five-v<version>-Android.apk
Infinite-Five-v<version>-macOS-universal.dmg
SHA256SUMS.txt
```

Native Release does not expose `workflow_dispatch`, so an arbitrary branch/tag cannot manually enter the signing or publication path through the default-branch workflow. If a release run fails transiently, use GitHub Actions re-run on that original run; GitHub preserves the original `GITHUB_SHA` and `GITHUB_REF`, and the draft retry may replace only the expected artifact names through the controlled upload path. Any unexpected attachment blocks publication. Before publication, the workflow requires exactly the four expected assets, compares each GitHub-hosted asset SHA-256 digest with the locally verified file, and rechecks tag-to-source identity. After publication it rechecks the tag, requires `isImmutable=true`, preserves the exact four-asset set, and verifies the GitHub release attestation and each local artifact against it.

An already published immutable release is final and causes a later same-version trigger to skip native rebuilding. A draft or orphan tag that resolves to another source commit fails closed rather than being reused.

Existing releases published before repository Release Immutability was enabled are not retroactively made immutable. Do not describe or treat those historical releases as immutable merely because future releases use this flow.

## iOS

iOS should reuse the same Tauri frontend and game core when distribution access becomes available. The canonical bundle identity is `com.sl.infinitefive`. Platform work should be limited to the iOS shell, lifecycle, safe areas, haptics/sharing, signing and store requirements. Do not start a separate Swift game implementation.

## Sharing and links

Shared replay data must remain portable between platforms. Native builds should share a canonical web URL rather than a `tauri://` or other internal application URL so a recipient without the native application can still open the game in a browser.

Deep links / universal links can be added when online rooms or richer cross-platform sharing make them necessary.

## Validation gates

Before calling a native target supported for public release, verify at minimum:

- reproducible dependency installation;
- application identity and generated package-path consistency;
- existing game and AI tests;
- production frontend build;
- native package build for the target;
- offline startup from bundled assets;
- Canvas rendering and the shared Rust game core through the target-specific bridge;
- persistence across restart and application upgrade;
- touch/pointer/keyboard behavior appropriate to the platform;
- share/replay behavior;
- only necessary permissions in the final package;
- signing and update behavior for the intended distribution channel;
- Android release ABI shape and 16 KB ELF/APK/AAB compatibility when Android is targeted.

A successful CI package build is a compatibility signal, not a substitute for testing the application on real hardware.

## Release hardening baseline

The authoritative rules and AI stay in the shared Rust core. External core state is bounded and validated before gameplay/search work, including impossible post-win histories, coordinate/move limits, and bounded AI request parameters. Rust lockfiles are monitored by Dependabot and audited against RustSec advisories.

Production web builds require optimized/stripped WebAssembly and verify the frontend bundle for source/debug leakage. Android release verification checks package identity, SDK/ABI policy, signing in the signed release workflow, 16 KB native alignment, stripped native libraries, source/WASM leakage and internal game-core symbol leakage. macOS release verification keeps equivalent universal-architecture and leakage checks; Developer ID notarization remains a future signing step rather than a v0.6.3 blocker.
