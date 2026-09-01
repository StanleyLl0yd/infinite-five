from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(text.replace(old, new))


replace(
    'src/game/ai.ts',
    """  const ranked = candidates
    .map((position) => ({
      position,
      score: rankScore(board, position, mark)
    }))
    .sort((a, b) => b.score - a.score);""",
    """  const ranked = rankedCandidates(board, mark, 1);"""
)
replace(
    'src/game/ai.ts',
    """  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  const bestScore = ranked[0]?.score ?? 0;""",
    """  if (blocks.length > 0) return blocks[0];

  const bestScore = ranked[0].score;"""
)
replace(
    'src/game/ai.ts',
    """  return [...pool]
    .sort(
      (a, b) =>
        b.score + positionNoise(b.position, seed) * 0.02 * Math.max(1, bestScore) -
        (a.score + positionNoise(a.position, seed) * 0.02 * Math.max(1, bestScore))
    )[0]?.position ?? ranked[0].position;""",
    """  return pool.sort(
    (a, b) =>
      b.score + positionNoise(b.position, seed) * 0.02 * Math.max(1, bestScore) -
      (a.score + positionNoise(a.position, seed) * 0.02 * Math.max(1, bestScore))
  )[0].position;"""
)
replace(
    'src/game/ai.ts',
    """  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  const opponentForks = findDoubleThreatMoves(""",
    """  if (blocks.length > 0) return blocks[0];

  const opponentForks = findDoubleThreatMoves("""
)
replace('src/game/ai.ts', 'if (Date.now() >= context.deadline && best)', 'if (Date.now() >= context.deadline)')
replace(
    'src/game/ai.ts',
    'if (!iterationComplete || scored.length !== ordered.length)',
    'if (!iterationComplete)'
)
replace('src/game/ai.ts', '    ordered = ordered.sort(\n', '    ordered.sort(\n')

replace('src/main.ts', "      unavailable.className = 'history-replay-unavailable';\n", '')
replace(
    'src/main.ts',
    '  const moves = replay?.moves ?? [...board.getMoves()];',
    '  const moves = replay?.moves ?? board.getMoves();'
)
replace(
    'src/main.ts',
    'const loadedSavedGame = sharedMoves ? false : loadSavedGame();',
    'const loadedSavedGame = !sharedMoves && loadSavedGame();'
)

canvas = Path('src/ui/canvas-board.ts')
canvas_text = canvas.read_text()
old_interfaces = """interface ScreenPoint {
  x: number;
  y: number;
}

interface WorldPoint {
  x: number;
  y: number;
}"""
if canvas_text.count(old_interfaces) != 1:
    raise SystemExit('canvas-board.ts: point interfaces changed unexpectedly')
canvas_text = canvas_text.replace(old_interfaces, """interface Point {
  x: number;
  y: number;
}""")
canvas_text = canvas_text.replace('ScreenPoint', 'Point').replace('WorldPoint', 'Point')
if canvas_text.count("  private pointerType = 'mouse';\n") != 1:
    raise SystemExit('canvas-board.ts: pointerType field changed unexpectedly')
canvas_text = canvas_text.replace("  private pointerType = 'mouse';\n", '')
if canvas_text.count('      this.pointerType = event.pointerType;\n') != 1:
    raise SystemExit('canvas-board.ts: pointerType assignment changed unexpectedly')
canvas_text = canvas_text.replace('      this.pointerType = event.pointerType;\n', '')
old_threshold = "      const threshold = this.pointerType === 'touch' ? 10 : 5;"
if canvas_text.count(old_threshold) != 1:
    raise SystemExit('canvas-board.ts: pointer threshold changed unexpectedly')
canvas_text = canvas_text.replace(old_threshold, "      const threshold = event.pointerType === 'touch' ? 10 : 5;")
canvas.write_text(canvas_text)

tsconfig = Path('tsconfig.json')
tsconfig_text = tsconfig.read_text()
for line in [
    '    "useDefineForClassFields": true,\n',
    '    "allowImportingTsExtensions": false,\n',
    '    "resolveJsonModule": true,\n'
]:
    if tsconfig_text.count(line) != 1:
        raise SystemExit(f'tsconfig.json: expected one {line.strip()}')
    tsconfig_text = tsconfig_text.replace(line, '')
tsconfig.write_text(tsconfig_text)

pwa_types = Path('src/virtual-pwa.d.ts')
if not pwa_types.exists():
    raise SystemExit('src/virtual-pwa.d.ts is already missing')
pwa_types.unlink()

