# RuStore publication

## Status

Infinite Five v0.6.0 is the current RuStore release candidate. The signed GitHub Release is published from source commit `ba84de6d0ba093ebd544223c290c3ed23514be8a`; its primary Android AAB, supplemental APK and universal macOS DMG have passed the controlled release workflow and are attached together with SHA-256 checksums. The Android application uses the stable package identity `com.sl.infinitefive`.

The remaining first-publication work is intentionally a RuStore Console / real-device step because it requires the developer account, store forms, AAB signing enrollment and real release screenshots. Repository automation must not store RuStore credentials or private signing material. Google Play and App Store distribution remain planned but are deferred until the required developer access is available.

Official RuStore references used for the release checklist:

- publication flow and store metadata: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication
- AAB signing enrollment: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication/new-version-app/upload-aab
- application requirements: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/requirement-apps

## Release artifacts

The published v0.6.0 release contains:

```text
Infinite-Five-v0.6.0-Android.aab
Infinite-Five-v0.6.0-Android.apk
Infinite-Five-v0.6.0-macOS-universal.dmg
SHA256SUMS.txt
```

GitHub reports these SHA-256 digests for the native files:

```text
1d692d8ae1b604f70cc58c99b55243ce9099d652db3274b9014ef361a91a95c2  Infinite-Five-v0.6.0-Android.aab
e25a602372a5b8d60209f47a7cf411a64b4f51efa18f6e49d328cabd9bf30361  Infinite-Five-v0.6.0-Android.apk
56f64788a905f8a3c646d9ea7479f11211c1d032825d6d3b170a84e231a1ff6d  Infinite-Five-v0.6.0-macOS-universal.dmg
```

The APK is signed with the application-signing key. The AAB is signed with the upload key. The workflow verifies both certificate fingerprints, verifies `com.sl.infinitefive`, and attaches the native files only to the GitHub Release whose tag resolves to the exact source commit that produced them.

Use the AAB as the primary RuStore submission artifact after completing RuStore AAB signing enrollment. Keep the signed APK as the direct-install and fallback publication artifact.

## Android release compatibility

The v0.6.0 Android release baseline is:

- `minSdk 26` (Android 8.0+);
- `targetSdk 36`;
- `compileSdk 36`;
- NDK `29.0.14206865`;
- production ABIs: `arm64-v8a` and `armeabi-v7a`;
- signed AAB as the primary store artifact;
- signed APK only as supplemental direct-install/GitHub output.

The release pipeline treats 16 KB page-size support as a blocking artifact gate. It verifies every packaged 64-bit native library for ELF LOAD alignment of at least `0x4000`, validates the APK with 16 KB zip alignment, and requires `PAGE_ALIGNMENT_16K` in the AAB. Any future JNI/native dependency that breaks those guarantees must fail CI before publication.

## AAB signing enrollment

RuStore requires application signing to be enrolled before the first AAB upload. For the existing Infinite Five signing setup:

1. Keep the package name exactly `com.sl.infinitefive`.
2. In RuStore Console, start the application-signing upload flow and download `pepk.jar` / copy the PEPK command generated for this application. The command contains a unique encryption key and must be taken from the console rather than hard-coded in the repository.
3. Use the same application-signing key represented in GitHub by `ANDROID_APP_KEY_ALIAS` to produce the encrypted application-signing ZIP (`pepk_out.zip`). RuStore currently requires the application-signing key to be RSA with at least 2048 bits and Java 11 or newer for the documented flow.
4. Export the public certificate for the same upload key represented by `ANDROID_UPLOAD_KEY_ALIAS` in PEM format. Generic form:

```bash
keytool -exportcert -alias <upload-key-alias> -keystore <keystore> -rfc -file upload-cert.pem
```

5. Upload both files in RuStore Console:
   - the PEPK ZIP containing the encrypted application-signing key;
   - `upload-cert.pem` for the key that signs the AAB.
6. Upload `Infinite-Five-v0.6.0-Android.aab`, which the release workflow signs with that upload key.
7. Keep both signing identities stable for every future update.

