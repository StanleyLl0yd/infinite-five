use std::collections::{HashMap, HashSet};

use crate::{
    types::{Mark, Move, Position},
    win::get_winning_line,
};

pub(crate) const MAX_MOVES: usize = 2_000;
pub(crate) const MAX_ABS_COORDINATE: i64 = 1_000_000;

pub(crate) fn validate_position(position: Position) -> Result<(), &'static str> {
    if position.x.abs() <= MAX_ABS_COORDINATE && position.y.abs() <= MAX_ABS_COORDINATE {
        Ok(())
    } else {
        Err("Invalid coordinate")
    }
}

pub(crate) fn validate_move_count(count: usize) -> Result<(), &'static str> {
    if count <= MAX_MOVES {
        Ok(())
    } else {
        Err("Move limit exceeded")
    }
}

fn validate_history(moves: &[Move]) -> Result<(), &'static str> {
    validate_move_count(moves.len()).map_err(|_| "Invalid saved game")?;
    if moves
        .iter()
        .any(|next| validate_position(next.position()).is_err())
    {
        return Err("Invalid saved game");
    }
    Ok(())
}

#[derive(Clone, Debug, Default)]
pub struct Board {
    cells: HashMap<(i64, i64), Mark>,
    moves: Vec<Move>,
}

impl Board {
    pub fn get(&self, x: i64, y: i64) -> Option<Mark> {
        self.cells.get(&(x, y)).copied()
    }

    pub fn place(&mut self, x: i64, y: i64, mark: Mark) -> bool {
        if self.cells.contains_key(&(x, y)) {
            return false;
        }
        self.cells.insert((x, y), mark);
        self.moves.push(Move { x, y, mark });
        true
    }

    pub fn undo(&mut self) -> Option<Move> {
        let next = self.moves.pop()?;
        self.cells.remove(&(next.x, next.y));
        Some(next)
    }

    pub fn clear(&mut self) {
        self.cells.clear();
        self.moves.clear();
    }

    pub fn moves(&self) -> &[Move] {
        &self.moves
    }

