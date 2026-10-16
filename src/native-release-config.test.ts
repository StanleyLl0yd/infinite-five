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

  it('keeps the production release trigger narrow and manifest-driven', () => {
    expect(release).toContain('paths:\n      - package.json');
    expect(release).not.toContain('      - .github/workflows/native-release.yml');
    expect(release).not.toContain('workflow_dispatch:');
  });

  it('recovers exact-tag and stranded untagged drafts by immutable release ID', () => {
    expect(release).toContain('release_id: ${{ steps.release.outputs.release_id }}');
    expect(release).toContain('gh api "repos/$GITHUB_REPOSITORY/releases?per_page=100" --paginate --slurp');
    expect(release).toContain('.tag_name == $tag');
    expect(release).toContain('.tag_name | startswith("untagged-")');
    expect(release).toContain('.name == $name');
    expect(release).toContain('.target_commitish == $source');
    expect(release).toContain('.author.login == "github-actions[bot]"');
    expect(release).toContain('(.assets | length) == 0');
    expect(release).toContain('test "$DRAFT_AUTHOR" = "github-actions[bot]"');
    expect(release).toContain('if [[ "$DRAFT_ASSET_COUNT" != "0" ]]; then');
    expect(release).toContain('gh api --method PATCH "repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID"');
    expect(release).toContain('-f tag_name="$TAG"');
    expect(release).toContain('-f target_commitish="$SOURCE_SHA"');
    expect(release).not.toContain('gh release create "$TAG"');
    expect(release).not.toContain('RELEASE_DRAFT="$(gh release view');
  });

  it('restores tag and target together so GitHub cannot strand the recovered draft', () => {
    const patchStart = release.indexOf('gh api --method PATCH "repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID"');
    const patchEnd = release.indexOf('--silent', patchStart);
    const patch = release.slice(patchStart, patchEnd);

    expect(patchStart).toBeGreaterThanOrEqual(0);
    expect(patch).toContain('-f tag_name="$TAG"');
    expect(patch).toContain('-f target_commitish="$SOURCE_SHA"');
  });

  it('publishes only the verified draft ID and proves immutable tag and asset identity', () => {
    expect(release).toContain('RELEASE_ID: ${{ needs.preflight.outputs.release_id }}');
    expect(release).toContain('releases/$RELEASE_ID/assets?per_page=100');
    expect(release).toContain('https://uploads.github.com/repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID/assets?name=$name');
    expect(release).toContain('gh api --method PATCH "repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID" -F draft=false --silent');
    expect(release).toContain('test "$TAG_SHA" = "$SOURCE_SHA"');
    expect(release).toContain('test "$PUBLISHED_BY_TAG_ID" = "$RELEASE_ID"');
    expect(release).toContain('test "$IS_IMMUTABLE" = "true"');
    expect(release).toContain('gh release verify "$TAG" --repo "$GITHUB_REPOSITORY"');
    expect((release.match(/gh release verify-asset \"\$TAG\"/g) ?? []).length).toBe(4);
  });
});
