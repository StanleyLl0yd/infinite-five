use std::{
    collections::HashMap,
    time::{SystemTime, UNIX_EPOCH},
};

use crate::{
    board::Board,
    types::{AiDifficulty, AiSearchDiagnostics, Mark, Move, Position},
    win::get_winning_line,
};

const WIN_SCORE: f64 = 1_000_000_000.0;
const DIRECTIONS: [(i64, i64); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

#[derive(Clone, Copy, Debug)]
struct RankedMove {
    position: Position,
    score: f64,
}

#[derive(Clone, Copy, Debug)]
struct SearchResult {
    score: f64,
    complete: bool,
}

#[derive(Debug)]
struct SearchContext {
    deadline_ms: f64,
    seed: u32,
    nodes: u64,
    timed_out: bool,
}

#[derive(Clone, Copy, Debug)]
struct ExpertChoice {
    position: Position,
    completed_depth: u32,
    root_candidates: usize,
}

#[derive(Debug)]
struct EasyRandom {
    state: u32,
}

impl EasyRandom {
    fn new(seed: u32) -> Self {
        let mixed = seed ^ 0x9e37_79b9;
        Self {
            state: if mixed == 0 { 0xa341_316c } else { mixed },
        }
    }

    fn unit(&mut self) -> f64 {
        let mut value = self.state;
        value ^= value << 13;
        value ^= value >> 17;
        value ^= value << 5;
        self.state = value;
        value as f64 / (u32::MAX as f64 + 1.0)
    }

    fn index(&mut self, length: usize) -> usize {
        ((self.unit() * length as f64).floor() as usize).min(length.saturating_sub(1))
    }
}

#[cfg(target_arch = "wasm32")]
#[link(wasm_import_module = "env")]
extern "C" {
    #[link_name = "now_ms"]
    fn host_now_ms() -> f64;
}

#[cfg(target_arch = "wasm32")]
fn now_ms() -> f64 {
    unsafe { host_now_ms() }
}

#[cfg(not(target_arch = "wasm32"))]
fn now_ms() -> f64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_secs_f64() * 1000.0)
        .unwrap_or(0.0)
}

fn hash_number(value: i32) -> u32 {
    let mut result = value as u32;
    result ^= result >> 16;
    result = result.wrapping_mul(0x7feb_352d);
    result ^= result >> 15;
    result = result.wrapping_mul(0x846c_a68b);
    result ^= result >> 16;
    result
}

fn imul(value: i64, factor: u32) -> u32 {
    (value as i32 as u32).wrapping_mul(factor)
}

fn position_noise(position: Position, seed: u32) -> f64 {
    let mixed = seed ^ imul(position.x, 73_856_093) ^ imul(position.y, 19_349_663);
    hash_number(mixed as i32) as f64 / u32::MAX as f64
}

fn seed_from_board(board: &Board) -> u32 {
    let mut seed = 0x811c_9dc5_u32;
    for next in board.moves() {
        let value = (next.x as i32)
            .wrapping_mul(31)
            .wrapping_add((next.y as i32).wrapping_mul(131))
            .wrapping_add(if next.mark == Mark::X { 17 } else { 29 });
        seed ^= hash_number(value);
        seed = seed.wrapping_mul(0x0100_0193);
    }
    seed
}

fn count_direction(
    board: &Board,
    position: Position,
    mark: Mark,
    dx: i64,
    dy: i64,
) -> (i64, bool) {
    let mut count = 0;
    let mut x = position.x + dx;
    let mut y = position.y + dy;
    while board.get(x, y) == Some(mark) {
        count += 1;
        x += dx;
        y += dy;
    }
    (count, board.get(x, y).is_none())
}

fn contiguous_score(length: i64, open_ends: i64) -> f64 {
    if length >= 5 {
        WIN_SCORE
    } else if length == 4 && open_ends == 2 {
        12_000_000.0
    } else if length == 4 && open_ends == 1 {
        1_800_000.0
    } else if length == 3 && open_ends == 2 {
        260_000.0
    } else if length == 3 && open_ends == 1 {
        22_000.0
    } else if length == 2 && open_ends == 2 {
        5_000.0
    } else if length == 2 && open_ends == 1 {
        650.0
    } else if open_ends == 2 {
        60.0
    } else {
        10.0
    }
}

