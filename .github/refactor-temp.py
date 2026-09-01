from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:80]!r}')
    file.write_text(text.replace(old, new, 1))


replace_once(
    'src/i18n.ts',
    "    modeLabel: 'Game mode',",
    """    aboutLabel: 'About',
    aboutTitle: 'About Infinite Five',
    aboutIntro: 'Five in a row on an infinite board. Play locally or challenge the computer from Easy to Expert.',
    aboutVersion: 'Version',
    aboutDeveloper: 'Developer: Stanley Lloyd',
    aboutGitHub: 'GitHub',
    aboutPrivacy: 'Privacy Policy',
    aboutTerms: 'Terms of Use',
    aboutRights: '© 2026 Stanley Lloyd. All rights reserved.',
    modeLabel: 'Game mode',"""
)
replace_once(
    'src/i18n.ts',
    "    modeLabel: 'Режим игры',",
    """    aboutLabel: 'О приложении',
    aboutTitle: 'Об Infinite Five',
    aboutIntro: 'Пять в ряд на бесконечном поле. Играйте вдвоём или против компьютера от лёгкого уровня до эксперта.',
    aboutVersion: 'Версия',
    aboutDeveloper: 'Разработчик: Stanley Lloyd',
    aboutGitHub: 'GitHub',
    aboutPrivacy: 'Политика конфиденциальности',
    aboutTerms: 'Условия использования',
    aboutRights: '© 2026 Stanley Lloyd. Все права защищены.',
    modeLabel: 'Режим игры',"""
)

replace_once(
    'index.html',
    """            </p>
          </div>
          <div class=\"game-options\" aria-label=\"Game options\">""",
    """            </p>
            <button id=\"aboutButton\" class=\"about-button\" type=\"button\" aria-label=\"About\" title=\"About\">
              <span aria-hidden=\"true\">i</span>
            </button>
          </div>
          <div class=\"game-options\" aria-label=\"Game options\">"""
)
replace_once(
    'index.html',
    """      </main>
    </div>

    <dialog id=\"resultDialog\"""",
    """      </main>

      <dialog id=\"aboutDialog\" class=\"modal-dialog about-dialog\" aria-labelledby=\"aboutTitle\">
        <div class=\"dialog-body\">
          <h2 id=\"aboutTitle\">About Infinite Five</h2>
          <p id=\"aboutIntro\">Five in a row on an infinite board. Play locally or challenge the computer from Easy to Expert.</p>
          <p class=\"about-meta\"><span id=\"aboutVersionLabel\">Version</span> <span id=\"aboutVersion\"></span></p>
          <p id=\"aboutDeveloper\" class=\"about-developer\">Developer: Stanley Lloyd</p>
          <div class=\"about-links\">
            <a id=\"aboutGitHub\" href=\"https://github.com/StanleyLl0yd/infinite-five\" target=\"_blank\" rel=\"noreferrer\">GitHub</a>
            <a id=\"aboutPrivacy\" href=\"https://github.com/StanleyLl0yd/infinite-five/blob/main/PRIVACY.md\" target=\"_blank\" rel=\"noreferrer\">Privacy Policy</a>
            <a id=\"aboutTerms\" href=\"https://github.com/StanleyLl0yd/infinite-five/blob/main/TERMS.md\" target=\"_blank\" rel=\"noreferrer\">Terms of Use</a>
          </div>
          <p id=\"aboutRights\" class=\"about-rights\">© 2026 Stanley Lloyd. All rights reserved.</p>
          <div class=\"dialog-actions\"><button id=\"aboutCloseButton\" type=\"button\" class=\"primary\">Close</button></div>
        </div>
      </dialog>
    </div>

    <dialog id=\"resultDialog\""""
)
replace_once(
    'index.html',
    '    <script type="module" src="/src/main.ts"></script>\n    <script type="module" src="/src/about.ts"></script>',
    '    <script type="module" src="/src/main.ts"></script>'
)

styles = Path('src/styles.css')
about_styles = Path('src/about.css').read_text().strip()
styles.write_text(styles.read_text().rstrip() + '\n\n' + about_styles + '\n')

