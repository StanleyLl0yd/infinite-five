import { Board } from './board';
import { getWinningLine } from './win';
import type { Mark, Move, Position } from './types';

export type AiDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AiSearchOptions {
  seed?: number;
  timeBudgetMs?: number;
}

interface RankedMove {
  position: Position;
  score: number;
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

const windowPatternScore = (board: Board, position: Position, mark: Mark, dx: number, dy: number): number => {
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
  const candidates = rankedCandidates(board, mark).slice(0, 24).map(({ position }) => position);
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

const staticEvaluation = (board: Board, mark: Mark): number => {
  const opponent = opponentOf(mark);
  const own = rankedCandidates(board, mark).slice(0, 3);
  const enemy = rankedCandidates(board, opponent).slice(0, 3);
  const ownScore = own.reduce((sum, candidate, index) => sum + candidate.score / (index + 1), 0);
  const enemyScore = enemy.reduce((sum, candidate, index) => sum + candidate.score / (index + 1), 0);
  return ownScore - enemyScore * 1.07;
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
  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  const bestScore = ranked[0]?.score ?? 0;
  const pool = ranked.filter(({ score }) => score >= bestScore * 0.94).slice(0, 3);
  return [...pool]
    .sort(
      (a, b) =>
        b.score + positionNoise(b.position, seed) * 0.02 * Math.max(1, bestScore) -
        (a.score + positionNoise(a.position, seed) * 0.02 * Math.max(1, bestScore))
    )[0]?.position ?? ranked[0].position;
};

const evaluateHardCandidate = (
  board: Board,
  candidate: RankedMove,
  mark: Mark,
  deadline: number
): number => {
  const opponent = opponentOf(mark);
  board.place(candidate.position.x, candidate.position.y, mark);

  const ownThreats = immediateThreatCount(board, mark);
  const opponentWins = findWinningMoves(
    board,
    opponent,
    rankedCandidates(board, opponent).slice(0, 20).map(({ position }) => position)
  );

  if (opponentWins.length > 0) {
    board.undo();
    return -winScore + candidate.score;
  }
  if (ownThreats >= 2) {
    board.undo();
    return winScore * 0.82 + candidate.score;
  }

  const replies = rankedCandidates(board, opponent).slice(0, 12);
  let worstReply = Number.POSITIVE_INFINITY;
  for (const reply of replies) {
    if (Date.now() >= deadline) break;
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
  return (Number.isFinite(worstReply) ? worstReply : fallback) + candidate.score * 0.12 + ownThreats * 7_000_000;
};

const chooseHard = (board: Board, mark: Mark, deadline: number): Position => {
  const ranked = rankedCandidates(board, mark);
  const candidates = ranked.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) return wins[0];

  const opponent = opponentOf(mark);
  const blocks = findWinningMoves(board, opponent, candidates);
  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  let best = ranked[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of ranked.slice(0, 24)) {
    if (Date.now() >= deadline && best) break;
    const score = evaluateHardCandidate(board, candidate, mark, deadline);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best.position;
};

const expertConsensus = (board: Board, mark: Mark, seed: number): RankedMove[] => {
  const profiles = [
    rankedCandidates(board, mark, 2, 1.2, 0.86),
    rankedCandidates(board, mark, 2, 0.9, 1.2),
    rankedCandidates(board, mark, 3, 1.03, 1.03)
  ];
  const combined = new Map<string, RankedMove & { votes: number }>();

  profiles.forEach((profile, profileIndex) => {
    profile.slice(0, profileIndex === 2 ? 18 : 14).forEach((candidate, index) => {
      const key = keyOf(candidate.position.x, candidate.position.y);
      const existing = combined.get(key) ?? {
        position: candidate.position,
        score: 0,
        votes: 0
      };
      existing.score += candidate.score / (1 + index * 0.1);
      existing.votes += 1;
      combined.set(key, existing);
    });
  });

  return [...combined.values()]
    .map(({ position, score, votes }) => ({
      position,
      score: score + votes * 1_500_000 + positionNoise(position, seed) * 500
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
  deadline: number,
  seed: number
): number => {
  const moves = board.getMoves();
  const lastMove = moves[moves.length - 1];
  if (lastMove && getWinningLine(board, lastMove)) {
    return lastMove.mark === perspective ? winScore + depth : -winScore - depth;
  }
  if (depth === 0 || Date.now() >= deadline) {
    return staticEvaluation(board, perspective);
  }

  const width = depth >= 3 ? 10 : depth === 2 ? 8 : 6;
  const candidates = orderedSearchMoves(board, turn, width, seed ^ depth);
  if (candidates.length === 0) {
    return staticEvaluation(board, perspective);
  }

  const maximizing = turn === perspective;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (Date.now() >= deadline) break;
    board.place(candidate.position.x, candidate.position.y, turn);
    const value = search(
      board,
      perspective,
      opponentOf(turn),
      depth - 1,
      alpha,
      beta,
      deadline,
      seed ^ hashNumber(candidate.position.x * 101 + candidate.position.y * 313)
    );
    board.undo();

    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }

  return Number.isFinite(best) ? best : staticEvaluation(board, perspective);
};

const chooseExpert = (board: Board, mark: Mark, deadline: number, seed: number): Position => {
  const consensus = expertConsensus(board, mark, seed);
  const candidates = consensus.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) return wins[0];

  const opponent = opponentOf(mark);
  const blocks = findWinningMoves(board, opponent, candidates);
  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  let best = consensus[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of consensus.slice(0, 18)) {
    if (Date.now() >= deadline && best) break;
    board.place(candidate.position.x, candidate.position.y, mark);

    const opponentThreats = immediateThreatCount(board, opponent);
    const ownThreats = immediateThreatCount(board, mark);
    let score: number;
    if (opponentThreats > 0) {
      score = -winScore * 0.94;
    } else if (ownThreats >= 2) {
      score = winScore * 0.93 + ownThreats * 1_000_000;
    } else {
      score = search(
        board,
        mark,
        opponent,
        4,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        deadline,
        seed
      );
    }
    board.undo();

    score += candidate.score * 0.035 + positionNoise(candidate.position, seed) * 250;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best.position;
};

export const chooseAiMove = (
  board: Board,
  mark: Mark,
  difficulty: AiDifficulty,
  options: AiSearchOptions = {}
): Position => {
  if (board.getMoves().length === 0) {
    return { x: 0, y: 0 };
  }

  const seed = options.seed ?? seedFromBoard(board);
  const budget = options.timeBudgetMs ?? (difficulty === 'expert' ? 900 : difficulty === 'hard' ? 320 : 120);
  const deadline = Date.now() + Math.max(50, budget);

  if (difficulty === 'easy') return chooseEasy(board, mark);
  if (difficulty === 'medium') return chooseMedium(board, mark, seed);
  if (difficulty === 'hard') return chooseHard(board, mark, deadline);
  return chooseExpert(board, mark, deadline, seed);
};
