import { describe, expect, it } from 'vitest';
import { Board } from './board';

describe('Board render cache', () => {
  it('replaces and retrieves marks without owning game rules', () => {
    const board = new Board();
    board.replace([
      { x: 3, y: -2, mark: 'X' },
      { x: 4, y: -2, mark: 'O' }
    ]);

    expect(board.get(3, -2)).toBe('X');
    expect(board.get(4, -2)).toBe('O');
    expect(board.getMoves()).toEqual([
      { x: 3, y: -2, mark: 'X' },
      { x: 4, y: -2, mark: 'O' }
    ]);
  });

  it('returns only occupied cells inside bounded render coordinates', () => {
    const board = new Board();
    const moves = [];
    for (let index = 0; index < 5_000; index += 1) {
      moves.push({ x: index * 3, y: index % 17, mark: index % 2 === 0 ? 'X' as const : 'O' as const });
    }
    moves.push({ x: -2, y: -2, mark: 'X' });
    moves.push({ x: 2, y: 2, mark: 'O' });
    board.replace(moves);

    expect(board.getMovesInBounds(-3, 3, -3, 3)).toEqual([
      { x: -2, y: -2, mark: 'X' },
      { x: 0, y: 0, mark: 'X' },
      { x: 3, y: 1, mark: 'O' },
      { x: 2, y: 2, mark: 'O' }
    ]);
  });

  it('clears cached state', () => {
    const board = new Board();
    board.replace([{ x: 0, y: 0, mark: 'X' }]);
    board.clear();
    expect(board.getMoves()).toEqual([]);
    expect(board.get(0, 0)).toBeUndefined();
  });
});
