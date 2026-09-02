from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"expected {expected} matches in {path}, found {count}")
    file.write_text(text.replace(old, new), encoding="utf-8")


replace_exact("package.json", '"version": "0.6.0"', '"version": "0.6.1"')
replace_exact("package-lock.json", '"version": "0.6.0"', '"version": "0.6.1"', 3)
replace_exact("src-tauri/tauri.conf.json", '"version": "0.6.0"', '"version": "0.6.1"')
replace_exact("src-tauri/Cargo.toml", 'version = "0.6.0"', 'version = "0.6.1"')
replace_exact("crates/game-core/Cargo.toml", 'version = "0.6.0"', 'version = "0.6.1"')
