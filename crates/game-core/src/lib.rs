mod ai;
mod board;
mod types;
mod win;

use std::fmt;

use ai::choose_ai_move;
use board::{validate_move_count, validate_position, Board};
use serde::{Deserialize, Serialize};
use types::{AiDifficulty, AiSearchDiagnostics, GameState, Mark, Move, Position};
use win::get_winning_line;

pub use types::{AiDifficulty as Difficulty, AiSearchDiagnostics as SearchDiagnostics};
pub use types::{GameState as State, Mark as PlayerMark, Move as GameMove, Position as GamePosition};
pub use types::WinningLine;

#[derive(Debug)]
enum CoreError {
    InvalidRequest(String),
    InvalidBoard(&'static str),
    InvalidMove(&'static str),
    Occupied,
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidRequest(message) => write!(formatter, "{message}"),
            Self::InvalidBoard(message) | Self::InvalidMove(message) => write!(formatter, "{message}"),
            Self::Occupied => write!(formatter, "Cell is occupied"),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
enum CoreRequest {
    State {
        moves: Vec<Move>,
    },
    ApplyMove {
        moves: Vec<Move>,
        position: Position,
        mark: Mark,
    },
    Undo {
        moves: Vec<Move>,
        count: usize,
    },
    AiMove {
        moves: Vec<Move>,
        mark: Mark,
        difficulty: AiDifficulty,
        seed: Option<u32>,
        #[serde(rename = "timeBudgetMs")]
        time_budget_ms: Option<u64>,
        #[serde(rename = "maxDepth")]
        max_depth: Option<u32>,
    },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CoreResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    state: Option<GameState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    applied: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    position: Option<Position>,
    #[serde(skip_serializing_if = "Option::is_none")]
    diagnostics: Option<AiSearchDiagnostics>,
}

#[derive(Debug, Serialize)]
struct Envelope {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<CoreResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn board_from_moves(moves: &[Move]) -> Result<Board, CoreError> {
    let mut board = Board::default();
    board.restore(moves).map_err(CoreError::InvalidBoard)?;
    Ok(board)
}

fn state_from_board(board: &Board) -> GameState {
    let winning_line = board
        .moves()
        .last()
        .copied()
        .and_then(|last| get_winning_line(board, last));
    let winner = if winning_line.is_some() {
        board.moves().last().map(|next| next.mark)
    } else {
        None
    };
    let next_mark = if board.moves().len().is_multiple_of(2) {
        Mark::X
    } else {
        Mark::O
    };
    GameState {
        moves: board.moves().to_vec(),
        winning_line,
        winner,
        next_mark,
    }
}

fn validate_turn(board: &Board, mark: Mark) -> Result<(), CoreError> {
    let state = state_from_board(board);
    if state.winner.is_some() {
        return Err(CoreError::InvalidMove("Game is already finished"));
    }
    if mark != state.next_mark {
        return Err(CoreError::InvalidMove("Invalid turn"));
    }
    Ok(())
}

fn dispatch(request: CoreRequest) -> Result<CoreResponse, CoreError> {
    match request {
        CoreRequest::State { moves } => {
            let board = board_from_moves(&moves)?;
            Ok(CoreResponse {
                state: Some(state_from_board(&board)),
                applied: None,
                position: None,
                diagnostics: None,
            })
        }
        CoreRequest::ApplyMove {
            moves,
            position,
            mark,
        } => {
            let mut board = board_from_moves(&moves)?;
            validate_turn(&board, mark)?;
            validate_position(position).map_err(CoreError::InvalidMove)?;
            validate_move_count(board.moves().len().saturating_add(1))
                .map_err(CoreError::InvalidMove)?;
            if !board.place(position.x, position.y, mark) {
                return Err(CoreError::Occupied);
            }
            Ok(CoreResponse {
                state: Some(state_from_board(&board)),
                applied: Some(true),
                position: None,
                diagnostics: None,
            })
        }
        CoreRequest::Undo { moves, count } => {
            let mut board = board_from_moves(&moves)?;
            for _ in 0..count {
                if board.undo().is_none() {
                    break;
                }
            }
            Ok(CoreResponse {
                state: Some(state_from_board(&board)),
                applied: None,
                position: None,
                diagnostics: None,
            })
        }
        CoreRequest::AiMove {
            moves,
            mark,
            difficulty,
            seed,
            time_budget_ms,
            max_depth,
        } => {
            let mut board = board_from_moves(&moves)?;
            validate_turn(&board, mark)?;
            validate_move_count(board.moves().len().saturating_add(1))
                .map_err(CoreError::InvalidMove)?;
            let (position, diagnostics) = choose_ai_move(
                &mut board,
                mark,
                difficulty,
                seed,
                time_budget_ms,
                max_depth,
            );
            Ok(CoreResponse {
                state: None,
                applied: None,
                position: Some(position),
                diagnostics: Some(diagnostics),
            })
        }
    }
}

pub fn dispatch_json(input: &str) -> String {
    let result = serde_json::from_str::<CoreRequest>(input)
        .map_err(|error| CoreError::InvalidRequest(format!("Invalid core request: {error}")))
        .and_then(dispatch);

    let envelope = match result {
        Ok(result) => Envelope {
            ok: true,
            result: Some(result),
            error: None,
        },
        Err(error) => Envelope {
            ok: false,
            result: None,
            error: Some(error.to_string()),
        },
    };
    serde_json::to_string(&envelope).unwrap_or_else(|_| {
        r#"{"ok":false,"error":"Core response serialization failed"}"#.to_string()
    })
}

#[cfg(target_arch = "wasm32")]
fn leak_bytes(bytes: Box<[u8]>) -> (u32, u32) {
    let length = bytes.len() as u32;
    let pointer = Box::into_raw(bytes) as *mut u8 as u32;
    (pointer, length)
}

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub extern "C" fn core_alloc(length: u32) -> u32 {
    let bytes = vec![0_u8; length as usize].into_boxed_slice();
    Box::into_raw(bytes) as *mut u8 as u32
}

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub unsafe extern "C" fn core_dealloc(pointer: u32, length: u32) {
    if pointer == 0 {
        return;
    }
    let slice = std::ptr::slice_from_raw_parts_mut(pointer as *mut u8, length as usize);
    drop(Box::from_raw(slice));
}

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub unsafe extern "C" fn core_call(pointer: u32, length: u32) -> u64 {
    let input = std::slice::from_raw_parts(pointer as *const u8, length as usize);
    let output = match std::str::from_utf8(input) {
        Ok(value) => dispatch_json(value),
        Err(_) => r#"{"ok":false,"error":"Core request is not valid UTF-8"}"#.to_string(),
    };
    let (output_pointer, output_length) = leak_bytes(output.into_bytes().into_boxed_slice());
    ((output_pointer as u64) << 32) | output_length as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request_ai(
        moves: &[Move],
        mark: Mark,
        difficulty: AiDifficulty,
        seed: u32,
        time_budget_ms: u64,
        max_depth: Option<u32>,
    ) -> (Position, AiSearchDiagnostics) {
        let response = dispatch(CoreRequest::AiMove {
            moves: moves.to_vec(),
            mark,
            difficulty,
            seed: Some(seed),
            time_budget_ms: Some(time_budget_ms),
            max_depth,
        })
        .unwrap();
        (response.position.unwrap(), response.diagnostics.unwrap())
    }

    fn apply_move(moves: &[Move], position: Position, mark: Mark) -> GameState {
        dispatch(CoreRequest::ApplyMove {
            moves: moves.to_vec(),
            position,
            mark,
        })
        .unwrap()
        .state
        .unwrap()
    }

    fn play_match(
        x_difficulty: AiDifficulty,
        o_difficulty: AiDifficulty,
        seed: u32,
        max_moves: usize,
    ) -> Vec<Move> {
        let mut moves = Vec::new();
        let mut mark = Mark::X;

        for ply in 0..max_moves {
            let difficulty = if mark == Mark::X {
                x_difficulty
            } else {
                o_difficulty
            };
            let budget = match difficulty {
                AiDifficulty::Expert => 55,
                AiDifficulty::Hard => 35,
                AiDifficulty::Easy | AiDifficulty::Medium => 20,
            };
            let max_depth = (difficulty == AiDifficulty::Expert).then_some(2);
            let (position, _) = request_ai(
                &moves,
                mark,
                difficulty,
                seed.wrapping_add((ply as u32).wrapping_mul(97)),
                budget,
                max_depth,
            );
            assert!(!moves.iter().any(|next| next.position() == position));
            let state = apply_move(&moves, position, mark);
            moves = state.moves;
            if state.winner.is_some() {
                break;
            }
            mark = state.next_mark;
        }
        moves
    }

    #[test]
    fn dispatch_applies_moves_and_reports_state() {
        let response = dispatch_json(
            r#"{"op":"apply_move","moves":[],"position":{"x":0,"y":0},"mark":"X"}"#,
        );
        let parsed = serde_json::from_str::<serde_json::Value>(&response).unwrap();
        assert_eq!(parsed["ok"], true);
        assert_eq!(parsed["result"]["state"]["moves"][0]["mark"], "X");
        assert_eq!(parsed["result"]["state"]["nextMark"], "O");
    }

    #[test]
    fn dispatch_rejects_invalid_moves() {
        let occupied = dispatch_json(
            r#"{"op":"apply_move","moves":[{"x":0,"y":0,"mark":"X"}],"position":{"x":0,"y":0},"mark":"O"}"#,
        );
        let parsed = serde_json::from_str::<serde_json::Value>(&occupied).unwrap();
        assert_eq!(parsed["ok"], false);
        assert_eq!(parsed["error"], "Cell is occupied");

        let wrong_turn = dispatch_json(
            r#"{"op":"apply_move","moves":[],"position":{"x":0,"y":0},"mark":"O"}"#,
        );
        let parsed = serde_json::from_str::<serde_json::Value>(&wrong_turn).unwrap();
        assert_eq!(parsed["ok"], false);
        assert_eq!(parsed["error"], "Invalid turn");
    }

    #[test]
    fn undo_is_performed_inside_the_core() {
        let response = dispatch_json(
            r#"{"op":"undo","moves":[{"x":0,"y":0,"mark":"X"},{"x":1,"y":0,"mark":"O"}],"count":1}"#,
        );
        let parsed = serde_json::from_str::<serde_json::Value>(&response).unwrap();
        assert_eq!(parsed["result"]["state"]["moves"].as_array().unwrap().len(), 1);
        assert_eq!(parsed["result"]["state"]["nextMark"], "O");
    }

    #[test]
    fn medium_returns_an_empty_nearby_cell() {
        let moves = [
            Move {
                x: 0,
                y: 0,
                mark: Mark::X,
            },
            Move {
                x: 1,
                y: 0,
                mark: Mark::O,
            },
        ];
        let (position, _) = request_ai(&moves, Mark::X, AiDifficulty::Medium, 3, 140, None);
        assert!(!moves.iter().any(|next| next.position() == position));
        assert!(position.x.abs().max(position.y.abs()) <= 3);
    }

    #[test]
    fn expert_and_hard_self_play_remains_legal() {
        let first = play_match(AiDifficulty::Expert, AiDifficulty::Hard, 101, 24);
        let second = play_match(AiDifficulty::Expert, AiDifficulty::Hard, 101, 24);
        assert!(!first.is_empty());
        assert!(!second.is_empty());
        assert!(first.len() <= 24);
        assert!(second.len() <= 24);

        let mirrored = play_match(AiDifficulty::Hard, AiDifficulty::Expert, 211, 24);
        assert!(!mirrored.is_empty());
        assert!(mirrored.len() <= 24);
    }

    #[test]
    fn representative_expert_position_reports_search_diagnostics() {
        let moves = [
            Move { x: 0, y: 0, mark: Mark::X },
            Move { x: 1, y: 0, mark: Mark::O },
            Move { x: 0, y: 1, mark: Mark::X },
            Move { x: 1, y: 1, mark: Mark::O },
            Move { x: -1, y: 0, mark: Mark::X },
            Move { x: 2, y: 1, mark: Mark::O },
            Move { x: -1, y: 1, mark: Mark::X },
            Move { x: 2, y: 0, mark: Mark::O },
        ];
        let (position, diagnostics) =
            request_ai(&moves, Mark::X, AiDifficulty::Expert, 313, 500, Some(3));
        assert!(!moves.iter().any(|next| next.position() == position));
        assert!(diagnostics.root_candidates > 0);
        assert!(diagnostics.completed_depth <= 3);
        assert!(diagnostics.elapsed_ms >= 0.0);
    }
}