replace_once(
    'src/main.ts',
    "import './styles.css';\nimport { registerSW }",
    "import './styles.css';\nimport { version } from '../package.json';\nimport { registerSW }"
)
replace_once(
    'src/main.ts',
    "const newGameButton = getElement<HTMLButtonElement>('#newGameButton');",
    """const newGameButton = getElement<HTMLButtonElement>('#newGameButton');
const aboutButton = getElement<HTMLButtonElement>('#aboutButton');
const aboutDialog = getElement<HTMLDialogElement>('#aboutDialog');
const aboutTitle = getElement<HTMLElement>('#aboutTitle');
const aboutIntro = getElement<HTMLElement>('#aboutIntro');
const aboutVersionLabel = getElement<HTMLElement>('#aboutVersionLabel');
const aboutVersion = getElement<HTMLElement>('#aboutVersion');
const aboutDeveloper = getElement<HTMLElement>('#aboutDeveloper');
const aboutGitHub = getElement<HTMLAnchorElement>('#aboutGitHub');
const aboutPrivacy = getElement<HTMLAnchorElement>('#aboutPrivacy');
const aboutTerms = getElement<HTMLAnchorElement>('#aboutTerms');
const aboutRights = getElement<HTMLElement>('#aboutRights');
const aboutCloseButton = getElement<HTMLButtonElement>('#aboutCloseButton');"""
)
replace_once(
    'src/main.ts',
    "  gameInfoRules.textContent = text.infoRules;",
    """  gameInfoRules.textContent = text.infoRules;
  aboutButton.setAttribute('aria-label', text.aboutLabel);
  aboutButton.title = text.aboutLabel;
  aboutTitle.textContent = text.aboutTitle;
  aboutIntro.textContent = text.aboutIntro;
  aboutVersionLabel.textContent = text.aboutVersion;
  aboutVersion.textContent = version;
  aboutDeveloper.textContent = text.aboutDeveloper;
  aboutGitHub.textContent = text.aboutGitHub;
  aboutPrivacy.textContent = text.aboutPrivacy;
  aboutTerms.textContent = text.aboutTerms;
  aboutRights.textContent = text.aboutRights;
  aboutCloseButton.textContent = text.close;"""
)
replace_once(
    'src/main.ts',
    """    const snapshot = [...board.getMoves()];
    void requestAiMove(snapshot, computerMark(), settings.difficulty).then((position) => {""",
    """    void requestAiMove(board.getMoves(), computerMark(), settings.difficulty).then((position) => {"""
)
replace_once(
    'src/main.ts',
    """settingsButton.addEventListener('click', () => {
  syncSettingsDialog();
  settingsDialog.showModal();
});""",
    """aboutButton.addEventListener('click', () => aboutDialog.showModal());
aboutCloseButton.addEventListener('click', () => aboutDialog.close());

settingsButton.addEventListener('click', () => {
  syncSettingsDialog();
  settingsDialog.showModal();
});"""
)

replace_once(
    'src/game/ai-client.ts',
    """  const seed = randomSeed();
  const aiWorker = getWorker();
  if (!aiWorker) {
    return fallback(moves, mark, difficulty, seed);
  }

  const id = ++requestId;
  const request: WorkerRequest = { id, moves: [...moves], mark, difficulty, seed };""",
    """  const snapshot = [...moves];
  const seed = randomSeed();
  const aiWorker = getWorker();
  if (!aiWorker) {
    return fallback(snapshot, mark, difficulty, seed);
  }

  const id = ++requestId;
  const request: WorkerRequest = { id, moves: snapshot, mark, difficulty, seed };"""
)
replace_once(
    'src/game/ai-client.ts',
    '    return fallback(moves, mark, difficulty, seed);\n  }\n};',
    '    return fallback(snapshot, mark, difficulty, seed);\n  }\n};'
)
replace_once(
    'src/game/share.ts',
    '  Number.isInteger(value) && Math.abs(value as number) <= maxCoordinate;',
    "  typeof value === 'number' && Number.isInteger(value) && Math.abs(value) <= maxCoordinate;"
)

replace_once(
    'src/i18n.test.ts',
    "import { resolveLocale } from './i18n';",
    "import { resolveLocale, translations } from './i18n';"
)
replace_once(
    'src/i18n.test.ts',
    """  it('uses English when no locale is Russian', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('de-DE', 'en-US')).toBe('en');
    expect(resolveLocale('uk-UA')).toBe('en');
    expect(resolveLocale(undefined, '')).toBe('en');
  });
});""",
    """  it('uses English when no locale is Russian', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('de-DE', 'en-US')).toBe('en');
    expect(resolveLocale('uk-UA')).toBe('en');
    expect(resolveLocale(undefined, '')).toBe('en');
  });

  it('keeps translation keys synchronized', () => {
    expect(Object.keys(translations.ru).sort()).toEqual(Object.keys(translations.en).sort());
  });
});"""
)

Path('src/about.ts').unlink()
Path('src/about.css').unlink()
Path('.github/refactor-temp.py').unlink()
Path('.github/workflows/refactor-temp.yml').unlink()
