import type { Mark, Move } from './types';

const keyOf = (x: number, y: number) => `${x},${y}`;

export class Board {
  private readonly cells = new Map<string, Move>();
  private readonly moves: Move[] = [];

  get(x: number, y: number): Mark | undefined {
    return this.cells.get(keyOf(x, y))?.mark;
  }

  clear(): void {
    this.cells.clear();
    this.moves.length = 0;
  }

  getMoves(): readonly Move[] {
    return this.moves;
  }

  getMovesInBounds(minX: number, maxX: number, minY: number, maxY: number): Move[] {
    const left = Math.ceil(Math.min(minX, maxX));
    const right = Math.floor(Math.max(minX, maxX));
    const top = Math.ceil(Math.min(minY, maxY));
    const bottom = Math.floor(Math.max(minY, maxY));
    const visible: Move[] = [];

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const move = this.cells.get(keyOf(x, y));
        if (move) visible.push(move);
      }
    }

    return visible;
  }

  replace(moves: readonly Move[]): void {
    this.clear();
    for (const move of moves) {
      const copy = { ...move };
      this.cells.set(keyOf(copy.x, copy.y), copy);
      this.moves.push(copy);
    }
  }
}
