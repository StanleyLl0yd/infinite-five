#!/usr/bin/env bash
set -euo pipefail

TAG="${RELEASE_TAG:?RELEASE_TAG is required}"
ASSET="Infinite-Five-${TAG}-Android.apk"
OUT="docs/assets/rustore/screenshots"
TMP="$RUNNER_TEMP/infinite-five-rustore"

rm -rf "$TMP"
mkdir -p "$TMP" "$OUT/probe"
gh release download "$TAG" --repo "$GITHUB_REPOSITORY" --pattern "$ASSET" --dir "$TMP"
APK="$TMP/$ASSET"
test -f "$APK"
adb install -r "$APK"

adb shell wm size 1080x1920
adb shell wm density 420
adb shell settings put global policy_control immersive.full='*' || true
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
adb shell am force-stop com.sl.infinitefive
adb shell monkey -p com.sl.infinitefive -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 5

adb exec-out screencap -p > "$OUT/probe/home.png"
adb shell uiautomator dump /sdcard/window.xml >/dev/null
adb pull /sdcard/window.xml "$OUT/probe/home.xml" >/dev/null
adb shell wm size > "$OUT/probe/wm-size.txt"
adb shell wm density > "$OUT/probe/wm-density.txt"
adb shell dumpsys window > "$OUT/probe/window.txt"
adb shell dumpsys package com.sl.infinitefive > "$OUT/probe/package.txt"

sips -g pixelWidth -g pixelHeight "$OUT/probe/home.png"
grep -q "versionName=0.6.0" "$OUT/probe/package.txt"
