import { Board } from './board';
import { getWinningLine } from './win';
import type { Mark, Move, Position } from './types';

export type AiDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AiSearchDiagnostics {
  nodes: number;
  completedDepth: number;
  rootCandidates: number;
  elapsedMs: number;
  timedOut: boolean;
}

export interface AiSearchOptions {
  seed?: number;
  timeBudgetMs?: number;
  maxDepth?: number;
  diagnostics?: AiSearchDiagnostics;
}

interface RankedMove {
  position: Position;
  score: number;
}

interface SearchResult {
  score: number;
  complete: boolean;
}

interface SearchContext {
  deadline: number;
  seed: number;
  nodes: number;
  timedOut: boolean;
}

interface ExpertChoice {
  position: Position;
  completedDepth: number;
  rootCandidates: number;
}

const winScore = 1_000_000_000;
const directions: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

const opponentOf = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');
const keyOf = (x: number, y: number): string => `${x},${y}`;

const hashNumber = (value: number): number => {
  let result = value | 0;
  result ^= result >>> 16;
  result = Math.imul(result, 0x7feb352d);
  result ^= result >>> 15;
  result = Math.imul(result, 0x846ca68b);
  result ^= result >>> 16;
  return result >>> 0;
};

const positionNoise = (position: Position, seed: number): number =>
  hashNumber(seed ^ Math.imul(position.x, 73_856_093) ^ Math.imul(position.y, 19_349_663)) / 0xffffffff;

const seedFromBoard = (board: Board): number => {
  let seed = 0x811c9dc5;
  for (const move of board.getMoves()) {
    seed ^= hashNumber(move.x * 31 + move.y * 131 + (move.mark === 'X' ? 17 : 29));
    seed = Math.imul(seed, 0x01000193);
  }
  return seed >>> 0;
};

const getCandidates = (board: Board, radius: number): Position[] => {
  const moves = board.getMoves();
  if (moves.length === 0) {
    return [{ x: 0, y: 0 }];
  }

  const candidates = new Map<string, Position>();
  for (const move of moves) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        const x = move.x + dx;
        const y = move.y + dy;
        if (!board.get(x, y)) {
          candidates.set(keyOf(x, y), { x, y });
        }
      }
    }
  }
  return [...candidates.values()];
};

const countDirection = (
  board: Board,
  position: Position,
  mark: Mark,
  dx: number,
  dy: number
): { count: number; open: boolean } => {
  let count = 0;
  let x = position.x + dx;
  let y = position.y + dy;
  while (board.get(x, y) === mark) {
    count += 1;
    x += dx;
    y += dy;
  }
  return { count, open: board.get(x, y) === undefined };
};

const contiguousScore = (length: number, openEnds: number): number => {
  if (length >= 5) return winScore;
  if (length === 4 && openEnds === 2) return 12_000_000;
  if (length === 4 && openEnds === 1) return 1_800_000;
  if (length === 3 && openEnds === 2) return 260_000;
  if (length === 3 && openEnds === 1) return 22_000;
  if (length === 2 && openEnds === 2) return 5_000;
  if (length === 2 && openEnds === 1) return 650;
  return openEnds === 2 ? 60 : 10;
};

const windowPatternScore = (
  board: Board,
  position: Position,
  mark: Mark,
  dx: number,
  dy: number
): number => {
  const opponent = opponentOf(mark);
  let best = 0;

  for (let offset = -4; offset <= 0; offset += 1) {
    let own = 0;
    let empty = 0;
    let blocked = false;
    for (let step = 0; step < 5; step += 1) {
      const relative = offset + step;
      const x = position.x + relative * dx;
      const y = position.y + relative * dy;
      const cell = relative === 0 ? mark : board.get(x, y);
      if (cell === opponent) {
        blocked = true;
        break;
      }
      if (cell === mark) {
        own += 1;
      } else {
        empty += 1;
      }
    }

    if (blocked) {
      continue;
    }
    if (own >= 5) best = Math.max(best, winScore);
    else if (own === 4 && empty === 1) best = Math.max(best, 2_400_000);
    else if (own === 3 && empty === 2) best = Math.max(best, 95_000);
    else if (own === 2 && empty === 3) best = Math.max(best, 4_000);
  }

  return best;
};

