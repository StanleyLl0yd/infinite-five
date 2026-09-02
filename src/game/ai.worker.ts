import { callWasmCore } from './core-wasm';
import type { AiDifficulty, AiSearchDiagnostics, Mark, Move, Position } from './types';

interface WorkerRequest {
  id: number;
  moves: Move[];
  mark: Mark;
  difficulty: AiDifficulty;
  seed: number;
}

interface CoreAiResult {
  position?: Position;
  diagnostics?: AiSearchDiagnostics;
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { id, moves, mark, difficulty, seed } = event.data;
  void callWasmCore<CoreAiResult>({
    op: 'ai_move',
    moves,
    mark,
    difficulty,
    seed,
    timeBudgetMs: difficulty === 'expert' ? 2_600 : difficulty === 'hard' ? 700 : 240,
    ...(difficulty === 'expert' ? { maxDepth: 5 } : {})
  })
    .then((result) => {
      if (!result.position) throw new Error('Game core did not return an AI move');
      self.postMessage({ id, position: result.position });
    })
    .catch((error) => {
      self.postMessage({
        id,
        error: error instanceof Error ? error.message : 'AI worker failed'
      });
    });
});
