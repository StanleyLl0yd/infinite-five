import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(path, 'utf8');

const rustWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/native.yml',
  '.github/workflows/native-release.yml',
  '.github/workflows/security.yml',
];

describe('Rust toolchain reproducibility', () => {
  it('pins the repository Rust compiler and Clippy component', () => {
    const toolchain = read('rust-toolchain.toml');

    expect(toolchain).toContain('channel = "1.98.1"');
    expect(toolchain).toContain('profile = "minimal"');
    expect(toolchain).toContain('components = ["clippy"]');
  });

  it('keeps workflows on the repository toolchain instead of floating overrides', () => {
    for (const path of rustWorkflows) {
      const workflow = read(path);
      expect(workflow).not.toContain('RUSTUP_TOOLCHAIN');
      expect(workflow).not.toMatch(/cargo\s+\+(stable|beta|nightly)/);
      expect(workflow).not.toMatch(/rustc\s+\+(stable|beta|nightly)/);
      expect(workflow).not.toContain('rustup default stable');
      expect(workflow).not.toContain('rustup update stable');
    }
  });
});