fn window_pattern_score(
    board: &Board,
    position: Position,
    mark: Mark,
    dx: i64,
    dy: i64,
) -> f64 {
    let opponent = mark.opponent();
    let mut best: f64 = 0.0;

    for offset in -4..=0 {
        let mut own = 0;
        let mut empty = 0;
        let mut blocked = false;
        for step in 0..5 {
            let relative = offset + step;
            let x = position.x + relative * dx;
            let y = position.y + relative * dy;
            let cell = if relative == 0 {
                Some(mark)
            } else {
                board.get(x, y)
            };
            if cell == Some(opponent) {
                blocked = true;
                break;
            }
            if cell == Some(mark) {
                own += 1;
            } else {
                empty += 1;
            }
        }

        if blocked {
            continue;
        }
        if own >= 5 {
            best = best.max(WIN_SCORE);
        } else if own == 4 && empty == 1 {
            best = best.max(2_400_000.0);
        } else if own == 3 && empty == 2 {
            best = best.max(95_000.0);
        } else if own == 2 && empty == 3 {
            best = best.max(4_000.0);
        }
    }
    best
}

fn score_for_mark(board: &Board, position: Position, mark: Mark) -> f64 {
    let mut score = 0.0;
    for (dx, dy) in DIRECTIONS {
        let before = count_direction(board, position, mark, -dx, -dy);
        let after = count_direction(board, position, mark, dx, dy);
        score += contiguous_score(
            1 + before.0 + after.0,
            i64::from(before.1) + i64::from(after.1),
        );
        score += window_pattern_score(board, position, mark, dx, dy);
    }
    score
}

fn neighbor_score(board: &Board, position: Position) -> f64 {
    let mut score = 0.0;
    for dx in -2_i64..=2 {
        for dy in -2_i64..=2 {
            if dx == 0 && dy == 0 {
                continue;
            }
            if board.get(position.x + dx, position.y + dy).is_some() {
                score += if dx.abs() <= 1 && dy.abs() <= 1 {
                    12.0
                } else {
                    3.0
                };
            }
        }
    }
    score
}

fn rank_score(
    board: &Board,
    position: Position,
    mark: Mark,
    attack_weight: f64,
    defense_weight: f64,
) -> f64 {
    score_for_mark(board, position, mark) * attack_weight
        + score_for_mark(board, position, mark.opponent()) * defense_weight
        + neighbor_score(board, position)
}

fn is_winning_move(board: &mut Board, position: Position, mark: Mark) -> bool {
    if !board.place(position.x, position.y, mark) {
        return false;
    }
    let wins = get_winning_line(
        board,
        Move {
            x: position.x,
            y: position.y,
            mark,
        },
    )
    .is_some();
    board.undo();
    wins
}

fn find_winning_moves(
    board: &mut Board,
    mark: Mark,
    candidates: &[Position],
) -> Vec<Position> {
    candidates
        .iter()
        .copied()
        .filter(|candidate| is_winning_move(board, *candidate, mark))
        .collect()
}

fn ranked_candidates_with(
    board: &Board,
    mark: Mark,
    radius: i64,
    attack_weight: f64,
    defense_weight: f64,
) -> Vec<RankedMove> {
    let mut ranked = board
        .candidates(radius)
        .into_iter()
        .map(|position| RankedMove {
            position,
            score: rank_score(board, position, mark, attack_weight, defense_weight),
        })
        .collect::<Vec<_>>();
    ranked.sort_by(|a, b| b.score.total_cmp(&a.score));
    ranked
}

fn ranked_candidates(board: &Board, mark: Mark) -> Vec<RankedMove> {
    ranked_candidates_with(board, mark, 2, 1.0, 0.98)
}

fn immediate_threat_count(board: &mut Board, mark: Mark, limit: usize) -> usize {
    let candidates = ranked_candidates(board, mark)
        .into_iter()
        .take(28)
        .map(|entry| entry.position)
        .collect::<Vec<_>>();
    let mut count = 0;
    for candidate in candidates {
        if is_winning_move(board, candidate, mark) {
            count += 1;
            if count >= limit {
                break;
            }
        }
    }
    count
}

