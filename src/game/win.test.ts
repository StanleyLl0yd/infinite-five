import { describe, expect, it } from 'vitest';
import { Board } from './board';
import { getWinningLine } from './win';

describe('getWinningLine', () => {
  it('detects five horizontal marks', () => {
    const board = new Board();
    for (let x = 0; x < 5; x += 1) {
      board.place(x, 0, 'X');
    }

    const line = getWinningLine(board, { x: 4, y: 0, mark: 'X' });

    expect(line?.start).toEqual({ x: 0, y: 0 });
    expect(line?.end).toEqual({ x: 4, y: 0 });
    expect(line?.positions).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 }
    ]);
  });

  it('detects lines longer than five', () => {
    const board = new Board();
    for (let y = -2; y <= 3; y += 1) {
      board.place(2, y, 'O');
    }

    const line = getWinningLine(board, { x: 2, y: 1, mark: 'O' });

    expect(line?.positions).toEqual([
      { x: 2, y: -2 },
      { x: 2, y: -1 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 }
    ]);
  });

  it('detects both diagonal directions', () => {
    const rising = new Board();
    const falling = new Board();

    for (let i = 0; i < 5; i += 1) {
      rising.place(i, i, 'X');
      falling.place(i, -i, 'O');
    }

    expect(getWinningLine(rising, { x: 2, y: 2, mark: 'X' })).not.toBeNull();
    expect(getWinningLine(falling, { x: 2, y: -2, mark: 'O' })).not.toBeNull();
  });

  it('does not report four in a row', () => {
    const board = new Board();
    for (let x = 0; x < 4; x += 1) {
      board.place(x, 0, 'X');
    }

    expect(getWinningLine(board, { x: 3, y: 0, mark: 'X' })).toBeNull();
  });
});
