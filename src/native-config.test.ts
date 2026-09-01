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

  it('keeps release permissions minimal', () => {
    const releaseManifest = read(`${androidRoot}/app/src/main/AndroidManifest.xml`);
    const debugManifest = read(`${androidRoot}/app/src/debug/AndroidManifest.xml`);

    expect(releaseManifest).toContain('android.permission.VIBRATE');
    expect(releaseManifest).not.toContain('android.permission.INTERNET');
    expect(releaseManifest).not.toContain('android.software.leanback');
    expect(releaseManifest).not.toContain('android.intent.category.LEANBACK_LAUNCHER');
    expect(debugManifest).toContain('android.permission.INTERNET');
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
});
