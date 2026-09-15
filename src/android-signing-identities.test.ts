import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const EXPECTED_CERT_SHA256 = 'f02571c40741e2cb071564f5b63fd3dc38a875d0eda11a8c42269ed635bc2a58';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('Android signing identities', () => {
  it('pins only public certificate fingerprints in reviewed repository config', () => {
    const identities = JSON.parse(read('.github/android-signing-identities.json')) as Record<string, unknown>;

    expect(Object.keys(identities).sort()).toEqual([
      'applicationSigningCertificateSha256',
      'uploadCertificateSha256',
    ]);
    expect(identities.applicationSigningCertificateSha256).toBe(EXPECTED_CERT_SHA256);
    expect(identities.uploadCertificateSha256).toBe(EXPECTED_CERT_SHA256);
    expect(identities.applicationSigningCertificateSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(identities.uploadCertificateSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses committed identities instead of secret fingerprint configuration', () => {
    const release = read('.github/workflows/native-release.yml');
    const android = release.slice(release.indexOf('\n  android:'), release.indexOf('\n  macos:'));
    const core = android.indexOf('name: Test Rust game core');
    const load = android.indexOf('name: Load canonical Android signing identities');
    const restore = android.indexOf('name: Restore and verify Android keystore');
    const verify = android.indexOf('name: Verify Android artifacts');

    expect(load).toBeGreaterThan(core);
    expect(restore).toBeGreaterThan(load);
    expect(verify).toBeGreaterThan(restore);
    expect(android).toContain("readFileSync('.github/android-signing-identities.json', 'utf8')");
    expect(android).toContain('ANDROID_APP_CERT_SHA256: identities.applicationSigningCertificateSha256');
    expect(android).toContain('ANDROID_UPLOAD_CERT_SHA256: identities.uploadCertificateSha256');
    expect(android).toContain("!/^[0-9a-f]{64}$/.test(value)");
    expect(android).toContain('check_cert "$ANDROID_APP_KEY_ALIAS" "$ANDROID_APP_CERT_SHA256"');
    expect(android).toContain('check_cert "$ANDROID_UPLOAD_KEY_ALIAS" "$ANDROID_UPLOAD_CERT_SHA256"');
    expect(android).toContain('test "$ACTUAL_APK_CERT" = "$EXPECTED_APK_CERT"');
    expect(android).toContain('test "$ACTUAL_AAB_CERT" = "$EXPECTED_AAB_CERT"');
    expect(release).not.toContain('secrets.ANDROID_APP_CERT_SHA256');
    expect(release).not.toContain('secrets.ANDROID_UPLOAD_CERT_SHA256');
  });
});