    pub fn restore(&mut self, moves: &[Move]) -> Result<(), &'static str> {
        self.clear();
        validate_history(moves)?;
        for (index, next) in moves.iter().copied().enumerate() {
            let expected = if index.is_multiple_of(2) {
                Mark::X
            } else {
                Mark::O
            };
            if next.mark != expected || !self.place(next.x, next.y, next.mark) {
                self.clear();
                return Err("Invalid saved game");
            }
            if get_winning_line(self, next).is_some() && index + 1 < moves.len() {
                self.clear();
                return Err("Invalid saved game");
            }
        }
        Ok(())
    }

    pub fn candidates(&self, radius: i64) -> Vec<Position> {
        if self.moves.is_empty() {
            return vec![Position { x: 0, y: 0 }];
        }

        let mut seen = HashSet::new();
        let mut result = Vec::new();
        for next in &self.moves {
            for dx in -radius..=radius {
                for dy in -radius..=radius {
                    if dx == 0 && dy == 0 {
                        continue;
                    }
                    let Some(x) = next.x.checked_add(dx) else {
                        continue;
                    };
                    let Some(y) = next.y.checked_add(dy) else {
                        continue;
                    };
                    let position = Position { x, y };
                    if validate_position(position).is_ok()
                        && self.get(x, y).is_none()
                        && seen.insert((x, y))
                    {
                        result.push(position);
                    }
                }
            }
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn winning_history() -> Vec<Move> {
        vec![
            Move { x: 0, y: 0, mark: Mark::X },
            Move { x: 0, y: 1, mark: Mark::O },
            Move { x: 1, y: 0, mark: Mark::X },
            Move { x: 1, y: 1, mark: Mark::O },
            Move { x: 2, y: 0, mark: Mark::X },
            Move { x: 2, y: 1, mark: Mark::O },
            Move { x: 3, y: 0, mark: Mark::X },
            Move { x: 3, y: 1, mark: Mark::O },
            Move { x: 4, y: 0, mark: Mark::X },
        ]
    }

    #[test]
    fn place_get_and_undo_are_consistent() {
        let mut board = Board::default();
        assert!(board.place(3, -2, Mark::X));
        assert_eq!(board.get(3, -2), Some(Mark::X));
        assert!(!board.place(3, -2, Mark::O));
        assert!(board.place(4, -2, Mark::O));
        assert_eq!(
            board.undo(),
            Some(Move {
                x: 4,
                y: -2,
                mark: Mark::O
            })
        );
        assert_eq!(board.get(4, -2), None);
    }

    #[test]
    fn restore_rejects_invalid_sequences() {
        let mut board = Board::default();
        let duplicate = [
            Move {
                x: 1,
                y: 1,
                mark: Mark::X,
            },
            Move {
                x: 1,
                y: 1,
                mark: Mark::O,
            },
        ];
        assert_eq!(board.restore(&duplicate), Err("Invalid saved game"));
        assert!(board.moves().is_empty());

        let wrong_turn = [Move {
            x: 0,
            y: 0,
            mark: Mark::O,
        }];
        assert_eq!(board.restore(&wrong_turn), Err("Invalid saved game"));
        assert!(board.moves().is_empty());
    }

    #[test]
    fn restore_accepts_a_completed_game_when_the_win_is_last() {
        let history = winning_history();
        let mut board = Board::default();
        assert_eq!(board.restore(&history), Ok(()));
        assert_eq!(board.moves(), history);
    }

    #[test]
    fn restore_rejects_a_move_after_victory() {
        let mut history = winning_history();
        history.push(Move { x: 10, y: 10, mark: Mark::O });
        let mut board = Board::default();
        assert_eq!(board.restore(&history), Err("Invalid saved game"));
        assert!(board.moves().is_empty());
    }

    #[test]
    fn restore_rejects_multiple_moves_after_victory() {
        let mut history = winning_history();
        history.extend([
            Move { x: 10, y: 10, mark: Mark::O },
            Move { x: 11, y: 10, mark: Mark::X },
            Move { x: 12, y: 10, mark: Mark::O },
        ]);
        let mut board = Board::default();
        assert_eq!(board.restore(&history), Err("Invalid saved game"));
        assert!(board.moves().is_empty());
    }

    #[test]
    fn restore_accepts_coordinate_boundaries_and_rejects_values_beyond_them() {
        assert_eq!(
            validate_position(Position {
                x: MAX_ABS_COORDINATE,
                y: -MAX_ABS_COORDINATE,
            }),
            Ok(())
        );
        assert!(validate_position(Position {
            x: MAX_ABS_COORDINATE + 1,
            y: 0,
        })
        .is_err());
        assert!(validate_position(Position {
            x: 0,
            y: -MAX_ABS_COORDINATE - 1,
        })
        .is_err());
    }

    #[test]
    fn restore_enforces_the_move_limit_boundary() {
        let moves = (0..MAX_MOVES)
            .map(|index| Move {
                x: index as i64,
                y: 0,
                mark: if index.is_multiple_of(2) { Mark::X } else { Mark::O },
            })
            .collect::<Vec<_>>();
        let mut board = Board::default();
        assert_eq!(board.restore(&moves), Ok(()));

        let mut too_many = moves;
        too_many.push(Move {
            x: MAX_MOVES as i64,
            y: 0,
            mark: Mark::X,
        });
        assert_eq!(board.restore(&too_many), Err("Invalid saved game"));
        assert!(board.moves().is_empty());
    }

    #[test]
    fn candidates_keep_deterministic_insertion_order() {
        let mut board = Board::default();
        assert!(board.place(0, 0, Mark::X));
        let candidates = board.candidates(1);
        assert_eq!(
            candidates,
            vec![
                Position { x: -1, y: -1 },
                Position { x: -1, y: 0 },
                Position { x: -1, y: 1 },
                Position { x: 0, y: -1 },
                Position { x: 0, y: 1 },
                Position { x: 1, y: -1 },
                Position { x: 1, y: 0 },
                Position { x: 1, y: 1 },
            ]
        );
    }

    #[test]
    fn candidates_do_not_escape_coordinate_limits() {
        let mut board = Board::default();
        assert!(board.place(MAX_ABS_COORDINATE, MAX_ABS_COORDINATE, Mark::X));
        assert!(board
            .candidates(1)
            .iter()
            .all(|position| validate_position(*position).is_ok()));
    }
}
