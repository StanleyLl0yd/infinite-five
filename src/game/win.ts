import { Board } from './board';
import type { Move, Position, WinningLine } from './types';

const directions: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

const count = (board: Board, move: Move, dx: number, dy: number): number => {
  let result = 0;
  let x = move.x + dx;
  let y = move.y + dy;

  while (board.get(x, y) === move.mark) {
    result += 1;
    x += dx;
    y += dy;
  }

  return result;
};

export const getWinningLine = (board: Board, move: Move): WinningLine | null => {
  for (const [dx, dy] of directions) {
    const before = count(board, move, -dx, -dy);
    const after = count(board, move, dx, dy);
    const length = before + after + 1;
    if (length < 5) continue;

    const start = { x: move.x - before * dx, y: move.y - before * dy };
    const end = { x: move.x + after * dx, y: move.y + after * dy };
    const positions: Position[] = Array.from({ length }, (_, index) => ({
      x: start.x + index * dx,
      y: start.y + index * dy
    }));
    return { positions, start, end };
  }

  return null;
};
