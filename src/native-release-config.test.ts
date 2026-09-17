import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const release = readFileSync('.github/workflows/native-release.yml', 'utf8');

describe('native release preflight', () => {
  it('treats a missing release tag as absent instead of as a conflicting SHA', () => {
    expect(release).toContain('TAG_SHA=""');
    expect(release).toContain(
      'if ! TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/$TAG" --jq .sha 2>/dev/null)"; then',
    );
    expect(release).toContain('then\n            TAG_SHA=""\n          fi');
    expect(release).not.toContain(
      'TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/$TAG" --jq .sha 2>/dev/null || true)"',
    );
  });
});