const scoreForMark = (board: Board, position: Position, mark: Mark): number => {
  let score = 0;
  for (const [dx, dy] of directions) {
    const before = countDirection(board, position, mark, -dx, -dy);
    const after = countDirection(board, position, mark, dx, dy);
    score += contiguousScore(
      1 + before.count + after.count,
      Number(before.open) + Number(after.open)
    );
    score += windowPatternScore(board, position, mark, dx, dy);
  }
  return score;
};

const neighborScore = (board: Board, position: Position): number => {
  let score = 0;
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      if (board.get(position.x + dx, position.y + dy)) {
        score += Math.abs(dx) <= 1 && Math.abs(dy) <= 1 ? 12 : 3;
      }
    }
  }
  return score;
};

const rankScore = (
  board: Board,
  position: Position,
  mark: Mark,
  attackWeight = 1,
  defenseWeight = 0.98
): number => {
  const opponent = opponentOf(mark);
  return (
    scoreForMark(board, position, mark) * attackWeight +
    scoreForMark(board, position, opponent) * defenseWeight +
    neighborScore(board, position)
  );
};

const isWinningMove = (board: Board, position: Position, mark: Mark): boolean => {
  if (!board.place(position.x, position.y, mark)) {
    return false;
  }
  const move: Move = { ...position, mark };
  const wins = getWinningLine(board, move) !== null;
  board.undo();
  return wins;
};

const findWinningMoves = (
  board: Board,
  mark: Mark,
  candidates: readonly Position[]
): Position[] => candidates.filter((candidate) => isWinningMove(board, candidate, mark));

const rankedCandidates = (
  board: Board,
  mark: Mark,
  radius = 2,
  attackWeight = 1,
  defenseWeight = 0.98
): RankedMove[] =>
  getCandidates(board, radius)
    .map((position) => ({
      position,
      score: rankScore(board, position, mark, attackWeight, defenseWeight)
    }))
    .sort((a, b) => b.score - a.score);

const immediateThreatCount = (board: Board, mark: Mark, limit = 3): number => {
  let count = 0;
  const candidates = rankedCandidates(board, mark).slice(0, 28).map(({ position }) => position);
  for (const candidate of candidates) {
    if (isWinningMove(board, candidate, mark)) {
      count += 1;
      if (count >= limit) {
        break;
      }
    }
  }
  return count;
};

const isDoubleThreatMove = (board: Board, position: Position, mark: Mark): boolean => {
  if (!board.place(position.x, position.y, mark)) {
    return false;
  }
  const move: Move = { ...position, mark };
  const createsWin = getWinningLine(board, move) !== null;
  const threats = createsWin ? 2 : immediateThreatCount(board, mark, 2);
  board.undo();
  return threats >= 2;
};

const findDoubleThreatMoves = (
  board: Board,
  mark: Mark,
  candidates: readonly Position[],
  deadline: number,
  limit = 3
): Position[] => {
  const result: Position[] = [];
  for (const candidate of candidates) {
    if (Date.now() >= deadline) break;
    if (isDoubleThreatMove(board, candidate, mark)) {
      result.push(candidate);
      if (result.length >= limit) break;
    }
  }
  return result;
};

const staticEvaluation = (board: Board, mark: Mark): number => {
  const opponent = opponentOf(mark);
  const own = rankedCandidates(board, mark).slice(0, 4);
  const enemy = rankedCandidates(board, opponent).slice(0, 4);
  const ownScore = own.reduce((sum, candidate, index) => sum + candidate.score / (index + 1), 0);
  const enemyScore = enemy.reduce((sum, candidate, index) => sum + candidate.score / (index + 1), 0);
  return ownScore - enemyScore * 1.09;
};

const chooseEasy = (board: Board, mark: Mark): Position => {
  const candidates = getCandidates(board, 1);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) {
    return wins[Math.floor(Math.random() * wins.length)];
  }

  const blocks = findWinningMoves(board, opponentOf(mark), candidates);
  if (blocks.length > 0 && Math.random() < 0.72) {
    return blocks[Math.floor(Math.random() * blocks.length)];
  }

  const ranked = candidates
  .map((position) => ({ position, score: rankScore(board, position, mark) }))
  .sort((a, b) => b.score - a.score);
  const poolSize = Math.max(1, Math.min(ranked.length, Math.ceil(ranked.length * 0.35), 10));
  return ranked[Math.floor(Math.random() * poolSize)].position;
};

