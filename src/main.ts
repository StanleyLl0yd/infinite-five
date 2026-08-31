import './styles.css';
import { chooseAiMove, type AiDifficulty } from './game/ai';
import { Board } from './game/board';
import { getWinningLine } from './game/win';
import type { Mark, Move, Position, WinningLine } from './game/types';
import { CanvasBoard } from './ui/canvas-board';

type GameMode = 'ai' | 'local';

interface Statistics {
  wins: number;
  losses: number;
}

interface SavedGame {
  mode: GameMode;
  moves: Move[];
  resultRecorded: boolean;
}

const gameStorageKey = 'infinite-five.game.v2';
const settingsStorageKey = 'infinite-five.settings.v1';
const statsStorageKey = 'infinite-five.stats.v1';
const themeStorageKey = 'infinite-five.theme.v1';
const humanMark: Mark = 'X';
const computerMark: Mark = 'O';

const canvas = document.querySelector<HTMLCanvasElement>('#board');
const status = document.querySelector<HTMLElement>('#status');
const centerButton = document.querySelector<HTMLButtonElement>('#centerButton');
const undoButton = document.querySelector<HTMLButtonElement>('#undoButton');
const themeButton = document.querySelector<HTMLButtonElement>('#themeButton');
const newGameButton = document.querySelector<HTMLButtonElement>('#newGameButton');
const modeSelect = document.querySelector<HTMLSelectElement>('#modeSelect');
const difficultySelect = document.querySelector<HTMLSelectElement>('#difficultySelect');
const gameOptions = document.querySelector<HTMLElement>('.game-options');
const statsElement = document.querySelector<HTMLElement>('#stats');

if (
  !canvas ||
  !status ||
  !centerButton ||
  !undoButton ||
  !themeButton ||
  !newGameButton ||
  !modeSelect ||
  !difficultySelect ||
  !gameOptions ||
  !statsElement
) {
  throw new Error('Application shell is incomplete');
}

const board = new Board();
let mode: GameMode = 'ai';
let difficulty: AiDifficulty = 'medium';
let currentMark = 'X' as Mark;
let winner: Mark | null = null;
let winningLine: WinningLine | null = null;
let resultRecorded = false;
let aiThinking = false;
let aiTimer: number | null = null;
let statistics: Statistics = { wins: 0, losses: 0 };
let view: CanvasBoard;

const isMark = (value: unknown): value is Mark => value === 'X' || value === 'O';
const isMode = (value: unknown): value is GameMode => value === 'ai' || value === 'local';
const isDifficulty = (value: unknown): value is AiDifficulty =>
  value === 'easy' || value === 'medium' || value === 'hard';

const isMove = (value: unknown): value is Move => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const move = value as Partial<Move>;
  return Number.isInteger(move.x) && Number.isInteger(move.y) && isMark(move.mark);
};

const loadSettings = (): void => {
  const saved = localStorage.getItem(settingsStorageKey);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved) as { mode?: unknown; difficulty?: unknown };
    if (isMode(parsed.mode)) {
      mode = parsed.mode;
    }
    if (isDifficulty(parsed.difficulty)) {
      difficulty = parsed.difficulty;
    }
  } catch {
    localStorage.removeItem(settingsStorageKey);
  }
};

const saveSettings = (): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify({ mode, difficulty }));
};

const loadStatistics = (): void => {
  const saved = localStorage.getItem(statsStorageKey);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<Statistics>;
    if (
      Number.isInteger(parsed.wins) &&
      Number.isInteger(parsed.losses) &&
      (parsed.wins ?? -1) >= 0 &&
      (parsed.losses ?? -1) >= 0
    ) {
      statistics = { wins: parsed.wins ?? 0, losses: parsed.losses ?? 0 };
      return;
    }
  } catch {
    localStorage.removeItem(statsStorageKey);
    return;
  }

  localStorage.removeItem(statsStorageKey);
};

const saveStatistics = (): void => {
  localStorage.setItem(statsStorageKey, JSON.stringify(statistics));
};

const saveGame = (): void => {
  const moves = board.getMoves();
  if (moves.length === 0) {
    localStorage.removeItem(gameStorageKey);
    return;
  }

  const saved: SavedGame = {
    mode,
    moves: [...moves],
    resultRecorded
  };
  localStorage.setItem(gameStorageKey, JSON.stringify(saved));
};

const loadGame = (): void => {
  const saved = localStorage.getItem(gameStorageKey);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SavedGame> & { moves?: unknown };
    if (
      parsed.mode !== mode ||
      !Array.isArray(parsed.moves) ||
      !parsed.moves.every(
        (move, index) => isMove(move) && move.mark === (index % 2 === 0 ? 'X' : 'O')
      )
    ) {
      throw new Error('Invalid saved game');
    }

    board.restore(parsed.moves as Move[]);
    resultRecorded = parsed.resultRecorded === true;
  } catch {
    localStorage.removeItem(gameStorageKey);
    board.clear();
    resultRecorded = false;
  }
};

const resolveGameState = (): void => {
  const moves = board.getMoves();
  const lastMove = moves[moves.length - 1];
  winningLine = lastMove ? getWinningLine(board, lastMove) : null;
  winner = winningLine && lastMove ? lastMove.mark : null;
  currentMark = moves.length % 2 === 0 ? 'X' : 'O';
};

