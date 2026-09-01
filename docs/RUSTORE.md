# RuStore publication

## Status

Infinite Five v0.5.2 is the first RuStore release candidate. The Android application uses the stable package identity `com.sl.infinitefive` and the existing release-signing pipeline. Google Play and App Store distribution remain planned but are intentionally deferred until the required developer access is available.

The first RuStore submission itself is a console step because it requires the developer account, store forms and AAB signing enrollment. Repository automation prepares and verifies the upload artifacts but must not store RuStore credentials or signing material.

## Release artifacts

The controlled native release workflow produces:

```text
Infinite-Five-v0.5.2-Android.apk
Infinite-Five-v0.5.2-Android.aab
Infinite-Five-v0.5.2-macOS-universal.dmg
SHA256SUMS.txt
```

The APK is signed with the application-signing key. The AAB is signed with the upload key. The workflow verifies both certificate fingerprints, checks the Android package identity and attaches the native files only to the GitHub Release whose tag resolves to the exact source commit that produced them.

Use the AAB as the primary RuStore submission artifact after completing RuStore AAB signing enrollment. Keep the signed APK as the direct-install and fallback publication artifact.

## AAB signing enrollment

For the first AAB submission, complete RuStore signing setup in the developer console:

1. Keep the package name exactly `com.sl.infinitefive`.
2. Upload the certificate for the same upload key used by the release workflow.
3. Provide the application-signing key through the RuStore-supported encrypted key transfer flow when requested.
4. Do not commit exported keys, certificates containing private material, passwords or console credentials.
5. After enrollment, keep both signing identities stable for every update.

The GitHub secret contract is documented in `docs/CROSS_PLATFORM.md`. Enrollment files required by the store are separate from normal GitHub Release artifacts.

## Store listing draft

### Name

Infinite Five

### Short description

Пять в ряд на бесконечном поле — против компьютера или вдвоём.

### Detailed description

Infinite Five — минималистичная игра «пять в ряд» на действительно бесконечном поле.

Ставьте X и O на свободные клетки и первым соберите пять или больше знаков подряд по горизонтали, вертикали или диагонали. Поле не ограничивает партию рамками: его можно перемещать и масштабировать в любой момент.

Можно играть против компьютера с четырьмя уровнями сложности — Easy, Medium, Hard и Expert — или вдвоём на одном устройстве.

В игре есть отмена хода против компьютера, сохранение незавершённой партии, локальная история и статистика, повтор партий, светлая и тёмная темы, русский и английский интерфейс, звук и виброотклик. Игры можно делиться компактной ссылкой без аккаунта и сервера.

Infinite Five не содержит рекламы, аналитики и трекеров. Для игры не требуется регистрация или постоянное подключение к интернету. Игровые данные и настройки хранятся локально на устройстве.

### Version 0.5.2 release notes

Подготовлен первый релиз-кандидат для RuStore. Обновлена и дополнительно проверена Android-сборка, сокращены разрешения релизного приложения, улучшена надёжность подписанного APK/AAB release pipeline и включены последние оптимизации игрового кода.

## Suggested classification

- Category: Games; choose the closest board/strategy category offered by the current RuStore console.
- Expected age rating: suitable for all ages; confirm the final rating through the RuStore questionnaire.
- Language: Russian and English.
- Monetization: free, no purchases, no subscriptions.
- Ads: none.

## Public policies and developer information

The repository contains the public documents required for store distribution:

- `PRIVACY.md` — bilingual privacy policy;
- `TERMS.md` — bilingual application terms of use.

Use their public GitHub URLs in the corresponding RuStore fields. Developer legal/registration details and direct contact data belong in RuStore Console and must not be committed to the repository merely for store submission. Complete all mandatory developer-contact fields in the console before moderation.

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

Use these facts when completing the RuStore data-safety and permissions forms. Recheck the final built APK before every store upload because merged dependency manifests are authoritative.

## Screenshots

Prepare real screenshots from the release candidate rather than mockups. Recommended set:

1. New game on the infinite board with the main controls visible.
2. Mid-game position against Expert AI.
3. Winning five-in-a-row with the winning line highlighted.
4. Settings showing theme, language, sound and vibration controls.
5. Local history or replay view.

Prefer the Russian interface for the primary RuStore listing. Keep screenshots internally consistent in device size and orientation and do not add claims that are not visible in the application.

## Submission checklist

Before clicking Submit for moderation:

- GitHub Release tag resolves to the exact release source commit.
- CI, CodeQL, Security and native release workflows are green.
- APK and AAB signatures match the expected certificates.
- Package name is `com.sl.infinitefive`.
- `versionName` is `0.5.2` and Android `versionCode` is higher than v0.5.1.
- Final APK contains only required permissions and does not advertise Android TV support.
- APK installs and starts offline on a real Android device.
- New game, AI, undo, persistence, history, replay, sharing, sound and vibration are smoke-tested on the release APK.
- Upgrade from the previous signed APK preserves local data.
- AAB signing enrollment is completed in RuStore when AAB is used.
- Privacy-policy and terms links are filled in.
- Store name, descriptions, category, age rating, screenshots, developer contacts and data declaration are filled in.
- The release is submitted for RuStore moderation.

## Update SDK

RuStore In-App Updates is optional for the first publication and is intentionally not a blocker for v0.5.2. Its real store flow depends on a registered/moderated RuStore application and a compatible installed RuStore client, so integration should be added and tested only after the first application entry exists in RuStore. This avoids shipping an unvalidated store-specific SDK in the initial candidate.

When added, keep the integration isolated to the Android native layer and preserve the shared TypeScript game core as store-neutral.

## Deferred stores

Google Play and App Store remain roadmap targets. Do not change `com.sl.infinitefive`, signing continuity or shared game behavior when those distribution channels become available.
