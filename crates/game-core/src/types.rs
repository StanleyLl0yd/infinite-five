use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum Mark {
    X,
    O,
}

impl Mark {
    pub fn opponent(self) -> Self {
        match self {
            Self::X => Self::O,
            Self::O => Self::X,
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
pub struct Position {
    pub x: i64,
    pub y: i64,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Move {
    pub x: i64,
    pub y: i64,
    pub mark: Mark,
}

impl Move {
    pub fn position(self) -> Position {
        Position {
            x: self.x,
            y: self.y,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct WinningLine {
    pub positions: Vec<Position>,
    pub start: Position,
    pub end: Position,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AiDifficulty {
    Easy,
    Medium,
    Hard,
    Expert,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSearchDiagnostics {
    pub nodes: u64,
    pub completed_depth: u32,
    pub root_candidates: usize,
    pub elapsed_ms: f64,
    pub timed_out: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameState {
    pub moves: Vec<Move>,
    pub winning_line: Option<WinningLine>,
    pub winner: Option<Mark>,
    pub next_mark: Mark,
}
