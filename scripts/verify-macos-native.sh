#!/usr/bin/env bash
set -euo pipefail

APP="${1:?macOS app path is required}"
test -d "$APP"
command -v lipo >/dev/null
command -v otool >/dev/null
command -v nm >/dev/null

BINARY="$(find "$APP/Contents/MacOS" -maxdepth 1 -type f -perm -111 -print -quit)"
test -f "$BINARY"

ARCHS="$(lipo -archs "$BINARY")"
[[ " $ARCHS " == *" arm64 "* ]]
[[ " $ARCHS " == *" x86_64 "* ]]

if otool -l "$BINARY" | grep -F '__DWARF' >/dev/null; then
  echo "DWARF segment leaked into release binary: $BINARY" >&2
  exit 1
fi

if nm -a "$BINARY" 2>/dev/null | grep -Eq 'contiguous_score|window_pattern_score|rank_score|ranked_candidates|find_winning_moves|is_double_threat_move|score_expert_root_move|expert_consensus'; then
  echo "Internal game-core symbol leaked into release binary: $BINARY" >&2
  exit 1
fi

if find "$APP" -type d -name '*.dSYM' -print -quit | grep -q .; then
  echo "dSYM leaked into application bundle" >&2
  exit 1
fi
if find "$APP" -type f \( -name '*.map' -o -name '*.ts' -o -name '*.tsx' -o -name 'game_core.wasm' \) -print -quit | grep -q .; then
  echo "Source, source-map, or WebAssembly core leaked into native application bundle" >&2
  exit 1
fi
