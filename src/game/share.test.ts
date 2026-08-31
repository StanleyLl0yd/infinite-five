import { describe, expect, it } from 'vitest';
import type { Move } from './types';
import { createShareUrl, decodeSharedGame, encodeSharedGame, readSharedGameFromHash } from './share';

const moves: Move[] = [
  { x: 12, y: -3, mark: 'X' },
  { x: 13, y: -3, mark: 'O' },
  { x: 12, y: -2, mark: 'X' }
];

describe('shared games', () => {
  it('round-trips compact move data and restores alternating marks', () => {
    const encoded = encodeSharedGame(moves);
    expect(decodeSharedGame(encoded)).toEqual(moves);
  });

  it('rejects duplicate cells', () => {
    const encoded = encodeSharedGame([
      { x: 0, y: 0, mark: 'X' },
      { x: 0, y: 0, mark: 'O' }
    ]);
    expect(decodeSharedGame(encoded)).toBeNull();
  });

  it('creates and reads a shareable URL hash', () => {
    const url = createShareUrl(moves, 'https://example.com/infinite-five/');
    const parsed = new URL(url);
    expect(readSharedGameFromHash(parsed.hash)).toEqual(moves);
  });
});
