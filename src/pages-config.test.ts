import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(path, 'utf8');

describe('GitHub Pages workflow security', () => {
  it('keeps deployment and OIDC privileges out of the build job', () => {
    const workflow = read('.github/workflows/deploy.yml');
    const build = workflow.slice(workflow.indexOf('\n  build:'), workflow.indexOf('\n  deploy:'));
    const deploy = workflow.slice(workflow.indexOf('\n  deploy:'));

    expect(workflow).toContain('permissions: {}');
    expect(build).toContain('permissions:\n      contents: read\n      pages: read');
    expect(build).not.toContain('pages: write');
    expect(build).not.toContain('id-token: write');
    expect(deploy).toContain('permissions:\n      pages: write\n      id-token: write');
    expect(deploy).not.toContain('contents: write');
  });

  it('keeps Pages deployment isolated behind the build artifact and environment', () => {
    const workflow = read('.github/workflows/deploy.yml');
    const deploy = workflow.slice(workflow.indexOf('\n  deploy:'));

    expect(deploy).toContain('needs: build');
    expect(deploy).toContain('name: github-pages');
    expect(deploy).toContain('actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0');
  });

  it('pins the production WebAssembly optimizer identically in CI and Pages', () => {
    const ci = read('.github/workflows/ci.yml');
    const pages = read('.github/workflows/deploy.yml');
    const packagePin = 'sudo apt-get install --yes --no-install-recommends binaryen=108-1';
    const versionPin = 'test "$(wasm-opt --version)" = "wasm-opt version 108"';

    for (const workflow of [ci, pages]) {
      expect(workflow).toContain('name: Install pinned Binaryen');
      expect(workflow).toContain(packagePin);
      expect(workflow).toContain(versionPin);
      expect(workflow).not.toContain('apt-get install --yes --no-install-recommends binaryen\n');
    }
  });
});
