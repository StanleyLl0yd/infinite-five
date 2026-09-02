from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if text.count(old) != 1:
        raise SystemExit(f"expected one match in {path}: {old[:80]!r}, found {text.count(old)}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "crates/game-core/src/lib.rs",
    "use board::Board;",
    "use board::{validate_move_count, validate_position, Board};",
)

replace_once(
    "crates/game-core/src/lib.rs",
    """            let mut board = board_from_moves(&moves)?;\n            validate_turn(&board, mark)?;\n            if !board.place(position.x, position.y, mark) {\n""",
    """            let mut board = board_from_moves(&moves)?;\n            validate_turn(&board, mark)?;\n            validate_position(position).map_err(CoreError::InvalidMove)?;\n            validate_move_count(board.moves().len().saturating_add(1))\n                .map_err(CoreError::InvalidMove)?;\n            if !board.place(position.x, position.y, mark) {\n""",
)

replace_once(
    "crates/game-core/src/lib.rs",
    """            let mut board = board_from_moves(&moves)?;\n            validate_turn(&board, mark)?;\n            let (position, diagnostics) = choose_ai_move(\n""",
    """            let mut board = board_from_moves(&moves)?;\n            validate_turn(&board, mark)?;\n            validate_move_count(board.moves().len().saturating_add(1))\n                .map_err(CoreError::InvalidMove)?;\n            let (position, diagnostics) = choose_ai_move(\n""",
)

replace_once(
    "crates/game-core/src/ai.rs",
    """const WIN_SCORE: f64 = 1_000_000_000.0;\nconst DIRECTIONS: [(i64, i64); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];\n""",
    """const WIN_SCORE: f64 = 1_000_000_000.0;\nconst MIN_AI_TIME_BUDGET_MS: u64 = 20;\nconst MAX_AI_TIME_BUDGET_MS: u64 = 5_000;\nconst DEFAULT_EXPERT_DEPTH: u32 = 5;\nconst MAX_AI_DEPTH: u32 = 6;\nconst DIRECTIONS: [(i64, i64); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];\n""",
)

anchor = """pub fn choose_ai_move(\n    board: &mut Board,\n"""
helper = """fn normalize_ai_parameters(\n    difficulty: AiDifficulty,\n    time_budget_ms: Option<u64>,\n    max_depth: Option<u32>,\n) -> (u64, u32) {\n    let default_budget = match difficulty {\n        AiDifficulty::Expert => 1_200,\n        AiDifficulty::Hard => 420,\n        AiDifficulty::Easy | AiDifficulty::Medium => 140,\n    };\n    (\n        time_budget_ms\n            .unwrap_or(default_budget)\n            .clamp(MIN_AI_TIME_BUDGET_MS, MAX_AI_TIME_BUDGET_MS),\n        max_depth\n            .unwrap_or(DEFAULT_EXPERT_DEPTH)\n            .clamp(1, MAX_AI_DEPTH),\n    )\n}\n\n\n""" + anchor
replace_once("crates/game-core/src/ai.rs", anchor, helper)

replace_once(
    "crates/game-core/src/ai.rs",
    """    let seed = seed.unwrap_or_else(|| seed_from_board(board));\n    let default_budget = match difficulty {\n        AiDifficulty::Expert => 1_200,\n        AiDifficulty::Hard => 420,\n        AiDifficulty::Easy | AiDifficulty::Medium => 140,\n    };\n    let budget = time_budget_ms.unwrap_or(default_budget).max(20);\n    let mut context = SearchContext {\n""",
    """    let seed = seed.unwrap_or_else(|| seed_from_board(board));\n    let (budget, max_depth) = normalize_ai_parameters(difficulty, time_budget_ms, max_depth);\n    let mut context = SearchContext {\n""",
)

replace_once(
    "crates/game-core/src/ai.rs",
    """        AiDifficulty::Expert => {\n            let choice = choose_expert(board, mark, &mut context, max_depth.unwrap_or(5).max(1));\n""",
    """        AiDifficulty::Expert => {\n            let choice = choose_expert(board, mark, &mut context, max_depth);\n""",
)

insert_after = """    fn scoring_weights_match_the_typescript_baseline() {\n        assert_eq!(contiguous_score(5, 0), WIN_SCORE);\n        assert_eq!(contiguous_score(4, 2), 12_000_000.0);\n        assert_eq!(contiguous_score(4, 1), 1_800_000.0);\n        assert_eq!(contiguous_score(3, 2), 260_000.0);\n        assert_eq!(contiguous_score(3, 1), 22_000.0);\n        assert_eq!(contiguous_score(2, 2), 5_000.0);\n        assert_eq!(contiguous_score(2, 1), 650.0);\n        assert_eq!(contiguous_score(1, 2), 60.0);\n        assert_eq!(contiguous_score(1, 1), 10.0);\n    }\n"""
new_tests = insert_after + """\n    #[test]\n    fn ai_time_budget_is_clamped_at_trust_boundaries() {\n        assert_eq!(normalize_ai_parameters(AiDifficulty::Expert, Some(0), Some(5)).0, 20);\n        assert_eq!(\n            normalize_ai_parameters(AiDifficulty::Expert, Some(2_600), Some(5)).0,\n            2_600\n        );\n        assert_eq!(\n            normalize_ai_parameters(AiDifficulty::Expert, Some(5_000), Some(5)).0,\n            5_000\n        );\n        assert_eq!(\n            normalize_ai_parameters(AiDifficulty::Expert, Some(u64::MAX), Some(5)).0,\n            5_000\n        );\n    }\n\n    #[test]\n    fn ai_depth_is_clamped_without_changing_expert_production_depth() {\n        assert_eq!(normalize_ai_parameters(AiDifficulty::Expert, None, None).1, 5);\n        assert_eq!(normalize_ai_parameters(AiDifficulty::Expert, None, Some(0)).1, 1);\n        assert_eq!(normalize_ai_parameters(AiDifficulty::Expert, None, Some(5)).1, 5);\n        assert_eq!(normalize_ai_parameters(AiDifficulty::Expert, None, Some(6)).1, 6);\n        assert_eq!(\n            normalize_ai_parameters(AiDifficulty::Expert, None, Some(100_000)).1,\n            6\n        );\n    }\n"""
replace_once("crates/game-core/src/ai.rs", insert_after, new_tests)