If RuStore's current PEPK instructions require converting a `.jks` source keystore to `.keystore`, perform that conversion only in a trusted local environment and keep the converted file private.

Never commit or attach to a public GitHub Release:

- a keystore;
- passwords;
- private keys;
- the PEPK application-signing ZIP;
- console-specific encryption material;
- any other file containing private signing material.

The GitHub secret contract is documented in `docs/CROSS_PLATFORM.md`. Enrollment files are separate from normal GitHub Release artifacts.

## Store listing draft

### Name

Infinite Five

RuStore currently limits the application name to 30 characters and requires it to be unique. `Infinite Five` fits that limit.

### Short description

Пять в ряд на бесконечном поле — против компьютера или вдвоём.

RuStore currently limits the short description to 80 characters.

### Detailed description

Infinite Five — минималистичная игра «пять в ряд» на действительно бесконечном поле.

Ставьте X и O на свободные клетки и первым соберите пять или больше знаков подряд по горизонтали, вертикали или диагонали. Поле не ограничивает партию рамками: его можно перемещать и масштабировать в любой момент.

Можно играть против компьютера с четырьмя уровнями сложности — Easy, Medium, Hard и Expert — или вдвоём на одном устройстве.

В игре есть отмена хода против компьютера, сохранение незавершённой партии, локальная история и статистика, повтор партий, светлая и тёмная темы, русский и английский интерфейс, звук и виброотклик. Играми можно делиться компактной ссылкой без аккаунта и сервера.

Infinite Five не содержит рекламы, аналитики и трекеров. Для игры не требуется регистрация или постоянное подключение к интернету. Игровые данные и настройки хранятся локально на устройстве.

RuStore currently limits the detailed description to 4000 characters and notes that the user may collapse it at roughly 2000 characters.

### Version 0.6.0 release notes

Улучшено управление на телефонах и планшетах: безопаснее разделены тап и перетаскивание, отменённый touch-жест больше не может поставить знак, улучшены pinch/wheel zoom и плавное возвращение к последнему ходу. Добавлены анимация последнего хода, разные виброотклики, корректное закрытие диалогов через Back/Escape, 44 px touch-targets и улучшенный compact landscape. Android release baseline остаётся Android 8.0+, target/compile API 36, NDK r29, подписанный AAB-first ARM package и обязательная 16 KB compatibility verification.

## Suggested classification

- Category: Games; choose the closest board/strategy category offered by the current RuStore console.
- Game content labels: answer from the actual current gameplay; do not add labels for content that is not present.
- Expected age rating: suitable for all ages based on current game content; confirm the final rating through the RuStore questionnaire.
- Optional search tags: up to five, only directly relevant tags.
- Language: Russian and English.
- Monetization: free, no purchases, no subscriptions.
- Ads: none.

## Public policies and developer information

The repository contains the public documents required for store distribution:

- `PRIVACY.md` — bilingual privacy policy;
- `TERMS.md` — bilingual application terms of use.

Use their public GitHub URLs in the corresponding RuStore fields:

- https://github.com/StanleyLl0yd/infinite-five/blob/main/PRIVACY.md
- https://github.com/StanleyLl0yd/infinite-five/blob/main/TERMS.md

Developer legal/registration details and direct contact data belong in RuStore Console and must not be committed merely for store submission. Complete all mandatory developer/company fields required for the account and publication.

For a new application version RuStore currently requires at least one developer contact method from:

- email;
- VK group;
- website;
- MAX.

## Data and privacy declaration

Current application behavior:

- no account or authentication;
- no developer backend;
- no advertising;
- no analytics or tracking SDK;
- no collection or transmission of personal data by the application;
- current game, settings, statistics and recent history are stored locally on the device;
- a shared replay contains only game move coordinates and is transmitted only when the user explicitly shares the generated link;
- the production Android manifest does not request network access;
- the production Android manifest requests vibration only for user-controlled move, invalid-cell and result haptic feedback;
- no sensitive Android permissions are requested.

Use these facts when completing the RuStore user-data and sensitive-permissions forms. Recheck the final built APK before every store upload because the merged package manifest is authoritative.

