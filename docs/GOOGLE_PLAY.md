# Google Play publication - Infinite Five

## Status (2026-10-16)

This is a **pre-publication checklist**, not proof of an accepted Google Play release.

- Source application ID: `com.sl.infinitefive`. Keep this identity unchanged.
- Android configuration: `minSdk 26`, `compileSdk 36`, `targetSdk 36`, ARM64 + ARMv7, 16 KB page-size release checks.
- Controlled release workflow signs the Android App Bundle (AAB) with the upload-key alias. The APK is a **supplemental direct-install artifact**, not the Play upload.
- The developer confirmed Play Console account, device and phone verification is complete. **App listing creation, Play App Signing enrollment, store testing and release approval are separate tasks.**
- Infinite Five **0.6.3 is publicly available in RuStore** at https://www.rustore.ru/catalog/app/com.sl.infinitefive (first publication: September 7, 2026). Its successful RuStore release is not proof of a Google Play signing enrollment.
- Current source version: `0.6.4`, with Tauri-derived Android `versionCode` `6004`. The latest published GitHub Release remains `v0.6.3`; `v0.6.4` is only an empty draft. Do not upload a draft, CI verification artifact or unsigned AAB to Play.
- Open release-recovery PR #93 and issue #48 need proper resolution; do not silently bypass the immutable-release gate.
- The dependency and Semgrep baseline fixes were merged in PR #100. Exact-main CI, Security, CodeQL, Native and Pages passed on `5d7c7990298bcee8d79f9fcf46126884b5b36011`. Subsequent release source commits must pass their own required checks and signed AAB verification.
- The developer's Play Console verification is **complete**; it must not be treated as an outstanding blocker. App-key enrollment and any mandatory closed testing remain Play Console/device actions. No Play upload has been asserted.

## 1. Package and signing identity

1. In Play Console, create **Game** / a suitable board or strategy category with free distribution and package ID `com.sl.infinitefive`. Do not create a second application ID to solve signing problems.
2. Use **Play App Signing**. The AAB must be signed with the existing upload certificate from `.github/android-signing-identities.json` (`uploadCertificateSha256`). Its current reviewed fingerprint is `f02571c40741e2cb071564f5b63fd3dc38a875d0eda11a8c42269ed635bc2a58`. Confirm the certificate on the **actual signed AAB** before uploading and again in Play Console.
3. **Cross-store signing must be decided before the first Play rollout.** Verify the *distribution APK signing certificate* of the version already installed from RuStore, not merely the certificate of the AAB that was uploaded there. Compare its SHA-256 with `applicationSigningCertificateSha256`. To preserve seamless updates in both directions, provision that **same existing RuStore app-signing private key** in Play App Signing using the console's private PEPK procedure (if eligible). Keep the AAB **upload key** concept separate even if the repository currently uses one certificate for both roles. If Play instead distributes APKs signed with Google's unrelated default key, Android cannot update the RuStore installation in place under the normal signing-identity rules; users would have to reinstall and locally saved data may be lost. The Google default and new hybrid-signing features may differ from the imported-key option. **Never upload/export a signing private key through this repository or chat.**
4. Keep keystores, aliases' passwords, private signing keys and PEPK exports **out of Git, Actions artifacts and public releases**. The existing GitHub workflow can produce the upload-key-signed AAB from release secrets; do not regenerate keys merely for Play.
5. Use monotonically increasing `versionCode`: Tauri derives `major * 1000000 + minor * 1000 + patch` (`0.6.3` = `6003`, `0.6.4` = `6004`). The native artifact verifier also checks it against `package.json`; do not use auto-incremented build-local values or reuse a previously uploaded version code.

Google references:
- https://support.google.com/googleplay/android-developer/answer/9842756
- https://support.google.com/googleplay/android-developer/answer/9859152

## 2. Android release acceptance

Do not submit until these gates have evidence from the exact source being released:

- All required main/PR checks succeed, including `npm audit --audit-level=high`, native Android build, Rust tests, Semgrep, Gitleaks and CodeQL.
- Build and verify the **signed** release AAB with `.github/workflows/native-release.yml`; never upload an unsigned AAB or a debug build. The CI Native workflow also produces **unsigned** verification packages and must not be confused with the signed release.
- Verify the AAB's own manifest (not just the source manifest): package ID, `versionCode`, `minSdk=26`, `targetSdk=36`, permissions, non-debuggable production state; check signed upload certificate and ABI/16 KB constraints. The repository checks parts of this automatically; Play's pre-launch report and device testing remain mandatory acceptance signals.
- Test through Play **internal testing** first on real Android devices, including Android 16; then use the required closed test where applicable. Test game launch without Internet, move placement, win detection, Easy/Medium/Hard/Expert AI, 2-player mode, history, replay/share, Settings, Russian/English switching, Back, portrait/landscape, interrupted/restarted games, accessibility and install/update behavior.
- Review Android Vitals, crashes/ANRs, Play pre-launch report, device compatibility and any SDK/policy warnings. Confirm size and download/install behavior from a **Play-generated APK**, not only the direct APK.

