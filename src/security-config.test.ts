import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SEMGREP_IMAGE =
  'semgrep/semgrep:1.172.0@sha256:65dcd4408adda7c183a6b4550cb1e9b19f7f627a6fbb7e0559bd466bedc44d7b';
const SECURITY_AUDIT_URL = 'https://semgrep.dev/c/p/security-audit';
const SECURITY_AUDIT_SHA256 = [
  '83d7cde9157b3c79cc5cfaea26e7bd2ba9c740f2ba07635ad475b2585556c32d',
  '3e280f9214fb2a533fc94c60e318239ebaade31908cd4aa527fe66c75e54dd9d',
] as const;
const SECRETS_URL = 'https://semgrep.dev/c/p/secrets';
const RULESET_B_SHA256 = [
  'd1afb323ed493cf9d3ee5044447b989debf033b2b7cc8208662a81b8c162c66a',
  'f680ede6ba7af3e63a046c2f2c4d117181630b5308be16b22a48a82636d61b6b',
] as const;
const GLIB_UNSOUND_ADVISORY = 'RUSTSEC-2024-0429';
const GLIB_UNSOUND_EXCEPTION_EXPIRES = '2026-12-31';

describe('security workflow supply-chain pins', () => {
  it('pins the Semgrep container by version and immutable digest', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');

    expect(workflow).toContain(`image: ${SEMGREP_IMAGE}`);
    expect(workflow).not.toMatch(/^\s*image:\s+semgrep\/semgrep:1\.172\.0\s*$/m);
  });

  it('verifies the observed Semgrep Registry fleet variants before scanning local configs', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');

    expect(workflow).toContain(SECURITY_AUDIT_URL);
    for (const digest of SECURITY_AUDIT_SHA256) expect(workflow).toContain(digest);
    expect(workflow).toContain(SECRETS_URL);
    for (const digest of RULESET_B_SHA256) expect(workflow).toContain(digest);
    expect(workflow).toContain('DUAL_BASELINE_EXPIRES = date(2026, 10, 23)');
    expect(workflow).toContain('if date.today() > DUAL_BASELINE_EXPIRES:');
    expect(workflow).toContain('actual = hashlib.sha256(data).hexdigest()');
    expect(workflow).toContain('if actual not in expected:');
    expect(workflow).not.toMatch(/--config\s+p\/(?:security-audit|secrets)\b/);
    expect(workflow).toContain(
      'semgrep scan --config "$SEMGREP_SECURITY_AUDIT_CONFIG" --config "$SEMGREP_SECRETS_CONFIG" --error --metrics=off .',
    );

    const expiryCheck = workflow.indexOf('if date.today() > DUAL_BASELINE_EXPIRES:');
    const digestCheck = workflow.indexOf('if actual not in expected:');
    const configWrite = workflow.indexOf('path.write_bytes(data)');
    const scan = workflow.indexOf('semgrep scan --config "$SEMGREP_SECURITY_AUDIT_CONFIG"');
    expect(expiryCheck).toBeGreaterThan(-1);
    expect(digestCheck).toBeGreaterThan(expiryCheck);
    expect(configWrite).toBeGreaterThan(digestCheck);
    expect(scan).toBeGreaterThan(configWrite);
  });

  it('fails closed on RustSec unsound advisories with one live, expiring upstream exception', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');
    const gameCoreAudit = 'cargo audit --deny unsound --file crates/game-core/Cargo.lock';
    const strictNativeAudit = 'cargo audit --deny unsound --file src-tauri/Cargo.lock';
    const nativeAudit =
      'cargo audit --deny unsound --ignore "$GLIB_UNSOUND_ADVISORY" --file src-tauri/Cargo.lock';

    expect(workflow).toContain(`GLIB_UNSOUND_ADVISORY: ${GLIB_UNSOUND_ADVISORY}`);
    expect(workflow).toContain(`GLIB_UNSOUND_EXCEPTION_EXPIRES: '${GLIB_UNSOUND_EXCEPTION_EXPIRES}'`);
    expect(workflow).toContain("expiry = date.fromisoformat(os.environ['GLIB_UNSOUND_EXCEPTION_EXPIRES'])");
    expect(workflow).toContain('if today > expiry:');
    expect(workflow).toContain(gameCoreAudit);
    expect(workflow).toContain(`output="$(cargo audit --deny unsound --file src-tauri/Cargo.lock 2>&1)"`);
    expect(workflow).toContain('if [ "$status" -eq 0 ]; then');
    expect(workflow).toContain('grep -Fq "$GLIB_UNSOUND_ADVISORY" <<<"$output"');
    expect(workflow).toContain(nativeAudit);
    expect(workflow.match(/--ignore/g)).toHaveLength(1);

    const expiryGuard = workflow.indexOf('if today > expiry:');
    const gameCoreAuditIndex = workflow.indexOf(gameCoreAudit);
    const strictNativeAuditIndex = workflow.indexOf(strictNativeAudit, gameCoreAuditIndex + 1);
    const exceptionProof = workflow.indexOf('grep -Fq "$GLIB_UNSOUND_ADVISORY" <<<"$output"');
    const nativeAuditIndex = workflow.indexOf(nativeAudit);
    expect(expiryGuard).toBeGreaterThan(-1);
    expect(gameCoreAuditIndex).toBeGreaterThan(expiryGuard);
    expect(strictNativeAuditIndex).toBeGreaterThan(gameCoreAuditIndex);
    expect(exceptionProof).toBeGreaterThan(strictNativeAuditIndex);
    expect(nativeAuditIndex).toBeGreaterThan(exceptionProof);
  });
});
