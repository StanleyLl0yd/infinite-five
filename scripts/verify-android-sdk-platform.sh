#!/usr/bin/env bash
set -euo pipefail

CONFIG="${ANDROID_SDK_PLATFORM_CONFIG:-.github/android-sdk-platform.txt}"
test -f "$CONFIG"

mapfile -t config_lines < "$CONFIG"
test "${#config_lines[@]}" -eq 4

read_value() {
  local key="$1"
  local line="$2"
  [[ "$line" == "$key="* ]]
  printf '%s' "${line#*=}"
}

API_LEVEL="$(read_value api_level "${config_lines[0]}")"
REVISION="$(read_value revision "${config_lines[1]}")"
EXTENSION_LEVEL="$(read_value extension_level "${config_lines[2]}")"
EXPECTED_SHA256="$(read_value tree_sha256 "${config_lines[3]}")"

[[ "$API_LEVEL" =~ ^[0-9]+$ ]]
[[ "$REVISION" =~ ^[0-9]+([.][0-9]+)*$ ]]
[[ "$EXTENSION_LEVEL" =~ ^[0-9]+$ ]]
[[ "$EXPECTED_SHA256" =~ ^[0-9a-f]{64}$ ]]

: "${ANDROID_HOME:?ANDROID_HOME is required}"
PLATFORM_DIR="$ANDROID_HOME/platforms/android-$API_LEVEL"
PROPERTIES="$PLATFORM_DIR/source.properties"
test -d "$PLATFORM_DIR"
test -f "$PROPERTIES"

grep -Fx "Pkg.Revision=$REVISION" "$PROPERTIES"
grep -Fx "AndroidVersion.ApiLevel=$API_LEVEL" "$PROPERTIES"
grep -Fx "AndroidVersion.ExtensionLevel=$EXTENSION_LEVEL" "$PROPERTIES"

ACTUAL_SHA256="$({
  cd "$PLATFORM_DIR"
  find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum
} | sha256sum | awk '{print $1}')"

test "$ACTUAL_SHA256" = "$EXPECTED_SHA256"
printf 'Android SDK Platform API %s revision %s extension %s verified: %s\n' \
  "$API_LEVEL" "$REVISION" "$EXTENSION_LEVEL" "$ACTUAL_SHA256"
