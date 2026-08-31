import { describe, expect, it } from 'vitest';
import {
  addHistoryEntry,
  createHistoryFingerprint,
  createHistoryId,
  maxHistoryEntries,
  parseHistory,
  removeLatestMatchingHistoryEntry,
  serializeHistory,
  summarizeHistory,
  type HistoryEntry
} from './history';
import type { Move } from './types';

const entry = (index: number, overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: `game-${index}`,
  completedAt: 1_700_000_000_000 + index,
  mode: 'ai',
  difficulty: 'hard',
  humanMark: 'X',
  winner: index % 2 === 0 ? 'X' : 'O',
  moves: 20 + index,
  replay: `replay-${index}`,
  ...overrides
});

const repeatedMoves: Move[] = [
  { x: 0, y: 0, mark: 'X' },
  { x: 1, y: 0, mark: 'O' },
  { x: 0, y: 1, mark: 'X' }
];

describe('game history', () => {
  it('keeps newest unique entries within the history limit', () => {
    let history: HistoryEntry[] = [];
    for (let index = 0; index < maxHistoryEntries + 5; index += 1) {
      history = addHistoryEntry(history, entry(index));
    }

    expect(history).toHaveLength(maxHistoryEntries);
    expect(history[0].id).toBe(`game-${maxHistoryEntries + 4}`);
    expect(history.at(-1)?.id).toBe('game-5');

    history = addHistoryEntry(history, entry(10, { moves: 99 }));
    expect(history[0].id).toBe('game-10');
    expect(history[0].moves).toBe(99);
    expect(history.filter((item) => item.id === 'game-10')).toHaveLength(1);
  });

  it('round-trips valid history and rejects malformed payloads', () => {
    const history = [entry(1), entry(2, { mode: 'local', difficulty: null, humanMark: null })];
    expect(parseHistory(serializeHistory(history))).toEqual(history);
    expect(parseHistory('{"version":2,"entries":[]}')).toEqual([]);
    expect(parseHistory('not-json')).toEqual([]);
  });

  it('summarizes recent games', () => {
    const summary = summarizeHistory([
      entry(1, { winner: 'X', moves: 20 }),
      entry(2, { winner: 'O', moves: 30 }),
      entry(3, { mode: 'local', difficulty: null, humanMark: null, winner: 'X', moves: 40 })
    ]);

    expect(summary).toEqual({
      games: 3,
      averageMoves: 30,
      aiWins: 1,
      aiLosses: 1,
      aiWinRate: 50
    });
  });

  it('gives repeated identical games distinct occurrence ids', () => {
    const first = createHistoryId(repeatedMoves, 'X', 1_700_000_000_000);
    const second = createHistoryId(repeatedMoves, 'X', 1_700_000_000_001);

    expect(first).not.toBe(second);
    expect(first.startsWith(`${createHistoryFingerprint(repeatedMoves, 'X')}-`)).toBe(true);
    expect(second.startsWith(`${createHistoryFingerprint(repeatedMoves, 'X')}-`)).toBe(true);
  });

  it('removes only the newest matching repeated game', () => {
    const firstId = createHistoryId(repeatedMoves, 'X', 1_700_000_000_000);
    const secondId = createHistoryId(repeatedMoves, 'X', 1_700_000_000_001);
    const history = [
      entry(2, { id: secondId, winner: 'X', moves: repeatedMoves.length }),
      entry(1, { id: firstId, winner: 'X', moves: repeatedMoves.length })
    ];

    expect(removeLatestMatchingHistoryEntry(history, repeatedMoves, 'X').map((item) => item.id)).toEqual([
      firstId
    ]);
  });
});
