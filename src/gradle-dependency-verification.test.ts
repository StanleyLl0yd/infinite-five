import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const metadataPath = 'src-tauri/gen/android/gradle/verification-metadata.xml';
const expectedSha256 = '8f4bdf5eda5cbdf8d84a42bd8eca04e976b5b0b605cda7ce808edc4155c6c6ad';
const expectedSize = 240592;

function readWorkflowSources(): string {
  return readdirSync('.github/workflows')
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .sort()
    .map((name) => readFileSync(join('.github/workflows', name), 'utf8'))
    .join('\n');
}

describe('Gradle dependency verification', () => {
  it('keeps the independently reviewed metadata byte-for-byte', () => {
    const metadata = readFileSync(metadataPath);
    const xml = metadata.toString('utf8');

    expect(metadata.byteLength).toBe(expectedSize);
    expect(createHash('sha256').update(metadata).digest('hex')).toBe(expectedSha256);
    expect(xml).toContain('<verify-metadata>true</verify-metadata>');
    expect(xml).toContain('<verify-signatures>false</verify-signatures>');
    expect(xml).toContain('<sha256 value=');
  });

  it('does not bypass or regenerate dependency verification in CI', () => {
    const workflows = readWorkflowSources();

    expect(workflows).not.toMatch(/--dependency-verification(?:=|\s+)(?:off|lenient)\b/);
    expect(workflows).not.toContain('--write-verification-metadata');
  });
});
