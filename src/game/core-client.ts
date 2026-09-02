import { callWasmCore } from './core-wasm';
import type {
  AiDifficulty,
  AiSearchDiagnostics,
  CoreGameState,
  Mark,
  Move,
  Position
} from './types';

interface CoreResult {
  state?: CoreGameState;
  applied?: boolean;
  position?: Position;
  diagnostics?: AiSearchDiagnostics;
}

interface CoreEnvelope {
  ok: boolean;
  result?: CoreResult;
  error?: string;
}

interface TauriGlobal {
  core?: {
    invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
  };
}

declare global {
  interface Window {
    __TAURI__?: TauriGlobal;
  }
}

export const hasNativeCore = (): boolean =>
  typeof window !== 'undefined' && typeof window.__TAURI__?.core?.invoke === 'function';

const parseNativeResponse = (payload: string): CoreResult => {
  const envelope = JSON.parse(payload) as CoreEnvelope;
  if (!envelope.ok || !envelope.result) {
    throw new Error(envelope.error ?? 'Game core request failed');
  }
  return envelope.result;
};

export const callCore = async (request: unknown): Promise<CoreResult> => {
  if (hasNativeCore()) {
    const payload = await window.__TAURI__!.core!.invoke<string>('game_core_call', {
      request: JSON.stringify(request)
    });
    return parseNativeResponse(payload);
  }
  return callWasmCore<CoreResult>(request);
};

const requireState = (result: CoreResult): CoreGameState => {
  if (!result.state) throw new Error('Game core did not return board state');
  return result.state;
};

export const readCoreState = async (moves: readonly Move[]): Promise<CoreGameState> =>
  requireState(await callCore({ op: 'state', moves }));

export const applyCoreMove = async (
  moves: readonly Move[],
  position: Position,
  mark: Mark
): Promise<CoreGameState> =>
  requireState(await callCore({ op: 'apply_move', moves, position, mark }));

export const undoCoreMoves = async (
  moves: readonly Move[],
  count: number
): Promise<CoreGameState> =>
  requireState(await callCore({ op: 'undo', moves, count }));

export const requestCoreAiMove = async (
  moves: readonly Move[],
  mark: Mark,
  difficulty: AiDifficulty,
  seed: number,
  timeBudgetMs: number,
  maxDepth?: number
): Promise<{ position: Position; diagnostics: AiSearchDiagnostics }> => {
  const result = await callCore({
    op: 'ai_move',
    moves,
    mark,
    difficulty,
    seed,
    timeBudgetMs,
    ...(maxDepth === undefined ? {} : { maxDepth })
  });
  if (!result.position || !result.diagnostics) {
    throw new Error('Game core did not return an AI move');
  }
  return { position: result.position, diagnostics: result.diagnostics };
};
