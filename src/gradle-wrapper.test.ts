import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const WRAPPER_JAR = 'src-tauri/gen/android/gradle/wrapper/gradle-wrapper.jar';
const WRAPPER_PROPERTIES = 'src-tauri/gen/android/gradle/wrapper/gradle-wrapper.properties';
const GRADLE_8_14_3_WRAPPER_SHA256 = '7d3a4ac4de1c32b59bc6a4eb8ecb8e612ccd0cf1ae1e99f66902da64df296172';
const GRADLE_8_14_3_DISTRIBUTION_SHA256 = 'bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531';
const WRAPPER_VALIDATION_ACTION =
  'gradle/actions/wrapper-validation@9c971963bec38e04b3d30dcc455b5382be2fdbfb # v6.3.0';

describe('Gradle wrapper supply-chain validation', () => {
  it('pins the committed wrapper JAR to Gradle 8.14.3', () => {
    const actual = createHash('sha256').update(readFileSync(WRAPPER_JAR)).digest('hex');

    expect(actual).toBe(GRADLE_8_14_3_WRAPPER_SHA256);
  });

  it('pins the Gradle 8.14.3 binary distribution checksum independently', () => {
    const properties = readFileSync(WRAPPER_PROPERTIES, 'utf8');

    expect(properties).toContain('distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip');
    expect(properties).toContain(`distributionSha256Sum=${GRADLE_8_14_3_DISTRIBUTION_SHA256}`);
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
