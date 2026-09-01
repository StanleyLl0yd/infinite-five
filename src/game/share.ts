import type { Move } from './types';

interface SharedPayload {
  v: 1;
  m: Array<readonly [number, number]>;
}

const maxSharedMoves = 2_000;
const maxCoordinate = 1_000_000;

const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

const fromBase64Url = (value: string): string => {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const isCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && Math.abs(value) <= maxCoordinate;

export const encodeSharedGame = (moves: readonly Move[]): string => {
  if (moves.length === 0 || moves.length > maxSharedMoves) {
    throw new Error('Game cannot be shared');
  }

  const payload: SharedPayload = {
    v: 1,
    m: moves.map(({ x, y }) => [x, y] as const)
  };
  return toBase64Url(JSON.stringify(payload));
};

export const decodeSharedGame = (encoded: string): Move[] | null => {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<SharedPayload>;
    if (parsed.v !== 1 || !Array.isArray(parsed.m) || parsed.m.length === 0 || parsed.m.length > maxSharedMoves) {
      return null;
    }

    const seen = new Set<string>();
    const moves: Move[] = [];
    for (let index = 0; index < parsed.m.length; index += 1) {
      const pair = parsed.m[index];
      if (!Array.isArray(pair) || pair.length !== 2 || !isCoordinate(pair[0]) || !isCoordinate(pair[1])) {
        return null;
      }

      const [x, y] = pair;
      const key = `${x},${y}`;
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);
      moves.push({ x, y, mark: index % 2 === 0 ? 'X' : 'O' });
    }
    return moves;
  } catch {
    return null;
  }
};

export const readSharedGameFromHash = (hash: string): Move[] | null => {
  const match = hash.match(/(?:^#|&)game=([^&]+)/u);
  return match ? decodeSharedGame(match[1]) : null;
};

export const createShareUrl = (moves: readonly Move[], currentUrl: string): string => {
  const url = new URL(currentUrl);
  url.hash = `game=${encodeSharedGame(moves)}`;
  return url.toString();
};
