import { version } from '../package.json';
import './about.css';
import type { Locale } from './i18n';

const messages = {
  en: {
    label: 'About',
    title: 'About Infinite Five',
    intro: 'Five in a row on an infinite board. Play locally or challenge the computer from Easy to Expert.',
    version: 'Version',
    developer: 'Developer: Stanley Lloyd',
    github: 'GitHub',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    rights: '© 2026 Stanley Lloyd. All rights reserved.',
    close: 'Close'
  },
  ru: {
    label: 'О приложении',
    title: 'Об Infinite Five',
    intro: 'Пять в ряд на бесконечном поле. Играйте вдвоём или против компьютера от лёгкого уровня до эксперта.',
    version: 'Версия',
    developer: 'Разработчик: Stanley Lloyd',
    github: 'GitHub',
    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    rights: '© 2026 Stanley Lloyd. Все права защищены.',
    close: 'Закрыть'
  }
} as const;

const app = document.querySelector<HTMLDivElement>('#app');
const gameInfoCopy = document.querySelector<HTMLElement>('.game-info-copy');
if (!app || !gameInfoCopy) throw new Error('About UI initialization failed');

const button = document.createElement('button');
button.className = 'about-button';
button.type = 'button';
button.innerHTML = '<span aria-hidden="true">i</span>';

const dialog = document.createElement('dialog');
dialog.className = 'modal-dialog about-dialog';
dialog.setAttribute('aria-labelledby', 'aboutTitle');

const locale = (): Locale => (document.documentElement.lang === 'ru' ? 'ru' : 'en');

const render = (): void => {
  const copy = messages[locale()];
  button.setAttribute('aria-label', copy.label);
  button.title = copy.label;
  dialog.innerHTML = `
    <div class="dialog-body">
      <h2 id="aboutTitle">${copy.title}</h2>
      <p>${copy.intro}</p>
      <p class="about-meta">${copy.version} ${version}</p>
      <p class="about-developer">${copy.developer}</p>
      <div class="about-links">
        <a href="https://github.com/StanleyLl0yd/infinite-five" target="_blank" rel="noreferrer">${copy.github}</a>
        <a href="https://github.com/StanleyLl0yd/infinite-five/blob/main/PRIVACY.md" target="_blank" rel="noreferrer">${copy.privacy}</a>
        <a href="https://github.com/StanleyLl0yd/infinite-five/blob/main/TERMS.md" target="_blank" rel="noreferrer">${copy.terms}</a>
      </div>
      <p class="about-rights">${copy.rights}</p>
      <div class="dialog-actions"><button type="button" class="primary about-close">${copy.close}</button></div>
    </div>
  `;
  dialog.querySelector<HTMLButtonElement>('.about-close')?.addEventListener('click', () => dialog.close());
};

render();
gameInfoCopy.append(button);
app.append(dialog);

new MutationObserver(render).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['lang']
});

button.addEventListener('click', () => {
  render();
  if (!dialog.open) dialog.showModal();
});
