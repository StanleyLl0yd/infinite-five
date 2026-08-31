import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { requestAiMove } from './game/ai-client';
import type { AiDifficulty } from './game/ai';
import { Board } from './game/board';
import {
  addHistoryEntry,
  createHistoryId,
  parseHistory,
  removeLatestMatchingHistoryEntry,
  serializeHistory,
  summarizeHistory,
  type HistoryEntry
} from './game/history';
import {
  createShareUrl,
  decodeSharedGame,
  encodeSharedGame,
  readSharedGameFromHash
} from './game/share';
import { getWinningLine } from './game/win';
import type { Mark, Move, Position, WinningLine } from './game/types';
import { interpolate, resolveLocale, translations, type LanguagePreference, type Locale } from './i18n';
import { CanvasBoard } from './ui/canvas-board';

type GameMode = 'ai' | 'local';
type ThemePreference = 'system' | 'light' | 'dark';
type HumanSidePreference = 'X' | 'O' | 'random';

interface Statistics {
  wins: number;
  losses: number;
}

interface AppSettings {
  mode: GameMode;
  difficulty: AiDifficulty;
  humanSide: HumanSidePreference;
  theme: ThemePreference;
  language: LanguagePreference;
  sound: boolean;
  vibration: boolean;
}

interface SavedGame {
  version: 3;
  mode: GameMode;
  difficulty: AiDifficulty;
  humanMark: Mark;
  moves: Move[];
  resultRecorded: boolean;
}

