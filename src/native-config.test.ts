import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_ID = 'com.sl.infinitefive';
const OLD_APP_ID = 'io.github.stanleyll0yd.infinitefive';
const androidRoot = 'src-tauri/gen/android';
const textExtensions = new Set(['.gradle', '.java', '.json', '.kt', '.kts', '.properties', '.toml', '.xml']);

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function collectTextFiles(path: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectTextFiles(fullPath));
    } else if (textExtensions.has(extname(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('native application configuration', () => {
  it('keeps release versions aligned', () => {
    const packageJson = JSON.parse(read('package.json')) as { version?: string };
    const config = JSON.parse(read('src-tauri/tauri.conf.json')) as { version?: string };
    const cargo = read('src-tauri/Cargo.toml');

    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(config.version).toBe(packageJson.version);
    expect(cargo).toContain(`version = "${packageJson.version}"`);
  });

  it('keeps Tauri and generated Android packages aligned', () => {
    const config = JSON.parse(read('src-tauri/tauri.conf.json')) as { identifier?: string };
    expect(config.identifier).toBe(APP_ID);

    const gradle = read(`${androidRoot}/app/build.gradle.kts`);
    expect(gradle).toContain(`namespace = "${APP_ID}"`);
    expect(gradle).toContain(`applicationId = "${APP_ID}"`);

    const mainActivity = `${androidRoot}/app/src/main/java/com/sl/infinitefive/MainActivity.kt`;
    expect(existsSync(mainActivity)).toBe(true);
    expect(read(mainActivity)).toContain(`package ${APP_ID}`);

    for (const file of ['BuildTask.kt', 'RustPlugin.kt']) {
      expect(existsSync(`${androidRoot}/buildSrc/src/main/java/com/sl/infinitefive/kotlin/${file}`)).toBe(true);
    }

    expect(existsSync(`${androidRoot}/app/src/main/java/io/github/stanleyll0yd/infinitefive/MainActivity.kt`)).toBe(false);
    expect(existsSync(`${androidRoot}/buildSrc/src/main/java/io/github/stanleyll0yd/infinitefive`)).toBe(false);
    for (const file of collectTextFiles(androidRoot)) {
      expect(read(file)).not.toContain(OLD_APP_ID);
    }
  });

  it('keeps the Android SDK and NDK baseline explicit', () => {
    const config = JSON.parse(read('src-tauri/tauri.conf.json')) as {
      bundle?: { android?: { minSdkVersion?: number } };
    };
    const gradle = read(`${androidRoot}/app/build.gradle.kts`);

    expect(config.bundle?.android?.minSdkVersion).toBe(26);
    expect(gradle).toContain('minSdk = 26');
    expect(gradle).toContain('targetSdk = 36');
    expect(gradle).toContain('compileSdk = 36');
    expect(gradle).toContain('ndkVersion = "29.0.14206865"');
  });

  it('pins the Android Gradle wrapper distribution checksum', () => {
    const wrapper = read(`${androidRoot}/gradle/wrapper/gradle-wrapper.properties`);

    expect(wrapper).toContain('distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip');
    expect(wrapper).toContain(
      'distributionSha256Sum=bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531',
    );
  });

  it('keeps raster Android launcher resources authoritative', () => {
    const adaptiveIcon = read(`${androidRoot}/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`);

    expect(adaptiveIcon).toContain('@mipmap/ic_launcher_foreground');
    expect(adaptiveIcon).toContain('@color/ic_launcher_background');
    expect(existsSync(`${androidRoot}/app/src/main/res/drawable/ic_launcher_background.xml`)).toBe(false);
    expect(existsSync(`${androidRoot}/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`)).toBe(false);
    expect(existsSync('src-tauri/icons/android')).toBe(false);
  });

  it('keeps release permissions minimal', () => {
    const releaseManifest = read(`${androidRoot}/app/src/main/AndroidManifest.xml`);
    const debugManifest = read(`${androidRoot}/app/src/debug/AndroidManifest.xml`);

    expect(releaseManifest).toContain('android.permission.VIBRATE');
    expect(releaseManifest).not.toContain('android.permission.INTERNET');
    expect(releaseManifest).not.toContain('android.software.leanback');
    expect(releaseManifest).not.toContain('android.intent.category.LEANBACK_LAUNCHER');
    expect(debugManifest).toContain('android.permission.INTERNET');
  });

  it('hardens Android and Rust release outputs', () => {
    const gradle = read(`${androidRoot}/app/build.gradle.kts`);
    const releaseStart = gradle.indexOf('getByName("release")');
    const releaseEnd = gradle.indexOf('    kotlinOptions', releaseStart);
    const releaseBlock = gradle.slice(releaseStart, releaseEnd);
    const cargo = read('src-tauri/Cargo.toml');

    expect(releaseStart).toBeGreaterThanOrEqual(0);
    expect(releaseBlock).toContain('isDebuggable = false');
    expect(releaseBlock).toContain('isJniDebuggable = false');
    expect(releaseBlock).toContain('isMinifyEnabled = true');
    expect(releaseBlock).toContain('isShrinkResources = true');
    expect(releaseBlock).toContain('proguard-android-optimize.txt');
    expect(releaseBlock).not.toContain('keepDebugSymbols');
    expect(cargo).toContain('[profile.release]');
    expect(cargo).toContain('lto = "fat"');
    expect(cargo).toContain('codegen-units = 1');
    expect(cargo).toContain('strip = "symbols"');
    expect(cargo).toContain('debug = 0');
  });

  it('keeps release signing external to the repository', () => {
    const gradle = read(`${androidRoot}/app/build.gradle.kts`);
    expect(gradle).toContain('rootProject.file("keystore.properties")');
    expect(gradle).toContain('create("release")');
    expect(gradle).toContain('signingConfig = signingConfigs.getByName("release")');
    expect(gradle).toContain('keyPassword = keystoreProperties.getProperty("keyPassword")');
    expect(gradle).toContain('storePassword = keystoreProperties.getProperty("storePassword")');
    expect(existsSync(`${androidRoot}/keystore.properties`)).toBe(false);
  });

  it('keeps release architecture and 16 KB checks in the native pipeline', () => {
    const native = read('.github/workflows/native.yml');
    const release = read('.github/workflows/native-release.yml');
    const verifier = read('scripts/verify-android-native.sh');

    for (const workflow of [native, release]) {
      expect(workflow).toContain('aarch64-linux-android armv7-linux-androideabi');
      expect(workflow).toContain('--target aarch64 --target armv7');
      expect(workflow).not.toContain('i686-linux-android x86_64-linux-android');
    }
    expect(release.indexOf('Build signed AAB')).toBeLessThan(release.indexOf('Build supplemental signed APK'));
    expect(verifier).toContain('EXPECTED_ABIS="arm64-v8a armeabi-v7a"');
    expect(verifier).toContain('alignment >= 0x4000');
    expect(verifier).toContain('PAGE_ALIGNMENT_16K');
    expect(verifier).toContain('-P 16');
    expect(verifier).toContain('verify_release_elf');
    expect(verifier).toContain("verify_native_assets \"$AAB\" 'base/assets/'");
    expect(verifier).toContain("verify_native_assets \"$APK\" 'assets/'");
  });

  it('pins Android package verification to the AGP 8.11 Build Tools baseline', () => {
    const native = read('.github/workflows/native.yml');
    const release = read('.github/workflows/native-release.yml');
    const verifier = read('scripts/verify-android-native.sh');

    expect(native).toContain("ANDROID_BUILD_TOOLS_VERSION: '35.0.0'");
    expect(release).toContain("ANDROID_BUILD_TOOLS_VERSION: '35.0.0'");
    for (const workflow of [native, release]) {
      expect(workflow).toContain('"build-tools;$ANDROID_BUILD_TOOLS_VERSION"');
      expect(workflow).not.toMatch(/build-tools.*sort -V.*tail -n 1/);
    }
    expect(verifier).toContain('ANDROID_BUILD_TOOLS_VERSION="${ANDROID_BUILD_TOOLS_VERSION:-35.0.0}"');
    expect(verifier).toContain('BUILD_TOOLS_DIR="${ANDROID_HOME:?ANDROID_HOME is required}/build-tools/$ANDROID_BUILD_TOOLS_VERSION"');
    expect(verifier).toContain('ZIPALIGN="${ZIPALIGN:-$BUILD_TOOLS_DIR/zipalign}"');
    expect(verifier).not.toContain('sort -V | tail -n 1');
  });

  it('keeps one controlled draft-to-immutable release workflow', () => {
    const release = read('.github/workflows/native-release.yml');

    expect(existsSync('.github/workflows/release.yml')).toBe(false);
    expect(release).toContain('group: native-release');
    expect(release).toContain('name: Prepare draft release');
    expect(release).toContain('gh release create "$TAG"');
    expect(release).toContain('--target "$SOURCE_SHA"');
    expect(release).toContain('--draft');
    expect(release.match(/ref: \$\{\{ needs\.preflight\.outputs\.source_sha \}\}/g)).toHaveLength(2);
  });

  it('limits release write permission to lifecycle jobs and release execution to protected main pushes', () => {
    const release = read('.github/workflows/native-release.yml');
    const preflight = release.slice(release.indexOf('\n  preflight:'), release.indexOf('\n  android:'));
    const android = release.slice(release.indexOf('\n  android:'), release.indexOf('\n  macos:'));
    const macos = release.slice(release.indexOf('\n  macos:'), release.indexOf('\n  publish:'));
    const publish = release.slice(release.indexOf('\n  publish:'));

    expect(release).toContain('permissions: {}');
    expect(release).not.toContain('workflow_dispatch');
    expect(release).not.toContain('inputs.tag');
    expect(preflight).toContain('ref: ${{ github.sha }}');
    expect(preflight).toContain('permissions:\n      contents: write');
    expect(android).toContain('permissions:\n      contents: read');
    expect(android).not.toContain('contents: write');
    expect(macos).toContain('permissions:\n      contents: read');
    expect(macos).not.toContain('contents: write');
    expect(publish).toContain('permissions:\n      contents: write\n      actions: read');
  });

  it('restores signing material only after non-signing verification completes', () => {
    const release = read('.github/workflows/native-release.yml');
    const android = release.slice(release.indexOf('\n  android:'), release.indexOf('\n  macos:'));
    const audit = android.indexOf('name: Audit dependencies');
    const frontend = android.indexOf('name: Run frontend tests');
    const core = android.indexOf('name: Test Rust game core');
    const restore = android.indexOf('name: Restore and verify Android keystore');
    const aab = android.indexOf('name: Build signed AAB');
    const apk = android.indexOf('name: Build supplemental signed APK');
    const verify = android.indexOf('name: Verify Android artifacts');
    const cleanup = android.indexOf('name: Remove temporary signing material');

    expect(audit).toBeGreaterThanOrEqual(0);
    expect(frontend).toBeGreaterThan(audit);
    expect(core).toBeGreaterThan(frontend);
    expect(restore).toBeGreaterThan(core);
    expect(aab).toBeGreaterThan(restore);
    expect(apk).toBeGreaterThan(aab);
    expect(verify).toBeGreaterThan(apk);
    expect(cleanup).toBeGreaterThan(verify);
    expect(android).toContain('if: always()');
  });

  it('skips immutable published versions and rejects conflicting draft tags', () => {
    const release = read('.github/workflows/native-release.yml');
    const published = release.indexOf('if [[ "$RELEASE_DRAFT" == "false" ]]');
    const conflict = release.indexOf('elif [[ -n "$TAG_SHA" && "$TAG_SHA" != "$SOURCE_SHA" ]]', published);

    expect(published).toBeGreaterThanOrEqual(0);
    expect(conflict).toBeGreaterThan(published);
    expect(release.slice(published, conflict)).toContain('test "$RELEASE_IMMUTABLE" = "true"');
    expect(release.slice(published, conflict)).toContain('SHOULD_BUILD=false');
    expect(release).toContain('Draft or orphan release tag $TAG belongs to another source commit');
  });

  it('stages and verifies the exact release asset set before immutable publication', () => {
    const release = read('.github/workflows/native-release.yml');
    const upload = release.indexOf('gh release upload "$TAG"');
    const digestVerification = release.indexOf('verify_remote_asset()', upload);
    const provenanceRecheck = release.indexOf('TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/$TAG" --jq .sha)"', digestVerification);
    const finalDigestVerification = release.lastIndexOf('verify_remote_asset "release/$CHECKSUMS"');
    const publish = release.indexOf('gh release edit "$TAG" --draft=false');
    const postPublishCheck = release.indexOf('TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/$TAG" --jq .sha)"', publish);

    expect(release).toContain('test "$UNEXPECTED_ASSETS" = "0"');
    expect(release).toContain('--clobber');
    expect(upload).toBeGreaterThanOrEqual(0);
    expect(digestVerification).toBeGreaterThan(upload);
    expect(release).toContain('.digest")');
    expect(release.match(/verify_remote_asset "release\/\$AAB"/g)).toHaveLength(2);
    expect(release.match(/verify_remote_asset "release\/\$CHECKSUMS"/g)).toHaveLength(2);
    expect(release).toContain("--jq '.assets | length')\" = \"4\"");
    expect(provenanceRecheck).toBeGreaterThan(digestVerification);
    expect(finalDigestVerification).toBeGreaterThan(provenanceRecheck);
    expect(publish).toBeGreaterThan(finalDigestVerification);
    expect(postPublishCheck).toBeGreaterThan(publish);
    expect(release).toContain('--json isImmutable --jq .isImmutable');
    expect(release).toContain('test "$IS_IMMUTABLE" = "true"');
    expect(release).toContain('gh release verify "$TAG" --repo "$GITHUB_REPOSITORY"');
    expect(release).toContain('gh release verify-asset "$TAG" "release/$AAB"');
    expect(release).toContain('gh release verify-asset "$TAG" "release/$CHECKSUMS"');
  });
});