const updateStatistics = (): void => {
  statsElement.textContent = `AI: ${statistics.wins} wins · ${statistics.losses} losses`;
};

const updateStatus = (): void => {
  if (winner) {
    if (mode === 'ai') {
      status.textContent = winner === humanMark ? 'You win' : 'Computer wins';
    } else {
      status.textContent = `${winner} wins`;
    }
  } else if (aiThinking) {
    status.textContent = 'Computer thinking…';
  } else if (mode === 'ai') {
    status.textContent = currentMark === humanMark ? 'Your turn' : 'Computer to move';
  } else {
    status.textContent = `${currentMark} to move`;
  }

  status.dataset.winner = winner ?? '';
};

const updateControls = (): void => {
  modeSelect.value = mode;
  difficultySelect.value = difficulty;
  difficultySelect.disabled = aiThinking;
  modeSelect.disabled = aiThinking;
  undoButton.disabled = mode !== 'ai' || board.getMoves().length === 0 || aiThinking;
  gameOptions.dataset.mode = mode;
};

const refreshUi = (): void => {
  updateStatus();
  updateControls();
  updateStatistics();
};

const applyTheme = (theme: 'light' | 'dark'): void => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);
  themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
  themeButton.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  );
};

const recordResult = (): void => {
  if (mode !== 'ai' || !winner || resultRecorded) {
    return;
  }

  if (winner === humanMark) {
    statistics.wins += 1;
  } else {
    statistics.losses += 1;
  }

  resultRecorded = true;
  saveStatistics();
};

const revertRecordedResult = (): void => {
  if (mode !== 'ai' || !winner || !resultRecorded) {
    return;
  }

  if (winner === humanMark) {
    statistics.wins = Math.max(0, statistics.wins - 1);
  } else {
    statistics.losses = Math.max(0, statistics.losses - 1);
  }

  resultRecorded = false;
  saveStatistics();
};

const applyMove = (position: Position, mark: Mark): boolean => {
  if (!board.place(position.x, position.y, mark)) {
    return false;
  }

  const move: Move = { ...position, mark };
  winningLine = getWinningLine(board, move);
  if (winningLine) {
    winner = mark;
    recordResult();
  } else {
    currentMark = mark === 'X' ? 'O' : 'X';
  }

  saveGame();
  view.setWinningLine(winningLine);
  refreshUi();
  return true;
};

const cancelAiTurn = (): void => {
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer);
    aiTimer = null;
  }
  aiThinking = false;
};

const scheduleAiTurn = (): void => {
  if (mode !== 'ai' || winner || currentMark !== computerMark || aiThinking) {
    return;
  }

  aiThinking = true;
  refreshUi();

  aiTimer = window.setTimeout(() => {
    aiTimer = null;
    const position = chooseAiMove(board, computerMark, difficulty);
    aiThinking = false;
    applyMove(position, computerMark);
  }, 180);
};

const resetGame = (): void => {
  cancelAiTurn();
  board.clear();
  currentMark = 'X';
  winner = null;
  winningLine = null;
  resultRecorded = false;
  localStorage.removeItem(gameStorageKey);
  view.setWinningLine(null);
  view.centerOn();
  refreshUi();
};

const handleCellClick = (position: Position): void => {
  if (winner || aiThinking || board.get(position.x, position.y)) {
    return;
  }
  if (mode === 'ai' && currentMark !== humanMark) {
    return;
  }

  if (applyMove(position, currentMark) && mode === 'ai' && !winner) {
    scheduleAiTurn();
  }
};

const savedTheme = localStorage.getItem(themeStorageKey);
const initialTheme =
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

applyTheme(initialTheme);
loadSettings();
loadStatistics();
loadGame();
resolveGameState();
recordResult();

view = new CanvasBoard(canvas, board, handleCellClick);
view.setWinningLine(winningLine);
refreshUi();
saveGame();

centerButton.addEventListener('click', () => {
  const moves = board.getMoves();
  const lastMove = moves[moves.length - 1];
  view.centerOn(lastMove);
});

themeButton.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  view.render();
});

newGameButton.addEventListener('click', resetGame);

undoButton.addEventListener('click', () => {
  if (mode !== 'ai' || board.getMoves().length === 0) {
    return;
  }

  cancelAiTurn();
  revertRecordedResult();

  const lastMove = board.getMoves()[board.getMoves().length - 1];
  board.undo();
  if (lastMove?.mark === computerMark) {
    board.undo();
  }

  resolveGameState();
  saveGame();
  view.setWinningLine(winningLine);
  refreshUi();
});

modeSelect.addEventListener('change', () => {
  if (!isMode(modeSelect.value)) {
    return;
  }

  mode = modeSelect.value;
  saveSettings();
  resetGame();
});

difficultySelect.addEventListener('change', () => {
  if (!isDifficulty(difficultySelect.value)) {
    return;
  }

  difficulty = difficultySelect.value;
  saveSettings();
  refreshUi();
});

if (mode === 'ai' && board.getMoves().length % 2 === 1 && !winner) {
  scheduleAiTurn();
}
