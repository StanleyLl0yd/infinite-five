import type { Mark, Move } from './types';

const keyOf = (x: number, y: number): string => `${x},${y}`;

export class BoardView {
  private readonly cells = new Map<string, Mark>();
  private moves: Move[] = [];

  get(x: number, y: number): Mark | undefined {
    return this.cells.get(keyOf(x, y));
  }

  getMoves(): readonly Move[] {
    return this.moves;
  }

  getMovesInBounds(minX: number, maxX: number, minY: number, maxY: number): Move[] {
    const result: Move[] = [];
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const mark = this.cells.get(keyOf(x, y));
        if (mark) result.push({ x, y, mark });
      }
    }
    return result;
  }

  replace(moves: readonly Move[]): void {
    this.cells.clear();
    this.moves = moves.map((move) => ({ ...move }));
    for (const move of this.moves) this.cells.set(keyOf(move.x, move.y), move.mark);
  }

  clear(): void {
    this.cells.clear();
    this.moves = [];
  }
}
