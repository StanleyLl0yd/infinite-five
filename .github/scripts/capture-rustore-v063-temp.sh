#!/usr/bin/env bash
set -euo pipefail

mkdir -p capture/raw capture/ui

gh release download v0.6.3 --repo "$GITHUB_REPOSITORY" --pattern 'Infinite-Five-v0.6.3-Android.apk' --dir capture
APK='capture/Infinite-Five-v0.6.3-Android.apk'
PACKAGE='com.sl.infinitefive'
test -s "$APK"
echo 'cd951a2d6be1f2c5a0ca10e5a314ba03737be356b714eb5e5a3405355a1673d4  capture/Infinite-Five-v0.6.3-Android.apk' | sha256sum -c -
sha256sum "$APK" > capture/APK-SHA256.txt

adb install -r "$APK"
adb shell settings put global policy_control immersive.full='*' || true
adb shell wm size 1080x1920
adb shell wm density 420
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
test "$(adb shell wm size | tr -d '\r')" = 'Physical size: 1080x1920'

adb shell am force-stop "$PACKAGE"
adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 5

dump_ui() {
  local name="$1"
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/window.xml "capture/ui/${name}.xml" >/dev/null 2>&1 || true
}

shot() {
  local name="$1"
  adb exec-out screencap -p > "capture/raw/${name}.png"
  test -s "capture/raw/${name}.png"
  dump_ui "$name"
}

tap_text() {
  local needle="$1"
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/window.xml /tmp/window.xml >/dev/null 2>&1 || true
  NEEDLE="$needle" python3 - <<'PY'
import os, re, subprocess, sys, xml.etree.ElementTree as ET
needle = os.environ['NEEDLE'].casefold()
try:
    root = ET.parse('/tmp/window.xml').getroot()
except Exception:
    sys.exit(2)
for node in root.iter('node'):
    hay = ' '.join((node.attrib.get('text', ''), node.attrib.get('content-desc', ''))).casefold()
    if needle in hay:
        match = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if match:
            x1, y1, x2, y2 = map(int, match.groups())
            subprocess.run(['adb', 'shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2)], check=True)
            sys.exit(0)
sys.exit(1)
PY
}

shot 01-home-en

tap_text 'Settings' || adb shell input tap 940 95
sleep 1
tap_text 'System / browser' || adb shell input tap 540 950
sleep 1
tap_text 'Русский' || true
sleep 1
tap_text 'Save' || adb shell input tap 800 1540
sleep 2
shot 02-home-ru

tap_text 'Легко' || tap_text 'Easy' || adb shell input tap 760 360
sleep 1
tap_text 'Эксперт' || tap_text 'Expert' || adb shell input tap 760 620
sleep 1
adb shell input tap 540 1050
sleep 2
adb shell input tap 690 1050
sleep 2
adb shell input tap 540 1200
sleep 2
adb shell input tap 690 1200
sleep 2
shot 03-expert-midgame

tap_text 'Против компьютера' || tap_text 'Vs computer' || adb shell input tap 300 360
sleep 1
tap_text 'Два игрока' || tap_text 'Two players' || true
sleep 1
tap_text 'Новая игра' || tap_text 'New game' || adb shell input tap 1010 95
sleep 2
adb shell input tap 300 1000
adb shell input tap 300 1300
adb shell input tap 450 1000
adb shell input tap 450 1300
adb shell input tap 600 1000
adb shell input tap 600 1300
adb shell input tap 750 1000
adb shell input tap 750 1300
adb shell input tap 900 1000
sleep 2
shot 04-win-dialog

tap_text 'Закрыть' || tap_text 'Close' || adb shell input tap 330 1450
sleep 2
shot 05-winning-board

tap_text 'Настройки' || tap_text 'Settings' || adb shell input tap 940 95
sleep 2
shot 06-settings

tap_text 'Закрыть' || tap_text 'Close' || adb shell input tap 330 1540
sleep 1
tap_text 'История' || tap_text 'History' || adb shell input tap 895 95
sleep 2
shot 07-history

adb shell wm size > capture/ui/wm-size.txt
adb shell wm density > capture/ui/wm-density.txt
adb shell dumpsys package "$PACKAGE" > capture/ui/package-dump.txt

python3 - <<'PY'
import hashlib, pathlib, struct
root = pathlib.Path('capture/raw')
expected = [
    '01-home-en.png',
    '02-home-ru.png',
    '03-expert-midgame.png',
    '04-win-dialog.png',
    '05-winning-board.png',
    '06-settings.png',
    '07-history.png',
]
actual = sorted(p.name for p in root.glob('*.png'))
assert actual == sorted(expected), (actual, expected)
lines = []
for name in expected:
    data = (root / name).read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', name
    width, height = struct.unpack('>II', data[16:24])
    assert (width, height) == (1080, 1920), (name, width, height)
    digest = hashlib.sha256(data).hexdigest()
    lines.append(f'{digest}  {name}')
    print(f'{name}: {width}x{height}, {len(data)} bytes, sha256:{digest}')
pathlib.Path('capture/SCREENSHOTS-SHA256.txt').write_text('\n'.join(lines) + '\n')
PY
