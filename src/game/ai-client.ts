import { chooseAiMove, type AiDifficulty } from './ai';
import { Board } from './board';
import type { Mark, Move, Position } from './types';

interface WorkerRequest {
  id: number;
  moves: Move[];
  mark: Mark;
  difficulty: AiDifficulty;
  seed: number;
}

interface WorkerResponse {
  id: number;
  position?: Position;
  error?: string;
}

let worker: Worker | null = null;
let requestId = 0;
const pending = new Map<
  number,
  { resolve: (position: Position) => void; reject: (error: Error) => void }
>();

const randomSeed = (): number => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
};

const fallback = (moves: readonly Move[], mark: Mark, difficulty: AiDifficulty, seed: number): Position => {
  const board = new Board();
  board.restore(moves);
  return chooseAiMove(board, mark, difficulty, {
    seed,
    timeBudgetMs: difficulty === 'expert' ? 1_700 : difficulty === 'hard' ? 520 : 180,
    maxDepth: difficulty === 'expert' ? 4 : undefined
  });
};

const getWorker = (): Worker | null => {
  if (worker) {
    return worker;
  }
  if (typeof Worker === 'undefined') {
    return null;
  }

  try {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) {
        return;
      }
      pending.delete(event.data.id);
      if (event.data.position) {
        entry.resolve(event.data.position);
      } else {
        entry.reject(new Error(event.data.error ?? 'AI worker failed'));
      }
    });
    worker.addEventListener('error', () => {
      for (const entry of pending.values()) {
        entry.reject(new Error('AI worker failed'));
      }
      pending.clear();
      worker?.terminate();
      worker = null;
    });
    return worker;
  } catch {
    worker = null;
    return null;
  }
};

export const requestAiMove = async (
  moves: readonly Move[],
  mark: Mark,
  difficulty: AiDifficulty
): Promise<Position> => {
  const seed = randomSeed();
  const aiWorker = getWorker();
  if (!aiWorker) {
    return fallback(moves, mark, difficulty, seed);
  }

  const id = ++requestId;
  const request: WorkerRequest = { id, moves: [...moves], mark, difficulty, seed };
  try {
    return await new Promise<Position>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      aiWorker.postMessage(request);
    });
  } catch {
    return fallback(moves, mark, difficulty, seed);
  }
};
