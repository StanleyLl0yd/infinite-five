import type { Mark, Move } from './types';

const keyOf = (x: number, y: number) => `${x},${y}`;

export class Board {
  private readonly cells = new Map<string, Move>();
  private readonly moves: Move[] = [];

  get(x: number, y: number): Mark | undefined {
    return this.cells.get(keyOf(x, y))?.mark;
  }

  place(x: number, y: number, mark: Mark): boolean {
    const key = keyOf(x, y);
    if (this.cells.has(key)) {
      return false;
    }

    const move = { x, y, mark };
    this.cells.set(key, move);
    this.moves.push(move);
    return true;
  }

  undo(): Move | undefined {
    const move = this.moves.pop();
    if (!move) {
      return undefined;
    }

    this.cells.delete(keyOf(move.x, move.y));
    return move;
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

  restore(moves: readonly Move[]): void {
    this.clear();
    for (const move of moves) {
      if (!this.place(move.x, move.y, move.mark)) {
        throw new Error('Invalid saved game');
      }
    }
  }
}