interface ReplayState {
  moves: Move[];
  index: number;
  shared: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const gameStorageKey = 'infinite-five.game.v3';
const legacyGameStorageKey = 'infinite-five.game.v2';
const settingsStorageKey = 'infinite-five.settings.v2';
const legacySettingsStorageKey = 'infinite-five.settings.v1';
const statsStorageKey = 'infinite-five.stats.v1';
const historyStorageKey = 'infinite-five.history.v1';
const legacyThemeStorageKey = 'infinite-five.theme.v1';

const defaultSettings: AppSettings = {
  mode: 'ai',
  difficulty: 'medium',
  humanSide: 'X',
  theme: 'system',
  language: 'auto',
  sound: true,
  vibration: true
};

const getElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing application element: ${selector}`);
  }
  return element;
};

const canvas = getElement<HTMLCanvasElement>('#board');
const boardKeyboardHelp = getElement<HTMLElement>('#boardKeyboardHelp');
const status = getElement<HTMLElement>('#status');
const centerButton = getElement<HTMLButtonElement>('#centerButton');
const undoButton = getElement<HTMLButtonElement>('#undoButton');
const themeButton = getElement<HTMLButtonElement>('#themeButton');
const historyButton = getElement<HTMLButtonElement>('#historyButton');
const settingsButton = getElement<HTMLButtonElement>('#settingsButton');
const newGameButton = getElement<HTMLButtonElement>('#newGameButton');
const modeSelect = getElement<HTMLSelectElement>('#modeSelect');
const difficultySelect = getElement<HTMLSelectElement>('#difficultySelect');
const gameOptions = getElement<HTMLElement>('.game-options');
const statsElement = getElement<HTMLElement>('#stats');
const metaDescription = getElement<HTMLMetaElement>('#metaDescription');
const gameInfoTitle = getElement<HTMLElement>('#gameInfoTitle');
const gameInfoRules = getElement<HTMLElement>('#gameInfoRules');
const modeLabel = getElement<HTMLElement>('#modeLabel');
const difficultyLabel = getElement<HTMLElement>('#difficultyLabel');
const modeAiOption = getElement<HTMLOptionElement>('#modeAiOption');
const modeLocalOption = getElement<HTMLOptionElement>('#modeLocalOption');
const difficultyEasyOption = getElement<HTMLOptionElement>('#difficultyEasyOption');
const difficultyMediumOption = getElement<HTMLOptionElement>('#difficultyMediumOption');
const difficultyHardOption = getElement<HTMLOptionElement>('#difficultyHardOption');
const difficultyExpertOption = getElement<HTMLOptionElement>('#difficultyExpertOption');
const resultDialog = getElement<HTMLDialogElement>('#resultDialog');
const resultDialogTitle = getElement<HTMLElement>('#resultDialogTitle');
const resultDialogPrompt = getElement<HTMLElement>('#resultDialogPrompt');
const resultDialogDetails = getElement<HTMLElement>('#resultDialogDetails');
const resultCloseButton = getElement<HTMLButtonElement>('#resultCloseButton');
const resultNewGameButton = getElement<HTMLButtonElement>('#resultNewGameButton');
const resultReplayButton = getElement<HTMLButtonElement>('#resultReplayButton');
const resultShareButton = getElement<HTMLButtonElement>('#resultShareButton');
const resumeDialog = getElement<HTMLDialogElement>('#resumeDialog');
const resumeDialogTitle = getElement<HTMLElement>('#resumeDialogTitle');
const resumeDialogPrompt = getElement<HTMLElement>('#resumeDialogPrompt');
const resumeContinueButton = getElement<HTMLButtonElement>('#resumeContinueButton');
const resumeNewGameButton = getElement<HTMLButtonElement>('#resumeNewGameButton');
const historyDialog = getElement<HTMLDialogElement>('#historyDialog');
const historyDialogTitle = getElement<HTMLElement>('#historyDialogTitle');
const historySummary = getElement<HTMLElement>('#historySummary');
const historyList = getElement<HTMLElement>('#historyList');
const historyCloseButton = getElement<HTMLButtonElement>('#historyCloseButton');
const settingsDialog = getElement<HTMLDialogElement>('#settingsDialog');
const settingsDialogTitle = getElement<HTMLElement>('#settingsDialogTitle');
const settingsCloseButton = getElement<HTMLButtonElement>('#settingsCloseButton');
const settingsSaveButton = getElement<HTMLButtonElement>('#settingsSaveButton');
const humanSideField = getElement<HTMLElement>('#humanSideField');
const humanSideLabel = getElement<HTMLElement>('#humanSideLabel');
const humanSideSelect = getElement<HTMLSelectElement>('#humanSideSelect');
const sideXOption = getElement<HTMLOptionElement>('#sideXOption');
const sideOOption = getElement<HTMLOptionElement>('#sideOOption');
const sideRandomOption = getElement<HTMLOptionElement>('#sideRandomOption');
const themeLabel = getElement<HTMLElement>('#themeLabel');
const themeSelect = getElement<HTMLSelectElement>('#themeSelect');
const themeSystemOption = getElement<HTMLOptionElement>('#themeSystemOption');
const themeLightOption = getElement<HTMLOptionElement>('#themeLightOption');
const themeDarkOption = getElement<HTMLOptionElement>('#themeDarkOption');
const languageLabel = getElement<HTMLElement>('#languageLabel');
const languageSelect = getElement<HTMLSelectElement>('#languageSelect');
const languageAutoOption = getElement<HTMLOptionElement>('#languageAutoOption');
const languageRussianOption = getElement<HTMLOptionElement>('#languageRussianOption');
const languageEnglishOption = getElement<HTMLOptionElement>('#languageEnglishOption');
const soundLabel = getElement<HTMLElement>('#soundLabel');
const soundCheckbox = getElement<HTMLInputElement>('#soundCheckbox');
const vibrationLabel = getElement<HTMLElement>('#vibrationLabel');
const vibrationCheckbox = getElement<HTMLInputElement>('#vibrationCheckbox');
const installButton = getElement<HTMLButtonElement>('#installButton');
const installHint = getElement<HTMLElement>('#installHint');
const replayBar = getElement<HTMLElement>('#replayBar');
const replayTitle = getElement<HTMLElement>('#replayTitle');
const replayStep = getElement<HTMLElement>('#replayStep');
const replayPreviousButton = getElement<HTMLButtonElement>('#replayPreviousButton');
const replayNextButton = getElement<HTMLButtonElement>('#replayNextButton');
const replayShareButton = getElement<HTMLButtonElement>('#replayShareButton');
const replayExitButton = getElement<HTMLButtonElement>('#replayExitButton');
const toast = getElement<HTMLElement>('#toast');
const toastText = getElement<HTMLElement>('#toastText');
const toastActionButton = getElement<HTMLButtonElement>('#toastActionButton');

const board = new Board();
let settings: AppSettings = { ...defaultSettings };
let locale: Locale = 'en';
let text: (typeof translations)[keyof typeof translations] = translations.en;
let humanMark: Mark = 'X';
let currentMark: Mark = 'X';
let winner: Mark | null = null;
let winningLine: WinningLine | null = null;
let resultRecorded = false;
let aiThinking = false;
let aiTimer: number | null = null;
let aiRequestVersion = 0;
let resultTimer: number | null = null;
let statistics: Statistics = { wins: 0, losses: 0 };
let gameHistory: HistoryEntry[] = [];
let replay: ReplayState | null = null;
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let toastTimer: number | null = null;
let view: CanvasBoard;

const isMark = (value: unknown): value is Mark => value === 'X' || value === 'O';
const isMode = (value: unknown): value is GameMode => value === 'ai' || value === 'local';
const isDifficulty = (value: unknown): value is AiDifficulty =>
  value === 'easy' || value === 'medium' || value === 'hard' || value === 'expert';
const isHumanSide = (value: unknown): value is HumanSidePreference =>
  value === 'X' || value === 'O' || value === 'random';
const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';
const isLanguagePreference = (value: unknown): value is LanguagePreference =>
  value === 'auto' || value === 'ru' || value === 'en';

const isMove = (value: unknown): value is Move => {
  if (!value || typeof value !== 'object') return false;
  const move = value as Partial<Move>;
  return Number.isInteger(move.x) && Number.isInteger(move.y) && isMark(move.mark);
};

const computerMark = (): Mark => (humanMark === 'X' ? 'O' : 'X');

const systemLocale = (): Locale =>
  resolveLocale(
    navigator.language,
    ...navigator.languages,
    Intl.DateTimeFormat().resolvedOptions().locale
  );

const resolvedTheme = (): 'light' | 'dark' => {
  if (settings.theme === 'light' || settings.theme === 'dark') return settings.theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const chooseHumanMark = (): Mark => {
  if (settings.humanSide === 'X' || settings.humanSide === 'O') return settings.humanSide;
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % 2 === 0 ? 'X' : 'O';
};

const showToast = (message: string, action?: { label: string; run: () => void }): void => {
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastText.textContent = message;
  toastActionButton.hidden = !action;
  if (action) {
    toastActionButton.textContent = action.label;
    toastActionButton.onclick = action.run;
  } else {
    toastActionButton.onclick = null;
  }
  toast.hidden = false;
  if (!action) {
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
      toastTimer = null;
    }, 2600);
  }
};

const applyTranslations = (): void => {
  locale = settings.language === 'auto' ? systemLocale() : settings.language;
  text = translations[locale];
  document.documentElement.lang = locale;
  metaDescription.content = text.metaDescription;
  gameInfoTitle.textContent = text.infoTitle;
  gameInfoRules.textContent = text.infoRules;
  gameOptions.setAttribute('aria-label', text.gameOptionsLabel);
  canvas.setAttribute('aria-label', text.boardLabel);
  canvas.dataset.cellLabel = text.cellLabel;
  boardKeyboardHelp.textContent = text.boardKeyboardHelp;
  modeLabel.textContent = text.modeLabel;
  modeAiOption.textContent = text.modeAi;
  modeLocalOption.textContent = text.modeLocal;
  difficultyLabel.textContent = text.difficultyLabel;
  difficultyEasyOption.textContent = text.difficultyEasy;
  difficultyMediumOption.textContent = text.difficultyMedium;
  difficultyHardOption.textContent = text.difficultyHard;
  difficultyExpertOption.textContent = text.difficultyExpert;
  centerButton.querySelector('.button-label')!.textContent = text.center;
  undoButton.querySelector('.button-label')!.textContent = text.undo;
  historyButton.querySelector('.button-label')!.textContent = text.history;
  settingsButton.querySelector('.button-label')!.textContent = text.settings;
  newGameButton.querySelector('.button-label')!.textContent = text.newGame;
  resultDialogPrompt.textContent = text.resultPrompt;
  resultCloseButton.textContent = text.close;
  resultNewGameButton.textContent = text.newGame;
  resultReplayButton.textContent = text.replay;
  resultShareButton.textContent = text.share;
  resumeDialogTitle.textContent = text.resumeTitle;
  resumeContinueButton.textContent = text.continueGame;
  resumeNewGameButton.textContent = text.newGame;
  historyDialogTitle.textContent = text.historyTitle;
  historyCloseButton.textContent = text.close;
  settingsDialogTitle.textContent = text.settingsTitle;
  settingsCloseButton.textContent = text.close;
  settingsSaveButton.textContent = text.saveSettings;
  humanSideLabel.textContent = text.sideLabel;
  sideXOption.textContent = text.sideX;
  sideOOption.textContent = text.sideO;
  sideRandomOption.textContent = text.sideRandom;
  themeLabel.textContent = text.themeLabel;
  themeSystemOption.textContent = text.themeSystem;
  themeLightOption.textContent = text.themeLight;
  themeDarkOption.textContent = text.themeDark;
  languageLabel.textContent = text.languageLabel;
  languageAutoOption.textContent = text.languageAuto;
  languageRussianOption.textContent = text.languageRussian;
  languageEnglishOption.textContent = text.languageEnglish;
  soundLabel.textContent = text.soundLabel;
  vibrationLabel.textContent = text.vibrationLabel;
  installButton.textContent = text.install;
  installHint.textContent = text.installUnavailable;
  replayTitle.textContent = text.replayTitle;
  replayPreviousButton.setAttribute('aria-label', text.previous);
  replayNextButton.setAttribute('aria-label', text.next);
  replayPreviousButton.title = text.previous;
  replayNextButton.title = text.next;
  replayShareButton.textContent = text.share;
  replayExitButton.textContent = text.exitReplay;
  centerButton.title = text.center;
  undoButton.title = text.undo;
  historyButton.title = text.history;
  settingsButton.title = text.settings;
  newGameButton.title = text.newGame;
};

const applyTheme = (): void => {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  themeButton.querySelector('.button-label')!.textContent = theme === 'dark' ? text.light : text.dark;
  themeButton.setAttribute('aria-label', theme === 'dark' ? text.switchToLight : text.switchToDark);
  themeButton.title = theme === 'dark' ? text.switchToLight : text.switchToDark;
};

const loadSettings = (): void => {
  const saved = localStorage.getItem(settingsStorageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Partial<AppSettings>;
      settings = {
        mode: isMode(parsed.mode) ? parsed.mode : defaultSettings.mode,
        difficulty: isDifficulty(parsed.difficulty) ? parsed.difficulty : defaultSettings.difficulty,
        humanSide: isHumanSide(parsed.humanSide) ? parsed.humanSide : defaultSettings.humanSide,
        theme: isThemePreference(parsed.theme) ? parsed.theme : defaultSettings.theme,
        language: isLanguagePreference(parsed.language) ? parsed.language : defaultSettings.language,
        sound: typeof parsed.sound === 'boolean' ? parsed.sound : defaultSettings.sound,
        vibration: typeof parsed.vibration === 'boolean' ? parsed.vibration : defaultSettings.vibration
      };
      return;
    } catch {
      localStorage.removeItem(settingsStorageKey);
    }
  }

  const legacy = localStorage.getItem(legacySettingsStorageKey);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as { mode?: unknown; difficulty?: unknown };
      if (isMode(parsed.mode)) settings.mode = parsed.mode;
      if (isDifficulty(parsed.difficulty)) settings.difficulty = parsed.difficulty;
    } catch {
      localStorage.removeItem(legacySettingsStorageKey);
    }
  }
  const legacyTheme = localStorage.getItem(legacyThemeStorageKey);
  if (legacyTheme === 'light' || legacyTheme === 'dark') settings.theme = legacyTheme;
};

const saveSettings = (): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  localStorage.removeItem(legacySettingsStorageKey);
  localStorage.removeItem(legacyThemeStorageKey);
};

const loadStatistics = (): void => {
  const saved = localStorage.getItem(statsStorageKey);
  if (!saved) return;
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

const loadHistory = (): void => {
  gameHistory = parseHistory(localStorage.getItem(historyStorageKey));
};

const saveHistory = (): void => {
  localStorage.setItem(historyStorageKey, serializeHistory(gameHistory));
};

const validateMoves = (moves: unknown[]): moves is Move[] =>
  moves.every((move, index) => isMove(move) && move.mark === (index % 2 === 0 ? 'X' : 'O'));

const loadSavedGame = (): boolean => {
  const saved = localStorage.getItem(gameStorageKey) ?? localStorage.getItem(legacyGameStorageKey);
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved) as Partial<SavedGame> & { moves?: unknown; mode?: unknown };
    if (!isMode(parsed.mode) || !Array.isArray(parsed.moves) || !validateMoves(parsed.moves)) {
      throw new Error('Invalid saved game');
    }

    settings.mode = parsed.mode;
    if (isDifficulty(parsed.difficulty)) settings.difficulty = parsed.difficulty;
    humanMark = isMark(parsed.humanMark) ? parsed.humanMark : 'X';
    board.restore(parsed.moves);
    resultRecorded = parsed.resultRecorded === true;
    saveSettings();
    return true;
  } catch {
    localStorage.removeItem(gameStorageKey);
    localStorage.removeItem(legacyGameStorageKey);
    board.clear();
    resultRecorded = false;
    return false;
  }
};

const saveGame = (): void => {
  if (replay?.shared) return;
  const moves = board.getMoves();
  if (moves.length === 0) {
    localStorage.removeItem(gameStorageKey);
    localStorage.removeItem(legacyGameStorageKey);
    return;
  }

  const saved: SavedGame = {
    version: 3,
    mode: settings.mode,
    difficulty: settings.difficulty,
    humanMark,
    moves: [...moves],
    resultRecorded
  };
  localStorage.setItem(gameStorageKey, JSON.stringify(saved));
  localStorage.removeItem(legacyGameStorageKey);
};

const resolveGameState = (): void => {
  const moves = board.getMoves();
  const lastMove = moves[moves.length - 1];
  winningLine = lastMove ? getWinningLine(board, lastMove) : null;
  winner = winningLine && lastMove ? lastMove.mark : null;
  currentMark = moves.length % 2 === 0 ? 'X' : 'O';
};

const getResultText = (): string => {
  if (!winner) return '';
  if (settings.mode === 'ai') return winner === humanMark ? text.youWin : text.computerWins;
  return interpolate(text.markWins, { mark: winner });
};

const updateStatistics = (): void => {
  const games = statistics.wins + statistics.losses;
  const rate = games === 0 ? 0 : Math.round((statistics.wins / games) * 100);
  statsElement.textContent = interpolate(text.stats, {
    wins: statistics.wins,
    losses: statistics.losses,
    rate
  });
};

const difficultyName = (difficulty: AiDifficulty): string => {
  if (difficulty === 'easy') return text.difficultyEasy;
  if (difficulty === 'medium') return text.difficultyMedium;
  if (difficulty === 'hard') return text.difficultyHard;
  return text.difficultyExpert;
};

const recordHistory = (): void => {
  if (!winner || replay) return;
  const moves = [...board.getMoves()];
  const completedAt = Date.now();
  const id = createHistoryId(moves, winner, completedAt);

  let encodedReplay: string | null = null;
  try {
    encodedReplay = encodeSharedGame(moves);
  } catch {
    encodedReplay = null;
  }

  gameHistory = addHistoryEntry(gameHistory, {
    id,
    completedAt,
    mode: settings.mode,
    difficulty: settings.mode === 'ai' ? settings.difficulty : null,
    humanMark: settings.mode === 'ai' ? humanMark : null,
    winner,
    moves: moves.length,
    replay: encodedReplay
  });
  saveHistory();
};

const revertRecordedHistory = (): void => {
  if (!winner || replay) return;
  const next = removeLatestMatchingHistoryEntry(gameHistory, board.getMoves(), winner);
  if (next.length === gameHistory.length) return;
  gameHistory = next;
  saveHistory();
};

const renderHistory = (): void => {
  const summary = summarizeHistory(gameHistory);
  historySummary.textContent = gameHistory.length === 0
    ? ''
    : interpolate(text.historySummary, {
        games: summary.games,
        average: summary.averageMoves,
        rate: summary.aiWinRate
      });
  historyList.replaceChildren();

  if (gameHistory.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = text.historyEmpty;
    historyList.append(empty);
    return;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  for (const entry of gameHistory) {
    const row = document.createElement('div');
    row.className = 'history-entry';
    const copy = document.createElement('div');
    copy.className = 'history-entry-copy';
    const title = document.createElement('strong');
    if (entry.mode === 'ai' && entry.humanMark && entry.difficulty) {
      title.textContent = interpolate(
        entry.winner === entry.humanMark ? text.historyAiWin : text.historyAiLoss,
        { difficulty: difficultyName(entry.difficulty), moves: entry.moves }
      );
    } else {
      title.textContent = interpolate(text.historyLocal, { winner: entry.winner, moves: entry.moves });
    }
    const date = document.createElement('span');
    date.textContent = dateFormatter.format(new Date(entry.completedAt));
    copy.append(title, date);
    row.append(copy);

    if (entry.replay) {
      const replayButton = document.createElement('button');
      replayButton.type = 'button';
      replayButton.textContent = text.replay;
      replayButton.addEventListener('click', () => {
        const moves = decodeSharedGame(entry.replay ?? '');
        if (!moves) return;
        historyDialog.close();
        enterReplay(moves, true, 0);
      });
      row.append(replayButton);
    } else {
      const unavailable = document.createElement('span');
      unavailable.className = 'history-replay-unavailable';
      unavailable.textContent = text.replayUnavailable;
      row.append(unavailable);
    }
    historyList.append(row);
  }
};

const updateStatus = (): void => {
  if (replay) {
    status.textContent = interpolate(text.replayStep, { current: replay.index, total: replay.moves.length });
  } else if (winner) {
    status.textContent = getResultText();
  } else if (aiThinking) {
    status.textContent = text.computerThinking;
  } else if (settings.mode === 'ai') {
    status.textContent = currentMark === humanMark
      ? interpolate(text.yourTurn, { mark: humanMark })
      : interpolate(text.computerTurn, { mark: computerMark() });
  } else {
    status.textContent = interpolate(text.markTurn, { mark: currentMark });
  }
  status.dataset.winner = winner ?? '';
};

const hasHumanMove = (): boolean => board.getMoves().some((move) => move.mark === humanMark);

const updateControls = (): void => {
  const replaying = replay !== null;
  modeSelect.value = settings.mode;
  difficultySelect.value = settings.difficulty;
  difficultySelect.disabled = aiThinking || replaying;
  modeSelect.disabled = aiThinking || replaying;
  undoButton.disabled = settings.mode !== 'ai' || !hasHumanMove() || aiThinking || replaying;
  centerButton.disabled = board.getMoves().length === 0;
  gameOptions.dataset.mode = settings.mode;
  humanSideField.hidden = settings.mode !== 'ai';
  replayBar.hidden = !replaying;
  if (replay) {
    replayStep.textContent = interpolate(text.replayStep, { current: replay.index, total: replay.moves.length });
    replayPreviousButton.disabled = replay.index <= 0;
    replayNextButton.disabled = replay.index >= replay.moves.length;
  }
};

const refreshUi = (): void => {
  updateStatus();
  updateControls();
  updateStatistics();
};

const recordResult = (): void => {
  if (settings.mode !== 'ai' || !winner || resultRecorded || replay) return;
  if (winner === humanMark) statistics.wins += 1;
  else statistics.losses += 1;
  resultRecorded = true;
  saveStatistics();
};

const revertRecordedResult = (): void => {
  if (settings.mode !== 'ai' || !winner || !resultRecorded) return;
  if (winner === humanMark) statistics.wins = Math.max(0, statistics.wins - 1);
  else statistics.losses = Math.max(0, statistics.losses - 1);
  resultRecorded = false;
  saveStatistics();
};

const playResultFeedback = (): void => {
  if (!winner || replay) return;
  if (settings.vibration && 'vibrate' in navigator) {
    navigator.vibrate(settings.mode === 'ai' && winner !== humanMark ? [45, 45, 70] : [45, 35, 45]);
  }
  if (!settings.sound) return;

  try {
    const audio = new AudioContext();
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, audio.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.28);
    gain.connect(audio.destination);
    const oscillator = audio.createOscillator();
    oscillator.frequency.value = settings.mode === 'ai' && winner !== humanMark ? 220 : 520;
    oscillator.connect(gain);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.3);
    oscillator.addEventListener('ended', () => void audio.close());
  } catch {
    return;
  }
};

const cancelResultPresentation = (): void => {
  if (resultTimer !== null) {
    window.clearTimeout(resultTimer);
    resultTimer = null;
  }
  if (resultDialog.open) resultDialog.close();
};

const showResultDialog = (): void => {
  if (!winner || replay || resultDialog.open) return;
  resultDialogTitle.textContent = getResultText();
  resultDialogDetails.textContent = interpolate(text.resultMoves, { moves: board.getMoves().length });
  resultDialog.showModal();
};

const presentResult = (): void => {
  view.animateWinningLine();
  playResultFeedback();
  cancelResultPresentation();
  resultTimer = window.setTimeout(() => {
    resultTimer = null;
    showResultDialog();
  }, 520);
};

const applyMove = (position: Position, mark: Mark): boolean => {
  if (!board.place(position.x, position.y, mark)) return false;

  const move: Move = { ...position, mark };
  winningLine = getWinningLine(board, move);
  if (winningLine) {
    winner = mark;
    recordResult();
    recordHistory();
  } else {
    currentMark = mark === 'X' ? 'O' : 'X';
  }

  saveGame();
  view.setWinningLine(winningLine);
  refreshUi();
  if (winner) presentResult();
  return true;
};

const cancelAiTurn = (): void => {
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer);
    aiTimer = null;
  }
  aiRequestVersion += 1;
  aiThinking = false;
};

const scheduleAiTurn = (): void => {
  if (
    settings.mode !== 'ai' ||
    winner ||
    replay ||
    currentMark !== computerMark() ||
    aiThinking ||
    resumeDialog.open
  ) {
    return;
  }

  aiThinking = true;
  const requestVersion = ++aiRequestVersion;
  refreshUi();
  aiTimer = window.setTimeout(() => {
    aiTimer = null;
    const snapshot = [...board.getMoves()];
    void requestAiMove(snapshot, computerMark(), settings.difficulty).then((position) => {
      if (requestVersion !== aiRequestVersion || replay || winner || currentMark !== computerMark()) return;
      aiThinking = false;
      applyMove(position, computerMark());
    });
  }, settings.difficulty === 'expert' ? 90 : 160);
};

const resetGame = (): void => {
  cancelAiTurn();
  cancelResultPresentation();
  if (resumeDialog.open) resumeDialog.close();
  replay = null;
  document.documentElement.dataset.replay = 'false';
  board.clear();
  humanMark = chooseHumanMark();
  currentMark = 'X';
  winner = null;
  winningLine = null;
  resultRecorded = false;
  localStorage.removeItem(gameStorageKey);
  localStorage.removeItem(legacyGameStorageKey);
  view.setWinningLine(null);
  view.centerOn();
  refreshUi();
  if (settings.mode === 'ai' && currentMark === computerMark()) scheduleAiTurn();
};

const handleCellClick = (position: Position): void => {
  if (winner || replay || aiThinking || board.get(position.x, position.y)) return;
  if (settings.mode === 'ai' && currentMark !== humanMark) return;
  if (applyMove(position, currentMark) && settings.mode === 'ai' && !winner) scheduleAiTurn();
};

const restoreReplayPosition = (): void => {
  if (!replay) return;
  board.restore(replay.moves.slice(0, replay.index));
  resolveGameState();
  view.setWinningLine(winningLine);
  if (!winningLine) view.clearWinEmphasis();
  const lastMove = board.getMoves()[board.getMoves().length - 1];
  view.centerOn(lastMove);
  refreshUi();
};

const enterReplay = (moves: readonly Move[], shared: boolean, startAt = 0): void => {
  cancelAiTurn();
  cancelResultPresentation();
  replay = { moves: [...moves], index: Math.max(0, Math.min(startAt, moves.length)), shared };
  document.documentElement.dataset.replay = 'true';
  restoreReplayPosition();
};

const exitReplay = (): void => {
  if (!replay) return;
  const replayState = replay;
  if (replayState.shared) {
    const url = new URL(window.location.href);
    url.hash = '';
    history.replaceState(null, '', url);
    window.location.reload();
    return;
  }

  board.restore(replayState.moves);
  replay = null;
  document.documentElement.dataset.replay = 'false';
  resolveGameState();
  view.setWinningLine(winningLine);
  const lastMove = board.getMoves()[board.getMoves().length - 1];
  view.centerOn(lastMove);
  refreshUi();
};

const shareGame = async (): Promise<void> => {
  const moves = replay?.moves ?? [...board.getMoves()];
  if (moves.length === 0) return;
  const url = createShareUrl(moves, window.location.href);

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Infinite Five', text: text.shareText, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast(text.linkCopied);
  } catch {
    window.prompt(text.shareUnavailable, url);
  }
};

const syncSettingsDialog = (): void => {
  settingsDialog.dataset.mode = settings.mode;
  humanSideSelect.value = settings.humanSide;
  themeSelect.value = settings.theme;
  languageSelect.value = settings.language;
  soundCheckbox.checked = settings.sound;
  vibrationCheckbox.checked = settings.vibration;
  installButton.hidden = deferredInstallPrompt === null;
};

const saveDialogSettings = (): void => {
  const previousSide = settings.humanSide;
  if (isHumanSide(humanSideSelect.value)) settings.humanSide = humanSideSelect.value;
  if (isThemePreference(themeSelect.value)) settings.theme = themeSelect.value;
  if (isLanguagePreference(languageSelect.value)) settings.language = languageSelect.value;
  settings.sound = soundCheckbox.checked;
  settings.vibration = vibrationCheckbox.checked;
  saveSettings();
  applyTranslations();
  applyTheme();
  view.render();
  settingsDialog.close();
  refreshUi();
  if (settings.mode === 'ai' && previousSide !== settings.humanSide) resetGame();
};

loadSettings();
loadStatistics();
loadHistory();
applyTranslations();
applyTheme();
humanMark = chooseHumanMark();

const sharedMoves = readSharedGameFromHash(window.location.hash);
const loadedSavedGame = sharedMoves ? false : loadSavedGame();
resolveGameState();

view = new CanvasBoard(canvas, board, handleCellClick);
view.setWinningLine(winningLine);
refreshUi();

if (sharedMoves) {
  enterReplay(sharedMoves, true, sharedMoves.length);
} else if (loadedSavedGame && board.getMoves().length > 0 && !winner) {
  resumeDialogPrompt.textContent = interpolate(text.resumePrompt, { moves: board.getMoves().length });
  resumeDialog.showModal();
} else if (winner) {
  recordResult();
  saveGame();
  window.setTimeout(showResultDialog, 180);
} else if (settings.mode === 'ai' && currentMark === computerMark()) {
  scheduleAiTurn();
}

centerButton.addEventListener('click', () => {
  const moves = board.getMoves();
  view.centerOn(moves[moves.length - 1]);
});

themeButton.addEventListener('click', () => {
  settings.theme = resolvedTheme() === 'dark' ? 'light' : 'dark';
  saveSettings();
  applyTheme();
  view.render();
});

historyButton.addEventListener('click', () => {
  renderHistory();
  historyDialog.showModal();
});
historyCloseButton.addEventListener('click', () => historyDialog.close());

settingsButton.addEventListener('click', () => {
  syncSettingsDialog();
  settingsDialog.showModal();
});

settingsSaveButton.addEventListener('click', saveDialogSettings);
settingsCloseButton.addEventListener('click', () => settingsDialog.close());

newGameButton.addEventListener('click', resetGame);
resultNewGameButton.addEventListener('click', resetGame);
resultReplayButton.addEventListener('click', () => enterReplay(board.getMoves(), false, 0));
resultShareButton.addEventListener('click', () => void shareGame());
resultCloseButton.addEventListener('click', () => resultDialog.close());

resumeContinueButton.addEventListener('click', () => {
  resumeDialog.close();
  const lastMove = board.getMoves()[board.getMoves().length - 1];
  view.centerOn(lastMove);
  if (settings.mode === 'ai' && currentMark === computerMark()) scheduleAiTurn();
});
resumeNewGameButton.addEventListener('click', resetGame);

undoButton.addEventListener('click', () => {
  if (settings.mode !== 'ai' || !hasHumanMove() || replay) return;
  cancelAiTurn();
  cancelResultPresentation();
  revertRecordedResult();
  revertRecordedHistory();

  const moves = board.getMoves();
  let humanMoveIndex = -1;
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    if (moves[index].mark === humanMark) {
      humanMoveIndex = index;
      break;
    }
  }
  if (humanMoveIndex < 0) return;
  while (board.getMoves().length > humanMoveIndex) board.undo();

  resolveGameState();
  resultRecorded = false;
  saveGame();
  view.setWinningLine(winningLine);
  const lastMove = board.getMoves()[board.getMoves().length - 1];
  view.centerOn(lastMove);
  refreshUi();
});

modeSelect.addEventListener('change', () => {
  if (!isMode(modeSelect.value)) return;
  settings.mode = modeSelect.value;
  saveSettings();
  resetGame();
});

difficultySelect.addEventListener('change', () => {
  if (!isDifficulty(difficultySelect.value)) return;
  settings.difficulty = difficultySelect.value;
  saveSettings();
  saveGame();
  refreshUi();
});

replayPreviousButton.addEventListener('click', () => {
  if (!replay || replay.index <= 0) return;
  replay.index -= 1;
  restoreReplayPosition();
});
replayNextButton.addEventListener('click', () => {
  if (!replay || replay.index >= replay.moves.length) return;
  replay.index += 1;
  restoreReplayPosition();
});
replayShareButton.addEventListener('click', () => void shareGame());
replayExitButton.addEventListener('click', exitReplay);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  installButton.hidden = false;
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});
installButton.addEventListener('click', () => {
  if (!deferredInstallPrompt) return;
  void deferredInstallPrompt.prompt().then(async () => {
    await deferredInstallPrompt?.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
});

const mediaTheme = window.matchMedia('(prefers-color-scheme: dark)');
mediaTheme.addEventListener('change', () => {
  if (settings.theme === 'system') {
    applyTheme();
    view.render();
  }
});

updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    showToast(text.updateAvailable, {
      label: text.updateNow,
      run: () => void updateServiceWorker?.(true)
    });
  },
  onOfflineReady() {
    showToast(text.offlineReady);
  }
});
