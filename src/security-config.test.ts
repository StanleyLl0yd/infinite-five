import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SEMGREP_IMAGE =
  'semgrep/semgrep:1.172.0@sha256:65dcd4408adda7c183a6b4550cb1e9b19f7f627a6fbb7e0559bd466bedc44d7b';

describe('security workflow supply-chain pins', () => {
  it('pins the Semgrep container by version and immutable digest', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');

    expect(workflow).toContain(`image: ${SEMGREP_IMAGE}`);
    expect(workflow).not.toMatch(/^\s*image:\s+semgrep\/semgrep:1\.172\.0\s*$/m);
  });
});