const chooseMedium = (board: Board, mark: Mark, seed: number): Position => {
  const ranked = rankedCandidates(board, mark);
  const candidates = ranked.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) return wins[0];

  const blocks = findWinningMoves(board, opponentOf(mark), candidates);
  if (blocks.length > 0) return blocks[0];

  const bestScore = ranked[0].score;
  const pool = ranked.filter(({ score }) => score >= bestScore * 0.94).slice(0, 3);
  return pool.sort(
    (a, b) =>
      b.score + positionNoise(b.position, seed) * 0.02 * Math.max(1, bestScore) -
      (a.score + positionNoise(a.position, seed) * 0.02 * Math.max(1, bestScore))
  )[0].position;
};

const evaluateHardCandidate = (
  board: Board,
  candidate: RankedMove,
  mark: Mark,
  context: SearchContext
): number => {
  const opponent = opponentOf(mark);
  board.place(candidate.position.x, candidate.position.y, mark);

  const ownThreats = immediateThreatCount(board, mark);
  const opponentWins = findWinningMoves(
    board,
    opponent,
    rankedCandidates(board, opponent).slice(0, 22).map(({ position }) => position)
  );

  if (opponentWins.length > 0) {
    board.undo();
    return -winScore + candidate.score;
  }
  if (ownThreats >= 2) {
    board.undo();
    return winScore * 0.84 + candidate.score;
  }

  const replies = rankedCandidates(board, opponent).slice(0, 14);
  let worstReply = Number.POSITIVE_INFINITY;
  for (const reply of replies) {
    if (Date.now() >= context.deadline) {
      context.timedOut = true;
      break;
    }
    context.nodes += 1;
    board.place(reply.position.x, reply.position.y, opponent);
    const replyMove: Move = { ...reply.position, mark: opponent };
    const score = getWinningLine(board, replyMove)
      ? -winScore
      : staticEvaluation(board, mark);
    board.undo();
    worstReply = Math.min(worstReply, score);
  }

  board.undo();
  const fallback = staticEvaluation(board, mark);
  return (Number.isFinite(worstReply) ? worstReply : fallback) + candidate.score * 0.12 + ownThreats * 7_500_000;
};

const chooseHard = (board: Board, mark: Mark, context: SearchContext): Position => {
  const ranked = rankedCandidates(board, mark);
  const candidates = ranked.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) return wins[0];

  const opponent = opponentOf(mark);
  const blocks = findWinningMoves(board, opponent, candidates);
  if (blocks.length > 0) return blocks[0];

  const opponentForks = findDoubleThreatMoves(
    board,
    opponent,
    rankedCandidates(board, opponent).slice(0, 14).map(({ position }) => position),
    context.deadline,
    2
  );
  if (opponentForks.length === 1) {
    return opponentForks[0];
  }

  let best = ranked[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of ranked.slice(0, 26)) {
    if (Date.now() >= context.deadline) {
      context.timedOut = true;
      break;
    }
    const score = evaluateHardCandidate(board, candidate, mark, context);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best.position;
};

const expertConsensus = (board: Board, mark: Mark, seed: number): RankedMove[] => {
  const profiles = [
    rankedCandidates(board, mark, 2, 1.24, 0.82),
    rankedCandidates(board, mark, 2, 0.86, 1.28),
    rankedCandidates(board, mark, 3, 1.04, 1.04),
    rankedCandidates(board, mark, 3, 1.16, 0.94),
    rankedCandidates(board, mark, 3, 0.94, 1.16)
  ];
  const combined = new Map<string, RankedMove & { votes: number }>();

  profiles.forEach((profile, profileIndex) => {
    const limit = profileIndex < 2 ? 15 : 20;
    profile.slice(0, limit).forEach((candidate, index) => {
      const key = keyOf(candidate.position.x, candidate.position.y);
      const existing = combined.get(key) ?? {
        position: candidate.position,
        score: 0,
        votes: 0
      };
      existing.score += candidate.score / (1 + index * 0.09);
      existing.votes += 1;
      combined.set(key, existing);
    });
  });

  return [...combined.values()]
    .map(({ position, score, votes }) => ({
      position,
      score: score + votes * votes * 720_000 + positionNoise(position, seed) * 500
    }))
    .sort((a, b) => b.score - a.score);
};

