import { describe, expect, it } from 'vitest';
import { Board } from './board';

describe('Board', () => {
  it('places and retrieves marks', () => {
    const board = new Board();

    expect(board.place(3, -2, 'X')).toBe(true);
    expect(board.get(3, -2)).toBe('X');
    expect(board.getMoves()).toEqual([{ x: 3, y: -2, mark: 'X' }]);
  });

  it('rejects an occupied cell', () => {
    const board = new Board();

    expect(board.place(0, 0, 'X')).toBe(true);
    expect(board.place(0, 0, 'O')).toBe(false);
    expect(board.getMoves()).toHaveLength(1);
  });

  it('undoes the latest move', () => {
    const board = new Board();
    board.place(0, 0, 'X');
    board.place(1, 0, 'O');

    expect(board.undo()).toEqual({ x: 1, y: 0, mark: 'O' });
    expect(board.get(1, 0)).toBeUndefined();
    expect(board.getMoves()).toHaveLength(1);
  });

  it('restores a saved position', () => {
    const board = new Board();

    board.restore([
      { x: -1, y: 2, mark: 'X' },
      { x: 0, y: 2, mark: 'O' }
    ]);

    expect(board.get(-1, 2)).toBe('X');
    expect(board.get(0, 2)).toBe('O');
  });

  it('returns only occupied cells inside bounded render coordinates', () => {
    const board = new Board();
    for (let index = 0; index < 5_000; index += 1) {
      board.place(index * 3, index % 17, index % 2 === 0 ? 'X' : 'O');
    }
    board.place(-2, -2, 'X');
    board.place(2, 2, 'O');

    expect(board.getMovesInBounds(-3, 3, -3, 3)).toEqual([
      { x: -2, y: -2, mark: 'X' },
      { x: 0, y: 0, mark: 'X' },
      { x: 2, y: 2, mark: 'O' },
      { x: 3, y: 1, mark: 'O' }
    ]);
  });

  it('rejects duplicate cells while restoring', () => {
    const board = new Board();

    expect(() =>
      board.restore([
        { x: 1, y: 1, mark: 'X' },
        { x: 1, y: 1, mark: 'O' }
      ])
    ).toThrow('Invalid saved game');
  });
});
