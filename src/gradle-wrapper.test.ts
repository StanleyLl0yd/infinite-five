import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const WRAPPER_JAR = 'src-tauri/gen/android/gradle/wrapper/gradle-wrapper.jar';
// Gradle's published checksum reference identifies this as an official wrapper JAR
// used by releases including 6.6 through 7.0.1. It is trusted but older than the
// configured 8.14.3 distribution; version alignment is tracked separately.
const COMMITTED_OFFICIAL_WRAPPER_SHA256 = 'e996d452d2645e70c01c11143ca2d3742734a28da2bf61f25c82bdc288c9e637';
const WRAPPER_VALIDATION_ACTION =
  'gradle/actions/wrapper-validation@9c971963bec38e04b3d30dcc455b5382be2fdbfb # v6.3.0';

describe('Gradle wrapper supply-chain validation', () => {
  it('pins the committed wrapper JAR to its published official checksum', () => {
    const actual = createHash('sha256').update(readFileSync(WRAPPER_JAR)).digest('hex');

    expect(actual).toBe(COMMITTED_OFFICIAL_WRAPPER_SHA256);
  });

  it('runs official wrapper validation before the required Android build', () => {
    const native = readFileSync('.github/workflows/native.yml', 'utf8');
    const checkout = native.indexOf('name: Checkout');
    const validation = native.indexOf(WRAPPER_VALIDATION_ACTION);
    const androidBuild = native.indexOf('name: Build Android release AAB');

    expect(checkout).toBeGreaterThanOrEqual(0);
    expect(validation).toBeGreaterThan(checkout);
    expect(androidBuild).toBeGreaterThan(validation);
  });

  it('validates the pinned wrapper through npm test before signed release builds', () => {
    const release = readFileSync('.github/workflows/native-release.yml', 'utf8');
    const frontendTests = release.indexOf('name: Run frontend tests');
    const restoreSigningMaterial = release.indexOf('name: Restore and verify Android keystore');
    const signedBuild = release.indexOf('name: Build signed AAB');

    expect(frontendTests).toBeGreaterThanOrEqual(0);
    expect(restoreSigningMaterial).toBeGreaterThan(frontendTests);
    expect(signedBuild).toBeGreaterThan(restoreSigningMaterial);
  });
});
