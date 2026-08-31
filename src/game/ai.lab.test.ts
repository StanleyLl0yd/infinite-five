import { describe, expect, it } from 'vitest';
import { chooseAiMove, type AiDifficulty, type AiSearchDiagnostics } from './ai';
import { Board } from './board';
import type { Mark, Move } from './types';
import { getWinningLine } from './win';

interface MatchResult {
  winner: Mark | null;
  moves: Move[];
}

const opposite = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');

const playMatch = (
  xDifficulty: AiDifficulty,
  oDifficulty: AiDifficulty,
  seed: number,
  maxMoves = 24
): MatchResult => {
  const board = new Board();
  let mark: Mark = 'X';

  for (let ply = 0; ply < maxMoves; ply += 1) {
    const difficulty = mark === 'X' ? xDifficulty : oDifficulty;
    const position = chooseAiMove(board, mark, difficulty, {
      seed: seed + ply * 97,
      timeBudgetMs: difficulty === 'expert' ? 55 : difficulty === 'hard' ? 35 : 20,
      maxDepth: difficulty === 'expert' ? 2 : undefined
    });

    expect(board.get(position.x, position.y)).toBeUndefined();
    expect(board.place(position.x, position.y, mark)).toBe(true);
    const move = board.getMoves()[board.getMoves().length - 1];
    if (getWinningLine(board, move)) {
      return { winner: mark, moves: [...board.getMoves()] };
    }
    mark = opposite(mark);
  }

  return { winner: null, moves: [...board.getMoves()] };
};

describe('AI lab', () => {
  it('runs deterministic Expert versus Hard self-play with legal moves', () => {
    const first = playMatch('expert', 'hard', 101);
    const second = playMatch('expert', 'hard', 101);

    expect(second).toEqual(first);
    expect(first.moves.length).toBeGreaterThan(0);
  });

  it('runs the mirrored Hard versus Expert matchup', () => {
    const result = playMatch('hard', 'expert', 211);
    expect(result.moves.length).toBeGreaterThan(0);
    expect(result.moves.length).toBeLessThanOrEqual(24);
  });

  it('captures search-depth and node diagnostics for a representative position', () => {
    const board = new Board();
    const moves: Move[] = [
      { x: 0, y: 0, mark: 'X' },
      { x: 1, y: 0, mark: 'O' },
      { x: 0, y: 1, mark: 'X' },
      { x: 1, y: 1, mark: 'O' },
      { x: -1, y: 0, mark: 'X' },
      { x: 2, y: 1, mark: 'O' },
      { x: -1, y: 1, mark: 'X' },
      { x: 2, y: 0, mark: 'O' }
    ];
    board.restore(moves);

    const diagnostics: AiSearchDiagnostics = {
      nodes: 0,
      completedDepth: 0,
      rootCandidates: 0,
      elapsedMs: 0,
      timedOut: false
    };

    const position = chooseAiMove(board, 'X', 'expert', {
      seed: 313,
      timeBudgetMs: 500,
      maxDepth: 3,
      diagnostics
    });

    expect(board.get(position.x, position.y)).toBeUndefined();
    expect(diagnostics.rootCandidates).toBeGreaterThan(0);
    expect(diagnostics.completedDepth).toBeLessThanOrEqual(3);
    expect(diagnostics.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
