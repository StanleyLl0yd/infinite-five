import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function job(workflow: string, name: string, nextName: string): string {
  const start = workflow.indexOf(`\n  ${name}:`);
  const end = workflow.indexOf(`\n  ${nextName}:`, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return workflow.slice(start, end);
}

describe('Android JDK reproducibility', () => {
  it('pins the already-verified Temurin runtime exactly', () => {
    expect(read('.java-version').trim()).toBe('17.0.20+1');
  });

  it('uses the same exact JDK before Android builds without changing macOS jobs', () => {
    const native = read('.github/workflows/native.yml');
    const release = read('.github/workflows/native-release.yml');
    const nativeAndroid = job(native, 'android', 'macos');
    const nativeMacos = native.slice(native.indexOf('\n  macos:'));
    const releaseAndroid = job(release, 'android', 'macos');
    const releaseMacos = job(release, 'macos', 'publish');
    const setupJava = 'actions/setup-java@de7274f081f381c8f8158605e0321c36c376e2e6 # v6.0.1';

    for (const android of [nativeAndroid, releaseAndroid]) {
      expect(android).toContain(`uses: ${setupJava}`);
      expect(android).toContain('distribution: temurin');
      expect(android).toContain('java-version-file: .java-version');
      expect(android).toContain('check-latest: false');
      expect(android).toContain('name: Verify Android JDK');
      expect(android).toContain('EXPECTED_JAVA_MAJOR="${EXPECTED_JAVA_VERSION%%.*}"');
      expect(android).toContain('test "$(command -v java)" = "$JAVA_HOME/bin/java"');
      expect(android).toContain('java.vendor = Eclipse Adoptium');
      expect(android).toContain('java.specification.version = $EXPECTED_JAVA_MAJOR');
      expect(android).toContain('OpenJDK Runtime Environment Temurin-');
      expect(android.indexOf('name: Set up pinned Android JDK')).toBeLessThan(
        android.indexOf('name: Configure Android SDK, NDK and Rust targets'),
      );
    }

    expect(native.match(/actions\/setup-java@/g)).toHaveLength(1);
    expect(release.match(/actions\/setup-java@/g)).toHaveLength(1);
    expect(nativeMacos).not.toContain('actions/setup-java@');
    expect(releaseMacos).not.toContain('actions/setup-java@');
  });
});
