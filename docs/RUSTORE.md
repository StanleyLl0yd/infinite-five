# RuStore publication

## Status

Infinite Five v0.5.2 is the first RuStore release candidate. The Android application uses the stable package identity `com.sl.infinitefive` and the controlled release-signing pipeline. Google Play and App Store distribution remain planned but are intentionally deferred until the required developer access is available.

The first RuStore submission itself is a console step because it requires the developer account, store forms, signing enrollment and real release screenshots. Repository automation prepares and verifies the upload artifacts but must not store RuStore credentials or private signing material.

Official RuStore references used for the release checklist:

- publication flow and store metadata: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication
- AAB signing enrollment: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication/new-version-app/upload-aab
- application requirements: https://www.rustore.ru/help/developers/publishing-and-verifying-apps/requirement-apps

## Release artifacts

The controlled native release workflow produces:

```text
Infinite-Five-v0.5.2-Android.apk
Infinite-Five-v0.5.2-Android.aab
Infinite-Five-v0.5.2-macOS-universal.dmg
SHA256SUMS.txt
```

The APK is signed with the application-signing key. The AAB is signed with the upload key. The workflow verifies both certificate fingerprints, verifies `com.sl.infinitefive`, and attaches the native files only to the GitHub Release whose tag resolves to the exact source commit that produced them.

Use the AAB as the primary RuStore submission artifact after completing RuStore AAB signing enrollment. Keep the signed APK as the direct-install and fallback publication artifact.

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
6. Upload `Infinite-Five-v0.5.2-Android.aab`, which the release workflow signs with that upload key.
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

### Version 0.5.2 release notes

Подготовлен первый релиз-кандидат для RuStore. Обновлена и дополнительно проверена Android-сборка, сокращены разрешения релизного приложения, усилена надёжность подписанного APK/AAB release pipeline и включены последние оптимизации игрового кода.

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
- the production Android manifest requests vibration only for the user-controlled haptic result feedback;
- no sensitive Android permissions are requested.

Use these facts when completing the RuStore user-data and sensitive-permissions forms. Recheck the final built APK before every store upload because the merged package manifest is authoritative.

## Store icon

Use the canonical Infinite Five artwork and export a dedicated store image rather than changing the in-app launcher identity.

Current RuStore publication guidance requires the mobile store icon to be:

- 512×512 px;
- PNG or JPG;
- no more than 3 MB;
- completely background-filled to every edge, with no transparent or unfilled contour.

The general RuStore application-requirements guide currently states an even stricter 1 MB maximum for an icon. Use a 512×512 PNG/JPG below **1 MB** so the asset satisfies both published limits.

`public/icon-512.png` has the required pixel dimensions and is far below either size limit. Before using it in the store, visually/technically confirm that the outer contour is fully background-filled with no transparency. If it is transparent, export a RuStore-specific 512×512 flattened version from the canonical artwork; do not alter the app icon merely to satisfy the store-card asset requirement.

## Screenshots

Mobile screenshots are mandatory. Use real screenshots captured from the v0.5.2 release candidate rather than mockups or generated promotional screens.

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
5. Local history or replay view.

For the game category, RuStore specifically expects screenshots to reflect the current graphics and real gameplay. Do not add decorative mockups as substitutes for release screenshots.

## Submission checklist

Before clicking Submit for moderation:

- GitHub Release `v0.5.2` tag resolves to the exact release source commit.
- CI, CodeQL, Security and Native Release workflows are green.
- `Infinite-Five-v0.5.2-Android.apk`, `Infinite-Five-v0.5.2-Android.aab`, `Infinite-Five-v0.5.2-macOS-universal.dmg` and `SHA256SUMS.txt` are attached to the release.
- APK and AAB signatures match the expected certificates.
- Package name is `com.sl.infinitefive`.
- `versionName` is `0.5.2` and Android `versionCode` is higher than v0.5.1.
- Final APK contains only required permissions and does not advertise Android TV support.
- APK installs and starts offline on a real Android device.
- New game, AI, undo, persistence, history, replay, sharing, sound and vibration are smoke-tested on the release APK.
- Upgrade from the previous signed APK preserves local data.
- AAB signing enrollment is completed in RuStore before the AAB upload.
- PEPK application-signing ZIP and upload-key PEM are prepared and submitted privately through RuStore Console.
- Store icon is 512×512, below 1 MB and has a fully filled background.
- At least three real phone screenshots meet the current size/orientation requirements.
- Privacy-policy and terms links are filled in.
- Store name, descriptions, category, game-content labels, age rating, developer contact and user-data declaration are filled in.
- Publication mode is selected and the release is submitted for RuStore moderation.

## Update SDK

RuStore In-App Updates is optional for the first publication and is intentionally not a blocker for v0.5.2. Its real store flow depends on a registered/moderated RuStore application and a compatible installed RuStore client, so integration should be added and tested only after the first application entry exists in RuStore. This avoids shipping an unvalidated store-specific SDK in the initial candidate.

When added, keep the integration isolated to the Android native layer and preserve the shared TypeScript game core as store-neutral.

## Deferred stores

Google Play and App Store remain roadmap targets. Do not change `com.sl.infinitefive`, signing continuity or shared game behavior when those distribution channels become available.
