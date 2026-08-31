import { Board } from './board';
import type { Move, Position, WinningLine } from './types';

const directions: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

const collect = (
  board: Board,
  move: Move,
  dx: number,
  dy: number
): Position[] => {
  const positions: Position[] = [];
  let x = move.x + dx;
  let y = move.y + dy;

  while (board.get(x, y) === move.mark) {
    positions.push({ x, y });
    x += dx;
    y += dy;
  }

  return positions;
};

export const getWinningLine = (
  board: Board,
  move: Move
): WinningLine | null => {
  for (const [dx, dy] of directions) {
    const before = collect(board, move, -dx, -dy).reverse();
    const after = collect(board, move, dx, dy);
    const positions = [...before, { x: move.x, y: move.y }, ...after];

    if (positions.length >= 5) {
      return {
        positions,
        start: positions[0],
        end: positions[positions.length - 1]
      };
    }
  }

  return null;
};
