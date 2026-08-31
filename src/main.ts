import './styles.css';
import { Board } from './game/board';
import { getWinningLine } from './game/win';
import type { Mark, Move, WinningLine } from './game/types';
import { CanvasBoard } from './ui/canvas-board';

const gameStorageKey = 'infinite-five.game.v1';
const themeStorageKey = 'infinite-five.theme.v1';

const canvas = document.querySelector<HTMLCanvasElement>('#board');
const status = document.querySelector<HTMLElement>('#status');
const centerButton = document.querySelector<HTMLButtonElement>('#centerButton');
const themeButton = document.querySelector<HTMLButtonElement>('#themeButton');
const newGameButton = document.querySelector<HTMLButtonElement>('#newGameButton');

if (!canvas || !status || !centerButton || !themeButton || !newGameButton) {
  throw new Error('Application shell is incomplete');
}

const board = new Board();
let currentMark: Mark = 'X';
let winner: Mark | null = null;
let winningLine: WinningLine | null = null;

const isMark = (value: unknown): value is Mark => value === 'X' || value === 'O';

const isMove = (value: unknown): value is Move => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const move = value as Partial<Move>;
  return (
    Number.isInteger(move.x) &&
    Number.isInteger(move.y) &&
    isMark(move.mark)
  );
};

const saveGame = (): void => {
  localStorage.setItem(gameStorageKey, JSON.stringify({ moves: board.getMoves() }));
};

const loadGame = (): void => {
  const saved = localStorage.getItem(gameStorageKey);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved) as { moves?: unknown };
    if (!Array.isArray(parsed.moves) || !parsed.moves.every(isMove)) {
      throw new Error('Invalid saved game');
    }

    board.restore(parsed.moves);
  } catch {
    localStorage.removeItem(gameStorageKey);
    board.clear();
  }
};

const resolveGameState = (): void => {
  const moves = board.getMoves();
  const lastMove = moves[moves.length - 1];
  winningLine = lastMove ? getWinningLine(board, lastMove) : null;
  winner = winningLine && lastMove ? lastMove.mark : null;
  currentMark = moves.length % 2 === 0 ? 'X' : 'O';
};

const updateStatus = (): void => {
  status.textContent = winner ? `${winner} wins` : `${currentMark} to move`;
  status.dataset.winner = winner ?? '';
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

const savedTheme = localStorage.getItem(themeStorageKey);
const initialTheme =
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

applyTheme(initialTheme);
loadGame();
resolveGameState();

const view = new CanvasBoard(canvas, board, ({ x, y }) => {
  if (winner || board.get(x, y)) {
    return;
  }

  const move: Move = { x, y, mark: currentMark };
  if (!board.place(move.x, move.y, move.mark)) {
    return;
  }

  winningLine = getWinningLine(board, move);
  if (winningLine) {
    winner = move.mark;
  } else {
    currentMark = currentMark === 'X' ? 'O' : 'X';
  }

  saveGame();
  updateStatus();
  view.setWinningLine(winningLine);
});

view.setWinningLine(winningLine);
updateStatus();

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

newGameButton.addEventListener('click', () => {
  board.clear();
  currentMark = 'X';
  winner = null;
  winningLine = null;
  localStorage.removeItem(gameStorageKey);
  view.setWinningLine(null);
  view.centerOn();
  updateStatus();
});
