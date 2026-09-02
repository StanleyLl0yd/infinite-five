interface WasmExports {
  memory: WebAssembly.Memory;
  core_alloc: (length: number) => number;
  core_dealloc: (pointer: number, length: number) => void;
  core_call: (pointer: number, length: number) => bigint;
}

interface CoreEnvelope<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

let instancePromise: Promise<WasmExports> | null = null;

const instantiate = async (): Promise<WasmExports> => {
  const imports = { env: { now_ms: (): number => Date.now() } };
  const url = `${import.meta.env.BASE_URL}game-core/game_core.wasm`;
  const response = await fetch(url);

  let instance: WebAssembly.Instance;
  try {
    ({ instance } = await WebAssembly.instantiateStreaming(response.clone(), imports));
  } catch {
    ({ instance } = await WebAssembly.instantiate(await response.arrayBuffer(), imports));
  }

  const exports = instance.exports as unknown as Partial<WasmExports>;
  if (
    !(exports.memory instanceof WebAssembly.Memory) ||
    typeof exports.core_alloc !== 'function' ||
    typeof exports.core_dealloc !== 'function' ||
    typeof exports.core_call !== 'function'
  ) {
    throw new Error('Invalid game core WebAssembly module');
  }
  return exports as WasmExports;
};

const getInstance = (): Promise<WasmExports> => {
  instancePromise ??= instantiate();
  return instancePromise;
};

export const callWasmCore = async <T>(request: unknown): Promise<T> => {
  const wasm = await getInstance();
  const input = new TextEncoder().encode(JSON.stringify(request));
  const inputPointer = wasm.core_alloc(input.byteLength);

  try {
    new Uint8Array(wasm.memory.buffer, inputPointer, input.byteLength).set(input);
    const packed = wasm.core_call(inputPointer, input.byteLength);
    const outputPointer = Number((packed >> 32n) & 0xffff_ffffn);
    const outputLength = Number(packed & 0xffff_ffffn);

    try {
      const output = new TextDecoder().decode(
        new Uint8Array(wasm.memory.buffer, outputPointer, outputLength)
      );
      const envelope = JSON.parse(output) as CoreEnvelope<T>;
      if (!envelope.ok || envelope.result === undefined) {
        throw new Error(envelope.error ?? 'Game core request failed');
      }
      return envelope.result;
    } finally {
      wasm.core_dealloc(outputPointer, outputLength);
    }
  } finally {
    wasm.core_dealloc(inputPointer, input.byteLength);
  }
};
