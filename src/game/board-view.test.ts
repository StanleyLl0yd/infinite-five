import { describe, expect, it } from 'vitest';
import { BoardView } from './board-view';

describe('BoardView', () => {
  it('replaces and exposes gameplay snapshots for rendering', () => {
    const board = new BoardView();
    board.replace([
      { x: 3, y: -2, mark: 'X' },
      { x: 1, y: 4, mark: 'O' }
    ]);

    expect(board.get(3, -2)).toBe('X');
    expect(board.get(1, 4)).toBe('O');
    expect(board.getMoves()).toEqual([
      { x: 3, y: -2, mark: 'X' },
      { x: 1, y: 4, mark: 'O' }
    ]);
  });

  it('keeps the previous bounded render ordering', () => {
    const board = new BoardView();
    board.replace([
      { x: -2, y: -2, mark: 'X' },
      { x: 0, y: 0, mark: 'X' },
      { x: 3, y: 1, mark: 'O' },
      { x: 2, y: 2, mark: 'O' }
    ]);

    expect(board.getMovesInBounds(-3, 3, -3, 3)).toEqual([
      { x: -2, y: -2, mark: 'X' },
      { x: 0, y: 0, mark: 'X' },
      { x: 3, y: 1, mark: 'O' },
      { x: 2, y: 2, mark: 'O' }
    ]);
  });
});
