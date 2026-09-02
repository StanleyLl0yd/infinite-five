import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const tauriCli = join('node_modules', '@tauri-apps', 'cli', 'tauri.js');
const masterIcon = join('branding', 'infinite-five-icon-master.png');
const nativeIcons = join('src-tauri', 'icons');
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

if (!existsSync(masterIcon)) {
  throw new Error(`Missing raster icon master: ${masterIcon}`);
}

runIcon(masterIcon, nativeIcons);

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#041230</color>
</resources>
`;
const sourceAdaptiveDir = join(nativeIcons, 'android', 'mipmap-anydpi-v26');
const sourceValuesDir = join(nativeIcons, 'android', 'values');
mkdirSync(sourceAdaptiveDir, { recursive: true });
mkdirSync(sourceValuesDir, { recursive: true });
writeFileSync(join(sourceAdaptiveDir, 'ic_launcher.xml'), adaptiveXml);
writeFileSync(join(sourceAdaptiveDir, 'ic_launcher_round.xml'), adaptiveXml);
writeFileSync(join(sourceValuesDir, 'ic_launcher_background.xml'), backgroundXml);

for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  copy(join(nativeIcons, 'android', `mipmap-${density}`), join(androidRes, `mipmap-${density}`));
}
copy(sourceAdaptiveDir, join(androidRes, 'mipmap-anydpi-v26'));
copy(join(sourceValuesDir, 'ic_launcher_background.xml'), join(androidRes, 'values', 'ic_launcher_background.xml'));

copy(join(nativeIcons, 'icon.png'), join('public', 'icon-512.png'));
copy(join(nativeIcons, 'android', 'mipmap-xxxhdpi', 'ic_launcher.png'), join('public', 'icon-192.png'));
copy(join(nativeIcons, 'ios', 'AppIcon-60x60@3x.png'), join('public', 'apple-touch-icon.png'));
copy(join(nativeIcons, '32x32.png'), join('public', 'favicon-32.png'));
copy(join(nativeIcons, 'icon.png'), join('public', 'icon-maskable-512.png'));
copy(join(nativeIcons, 'icon.png'), join('docs', 'assets', 'rustore', 'infinite-five-icon-512.png'));
