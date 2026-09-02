import { cpSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}`);
  }
};

run('rustup', ['target', 'add', 'wasm32-unknown-unknown']);
run('cargo', [
  'build',
  '--manifest-path',
  'crates/game-core/Cargo.toml',
  '--target',
  'wasm32-unknown-unknown',
  '--release'
]);

const source = resolve(
  'crates/game-core/target/wasm32-unknown-unknown/release/infinite_five_game_core.wasm'
);
const destination = resolve('public/game-core/game_core.wasm');
mkdirSync(dirname(destination), { recursive: true });

const requireOptimization = process.argv.includes('--require-opt') || process.env.WASM_OPT_REQUIRED === '1';
const probe = spawnSync('wasm-opt', ['--version'], { stdio: 'ignore' });
if (probe.status === 0) {
  const optimized = `${destination}.optimized`;
  run('wasm-opt', ['-Oz', '--strip-debug', '--strip-producers', source, '-o', optimized]);
  renameSync(optimized, destination);
} else {
  if (requireOptimization) throw new Error('wasm-opt is required for production web builds');
  cpSync(source, destination);
}

if (!existsSync(destination)) throw new Error('WebAssembly game core was not produced');