fn is_double_threat_move(board: &mut Board, position: Position, mark: Mark) -> bool {
    if !board.place(position.x, position.y, mark) {
        return false;
    }
    let creates_win = get_winning_line(
        board,
        Move {
            x: position.x,
            y: position.y,
            mark,
        },
    )
    .is_some();
    let threats = if creates_win {
        2
    } else {
        immediate_threat_count(board, mark, 2)
    };
    board.undo();
    threats >= 2
}

fn find_double_threat_moves(
    board: &mut Board,
    mark: Mark,
    candidates: &[Position],
    deadline_ms: f64,
    limit: usize,
) -> Vec<Position> {
    let mut result = Vec::new();
    for candidate in candidates {
        if now_ms() >= deadline_ms {
            break;
        }
        if is_double_threat_move(board, *candidate, mark) {
            result.push(*candidate);
            if result.len() >= limit {
                break;
            }
        }
    }
    result
}

fn static_evaluation(board: &mut Board, mark: Mark) -> f64 {
    let own = ranked_candidates(board, mark);
    let enemy = ranked_candidates(board, mark.opponent());
    let own_score = own
        .iter()
        .take(4)
        .enumerate()
        .map(|(index, candidate)| candidate.score / (index + 1) as f64)
        .sum::<f64>();
    let enemy_score = enemy
        .iter()
        .take(4)
        .enumerate()
        .map(|(index, candidate)| candidate.score / (index + 1) as f64)
        .sum::<f64>();
    own_score - enemy_score * 1.09
}

fn choose_easy(board: &mut Board, mark: Mark, seed: u32) -> Position {
    let candidates = board.candidates(1);
    let wins = find_winning_moves(board, mark, &candidates);
    let mut random = EasyRandom::new(seed);
    if !wins.is_empty() {
        return wins[random.index(wins.len())];
    }

    let blocks = find_winning_moves(board, mark.opponent(), &candidates);
    if !blocks.is_empty() && random.unit() < 0.72 {
        return blocks[random.index(blocks.len())];
    }

    let mut ranked = candidates
        .into_iter()
        .map(|position| RankedMove {
            position,
            score: rank_score(board, position, mark, 1.0, 0.98),
        })
        .collect::<Vec<_>>();
    ranked.sort_by(|a, b| b.score.total_cmp(&a.score));
    let pool_size = ranked
        .len()
        .min(((ranked.len() as f64 * 0.35).ceil() as usize).max(1))
        .min(10);
    ranked[random.index(pool_size)].position
}

fn choose_medium(board: &mut Board, mark: Mark, seed: u32) -> Position {
    let ranked = ranked_candidates(board, mark);
    let candidates = ranked.iter().map(|entry| entry.position).collect::<Vec<_>>();
    let wins = find_winning_moves(board, mark, &candidates);
    if let Some(first) = wins.first() {
        return *first;
    }

    let blocks = find_winning_moves(board, mark.opponent(), &candidates);
    if let Some(first) = blocks.first() {
        return *first;
    }

    let best_score = ranked[0].score;
    let mut pool = ranked
        .into_iter()
        .filter(|entry| entry.score >= best_score * 0.94)
        .take(3)
        .collect::<Vec<_>>();
    let scale = 0.02 * best_score.max(1.0);
    pool.sort_by(|a, b| {
        let b_value = b.score + position_noise(b.position, seed) * scale;
        let a_value = a.score + position_noise(a.position, seed) * scale;
        b_value.total_cmp(&a_value)
    });
    pool[0].position
}

