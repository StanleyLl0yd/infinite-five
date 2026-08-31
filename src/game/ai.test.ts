import { describe, expect, it } from 'vitest';
import { chooseAiMove, type AiSearchDiagnostics } from './ai';
import { Board } from './board';

describe('chooseAiMove', () => {
  it('takes an immediate winning move', () => {
    const board = new Board();
    for (let x = 0; x < 4; x += 1) {
      board.place(x, 0, 'O');
    }

    const move = chooseAiMove(board, 'O', 'medium', { seed: 1 });
    expect([
      { x: -1, y: 0 },
      { x: 4, y: 0 }
    ]).toContainEqual(move);
  });

  it('blocks an immediate loss on hard', () => {
    const board = new Board();
    for (let x = 0; x < 4; x += 1) {
      board.place(x, 0, 'X');
    }
    board.place(0, 1, 'O');

    const move = chooseAiMove(board, 'O', 'hard', { seed: 2, timeBudgetMs: 200 });
    expect([
      { x: -1, y: 0 },
      { x: 4, y: 0 }
    ]).toContainEqual(move);
  });

  it('returns an empty nearby cell', () => {
    const board = new Board();
    board.place(12, -8, 'X');

    const move = chooseAiMove(board, 'O', 'medium', { seed: 3 });
    expect(board.get(move.x, move.y)).toBeUndefined();
    expect(Math.abs(move.x - 12)).toBeLessThanOrEqual(2);
    expect(Math.abs(move.y + 8)).toBeLessThanOrEqual(2);
  });

  it('finds a double-threat intersection on expert', () => {
    const board = new Board();
    board.place(-2, 0, 'O');
    board.place(-1, 0, 'O');
    board.place(1, 0, 'O');
    board.place(0, -2, 'O');
    board.place(0, -1, 'O');
    board.place(0, 1, 'O');

    const move = chooseAiMove(board, 'O', 'expert', { seed: 4, timeBudgetMs: 300 });
    expect(move).toEqual({ x: 0, y: 0 });
  });

  it('blocks a single opponent double-threat intersection on expert', () => {
    const board = new Board();
    board.place(-2, 0, 'X');
    board.place(-1, 0, 'X');
    board.place(1, 0, 'X');
    board.place(0, -2, 'X');
    board.place(0, -1, 'X');
    board.place(0, 1, 'X');
    board.place(3, 3, 'O');

    const move = chooseAiMove(board, 'O', 'expert', { seed: 6, timeBudgetMs: 350 });
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

  it('is deterministic for the same board and seed', () => {
    const createBoard = (): Board => {
      const board = new Board();
      board.place(0, 0, 'X');
      board.place(1, 0, 'O');
      board.place(0, 1, 'X');
      board.place(2, 0, 'O');
      board.place(-1, 1, 'X');
      return board;
    };

    const first = chooseAiMove(createBoard(), 'O', 'expert', {
      seed: 8,
      timeBudgetMs: 500,
      maxDepth: 3
    });
    const second = chooseAiMove(createBoard(), 'O', 'expert', {
      seed: 8,
      timeBudgetMs: 500,
      maxDepth: 3
    });

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
      timeBudgetMs: 450,
      maxDepth: 3,
      diagnostics
    });

    expect(diagnostics.rootCandidates).toBeGreaterThan(0);
    expect(diagnostics.nodes).toBeGreaterThanOrEqual(0);
    expect(diagnostics.completedDepth).toBeGreaterThanOrEqual(0);
    expect(diagnostics.completedDepth).toBeLessThanOrEqual(3);
    expect(diagnostics.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('does not mutate the board during deep search', () => {
    const board = new Board();
    board.place(0, 0, 'X');
    board.place(1, 0, 'O');
    board.place(0, 1, 'X');
    board.place(1, 1, 'O');
    const before = [...board.getMoves()];

    chooseAiMove(board, 'X', 'expert', { seed: 5, timeBudgetMs: 160, maxDepth: 3 });
    expect(board.getMoves()).toEqual(before);
  });
});
