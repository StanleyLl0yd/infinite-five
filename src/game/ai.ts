import { Board } from './board';
import { getWinningLine } from './win';
import type { Mark, Move, Position } from './types';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

const directions: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

const opponentOf = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');
const keyOf = (x: number, y: number): string => `${x},${y}`;

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
        if (board.get(x, y)) {
          continue;
        }

        candidates.set(keyOf(x, y), { x, y });
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

const shapeScore = (length: number, openEnds: number): number => {
  if (length >= 5) {
    return 100_000_000;
  }
  if (length === 4 && openEnds === 2) {
    return 5_000_000;
  }
  if (length === 4 && openEnds === 1) {
    return 650_000;
  }
  if (length === 3 && openEnds === 2) {
    return 120_000;
  }
  if (length === 3 && openEnds === 1) {
    return 9_000;
  }
  if (length === 2 && openEnds === 2) {
    return 2_000;
  }
  if (length === 2 && openEnds === 1) {
    return 320;
  }
  return openEnds === 2 ? 45 : 8;
};

const scoreForMark = (board: Board, position: Position, mark: Mark): number => {
  let score = 0;

  for (const [dx, dy] of directions) {
    const before = countDirection(board, position, mark, -dx, -dy);
    const after = countDirection(board, position, mark, dx, dy);
    score += shapeScore(1 + before.count + after.count, Number(before.open) + Number(after.open));
  }

  return score;
};

const neighborScore = (board: Board, position: Position): number => {
  let score = 0;

  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      if (board.get(position.x + dx, position.y + dy)) {
        score += Math.abs(dx) <= 1 && Math.abs(dy) <= 1 ? 9 : 2;
      }
    }
  }

  return score;
};

const rankScore = (board: Board, position: Position, mark: Mark): number => {
  const opponent = opponentOf(mark);
  return (
    scoreForMark(board, position, mark) +
    scoreForMark(board, position, opponent) * 0.92 +
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
  radius = 2
): Array<{ position: Position; score: number }> =>
  getCandidates(board, radius)
    .map((position) => ({ position, score: rankScore(board, position, mark) }))
    .sort((a, b) => b.score - a.score);

const chooseEasy = (board: Board, mark: Mark): Position => {
  const candidates = getCandidates(board, 1);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) {
    return wins[Math.floor(Math.random() * wins.length)];
  }

  const blocks = findWinningMoves(board, opponentOf(mark), candidates);
  if (blocks.length > 0 && Math.random() < 0.7) {
    return blocks[Math.floor(Math.random() * blocks.length)];
  }

  const ranked = candidates
    .map((position) => ({ position, score: rankScore(board, position, mark) }))
    .sort((a, b) => b.score - a.score);
  const poolSize = Math.max(1, Math.min(ranked.length, Math.ceil(ranked.length * 0.35), 10));
  return ranked[Math.floor(Math.random() * poolSize)].position;
};

const chooseMedium = (board: Board, mark: Mark): Position => {
  const ranked = rankedCandidates(board, mark);
  const candidates = ranked.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) {
    return wins[0];
  }

  const blocks = findWinningMoves(board, opponentOf(mark), candidates);
  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  const bestScore = ranked[0]?.score ?? 0;
  const pool = ranked.filter(({ score }) => score >= bestScore * 0.9).slice(0, 3);
  return (pool[Math.floor(Math.random() * pool.length)] ?? ranked[0]).position;
};

const bestThreatScore = (board: Board, mark: Mark): number => {
  const ranked = rankedCandidates(board, mark).slice(0, 12);
  if (ranked.length === 0) {
    return 0;
  }

  for (const candidate of ranked) {
    if (isWinningMove(board, candidate.position, mark)) {
      return 100_000_000;
    }
  }

  return ranked[0].score;
};

const evaluateAfterResponse = (board: Board, mark: Mark): number => {
  const opponent = opponentOf(mark);
  return bestThreatScore(board, mark) - bestThreatScore(board, opponent) * 1.08;
};

const chooseHard = (board: Board, mark: Mark): Position => {
  const ranked = rankedCandidates(board, mark);
  const candidates = ranked.map(({ position }) => position);
  const wins = findWinningMoves(board, mark, candidates);
  if (wins.length > 0) {
    return wins[0];
  }

  const opponent = opponentOf(mark);
  const blocks = findWinningMoves(board, opponent, candidates);
  if (blocks.length > 0) {
    return blocks.sort((a, b) => rankScore(board, b, mark) - rankScore(board, a, mark))[0];
  }

  const searchMoves = ranked.slice(0, 18);
  let best = searchMoves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of searchMoves) {
    board.place(candidate.position.x, candidate.position.y, mark);

    const replies = rankedCandidates(board, opponent).slice(0, 10);
    let worstReply = Number.POSITIVE_INFINITY;

    if (replies.length === 0) {
      worstReply = evaluateAfterResponse(board, mark);
    } else {
      for (const reply of replies) {
        board.place(reply.position.x, reply.position.y, opponent);
        const replyMove: Move = { ...reply.position, mark: opponent };
        const score = getWinningLine(board, replyMove)
          ? -100_000_000
          : evaluateAfterResponse(board, mark);
        board.undo();
        worstReply = Math.min(worstReply, score);
      }
    }

    const immediateThreats = findWinningMoves(
      board,
      mark,
      getCandidates(board, 2)
    ).length;
    board.undo();

    const score = worstReply + candidate.score * 0.16 + Math.min(immediateThreats, 2) * 7_500_000;
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
  difficulty: AiDifficulty
): Position => {
  if (board.getMoves().length === 0) {
    return { x: 0, y: 0 };
  }

  if (difficulty === 'easy') {
    return chooseEasy(board, mark);
  }
  if (difficulty === 'hard') {
    return chooseHard(board, mark);
  }
  return chooseMedium(board, mark);
};