fn evaluate_hard_candidate(
    board: &mut Board,
    candidate: RankedMove,
    mark: Mark,
    context: &mut SearchContext,
) -> f64 {
    let opponent = mark.opponent();
    board.place(candidate.position.x, candidate.position.y, mark);

    let own_threats = immediate_threat_count(board, mark, 3);
    let opponent_candidates = ranked_candidates(board, opponent)
        .into_iter()
        .take(22)
        .map(|entry| entry.position)
        .collect::<Vec<_>>();
    let opponent_wins = find_winning_moves(board, opponent, &opponent_candidates);

    if !opponent_wins.is_empty() {
        board.undo();
        return -WIN_SCORE + candidate.score;
    }
    if own_threats >= 2 {
        board.undo();
        return WIN_SCORE * 0.84 + candidate.score;
    }

    let replies = ranked_candidates(board, opponent)
        .into_iter()
        .take(14)
        .collect::<Vec<_>>();
    let mut worst_reply = f64::INFINITY;
    for reply in replies {
        if now_ms() >= context.deadline_ms {
            context.timed_out = true;
            break;
        }
        context.nodes += 1;
        board.place(reply.position.x, reply.position.y, opponent);
        let reply_move = Move {
            x: reply.position.x,
            y: reply.position.y,
            mark: opponent,
        };
        let score = if get_winning_line(board, reply_move).is_some() {
            -WIN_SCORE
        } else {
            static_evaluation(board, mark)
        };
        board.undo();
        worst_reply = worst_reply.min(score);
    }

    board.undo();
    let fallback = static_evaluation(board, mark);
    (if worst_reply.is_finite() {
        worst_reply
    } else {
        fallback
    }) + candidate.score * 0.12
        + own_threats as f64 * 7_500_000.0
}

fn choose_hard(board: &mut Board, mark: Mark, context: &mut SearchContext) -> Position {
    let ranked = ranked_candidates(board, mark);
    let candidates = ranked.iter().map(|entry| entry.position).collect::<Vec<_>>();
    let wins = find_winning_moves(board, mark, &candidates);
    if let Some(first) = wins.first() {
        return *first;
    }

    let opponent = mark.opponent();
    let blocks = find_winning_moves(board, opponent, &candidates);
    if let Some(first) = blocks.first() {
        return *first;
    }

    let opponent_candidates = ranked_candidates(board, opponent)
        .into_iter()
        .take(14)
        .map(|entry| entry.position)
        .collect::<Vec<_>>();
    let opponent_forks = find_double_threat_moves(
        board,
        opponent,
        &opponent_candidates,
        context.deadline_ms,
        2,
    );
    if opponent_forks.len() == 1 {
        return opponent_forks[0];
    }

    let mut best = ranked[0];
    let mut best_score = f64::NEG_INFINITY;
    for candidate in ranked.iter().copied().take(26) {
        if now_ms() >= context.deadline_ms {
            context.timed_out = true;
            break;
        }
        let score = evaluate_hard_candidate(board, candidate, mark, context);
        if score > best_score {
            best = candidate;
            best_score = score;
        }
    }
    best.position
}

fn expert_consensus(board: &Board, mark: Mark, seed: u32) -> Vec<RankedMove> {
    let profiles = [
        ranked_candidates_with(board, mark, 2, 1.24, 0.82),
        ranked_candidates_with(board, mark, 2, 0.86, 1.28),
        ranked_candidates_with(board, mark, 3, 1.04, 1.04),
        ranked_candidates_with(board, mark, 3, 1.16, 0.94),
        ranked_candidates_with(board, mark, 3, 0.94, 1.16),
    ];
    let mut combined: Vec<(Position, f64, usize)> = Vec::new();
    let mut indexes = HashMap::<Position, usize>::new();

    for (profile_index, profile) in profiles.into_iter().enumerate() {
        let limit = if profile_index < 2 { 15 } else { 20 };
        for (index, candidate) in profile.into_iter().take(limit).enumerate() {
            let entry_index = if let Some(existing) = indexes.get(&candidate.position) {
                *existing
            } else {
                let next = combined.len();
                indexes.insert(candidate.position, next);
                combined.push((candidate.position, 0.0, 0));
                next
            };
            let entry = &mut combined[entry_index];
            entry.1 += candidate.score / (1.0 + index as f64 * 0.09);
            entry.2 += 1;
        }
    }

    let mut result = combined
        .into_iter()
        .map(|(position, score, votes)| RankedMove {
            position,
            score: score
                + (votes * votes) as f64 * 720_000.0
                + position_noise(position, seed) * 500.0,
        })
        .collect::<Vec<_>>();
    result.sort_by(|a, b| b.score.total_cmp(&a.score));
    result
}