native = Path('.github/workflows/native.yml')
native_text = native.read_text()
for block in [
    """      - name: Verify application identity
        run: |
          grep -F '\"identifier\": \"com.sl.infinitefive\"' src-tauri/tauri.conf.json
          grep -F 'namespace = \"com.sl.infinitefive\"' src-tauri/gen/android/app/build.gradle.kts
          grep -F 'applicationId = \"com.sl.infinitefive\"' src-tauri/gen/android/app/build.gradle.kts
          test -f src-tauri/gen/android/app/src/main/java/com/sl/infinitefive/MainActivity.kt
          grep -F 'package com.sl.infinitefive' src-tauri/gen/android/app/src/main/java/com/sl/infinitefive/MainActivity.kt
          test -f src-tauri/gen/android/buildSrc/src/main/java/com/sl/infinitefive/kotlin/BuildTask.kt
          test -f src-tauri/gen/android/buildSrc/src/main/java/com/sl/infinitefive/kotlin/RustPlugin.kt
          ! test -e src-tauri/gen/android/app/src/main/java/io/github/stanleyll0yd/infinitefive/MainActivity.kt
          ! test -e src-tauri/gen/android/buildSrc/src/main/java/io/github/stanleyll0yd/infinitefive
          ! grep -R -F 'io.github.stanleyll0yd.infinitefive' src-tauri --exclude-dir=target

""",
    """      - name: Verify application identity
        run: |
          grep -F '\"identifier\": \"com.sl.infinitefive\"' src-tauri/tauri.conf.json

""",
    """      - name: Verify APK output
        run: test -n \"$(find src-tauri/gen/android -type f -name '*.apk' -print -quit)\"

""",
    """      - name: Verify DMG output
        run: test -n \"$(find src-tauri/target -type f -name '*.dmg' -print -quit)\"

"""
]:
    if native_text.count(block) != 1:
        raise SystemExit('native.yml: verification block changed unexpectedly')
    native_text = native_text.replace(block, '')
native.write_text(native_text)

release = Path('.github/workflows/release.yml')
release_text = release.read_text()
self_trigger = '      - .github/workflows/release.yml\n'
if release_text.count(self_trigger) != 1:
    raise SystemExit('release.yml: self-trigger path changed unexpectedly')
release_text = release_text.replace(self_trigger, '')
old_checkout = 'actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6'
new_checkout = 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1'
if release_text.count(old_checkout) != 1:
    raise SystemExit('release.yml: checkout pin changed unexpectedly')
release.write_text(release_text.replace(old_checkout, new_checkout))

native_release = Path('.github/workflows/native-release.yml')
native_release_text = native_release.read_text()
self_trigger = '      - .github/workflows/native-release.yml\n'
if native_release_text.count(self_trigger) != 1:
    raise SystemExit('native-release.yml: self-trigger path changed unexpectedly')
native_release_text = native_release_text.replace(self_trigger, '')
version_output = '      version: ${{ steps.release.outputs.version }}\n'
if native_release_text.count(version_output) != 1:
    raise SystemExit('native-release.yml: version output changed unexpectedly')
native_release_text = native_release_text.replace(
    version_output,
    version_output + '      source_sha: ${{ steps.release.outputs.source_sha }}\n'
)
tag_output = '          echo "tag=$TAG" >> "$GITHUB_OUTPUT"\n'
if native_release_text.count(tag_output) != 1:
    raise SystemExit('native-release.yml: tag output changed unexpectedly')
native_release_text = native_release_text.replace(
    tag_output,
    tag_output + '          echo "source_sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"\n'
)
tag_env = '          TAG: ${{ needs.android.outputs.tag }}\n'
if native_release_text.count(tag_env) != 1:
    raise SystemExit('native-release.yml: publish tag env changed unexpectedly')
native_release_text = native_release_text.replace(
    tag_env,
    tag_env + '          SOURCE_SHA: ${{ needs.android.outputs.source_sha }}\n'
)
upload = '              gh release upload "$TAG" release/* --repo "$GITHUB_REPOSITORY" --clobber\n'
if native_release_text.count(upload) != 1:
    raise SystemExit('native-release.yml: release upload changed unexpectedly')
native_release_text = native_release_text.replace(
    upload,
    '              TAG_SHA="$(gh api "repos/$GITHUB_REPOSITORY/commits/$TAG" --jq .sha)"\n'
    '              test "$TAG_SHA" = "$SOURCE_SHA"\n'
    + upload
)
native_release.write_text(native_release_text)
