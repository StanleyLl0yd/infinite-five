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

describe('native application identity', () => {
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
      const path = `${androidRoot}/buildSrc/src/main/java/com/sl/infinitefive/kotlin/${file}`;
      expect(existsSync(path)).toBe(true);
      expect(read(path)).toContain(`package ${APP_ID}.kotlin`);
    }

    expect(existsSync(`${androidRoot}/app/src/main/java/io/github/stanleyll0yd/infinitefive/MainActivity.kt`)).toBe(false);
    for (const file of collectTextFiles(androidRoot)) {
      expect(read(file)).not.toContain(OLD_APP_ID);
    }
  });
});
