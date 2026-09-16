import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function androidJob(workflow: string): string {
  const start = workflow.indexOf('\n  android:');
  const end = workflow.indexOf('\n  macos:', start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return workflow.slice(start, end);
}

describe('Android SDK Platform reproducibility', () => {
  it('pins the verified API 36 platform contents', () => {
    expect(read('.github/android-sdk-platform.txt')).toBe(
      'api_level=36\n' +
        'revision=2\n' +
        'extension_level=17\n' +
        'tree_sha256=a4ca79ae6cf06746b14d44a4c812f8e31429005566df4f01777a2433b56a3411\n',
    );
  });

  it('fails closed on metadata, symlinks and content drift', () => {
    const verifier = read('scripts/verify-android-sdk-platform.sh');

    expect(verifier).toContain('test "${#config_lines[@]}" -eq 4');
    expect(verifier).toContain('grep -Fx "Pkg.Revision=$REVISION" "$PROPERTIES"');
    expect(verifier).toContain('grep -Fx "AndroidVersion.ApiLevel=$API_LEVEL" "$PROPERTIES"');
    expect(verifier).toContain('grep -Fx "AndroidVersion.ExtensionLevel=$EXTENSION_LEVEL" "$PROPERTIES"');
    expect(verifier).toContain('find "$PLATFORM_DIR" -type l -print -quit');
    expect(verifier).toContain('Unexpected symlink in Android SDK Platform');
    expect(verifier).toContain('find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum');
    expect(verifier).toContain('test "$ACTUAL_SHA256" = "$EXPECTED_SHA256"');
  });

  it('verifies the platform before both Android production build paths', () => {
    const nativeAndroid = androidJob(read('.github/workflows/native.yml'));
    const releaseAndroid = androidJob(read('.github/workflows/native-release.yml'));

    for (const android of [nativeAndroid, releaseAndroid]) {
      const jdk = android.indexOf('name: Verify Android JDK');
      const platform = android.indexOf('name: Verify Android SDK Platform 36');
      const node = android.indexOf('name: Set up Node.js');
      expect(jdk).toBeGreaterThanOrEqual(0);
      expect(platform).toBeGreaterThan(jdk);
      expect(node).toBeGreaterThan(platform);
      expect(android).toContain('run: bash scripts/verify-android-sdk-platform.sh');
      expect(android.match(/scripts\/verify-android-sdk-platform\.sh/g)).toHaveLength(1);
    }
  });
});
