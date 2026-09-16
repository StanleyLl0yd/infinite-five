import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SEMGREP_IMAGE =
  'semgrep/semgrep:1.172.0@sha256:65dcd4408adda7c183a6b4550cb1e9b19f7f627a6fbb7e0559bd466bedc44d7b';
const SECURITY_AUDIT_URL = 'https://semgrep.dev/c/p/security-audit';
const SECURITY_AUDIT_SHA256 = [
  '5509b33efc0c08e2134ccb76f2c7172065f7ba4a89f28799661029e274c306c7',
  'b109a039df712f30c6d3e25e1e8358053fd0f1c91b92d0e8d2871cd141fe602f',
] as const;
const DUAL_BASELINE_EXPIRES = '2026-09-23';
const SECRETS_URL = 'https://semgrep.dev/c/p/secrets';
const RULESET_B_SHA256 = [
  '139b35ad3442bc83d1f0864db82fa4fdc7e1f1ee4b5ac872bfbeb604c82c6518',
  '7c0b0163d7cbfe44f16cec78556662655bedeec1d41c6e091ddef5d85c1d5eff',
] as const;

describe('security workflow supply-chain pins', () => {
  it('pins the Semgrep container by version and immutable digest', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');

    expect(workflow).toContain(`image: ${SEMGREP_IMAGE}`);
    expect(workflow).not.toMatch(/^\s*image:\s+semgrep\/semgrep:1\.172\.0\s*$/m);
  });

  it('verifies the observed Semgrep Registry fleet variants before scanning local configs', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');

    expect(workflow).toContain(SECURITY_AUDIT_URL);
    for (const digest of SECURITY_AUDIT_SHA256) {
      expect(workflow).toContain(digest);
    }
    expect(workflow).toContain(SECRETS_URL);
    for (const digest of RULESET_B_SHA256) {
      expect(workflow).toContain(digest);
    }
    expect(workflow).toContain('DUAL_BASELINE_EXPIRES = date(2026, 9, 23)');
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
});
