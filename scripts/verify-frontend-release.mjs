import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const native = process.argv.includes('--native');
const root = 'dist';
if (!existsSync(root)) throw new Error('dist does not exist');

const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
};
walk(root);

const forbiddenExtensions = new Set(['.map', '.ts', '.tsx']);
const forbiddenPathParts = new Set(['src', '__tests__', 'test', 'tests']);
for (const file of files) {
  if (forbiddenExtensions.has(extname(file))) {
    throw new Error(`Source/debug artifact leaked into production: ${file}`);
  }
  const parts = relative(root, file).split(sep);
  if (parts.some((part) => forbiddenPathParts.has(part))) {
    throw new Error(`Source/test directory leaked into production: ${file}`);
  }
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) {
    throw new Error(`Test source leaked into production: ${file}`);
  }
}

const legacyNames = [
  'contiguousScore',
  'windowPatternScore',
  'rankScore',
  'rankedCandidates',
  'findWinningMoves',
  'isDoubleThreatMove',
  'immediateThreatCount',
  'scoreExpertRootMove',
  'expertConsensus'
];
const javascript = files
  .filter((file) => /\.[cm]?js$/.test(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
for (const name of legacyNames) {
  if (javascript.includes(name)) {
    throw new Error(`Readable legacy game-core implementation leaked into JavaScript: ${name}`);
  }
}

const wasmFiles = files.filter((file) => file.endsWith('.wasm'));
if (native) {
  if (wasmFiles.length !== 0) {
    throw new Error('Native frontend bundle must not contain the WebAssembly game core');
  }
  process.exit(0);
}

if (wasmFiles.length !== 1 || !wasmFiles[0].endsWith(join('game-core', 'game_core.wasm'))) {
  throw new Error('Web production bundle must contain exactly one game-core WebAssembly module');
}

const bytes = readFileSync(wasmFiles[0]);
const module = new WebAssembly.Module(bytes);
const exports = WebAssembly.Module.exports(module);
const allowedFunctions = new Set(['core_alloc', 'core_call', 'core_dealloc']);
for (const entry of exports) {
  if (entry.kind === 'function' && !allowedFunctions.has(entry.name)) {
    throw new Error(`Unexpected WebAssembly function export: ${entry.name}`);
  }
}
for (const name of allowedFunctions) {
  if (!exports.some((entry) => entry.kind === 'function' && entry.name === name)) {
    throw new Error(`Missing WebAssembly game-core export: ${name}`);
  }
}
if (!exports.some((entry) => entry.kind === 'memory' && entry.name === 'memory')) {
  throw new Error('WebAssembly game core does not export memory');
}

const wasmText = bytes.toString('latin1');
for (const name of [
  'contiguous_score',
  'window_pattern_score',
  'rank_score',
  'ranked_candidates',
  'find_winning_moves',
  'is_double_threat_move',
  'score_expert_root_move'
]) {
  if (wasmText.includes(name)) {
    throw new Error(`Internal game-core symbol leaked into optimized WebAssembly: ${name}`);
  }
}
