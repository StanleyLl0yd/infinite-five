import { describe, expect, it } from 'vitest';
import { chooseAiMove, type AiSearchDiagnostics } from './ai';
import { Board } from './board';

const populateDoubleThreatBoard = (): Board => {
  const board = new Board();
  board.place(-1, 0, 'O');
  board.place(1, 0, 'O');
  board.place(0, -1, 'O');
  board.place(0, 1, 'O');
  board.place(-3, -3, 'X');
  return board;
};

describe('chooseAiMove', () => {
  it('takes an immediate winning move', () => {
    const board = new Board();
    board.place(0, 0, 'O');
    board.place(1, 0, 'O');
    board.place(2, 0, 'O');
    board.place(3, 0, 'O');

    const move = chooseAiMove(board, 'O', 'medium', { seed: 1 });
    expect([{ x: -1, y: 0 }, { x: 4, y: 0 }]).toContainEqual(move);
  });

  it('blocks an immediate loss on hard', () => {
    const board = new Board();
    board.place(0, 0, 'X');
    board.place(1, 0, 'X');
    board.place(2, 0, 'X');
    board.place(3, 0, 'X');

    const move = chooseAiMove(board, 'O', 'hard', { seed: 2 });
    expect([{ x: -1, y: 0 }, { x: 4, y: 0 }]).toContainEqual(move);
  });

  it('returns an empty nearby cell', () => {
    const board = new Board();
    board.place(0, 0, 'X');
    board.place(1, 0, 'O');

    const move = chooseAiMove(board, 'X', 'medium', { seed: 3 });
    expect(board.get(move.x, move.y)).toBeUndefined();
    expect(Math.max(Math.abs(move.x), Math.abs(move.y))).toBeLessThanOrEqual(3);
  });

  it('finds a double-threat intersection on expert', () => {
    const board = populateDoubleThreatBoard();
    const move = chooseAiMove(board, 'O', 'expert', { seed: 4, timeBudgetMs: 300 });
    expect(move).toEqual({ x: 0, y: 0 });
  });

  it('blocks a single opponent double-threat intersection on expert', () => {
    const board = new Board();
    board.place(-1, 0, 'X');
    board.place(1, 0, 'X');
    board.place(0, -1, 'X');
    board.place(0, 1, 'X');
    board.place(-3, -3, 'O');

    const move = chooseAiMove(board, 'O', 'expert', { seed: 5, timeBudgetMs: 300 });
    expect(move).toEqual({ x: 0, y: 0 });
  });

  it('fills a broken four immediately', () => {
    const board = new Board();
    board.place(-2, 0, 'O');
    board.place(-1, 0, 'O');
    board.place(1, 0, 'O');
    board.place(2, 0, 'O');
    board.place(0, 2, 'X');

    const move = chooseAiMove(board, 'O', 'expert', { seed: 7, timeBudgetMs: 250 });
    expect(move).toEqual({ x: 0, y: 0 });
  });

  it('is deterministic for the same board and seed at a completed fixed depth', () => {
    const createBoard = (): Board => {
      const board = new Board();
      board.place(0, 0, 'X');
      board.place(1, 0, 'O');
      board.place(0, 1, 'X');
      board.place(2, 0, 'O');
      board.place(-1, 1, 'X');
      return board;
    };

    const options = { seed: 8, timeBudgetMs: 2_000, maxDepth: 1 } as const;
    const first = chooseAiMove(createBoard(), 'O', 'expert', options);
    const second = chooseAiMove(createBoard(), 'O', 'expert', options);

    expect(second).toEqual(first);
  });

  it('reports bounded Expert search diagnostics', () => {
    const board = new Board();
    board.place(0, 0, 'X');
    board.place(1, 0, 'O');
    board.place(0, 1, 'X');
    board.place(1, 1, 'O');
    board.place(-1, 0, 'X');
    board.place(2, 1, 'O');

    const diagnostics: AiSearchDiagnostics = {
      nodes: 0,
      completedDepth: 0,
      rootCandidates: 0,
      elapsedMs: 0,
      timedOut: false
    };

    chooseAiMove(board, 'X', 'expert', {
      seed: 9,
      timeBudgetMs: 500,
      maxDepth: 3,
      diagnostics
    });

    expect(diagnostics.nodes).toBeGreaterThan(0);
    expect(diagnostics.rootCandidates).toBeGreaterThan(0);
    expect(diagnostics.completedDepth).toBeGreaterThanOrEqual(1);
    expect(diagnostics.completedDepth).toBeLessThanOrEqual(3);
    expect(diagnostics.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('does not mutate the board during deep search', () => {
    const board = populateDoubleThreatBoard();
    const before = [...board.getMoves()];

    chooseAiMove(board, 'X', 'expert', { seed: 10, timeBudgetMs: 250, maxDepth: 2 });
    expect(board.getMoves()).toEqual(before);
  });
});