## Store icon

Use the prepared store-only asset:

```text
docs/assets/rustore/infinite-five-icon-512.png
```

It preserves the canonical Infinite Five artwork while flattening the background to every edge. The app/PWA launcher artwork remains unchanged.

The prepared PNG is:

- 512×512 px;
- PNG;
- 8,046 bytes;
- fully opaque with a background-filled outer contour.

Current RuStore publication guidance allows a 512×512 PNG/JPG up to 3 MB and requires a completely background-filled contour. The general RuStore application-requirements guide currently states an even stricter 1 MB maximum. The prepared asset satisfies both published size limits.

## Screenshots

Mobile screenshots are mandatory. Use real screenshots captured from the v0.6.0 release candidate rather than mockups or generated promotional screens.

For phone screenshots, follow the stricter current console requirements:

- at least 3 screenshots;
- PNG or JPG;
- no more than 3 MB each;
- no more than 2160×3840 px;
- use one consistent orientation for the set;
- prefer a clean 9:16 portrait or 16:9 landscape set;
- show only current application/game functionality;
- text must be Russian or English;
- no misleading claims, third-party advertising, store UI or unrelated system UI.

Recommended five-shot set, preferably in Russian and at one consistent device resolution:

1. New game on the infinite board with the main controls visible.
2. Mid-game position against Expert AI.
3. Winning five-in-a-row with the winning line highlighted.
4. Settings showing theme, language, sound and vibration controls.
5. About dialog with version, developer and legal links.

For the game category, RuStore specifically expects screenshots to reflect the current graphics and real gameplay. Do not add decorative mockups as substitutes for release screenshots.

## Submission checklist

Before clicking Submit for moderation:

- GitHub Release `v0.6.0` tag resolves to source commit `ba84de6d0ba093ebd544223c290c3ed23514be8a`.
- CI, CodeQL, Security and Native Release workflows are green.
- `Infinite-Five-v0.6.0-Android.aab`, `Infinite-Five-v0.6.0-Android.apk`, `Infinite-Five-v0.6.0-macOS-universal.dmg` and `SHA256SUMS.txt` are attached to the release.
- APK and AAB signatures match the expected certificates.
- Package name is `com.sl.infinitefive`.
- `versionName` is `0.6.0` and Android `versionCode` is higher than v0.5.4.
- Android baseline is `minSdk 26`, `targetSdk 36`, `compileSdk 36`, NDK r29.
- Release packages contain `arm64-v8a` and `armeabi-v7a` only, with `arm64-v8a` present.
- ELF, APK and AAB 16 KB compatibility gates pass.
- Final APK contains only required permissions and does not advertise Android TV support.
- APK installs and starts offline on a real Android device.
- New game, AI, undo, persistence, history, replay, sharing, sound and vibration are smoke-tested on the release APK.
- Upgrade from the previous signed APK preserves local data.
- AAB signing enrollment is completed in RuStore before the AAB upload.
- PEPK application-signing ZIP and upload-key PEM are prepared and submitted privately through RuStore Console.
- `docs/assets/rustore/infinite-five-icon-512.png` is used as the mobile store icon.
- At least three real phone screenshots meet the current size/orientation requirements.
- Privacy-policy and terms links are filled in.
- Store name, descriptions, category, game-content labels, age rating, developer contact and user-data declaration are filled in.
- Publication mode is selected and the release is submitted for RuStore moderation.

## Update SDK

RuStore In-App Updates is optional for the first publication and is intentionally not a blocker for v0.6.0. Its real store flow depends on a registered/moderated RuStore application and a compatible installed RuStore client, so integration should be added and tested only after the first application entry exists in RuStore. This avoids shipping an unvalidated store-specific SDK in the initial candidate.

When added, keep the integration isolated to the Android native layer and preserve the shared TypeScript game core as store-neutral.

## Deferred stores

Google Play and App Store remain roadmap targets. Do not change `com.sl.infinitefive`, signing continuity or shared game behavior when those distribution channels become available.
