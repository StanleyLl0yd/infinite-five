#!/usr/bin/env bash
set -euo pipefail

AAB="${1:?AAB path is required}"
APK="${2:?APK path is required}"
EXPECTED_ABIS="arm64-v8a armeabi-v7a"
ANDROID_BUILD_TOOLS_VERSION="${ANDROID_BUILD_TOOLS_VERSION:-35.0.0}"
BUILD_TOOLS_DIR="${ANDROID_HOME:?ANDROID_HOME is required}/build-tools/$ANDROID_BUILD_TOOLS_VERSION"

for artifact in "$AAB" "$APK"; do
  test -f "$artifact"
done
command -v unzip >/dev/null
command -v readelf >/dev/null

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

verify_abis() {
  local archive="$1"
  local prefix="$2"
  local actual
  actual="$(
    unzip -Z1 "$archive" |
      awk -v prefix="$prefix" '
        index($0, prefix) == 1 && $0 ~ /\.so$/ {
          relative = substr($0, length(prefix) + 1)
          count = split(relative, parts, "/")
          if (count == 2) print parts[1]
        }
      ' |
      sort -u |
      paste -sd ' ' -
  )"
  test "$actual" = "$EXPECTED_ABIS"
}

verify_elf_alignment() {
  local archive="$1"
  local pattern="$2"
  local output="$3"
  mkdir -p "$output"
  unzip -q "$archive" "$pattern" -d "$output"
  mapfile -t libs < <(find "$output" -type f -path '*/arm64-v8a/*.so' | sort)
  test "${#libs[@]}" -gt 0
  for lib in "${libs[@]}"; do
    mapfile -t alignments < <(readelf -lW "$lib" | awk '$1 == "LOAD" { print $NF }')
    test "${#alignments[@]}" -gt 0
    for alignment in "${alignments[@]}"; do
      (( alignment >= 0x4000 ))
    done
  done
}

verify_release_elf() {
  local archive="$1"
  local pattern="$2"
  local output="$3"
  mkdir -p "$output"
  unzip -q "$archive" "$pattern" -d "$output"
  mapfile -t libs < <(find "$output" -type f -name '*.so' | sort)
  test "${#libs[@]}" -gt 0
  for lib in "${libs[@]}"; do
    if readelf -SW "$lib" | grep -Eq '\.(debug_|zdebug_|gdb_index)'; then
      echo "Debug section leaked into release library: $lib" >&2
      exit 1
    fi
    if readelf -sW "$lib" | grep -Eq 'contiguous_score|window_pattern_score|rank_score|ranked_candidates|find_winning_moves|is_double_threat_move|score_expert_root_move|expert_consensus'; then
      echo "Internal game-core symbol leaked into release library: $lib" >&2
      exit 1
    fi
  done
}

verify_native_assets() {
  local archive="$1"
  local prefix="$2"
  local assets
  assets="$(unzip -Z1 "$archive" | awk -v prefix="$prefix" 'index($0, prefix) == 1')"
  if grep -Eq '\.(map|ts|tsx|rs)$' <<<"$assets"; then
    echo "Source or source-map artifact leaked into native app assets: $archive" >&2
    exit 1
  fi
  if grep -Eq '(^|/)game_core\.wasm$' <<<"$assets"; then
    echo "WebAssembly game core leaked into native app assets: $archive" >&2
    exit 1
  fi
}

verify_abis "$AAB" 'base/lib/'
verify_abis "$APK" 'lib/'
verify_elf_alignment "$AAB" 'base/lib/arm64-v8a/*.so' "$TMP_DIR/aab-align"
verify_elf_alignment "$APK" 'lib/arm64-v8a/*.so' "$TMP_DIR/apk-align"
verify_release_elf "$AAB" 'base/lib/*/*.so' "$TMP_DIR/aab-release"
verify_release_elf "$APK" 'lib/*/*.so' "$TMP_DIR/apk-release"
verify_native_assets "$AAB" 'base/assets/'
verify_native_assets "$APK" 'assets/'

ZIPALIGN="${ZIPALIGN:-$BUILD_TOOLS_DIR/zipalign}"
test -x "$ZIPALIGN"
"$ZIPALIGN" -c -P 16 -v 4 "$APK" >/dev/null

BUNDLETOOL="${BUNDLETOOL:-$TMP_DIR/bundletool-all-1.18.3.jar}"
if [[ ! -f "$BUNDLETOOL" ]]; then
  curl --fail --location --silent --show-error \
    --output "$BUNDLETOOL" \
    https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar
fi
printf '%s  %s\n' 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29' "$BUNDLETOOL" | sha256sum --check --status
java -jar "$BUNDLETOOL" dump config --bundle="$AAB" | grep -F 'PAGE_ALIGNMENT_16K' >/dev/null

# Validate the actual release manifests, not just the Gradle source settings.
BUNDLE_MANIFEST="$(java -jar "$BUNDLETOOL" dump manifest --bundle="$AAB")"
BUNDLE_VALUE() {
  java -jar "$BUNDLETOOL" dump manifest --bundle="$AAB" --xpath="$1"
}
test "$(BUNDLE_VALUE '/manifest/@package')" = 'com.sl.infinitefive'
test "$(BUNDLE_VALUE '/manifest/uses-sdk/@android:minSdkVersion')" = '26'
test "$(BUNDLE_VALUE '/manifest/uses-sdk/@android:targetSdkVersion')" = '36'
AAB_VERSION_CODE="$(BUNDLE_VALUE '/manifest/@android:versionCode')"
[[ "$AAB_VERSION_CODE" =~ ^[0-9]+$ ]]
(( AAB_VERSION_CODE > 0 && AAB_VERSION_CODE <= 2100000000 ))
AAB_VERSION_NAME="$(BUNDLE_VALUE '/manifest/@android:versionName')"
EXPECTED_VERSION="$(node -p "require('./package.json').version")"
EXPECTED_VERSION_CODE="$(node -e "const [major, minor, patch] = require('./package.json').version.split('.').map(Number); console.log(major * 1000000 + minor * 1000 + patch)")"
test "$AAB_VERSION_NAME" = "$EXPECTED_VERSION"
test "$AAB_VERSION_CODE" = "$EXPECTED_VERSION_CODE"

AAPT="$BUILD_TOOLS_DIR/aapt"
test -x "$AAPT"
BADGING="$("$AAPT" dump badging "$APK")"
grep -F "package: name='com.sl.infinitefive'" <<<"$BADGING" >/dev/null
grep -F "sdkVersion:'26'" <<<"$BADGING" >/dev/null
grep -F "targetSdkVersion:'36'" <<<"$BADGING" >/dev/null
APK_VERSION_CODE="$(sed -n "s/.*versionCode='\\([0-9][0-9]*\\)'.*/\\1/p" <<<"$BADGING" | head -n 1)"
APK_VERSION_NAME="$(sed -n "s/.*versionName='\\([^']*\\)'.*/\\1/p" <<<"$BADGING" | head -n 1)"
test "$AAB_VERSION_CODE" = "$APK_VERSION_CODE"
test "$AAB_VERSION_NAME" = "$APK_VERSION_NAME"

if grep -Eq 'android:(debuggable|testOnly|usesCleartextTraffic)="true"' <<<"$BUNDLE_MANIFEST" ||
  grep -F "uses-permission: name='android.permission.INTERNET'" <<<"$BADGING" >/dev/null; then
  echo 'Store release is debuggable, test-only, permits cleartext, or requests Internet access.' >&2
  exit 1
fi
