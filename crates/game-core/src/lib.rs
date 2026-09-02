mod ai;
mod board;
mod types;
mod win;

use std::fmt;

use ai::choose_ai_move;
use board::Board;
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
    Occupied,
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidRequest(message) => write!(formatter, "{message}"),
            Self::InvalidBoard(message) => write!(formatter, "{message}"),
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
    let next_mark = if board.moves().len() % 2 == 0 {
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
    fn dispatch_rejects_occupied_cells() {
        let response = dispatch_json(
            r#"{"op":"apply_move","moves":[{"x":0,"y":0,"mark":"X"}],"position":{"x":0,"y":0},"mark":"O"}"#,
        );
        let parsed = serde_json::from_str::<serde_json::Value>(&response).unwrap();
        assert_eq!(parsed["ok"], false);
        assert_eq!(parsed["error"], "Cell is occupied");
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
}