fn ordered_search_moves(
    board: &mut Board,
    turn: Mark,
    width: usize,
    seed: u32,
) -> Vec<RankedMove> {
    let ranked = ranked_candidates(board, turn);
    let candidates = ranked.iter().map(|entry| entry.position).collect::<Vec<_>>();
    let wins = find_winning_moves(board, turn, &candidates);
    if !wins.is_empty() {
        return wins
            .into_iter()
            .map(|position| RankedMove {
                position,
                score: WIN_SCORE,
            })
            .collect();
    }

    let blocks = find_winning_moves(board, turn.opponent(), &candidates);
    if !blocks.is_empty() {
        let mut result = blocks
            .into_iter()
            .map(|position| RankedMove {
                position,
                score: rank_score(board, position, turn, 1.0, 0.98),
            })
            .collect::<Vec<_>>();
        result.sort_by(|a, b| b.score.total_cmp(&a.score));
        result.truncate(width);
        return result;
    }

    let mut result = ranked.into_iter().take(width * 2).collect::<Vec<_>>();
    result.sort_by(|a, b| {
        let b_value = b.score + position_noise(b.position, seed) * 50.0;
        let a_value = a.score + position_noise(a.position, seed) * 50.0;
        b_value.total_cmp(&a_value)
    });
    result.truncate(width);
    result
}

fn search(
    board: &mut Board,
    perspective: Mark,
    turn: Mark,
    depth: u32,
    mut alpha: f64,
    mut beta: f64,
    context: &mut SearchContext,
) -> SearchResult {
    context.nodes += 1;
    if let Some(last_move) = board.moves().last().copied() {
        if get_winning_line(board, last_move).is_some() {
            return SearchResult {
                score: if last_move.mark == perspective {
                    WIN_SCORE + depth as f64
                } else {
                    -WIN_SCORE - depth as f64
                },
                complete: true,
            };
        }
    }
    if depth == 0 {
        return SearchResult {
            score: static_evaluation(board, perspective),
            complete: true,
        };
    }
    if now_ms() >= context.deadline_ms {
        context.timed_out = true;
        return SearchResult {
            score: static_evaluation(board, perspective),
            complete: false,
        };
    }

    let width = if depth >= 4 {
        11
    } else if depth == 3 {
        10
    } else if depth == 2 {
        8
    } else {
        6
    };
    let candidates = ordered_search_moves(board, turn, width, context.seed ^ depth);
    if candidates.is_empty() {
        return SearchResult {
            score: static_evaluation(board, perspective),
            complete: true,
        };
    }

    let maximizing = turn == perspective;
    let mut best = if maximizing {
        f64::NEG_INFINITY
    } else {
        f64::INFINITY
    };
    for candidate in candidates {
        if now_ms() >= context.deadline_ms {
            context.timed_out = true;
            return SearchResult {
                score: if best.is_finite() {
                    best
                } else {
                    static_evaluation(board, perspective)
                },
                complete: false,
            };
        }

        board.place(candidate.position.x, candidate.position.y, turn);
        let child = search(
            board,
            perspective,
            turn.opponent(),
            depth - 1,
            alpha,
            beta,
            context,
        );
        board.undo();

        if !child.complete {
            return SearchResult {
                score: if best.is_finite() { best } else { child.score },
                complete: false,
            };
        }

        if maximizing {
            best = best.max(child.score);
            alpha = alpha.max(best);
        } else {
            best = best.min(child.score);
            beta = beta.min(best);
        }
        if beta <= alpha {
            break;
        }
    }

    SearchResult {
        score: if best.is_finite() {
            best
        } else {
            static_evaluation(board, perspective)
        },
        complete: true,
    }
}

