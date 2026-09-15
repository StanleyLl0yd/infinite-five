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

  it('rejects reusing a release version for a different source commit', () => {
    const release = read('.github/workflows/release.yml');

    expect(release).toContain('TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/v$VERSION" --jq .sha)"');
    expect(release).toContain('test "$TAG_SHA" = "$GITHUB_SHA"');
  });

  it('skips automatic native rebuilds when the version tag belongs to an older source', () => {
    const release = read('.github/workflows/native-release.yml');

    expect(release).toContain('name: Native release preflight');
    expect(release).toContain('TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/$TAG" --jq .sha 2>/dev/null || true)"');
    expect(release).toContain('if [[ -n "$TAG_SHA" && "$TAG_SHA" != "$SOURCE_SHA" ]]');
    expect(release).toContain("if: needs.preflight.outputs.should_build == 'true'");
  });
});
