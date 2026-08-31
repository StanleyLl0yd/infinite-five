import { describe, expect, it } from 'vitest';
import { chooseAiMove } from './ai';
import { Board } from './board';

describe('chooseAiMove', () => {
  it('takes an immediate winning move', () => {
    const board = new Board();
    for (let x = 0; x < 4; x += 1) {
      board.place(x, 0, 'O');
    }

    const move = chooseAiMove(board, 'O', 'medium');

    expect([
      { x: -1, y: 0 },
      { x: 4, y: 0 }
    ]).toContainEqual(move);
  });

  it('blocks an immediate loss', () => {
    const board = new Board();
    for (let x = 0; x < 4; x += 1) {
      board.place(x, 0, 'X');
    }
    board.place(0, 1, 'O');

    const move = chooseAiMove(board, 'O', 'hard');

    expect([
      { x: -1, y: 0 },
      { x: 4, y: 0 }
    ]).toContainEqual(move);
  });

  it('returns an empty nearby cell', () => {
    const board = new Board();
    board.place(12, -8, 'X');

    const move = chooseAiMove(board, 'O', 'medium');

    expect(board.get(move.x, move.y)).toBeUndefined();
    expect(Math.abs(move.x - 12)).toBeLessThanOrEqual(2);
    expect(Math.abs(move.y + 8)).toBeLessThanOrEqual(2);
  });
});
