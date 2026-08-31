export type Locale = 'en' | 'ru';

export const resolveLocale = (...languages: Array<string | null | undefined>): Locale =>
  languages.some((language) => language?.trim().toLowerCase().startsWith('ru')) ? 'ru' : 'en';

export const translations = {
  en: {
    metaDescription: 'Infinite Five — five in a row on an infinite board.',
    infoTitle: 'Five in a row on an infinite board',
    infoRules:
      'X moves first. Be the first to make 5 or more of your marks in one horizontal, vertical or diagonal line. Drag the board to move it and use the mouse wheel or pinch to zoom.',
    modeLabel: 'Game mode',
    modeAi: 'Vs computer',
    modeLocal: 'Two players',
    difficultyLabel: 'Difficulty',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    center: 'Center',
    undo: 'Undo',
    light: 'Light',
    dark: 'Dark',
    newGame: 'New game',
    close: 'Close',
    resultPrompt: 'Play another game?',
    boardLabel: 'Infinite Five game board',
    gameOptionsLabel: 'Game options',
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
    youWin: 'You win',
    computerWins: 'Computer wins',
    computerThinking: 'Computer thinking…',
    yourTurn: 'Your turn',
    computerTurn: 'Computer to move',
    markWins: '{mark} wins',
    markTurn: '{mark} to move',
    stats: 'AI: {wins} wins · {losses} losses'
  },
  ru: {
    metaDescription: 'Infinite Five — пять в ряд на бесконечном поле.',
    infoTitle: 'Пять в ряд на бесконечном поле',
    infoRules:
      'X ходит первым. Побеждает тот, кто первым соберёт 5 или больше своих знаков подряд по горизонтали, вертикали или диагонали. Перетаскивайте поле для перемещения, масштабируйте колесом мыши или двумя пальцами.',
    modeLabel: 'Режим игры',
    modeAi: 'Против компьютера',
    modeLocal: 'Два игрока',
    difficultyLabel: 'Сложность',
    difficultyEasy: 'Легко',
    difficultyMedium: 'Средне',
    difficultyHard: 'Сложно',
    center: 'К ходу',
    undo: 'Отменить',
    light: 'Светлая',
    dark: 'Тёмная',
    newGame: 'Новая игра',
    close: 'Закрыть',
    resultPrompt: 'Сыграть ещё раз?',
    boardLabel: 'Игровое поле Infinite Five',
    gameOptionsLabel: 'Настройки игры',
    switchToLight: 'Переключить на светлую тему',
    switchToDark: 'Переключить на тёмную тему',
    youWin: 'Вы победили',
    computerWins: 'Компьютер победил',
    computerThinking: 'Компьютер думает…',
    yourTurn: 'Ваш ход',
    computerTurn: 'Ход компьютера',
    markWins: 'Победил {mark}',
    markTurn: 'Ход: {mark}',
    stats: 'ИИ: побед {wins} · поражений {losses}'
  }
} as const;

export const interpolate = (
  template: string,
  values: Readonly<Record<string, string | number>>
): string =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
