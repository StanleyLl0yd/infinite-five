use std::collections::{HashMap, HashSet};

use crate::types::{Mark, Move, Position};

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
        for (index, next) in moves.iter().enumerate() {
            let expected = if index.is_multiple_of(2) {
                Mark::X
            } else {
                Mark::O
            };
            if next.mark != expected || !self.place(next.x, next.y, next.mark) {
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
                    if self.get(x, y).is_none() && seen.insert((x, y)) {
                        result.push(Position { x, y });
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
}
