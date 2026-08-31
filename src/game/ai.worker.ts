import { chooseAiMove, type AiDifficulty } from './ai';
import { Board } from './board';
import type { Mark, Move } from './types';

interface WorkerRequest {
  id: number;
  moves: Move[];
  mark: Mark;
  difficulty: AiDifficulty;
  seed: number;
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { id, moves, mark, difficulty, seed } = event.data;
  try {
    const board = new Board();
    board.restore(moves);
    const position = chooseAiMove(board, mark, difficulty, {
      seed,
      timeBudgetMs: difficulty === 'expert' ? 2_600 : difficulty === 'hard' ? 700 : 240,
      maxDepth: difficulty === 'expert' ? 5 : undefined
    });
    self.postMessage({ id, position });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'AI worker failed' });
  }
});
