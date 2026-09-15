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

const nodeWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/native.yml',
  '.github/workflows/native-release.yml',
];

const rustBootstrap = 'python3 scripts/install-rust-toolchain.py';

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

  it('installs the pinned toolchain explicitly before workflow Rust entry points', () => {
    const ci = read('.github/workflows/ci.yml');
    const deploy = read('.github/workflows/deploy.yml');
    const native = read('.github/workflows/native.yml');
    const release = read('.github/workflows/native-release.yml');
    const security = read('.github/workflows/security.yml');

    expect(ci.match(/python3 scripts\/install-rust-toolchain\.py/g)).toHaveLength(1);
    expect(deploy.match(/python3 scripts\/install-rust-toolchain\.py/g)).toHaveLength(1);
    expect(native.match(/python3 scripts\/install-rust-toolchain\.py/g)).toHaveLength(2);
    expect(release.match(/python3 scripts\/install-rust-toolchain\.py/g)).toHaveLength(2);
    expect(security.match(/python3 scripts\/install-rust-toolchain\.py/g)).toHaveLength(1);

    expect(ci.indexOf(rustBootstrap)).toBeLessThan(ci.indexOf('rustup target add wasm32-unknown-unknown'));
    expect(deploy.indexOf(rustBootstrap)).toBeLessThan(deploy.indexOf('run: npm run test:core'));

    const nativeAndroid = native.slice(native.indexOf('\n  android:'), native.indexOf('\n  macos:'));
    const nativeMacos = native.slice(native.indexOf('\n  macos:'));
    expect(nativeAndroid.indexOf(rustBootstrap)).toBeLessThan(nativeAndroid.indexOf('rustup target add aarch64-linux-android'));
    expect(nativeMacos.indexOf(rustBootstrap)).toBeLessThan(nativeMacos.indexOf('rustup target add aarch64-apple-darwin'));

    const releaseAndroid = release.slice(release.indexOf('\n  android:'), release.indexOf('\n  macos:'));
    const releaseMacos = release.slice(release.indexOf('\n  macos:'), release.indexOf('\n  publish:'));
    expect(releaseAndroid.indexOf(rustBootstrap)).toBeLessThan(releaseAndroid.indexOf('rustup target add aarch64-linux-android'));
    expect(releaseMacos.indexOf(rustBootstrap)).toBeLessThan(releaseMacos.indexOf('rustup target add aarch64-apple-darwin'));
    expect(security.indexOf(rustBootstrap)).toBeLessThan(security.indexOf('run: cargo audit --file crates/game-core/Cargo.lock'));
  });

  it('derives rustup install arguments from the checked toolchain file', () => {
    const script = read('scripts/install-rust-toolchain.py');

    expect(script).toContain("tomllib.loads(path.read_text(encoding='utf-8'))");
    expect(script).toContain("expected_keys = {'channel', 'profile', 'components'}");
    expect(script).toContain("['rustup', 'toolchain', 'install', channel, '--profile', profile]");
    expect(script).toContain("['rustup', 'run', channel, 'rustc', '--version']");
    expect(script).not.toContain('1.98.1');
  });
});

describe('Node.js runtime reproducibility', () => {
  it('pins the repository Node.js runtime exactly', () => {
    expect(read('.node-version')).toBe('22.23.2\n');
  });

  it('uses the repository Node.js pin in every production build workflow', () => {
    for (const path of nodeWorkflows) {
      const workflow = read(path);
      expect(workflow).toContain('node-version-file: .node-version');
      expect(workflow).not.toMatch(/node-version:\s*(?:['"])?22(?:['"])?(?:\s|$)/);
    }

    expect(read('.github/workflows/native.yml').match(/node-version-file: \.node-version/g)).toHaveLength(2);
    expect(read('.github/workflows/native-release.yml').match(/node-version-file: \.node-version/g)).toHaveLength(3);
  });
});
