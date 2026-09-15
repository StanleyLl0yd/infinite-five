#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
import tomllib
from pathlib import Path


def fail(message: str) -> None:
    raise SystemExit(message)


def main() -> None:
    if len(sys.argv) > 2:
        fail('usage: install-rust-toolchain.py [rust-toolchain.toml]')

    path = Path(sys.argv[1] if len(sys.argv) == 2 else 'rust-toolchain.toml')
    if not path.is_file():
        fail(f'missing Rust toolchain file: {path}')

    try:
        document = tomllib.loads(path.read_text(encoding='utf-8'))
    except (OSError, UnicodeError, tomllib.TOMLDecodeError) as error:
        fail(f'cannot read Rust toolchain file {path}: {error}')

    if set(document) != {'toolchain'} or not isinstance(document['toolchain'], dict):
        fail('rust-toolchain.toml must contain only one [toolchain] table')

    toolchain = document['toolchain']
    expected_keys = {'channel', 'profile', 'components'}
    if set(toolchain) != expected_keys:
        fail(f'[toolchain] keys must be exactly {sorted(expected_keys)}')

    channel = toolchain['channel']
    profile = toolchain['profile']
    components = toolchain['components']

    if not isinstance(channel, str) or re.fullmatch(r'\d+\.\d+\.\d+', channel) is None:
        fail('toolchain.channel must be an exact stable Rust release')
    if not isinstance(profile, str) or profile not in {'minimal', 'default', 'complete'}:
        fail('toolchain.profile must be a supported rustup profile')
    if (
        not isinstance(components, list)
        or not components
        or any(not isinstance(component, str) or not component for component in components)
        or len(set(components)) != len(components)
    ):
        fail('toolchain.components must be a non-empty list of unique component names')

    command = ['rustup', 'toolchain', 'install', channel, '--profile', profile]
    for component in components:
        command.extend(['--component', component])
    subprocess.run(command, check=True)

    version_output = subprocess.check_output(
        ['rustup', 'run', channel, 'rustc', '--version'],
        text=True,
    ).strip()
    fields = version_output.split()
    if len(fields) < 2 or fields[0] != 'rustc' or fields[1] != channel:
        fail(f'installed Rust version mismatch: expected {channel}, got {version_output}')

    print(f'Rust toolchain {channel} installed with profile {profile}: {", ".join(components)}')


if __name__ == '__main__':
    main()
