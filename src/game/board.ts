import type { Mark, Move } from './types';

const keyOf = (x: number, y: number) => `${x},${y}`;

export class Board {
  private readonly cells = new Map<string, Mark>();
  private readonly moves: Move[] = [];

  get(x: number, y: number): Mark | undefined {
    return this.cells.get(keyOf(x, y));
  }

  place(x: number, y: number, mark: Mark): boolean {
    const key = keyOf(x, y);
    if (this.cells.has(key)) {
      return false;
    }

    this.cells.set(key, mark);
    this.moves.push({ x, y, mark });
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

  restore(moves: readonly Move[]): void {
    this.clear();
    for (const move of moves) {
      if (!this.place(move.x, move.y, move.mark)) {
        throw new Error('Invalid saved game');
      }
    }
  }
}