The target SDK requirement for ordinary new Android apps and updates has been API 36 since August 31, 2026:
https://support.google.com/googleplay/android-developer/answer/11926878

## 3. Play Store listing (RU / EN)

Both locales are supported in the product. Add Russian and English listings; check each field in the Console after pasting.

### Russian

**Название:** Infinite Five

**Краткое описание:**

Пять в ряд на бесконечном поле. Играйте вдвоём или против компьютера

**Полное описание:**

Infinite Five - игра «пять в ряд» на бесконечном игровом поле.

Ставьте крестики и нолики, чтобы первыми собрать пять знаков подряд по горизонтали, вертикали или диагонали. Перемещайте и масштабируйте поле: партия не ограничена фиксированной сеткой.

Играйте вдвоём на одном устройстве или против компьютера. Доступны четыре уровня сложности: Easy, Medium, Hard и Expert.

Сохраняйте незавершённую партию, просматривайте статистику и историю игр, делитесь повторами. Интерфейс доступен на русском и английском.

Без рекламы, регистрации и обязательного подключения к Интернету.

### English

**Name:** Infinite Five

**Short description:**

Five in a row on an endless board. Play with a friend or challenge the AI

**Full description:**

Infinite Five is a minimalist five-in-a-row game on an endless board.

Place X and O marks and be the first to connect five in a horizontal, vertical or diagonal line. Pan and zoom freely - the board has no fixed edges.

Play with a friend on the same device or challenge the computer on four difficulty levels: Easy, Medium, Hard and Expert.

Resume an unfinished game, review statistics and recent games, and share replays. The interface is available in Russian and English.

No ads, no account and no mandatory Internet connection.

Before submission, compare every claim with the latest **release** on a real device. Do not promise online multiplayer, achievements or store features that are not shipped.

## 4. Required visual assets

- **Store icon:** `docs/assets/rustore/infinite-five-icon-512.png` is an existing candidate. Verify it is a 512 × 512, 32-bit PNG with alpha, at most 1024 KB, and visually inspect it at Play Store display sizes. It is distinct from Android launcher mipmaps.
- **Feature graphic:** produce a **1024 × 500** JPEG or **24-bit RGB PNG with no alpha** from the approved Infinite Five visual identity. It is **not yet present** in the repository.
- **Screenshots:** supply at least **two** real-device screenshots of the current game, JPEG or 24-bit PNG without alpha; 320-3840 px dimensions, max dimension no more than twice the min. For better game discovery, aim for at least **three** high-resolution 9:16 or 16:9 shots, illustrating gameplay, AI difficulty/modes and accessible controls/history. No mock screens, store badges or fictional gameplay.
- Video preview is optional. If provided, it must show the real game and comply with Play's video rules.

Official asset rules:
https://support.google.com/googleplay/android-developer/answer/9866151

## 5. App content / declarations

Complete the *actual* Play Console questionnaires; do not submit guessed responses:

- **Privacy policy:** https://github.com/StanleyLl0yd/infinite-five/blob/main/PRIVACY.md
- **Data safety (expected from current app behavior):** no developer account, ad/analytics/tracking SDK or developer-operated data collection/sharing. Game save, settings, statistics and history are device-local; sharing a replay is **user-initiated** through Android's system share destination. Reconfirm against the **merged release manifest**, embedded libraries and actual app/network behavior before declaring "no data collected or shared." The Data safety declaration is still required even for apps collecting no data.
- **Ads:** none, assuming no ad SDK is added.
- **App access:** no login or gated features.
- **Content rating / target age groups:** answer the Google Play questionnaire based on actual game content. Avoid selecting "Designed for Families" or child-targeting settings without reviewing the additional Families obligations.
- **Device/permissions:** production manifest currently declares only vibration; check the merged manifest and Play's SDK disclosures.
- **Developer contact and other required account details:** enter and verify these privately in Play Console, not in the repository.
- **Countries and distribution:** choose available countries according to current Play Console rules; free vs paid status may have long-term implications. No IAP, subscription or ads are configured in this baseline.

Data safety guidance:
https://support.google.com/googleplay/android-developer/answer/10787469

## 6. Account, testing and rollout

1. **Completed:** Developer identity, Android device and phone verification in Play Console. No further account-verification instructions needed.
2. Upload the validated signed AAB to **internal testing**; resolve Console warnings and launch/test on devices.
3. New personal developer accounts created after November 13, 2023 must have at least **12 opted-in testers continuously for 14 days** in a **closed test**, then apply for production access. Internal testing alone does not meet this gate.
4. Complete all app-content declarations and store listing assets, review approval statuses and respond to policy/review feedback.
5. When production access is granted, launch a controlled first rollout and inspect Android Vitals and user reports.

Official account/test instructions:
- https://support.google.com/googleplay/android-developer/answer/10841920
- https://support.google.com/googleplay/android-developer/answer/14151465

**Publication gate:** source verified + passing checks + signed AAB + confirmed signing strategy + store assets + declarations + real-device/closed testing + Console approval. A prepared repository by itself is not a published app.
