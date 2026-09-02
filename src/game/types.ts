export type Mark = 'X' | 'O';
export type AiDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

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

export interface AiSearchDiagnostics {
  nodes: number;
  completedDepth: number;
  rootCandidates: number;
  elapsedMs: number;
  timedOut: boolean;
}

export interface CoreGameState {
  moves: Move[];
  winningLine: WinningLine | null;
  winner: Mark | null;
  nextMark: Mark;
}