fn score_expert_root_move(
    board: &mut Board,
    candidate: RankedMove,
    mark: Mark,
    depth: u32,
    context: &mut SearchContext,
) -> SearchResult {
    let opponent = mark.opponent();
    board.place(candidate.position.x, candidate.position.y, mark);
    let next = Move {
        x: candidate.position.x,
        y: candidate.position.y,
        mark,
    };

    if get_winning_line(board, next).is_some() {
        board.undo();
        return SearchResult {
            score: WIN_SCORE,
            complete: true,
        };
    }

    let own_threats = immediate_threat_count(board, mark, 3);
    let opponent_threats = immediate_threat_count(board, opponent, 2);
    let result = if opponent_threats > 0 {
        SearchResult {
            score: -WIN_SCORE * 0.95,
            complete: true,
        }
    } else if own_threats >= 2 {
        SearchResult {
            score: WIN_SCORE * 0.94 + own_threats as f64 * 1_100_000.0,
            complete: true,
        }
    } else {
        search(
            board,
            mark,
            opponent,
            depth.saturating_sub(1),
            f64::NEG_INFINITY,
            f64::INFINITY,
            context,
        )
    };
    board.undo();

    SearchResult {
        score: result.score
            + candidate.score * 0.03
            + position_noise(candidate.position, context.seed ^ depth) * 250.0,
        complete: result.complete,
    }
}

fn choose_expert(
    board: &mut Board,
    mark: Mark,
    context: &mut SearchContext,
    max_depth: u32,
) -> ExpertChoice {
    let consensus = expert_consensus(board, mark, context.seed);
    let candidates = consensus
        .iter()
        .map(|entry| entry.position)
        .collect::<Vec<_>>();
    let wins = find_winning_moves(board, mark, &candidates);
    if let Some(first) = wins.first() {
        return ExpertChoice {
            position: *first,
            completed_depth: 0,
            root_candidates: consensus.len(),
        };
    }

    let opponent = mark.opponent();
    let mut blocks = find_winning_moves(board, opponent, &candidates);
    if !blocks.is_empty() {
        blocks.sort_by(|a, b| {
            rank_score(board, *b, mark, 1.0, 0.98)
                .total_cmp(&rank_score(board, *a, mark, 1.0, 0.98))
        });
        return ExpertChoice {
            position: blocks[0],
            completed_depth: 0,
            root_candidates: consensus.len(),
        };
    }

    let own_candidates = consensus
        .iter()
        .take(16)
        .map(|entry| entry.position)
        .collect::<Vec<_>>();
    let own_forks =
        find_double_threat_moves(board, mark, &own_candidates, context.deadline_ms, 2);
    if let Some(first) = own_forks.first() {
        return ExpertChoice {
            position: *first,
            completed_depth: 0,
            root_candidates: consensus.len(),
        };
    }

    let opponent_candidates = ranked_candidates(board, opponent)
        .into_iter()
        .take(18)
        .map(|entry| entry.position)
        .collect::<Vec<_>>();
    let opponent_forks =
        find_double_threat_moves(board, opponent, &opponent_candidates, context.deadline_ms, 3);
    if opponent_forks.len() == 1 {
        return ExpertChoice {
            position: opponent_forks[0],
            completed_depth: 0,
            root_candidates: consensus.len(),
        };
    }

    let mut ordered = consensus.into_iter().take(16).collect::<Vec<_>>();
    let mut best = ordered[0];
    let mut completed_depth = 0;

    for depth in 1..=max_depth {
        if now_ms() >= context.deadline_ms {
            context.timed_out = true;
            break;
        }

        let mut scored = Vec::new();
        let mut iteration_complete = true;
        for candidate in ordered.iter().copied() {
            if now_ms() >= context.deadline_ms {
                context.timed_out = true;
                iteration_complete = false;
                break;
            }
            let result = score_expert_root_move(board, candidate, mark, depth, context);
            if !result.complete {
                iteration_complete = false;
                break;
            }
            scored.push(RankedMove {
                position: candidate.position,
                score: result.score,
            });
        }

        if !iteration_complete {
            break;
        }

        scored.sort_by(|a, b| b.score.total_cmp(&a.score));
        best = scored[0];
        completed_depth = depth;
        let score_by_position = scored
            .into_iter()
            .map(|entry| (entry.position, entry.score))
            .collect::<HashMap<_, _>>();
        ordered.sort_by(|a, b| {
            let b_score = score_by_position.get(&b.position).copied().unwrap_or(b.score);
            let a_score = score_by_position.get(&a.position).copied().unwrap_or(a.score);
            b_score.total_cmp(&a_score)
        });

        if best.score >= WIN_SCORE * 0.93 {
            break;
        }
    }

    ExpertChoice {
        position: best.position,
        completed_depth,
        root_candidates: ordered.len(),
    }
}

