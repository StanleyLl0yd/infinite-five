import { describe, expect, it } from 'vitest';
import { chooseAiMove } from './ai';
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

  it('does not mutate the board during deep search', () => {
    const board = new Board();
    board.place(0, 0, 'X');
    board.place(1, 0, 'O');
    board.place(0, 1, 'X');
    board.place(1, 1, 'O');
    const before = [...board.getMoves()];

    chooseAiMove(board, 'X', 'expert', { seed: 5, timeBudgetMs: 120 });
    expect(board.getMoves()).toEqual(before);
  });
});
