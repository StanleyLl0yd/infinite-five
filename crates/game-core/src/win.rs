use crate::{
    board::Board,
    types::{Move, Position, WinningLine},
};

const DIRECTIONS: [(i64, i64); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

fn count(board: &Board, next: Move, dx: i64, dy: i64) -> i64 {
    let mut result = 0;
    let mut x = next.x + dx;
    let mut y = next.y + dy;
    while board.get(x, y) == Some(next.mark) {
        result += 1;
        x += dx;
        y += dy;
    }
    result
}

pub fn get_winning_line(board: &Board, next: Move) -> Option<WinningLine> {
    for (dx, dy) in DIRECTIONS {
        let before = count(board, next, -dx, -dy);
        let after = count(board, next, dx, dy);
        let length = before + after + 1;
        if length < 5 {
            continue;
        }

        let start = Position {
            x: next.x - before * dx,
            y: next.y - before * dy,
        };
        let end = Position {
            x: next.x + after * dx,
            y: next.y + after * dy,
        };
        let positions = (0..length)
            .map(|index| Position {
                x: start.x + index * dx,
                y: start.y + index * dy,
            })
            .collect();
        return Some(WinningLine {
            positions,
            start,
            end,
        });
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Mark;

    #[test]
    fn detects_five_and_longer_lines() {
        let mut horizontal = Board::default();
        for x in 0..5 {
            assert!(horizontal.place(x, 0, Mark::X));
        }
        let line = get_winning_line(
            &horizontal,
            Move {
                x: 4,
                y: 0,
                mark: Mark::X,
            },
        )
        .unwrap();
        assert_eq!(line.start, Position { x: 0, y: 0 });
        assert_eq!(line.end, Position { x: 4, y: 0 });

        let mut vertical = Board::default();
        for y in -2..=3 {
            assert!(vertical.place(2, y, Mark::O));
        }
        assert_eq!(
            get_winning_line(
                &vertical,
                Move {
                    x: 2,
                    y: 1,
                    mark: Mark::O,
                },
            )
            .unwrap()
            .positions
            .len(),
            6
        );
    }

    #[test]
    fn detects_both_diagonal_directions_and_rejects_four() {
        let mut rising = Board::default();
        let mut falling = Board::default();
        let mut four = Board::default();
        for index in 0..5 {
            assert!(rising.place(index, index, Mark::X));
            assert!(falling.place(index, -index, Mark::O));
            if index < 4 {
                assert!(four.place(index, 0, Mark::X));
            }
        }
        assert!(get_winning_line(
            &rising,
            Move {
                x: 2,
                y: 2,
                mark: Mark::X,
            }
        )
        .is_some());
        assert!(get_winning_line(
            &falling,
            Move {
                x: 2,
                y: -2,
                mark: Mark::O,
            }
        )
        .is_some());
        assert!(get_winning_line(
            &four,
            Move {
                x: 3,
                y: 0,
                mark: Mark::X,
            }
        )
        .is_none());
    }
}