pub fn choose_ai_move(
    board: &mut Board,
    mark: Mark,
    difficulty: AiDifficulty,
    seed: Option<u32>,
    time_budget_ms: Option<u64>,
    max_depth: Option<u32>,
) -> (Position, AiSearchDiagnostics) {
    let started_at = now_ms();
    if board.moves().is_empty() {
        return (
            Position { x: 0, y: 0 },
            AiSearchDiagnostics {
                nodes: 0,
                completed_depth: 0,
                root_candidates: 1,
                elapsed_ms: 0.0,
                timed_out: false,
            },
        );
    }

    let seed = seed.unwrap_or_else(|| seed_from_board(board));
    let default_budget = match difficulty {
        AiDifficulty::Expert => 1_200,
        AiDifficulty::Hard => 420,
        AiDifficulty::Easy | AiDifficulty::Medium => 140,
    };
    let budget = time_budget_ms.unwrap_or(default_budget).max(20);
    let mut context = SearchContext {
        deadline_ms: now_ms() + budget as f64,
        seed,
        nodes: 0,
        timed_out: false,
    };

    let mut completed_depth = 0;
    let mut root_candidates = 0;
    let position = match difficulty {
        AiDifficulty::Easy => choose_easy(board, mark, seed),
        AiDifficulty::Medium => choose_medium(board, mark, seed),
        AiDifficulty::Hard => choose_hard(board, mark, &mut context),
        AiDifficulty::Expert => {
            let choice = choose_expert(board, mark, &mut context, max_depth.unwrap_or(5).max(1));
            completed_depth = choice.completed_depth;
            root_candidates = choice.root_candidates;
            choice.position
        }
    };

    (
        position,
        AiSearchDiagnostics {
            nodes: context.nodes,
            completed_depth,
            root_candidates,
            elapsed_ms: (now_ms() - started_at).max(0.0),
            timed_out: context.timed_out,
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn double_threat_board(mark: Mark, other: Mark) -> Board {
        let mut board = Board::default();
        for (x, y) in [(-2, 0), (-1, 0), (1, 0), (0, -2), (0, -1), (0, 1)] {
            assert!(board.place(x, y, mark));
        }
        assert!(board.place(-4, -4, other));
        board
    }

    #[test]
    fn scoring_weights_match_the_typescript_baseline() {
        assert_eq!(contiguous_score(5, 0), WIN_SCORE);
        assert_eq!(contiguous_score(4, 2), 12_000_000.0);
        assert_eq!(contiguous_score(4, 1), 1_800_000.0);
        assert_eq!(contiguous_score(3, 2), 260_000.0);
        assert_eq!(contiguous_score(3, 1), 22_000.0);
        assert_eq!(contiguous_score(2, 2), 5_000.0);
        assert_eq!(contiguous_score(2, 1), 650.0);
        assert_eq!(contiguous_score(1, 2), 60.0);
        assert_eq!(contiguous_score(1, 1), 10.0);
    }

    #[test]
    fn medium_takes_an_immediate_win() {
        let mut board = Board::default();
        for x in 0..4 {
            assert!(board.place(x, 0, Mark::O));
        }
        let (position, _) =
            choose_ai_move(&mut board, Mark::O, AiDifficulty::Medium, Some(1), None, None);
        assert!(matches!(position, Position { x: -1, y: 0 } | Position { x: 4, y: 0 }));
    }

    #[test]
    fn hard_blocks_an_immediate_loss() {
        let mut board = Board::default();
        for x in 0..4 {
            assert!(board.place(x, 0, Mark::X));
        }
        let (position, _) =
            choose_ai_move(&mut board, Mark::O, AiDifficulty::Hard, Some(2), Some(500), None);
        assert!(matches!(position, Position { x: -1, y: 0 } | Position { x: 4, y: 0 }));
    }

    #[test]
    fn expert_finds_and_blocks_double_threat_intersections() {
        let mut own = double_threat_board(Mark::O, Mark::X);
        let (attack, _) = choose_ai_move(
            &mut own,
            Mark::O,
            AiDifficulty::Expert,
            Some(4),
            Some(2_000),
            Some(1),
        );
        assert_eq!(attack, Position { x: 0, y: 0 });

        let mut enemy = double_threat_board(Mark::X, Mark::O);
        let (block, _) = choose_ai_move(
            &mut enemy,
            Mark::O,
            AiDifficulty::Expert,
            Some(5),
            Some(2_000),
            Some(1),
        );
        assert_eq!(block, Position { x: 0, y: 0 });
    }

    #[test]
    fn expert_fills_a_broken_four_immediately() {
        let mut board = Board::default();
        for x in [-2, -1, 1, 2] {
            assert!(board.place(x, 0, Mark::O));
        }
        assert!(board.place(0, 2, Mark::X));
        let (position, _) = choose_ai_move(
            &mut board,
            Mark::O,
            AiDifficulty::Expert,
            Some(7),
            Some(500),
            None,
        );
        assert_eq!(position, Position { x: 0, y: 0 });
    }

    #[test]
    fn fixed_depth_seeded_expert_is_deterministic() {
        fn create_board() -> Board {
            let mut board = Board::default();
            for next in [
                Move { x: 0, y: 0, mark: Mark::X },
                Move { x: 1, y: 0, mark: Mark::O },
                Move { x: 0, y: 1, mark: Mark::X },
                Move { x: 2, y: 0, mark: Mark::O },
                Move { x: -1, y: 1, mark: Mark::X },
            ] {
                assert!(board.place(next.x, next.y, next.mark));
            }
            board
        }

        let (first, _) = choose_ai_move(
            &mut create_board(),
            Mark::O,
            AiDifficulty::Expert,
            Some(8),
            Some(2_000),
            Some(1),
        );
        let (second, _) = choose_ai_move(
            &mut create_board(),
            Mark::O,
            AiDifficulty::Expert,
            Some(8),
            Some(2_000),
            Some(1),
        );
        assert_eq!(first, second);
    }

    #[test]
    fn search_reports_bounded_diagnostics_without_mutating_board() {
        let mut board = Board::default();
        for next in [
            Move { x: 0, y: 0, mark: Mark::X },
            Move { x: 1, y: 0, mark: Mark::O },
            Move { x: 0, y: 1, mark: Mark::X },
            Move { x: 1, y: 1, mark: Mark::O },
            Move { x: -1, y: 0, mark: Mark::X },
            Move { x: 2, y: 1, mark: Mark::O },
        ] {
            assert!(board.place(next.x, next.y, next.mark));
        }
        let before = board.moves().to_vec();
        let (position, diagnostics) = choose_ai_move(
            &mut board,
            Mark::X,
            AiDifficulty::Expert,
            Some(9),
            Some(500),
            Some(3),
        );
        assert!(board.get(position.x, position.y).is_none());
        assert!(diagnostics.nodes > 0);
        assert!(diagnostics.root_candidates > 0);
        assert!(diagnostics.completed_depth <= 3);
        assert_eq!(board.moves(), before);
    }

    #[test]
    fn tiny_budget_still_returns_a_legal_move() {
        let mut board = Board::default();
        for next in [
            Move { x: 0, y: 0, mark: Mark::X },
            Move { x: 1, y: 0, mark: Mark::O },
            Move { x: 0, y: 1, mark: Mark::X },
            Move { x: 1, y: 1, mark: Mark::O },
            Move { x: -1, y: 0, mark: Mark::X },
            Move { x: 2, y: 1, mark: Mark::O },
        ] {
            assert!(board.place(next.x, next.y, next.mark));
        }
        let (position, _) = choose_ai_move(
            &mut board,
            Mark::X,
            AiDifficulty::Expert,
            Some(10),
            Some(1),
            Some(5),
        );
        assert!(board.get(position.x, position.y).is_none());
    }
}
