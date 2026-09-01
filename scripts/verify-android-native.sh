#!/usr/bin/env bash
set -euo pipefail

AAB="${1:?AAB path is required}"
APK="${2:?APK path is required}"
EXPECTED_ABIS="arm64-v8a armeabi-v7a"

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

verify_abis "$AAB" 'base/lib/'
verify_abis "$APK" 'lib/'
verify_elf_alignment "$AAB" 'base/lib/arm64-v8a/*.so' "$TMP_DIR/aab"
verify_elf_alignment "$APK" 'lib/arm64-v8a/*.so' "$TMP_DIR/apk"

ZIPALIGN="${ZIPALIGN:-$(find "${ANDROID_HOME:?ANDROID_HOME is required}/build-tools" -type f -name zipalign | sort -V | tail -n 1)}"
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