const orderedSearchMoves = (board: Board, turn: Mark, width: number, seed: number): RankedMove[] => {
  const ranked = rankedCandidates(board, turn);
  const candidates = ranked.map(({ position }) => position);
  const wins = findWinningMoves(board, turn, candidates);
  if (wins.length > 0) {
    return wins.map((position) => ({ position, score: winScore }));
  }

  const blocks = findWinningMoves(board, opponentOf(turn), candidates);
  if (blocks.length > 0) {
    return blocks
      .map((position) => ({ position, score: rankScore(board, position, turn) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, width);
  }

  return ranked
    .slice(0, width * 2)
    .sort(
      (a, b) =>
        b.score + positionNoise(b.position, seed) * 50 -
        (a.score + positionNoise(a.position, seed) * 50)
    )
    .slice(0, width);
};

const search = (
  board: Board,
  perspective: Mark,
  turn: Mark,
  depth: number,
  alpha: number,
  beta: number,
  context: SearchContext
): SearchResult => {
  context.nodes += 1;
  const moves = board.getMoves();
  const lastMove = moves[moves.length - 1];
  if (lastMove && getWinningLine(board, lastMove)) {
    return {
      score: lastMove.mark === perspective ? winScore + depth : -winScore - depth,
      complete: true
    };
  }
  if (depth === 0) {
    return { score: staticEvaluation(board, perspective), complete: true };
  }
  if (Date.now() >= context.deadline) {
    context.timedOut = true;
    return { score: staticEvaluation(board, perspective), complete: false };
  }

  const width = depth >= 4 ? 11 : depth === 3 ? 10 : depth === 2 ? 8 : 6;
  const candidates = orderedSearchMoves(board, turn, width, context.seed ^ depth);
  if (candidates.length === 0) {
    return { score: staticEvaluation(board, perspective), complete: true };
  }

  const maximizing = turn === perspective;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (Date.now() >= context.deadline) {
      context.timedOut = true;
      return {
        score: Number.isFinite(best) ? best : staticEvaluation(board, perspective),
        complete: false
      };
    }

    board.place(candidate.position.x, candidate.position.y, turn);
    const child = search(
      board,
      perspective,
      opponentOf(turn),
      depth - 1,
      alpha,
      beta,
      context
    );
    board.undo();

    if (!child.complete) {
      return {
        score: Number.isFinite(best) ? best : child.score,
        complete: false
      };
    }

    if (maximizing) {
      best = Math.max(best, child.score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, child.score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }

  return {
    score: Number.isFinite(best) ? best : staticEvaluation(board, perspective),
    complete: true
  };
};

const scoreExpertRootMove = (
  board: Board,
  candidate: RankedMove,
  mark: Mark,
  depth: number,
  context: SearchContext
): SearchResult => {
  const opponent = opponentOf(mark);
  board.place(candidate.position.x, candidate.position.y, mark);
  const move: Move = { ...candidate.position, mark };

  if (getWinningLine(board, move)) {
    board.undo();
    return { score: winScore, complete: true };
  }

  const ownThreats = immediateThreatCount(board, mark, 3);
  const opponentThreats = immediateThreatCount(board, opponent, 2);
  let result: SearchResult;
  if (opponentThreats > 0) {
    result = { score: -winScore * 0.95, complete: true };
  } else if (ownThreats >= 2) {
    result = {
      score: winScore * 0.94 + ownThreats * 1_100_000,
      complete: true
    };
  } else {
    result = search(
      board,
      mark,
      opponent,
      Math.max(0, depth - 1),
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      context
    );
  }
  board.undo();

  return {
    score:
      result.score +
      candidate.score * 0.03 +
      positionNoise(candidate.position, context.seed ^ depth) * 250,
    complete: result.complete
  };
};

const chooseExpert = (
  board: Board,
  mark: Mark,
  context: SearchContext,
  maxDepth: number
): ExpertChoice => {
  const consensus = expertConsensus(board, mark, context.seed);
  const candidates = consensus.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) {
    return { position: wins[0], completedDepth: 0, rootCandidates: consensus.length };
  }

  const opponent = opponentOf(mark);
  const blocks = findWinningMoves(board, opponent, candidates);
  if (blocks.length > 0) {
    const position = blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
    return { position, completedDepth: 0, rootCandidates: consensus.length };
  }

  const ownForks = findDoubleThreatMoves(
    board,
    mark,
    consensus.slice(0, 16).map(({ position }) => position),
    context.deadline,
    2
  );
  if (ownForks.length > 0) {
    return { position: ownForks[0], completedDepth: 0, rootCandidates: consensus.length };
  }

  const opponentForks = findDoubleThreatMoves(
    board,
    opponent,
    rankedCandidates(board, opponent).slice(0, 18).map(({ position }) => position),
    context.deadline,
    3
  );
  if (opponentForks.length === 1) {
    return { position: opponentForks[0], completedDepth: 0, rootCandidates: consensus.length };
  }

  let ordered = consensus.slice(0, 16);
  let best = ordered[0];
  let completedDepth = 0;

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    if (Date.now() >= context.deadline) {
      context.timedOut = true;
      break;
    }

    const scored: RankedMove[] = [];
    let iterationComplete = true;
    for (const candidate of ordered) {
      if (Date.now() >= context.deadline) {
        context.timedOut = true;
        iterationComplete = false;
        break;
      }
      const result = scoreExpertRootMove(board, candidate, mark, depth, context);
      if (!result.complete) {
        iterationComplete = false;
        break;
      }
      scored.push({ position: candidate.position, score: result.score });
    }

    if (!iterationComplete) {
      break;
    }

    scored.sort((a, b) => b.score - a.score);
    best = scored[0];
    completedDepth = depth;
    const scoreByKey = new Map(scored.map((entry) => [keyOf(entry.position.x, entry.position.y), entry.score]));
    ordered.sort(
      (a, b) =>
        (scoreByKey.get(keyOf(b.position.x, b.position.y)) ?? b.score) -
        (scoreByKey.get(keyOf(a.position.x, a.position.y)) ?? a.score)
    );

    if (best.score >= winScore * 0.93) {
      break;
    }
  }

  return {
    position: best.position,
    completedDepth,
    rootCandidates: ordered.length
  };
};

const fillDiagnostics = (
  diagnostics: AiSearchDiagnostics | undefined,
  context: SearchContext,
  startedAt: number,
  completedDepth: number,
  rootCandidates: number
): void => {
  if (!diagnostics) return;
  diagnostics.nodes = context.nodes;
  diagnostics.completedDepth = completedDepth;
  diagnostics.rootCandidates = rootCandidates;
  diagnostics.elapsedMs = Date.now() - startedAt;
  diagnostics.timedOut = context.timedOut;
};

export const chooseAiMove = (
  board: Board,
  mark: Mark,
  difficulty: AiDifficulty,
  options: AiSearchOptions = {}
): Position => {
  const startedAt = Date.now();
  if (board.getMoves().length === 0) {
    if (options.diagnostics) {
      options.diagnostics.nodes = 0;
      options.diagnostics.completedDepth = 0;
      options.diagnostics.rootCandidates = 1;
      options.diagnostics.elapsedMs = 0;
      options.diagnostics.timedOut = false;
    }
    return { x: 0, y: 0 };
  }

  const seed = options.seed ?? seedFromBoard(board);
  const budget = options.timeBudgetMs ?? (difficulty === 'expert' ? 1_200 : difficulty === 'hard' ? 420 : 140);
  const context: SearchContext = {
    deadline: Date.now() + Math.max(20, budget),
    seed,
    nodes: 0,
    timedOut: false
  };

  let position: Position;
  let completedDepth = 0;
  let rootCandidates = 0;

  if (difficulty === 'easy') {
    position = chooseEasy(board, mark);
  } else if (difficulty === 'medium') {
    position = chooseMedium(board, mark, seed);
  } else if (difficulty === 'hard') {
    position = chooseHard(board, mark, context);
  } else {
    const choice = chooseExpert(board, mark, context, Math.max(1, options.maxDepth ?? 5));
    position = choice.position;
    completedDepth = choice.completedDepth;
    rootCandidates = choice.rootCandidates;
  }

  fillDiagnostics(options.diagnostics, context, startedAt, completedDepth, rootCandidates);
  return position;
};
