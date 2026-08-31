export type Mark = 'X' | 'O';

export interface Position {
  x: number;
  y: number;
}

export interface Move extends Position {
  mark: Mark;
}

export interface WinningLine {
  positions: Position[];
  start: Position;
  end: Position;
}
