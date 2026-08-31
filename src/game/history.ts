import type { AiDifficulty } from './ai';
import type { Mark, Move } from './types';

export type HistoryGameMode = 'ai' | 'local';

export interface HistoryEntry {
  id: string;
  completedAt: number;
  mode: HistoryGameMode;
  difficulty: AiDifficulty | null;
  humanMark: Mark | null;
  winner: Mark;
  moves: number;
  replay: string | null;
}

export interface HistorySummary {
  games: number;
  averageMoves: number;
  aiWins: number;
  aiLosses: number;
  aiWinRate: number;
}

interface HistoryPayload {
  version: 1;
  entries: HistoryEntry[];
}

export const maxHistoryEntries = 20;

const isMark = (value: unknown): value is Mark => value === 'X' || value === 'O';
const isMode = (value: unknown): value is HistoryGameMode => value === 'ai' || value === 'local';
const isDifficulty = (value: unknown): value is AiDifficulty =>
  value === 'easy' || value === 'medium' || value === 'hard' || value === 'expert';

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<HistoryEntry>;
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    entry.id.length <= 96 &&
    Number.isFinite(entry.completedAt) &&
    (entry.completedAt ?? 0) > 0 &&
    isMode(entry.mode) &&
    (entry.difficulty === null || isDifficulty(entry.difficulty)) &&
    (entry.humanMark === null || isMark(entry.humanMark)) &&
    isMark(entry.winner) &&
    Number.isInteger(entry.moves) &&
    (entry.moves ?? 0) > 0 &&
    (entry.replay === null || (typeof entry.replay === 'string' && entry.replay.length <= 250_000))
  );
};

export const createHistoryId = (moves: readonly Move[], winner: Mark): string => {
  let hash = 2_166_136_261;
  for (const move of moves) {
    hash ^= move.x;
    hash = Math.imul(hash, 16_777_619);
    hash ^= move.y;
    hash = Math.imul(hash, 16_777_619);
    hash ^= move.mark === 'X' ? 88 : 79;
    hash = Math.imul(hash, 16_777_619);
  }
  hash ^= winner === 'X' ? 88 : 79;
  hash = Math.imul(hash, 16_777_619);
  return `${moves.length}-${winner}-${(hash >>> 0).toString(36)}`;
};

export const addHistoryEntry = (
  entries: readonly HistoryEntry[],
  entry: HistoryEntry
): HistoryEntry[] => [entry, ...entries.filter((item) => item.id !== entry.id)].slice(0, maxHistoryEntries);

export const parseHistory = (raw: string | null): HistoryEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<HistoryPayload>;
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(isHistoryEntry).slice(0, maxHistoryEntries);
  } catch {
    return [];
  }
};

export const serializeHistory = (entries: readonly HistoryEntry[]): string =>
  JSON.stringify({ version: 1, entries: entries.slice(0, maxHistoryEntries) } satisfies HistoryPayload);

export const summarizeHistory = (entries: readonly HistoryEntry[]): HistorySummary => {
  const aiGames = entries.filter((entry) => entry.mode === 'ai' && entry.humanMark !== null);
  const aiWins = aiGames.filter((entry) => entry.winner === entry.humanMark).length;
  const aiLosses = aiGames.length - aiWins;
  const averageMoves = entries.length === 0
    ? 0
    : Math.round((entries.reduce((sum, entry) => sum + entry.moves, 0) / entries.length) * 10) / 10;

  return {
    games: entries.length,
    averageMoves,
    aiWins,
    aiLosses,
    aiWinRate: aiGames.length === 0 ? 0 : Math.round((aiWins / aiGames.length) * 100)
  };
};
