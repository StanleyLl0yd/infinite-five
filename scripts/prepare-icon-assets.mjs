import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const tauriCli = join('node_modules', '@tauri-apps', 'cli', 'tauri.js');
const masterIcon = join('branding', 'infinite-five-icon-master.png');
const nativeIcons = join('src-tauri', 'icons');
const staleAndroidIcons = join(nativeIcons, 'android');
const androidRes = join('src-tauri', 'gen', 'android', 'app', 'src', 'main', 'res');

function runIcon(input, output) {
  const result = spawnSync(process.execPath, [tauriCli, 'icon', input, '--output', output], {
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    throw new Error(`Tauri icon generation failed for ${input}`);
  }
}

function copy(source, destination) {
  if (!existsSync(source)) {
    throw new Error(`Missing generated icon asset: ${source}`);
  }
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

function requireAsset(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing generated icon asset: ${path}`);
  }
}

if (!existsSync(masterIcon)) {
  throw new Error(`Missing raster master icon: ${masterIcon}`);
}

rmSync(staleAndroidIcons, { recursive: true, force: true });
runIcon(masterIcon, nativeIcons);

for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  requireAsset(join(androidRes, `mipmap-${density}`, 'ic_launcher.png'));
  requireAsset(join(androidRes, `mipmap-${density}`, 'ic_launcher_foreground.png'));
  requireAsset(join(androidRes, `mipmap-${density}`, 'ic_launcher_round.png'));
}

copy(join(nativeIcons, 'icon.png'), join('public', 'icon-512.png'));
copy(join(nativeIcons, 'icon.png'), join('public', 'icon-maskable-512.png'));
copy(join(androidRes, 'mipmap-xxxhdpi', 'ic_launcher.png'), join('public', 'icon-192.png'));
copy(join(nativeIcons, 'ios', 'AppIcon-60x60@3x.png'), join('public', 'apple-touch-icon.png'));
copy(join(nativeIcons, '32x32.png'), join('public', 'favicon-32.png'));
copy(join(nativeIcons, 'icon.png'), join('docs', 'assets', 'rustore', 'infinite-five-icon-512.png'));
