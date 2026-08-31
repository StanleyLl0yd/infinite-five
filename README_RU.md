<div align="center">

# ∞5 INFINITE FIVE

### ПЯТЬ В РЯД · БЕСКОНЕЧНОЕ ПОЛЕ

<img src="docs/assets/readme/infinite-five-board.svg" alt="Игровое поле Infinite Five" width="100%">

[![CI](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/ci.yml?branch=main&label=CI&labelColor=111827&color=16A34A)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/codeql.yml?branch=main&label=CodeQL&labelColor=111827&color=2563EB)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/codeql.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/StanleyLl0yd/infinite-five/security.yml?branch=main&label=Security&labelColor=111827&color=E11D48)](https://github.com/StanleyLl0yd/infinite-five/actions/workflows/security.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2563EB?labelColor=111827&logo=githubpages&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![PWA](https://img.shields.io/badge/PWA-installable-E11D48?labelColor=111827&logo=pwa&logoColor=ffffff)](https://stanleyll0yd.github.io/infinite-five/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-2563EB?labelColor=111827&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Source version](https://img.shields.io/badge/source-0.2.0-16A34A?labelColor=111827)](package.json)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-E11D48?labelColor=111827)](LICENSE)

[![English](https://img.shields.io/badge/lang-EN-2563EB?labelColor=111827)](README.md)
[![Русский](https://img.shields.io/badge/lang-RU-E11D48?labelColor=111827)](README_RU.md)

Минималистичная игра «пять в ряд» на практически бесконечном поле — в браузере, на компьютере и телефоне.

[**▶ Играть сейчас**](https://stanleyll0yd.github.io/infinite-five/)

</div>

**Infinite Five** сохраняет классическую механику крестиков-ноликов, но убирает границы обычного поля: X и O ставятся на свободные клетки бесконечной сетки, а побеждает первый игрок, собравший пять или больше своих знаков подряд.

Текущая версия исходников: **0.2.0** · Web + PWA · GitHub Pages

## 🎯 Правила

1. **X ходит первым.**
2. Игроки по очереди ставят X и O на свободные клетки.
3. Поле не имеет фиксированных границ.
4. Побеждает тот, кто первым соберёт **5 или больше** своих знаков подряд.
5. Победная линия может быть горизонтальной, вертикальной или диагональной.
6. После завершения партии можно сразу начать новую игру.

> Никаких уровней, ресурсов, усилителей и мета-механик — только поле, два знака и пять в ряд.

## ✨ Что уже работает

- бесконечное Canvas-поле;
- режим **против компьютера**;
- три уровня сложности AI: Easy, Medium и Hard;
- локальная игра **два игрока** на одном устройстве;
- определение победы при 5+ знаках подряд;
- подсветка последнего хода и победной линии;
- окно результата с предложением начать новую партию;
- отмена хода в игре против AI;
- статистика побед и поражений против AI;
- сохранение незаконченной партии;
- светлая и тёмная темы;
- перемещение поля мышью или пальцем;
- масштабирование колесом мыши или жестом pinch;
- адаптивный интерфейс для компьютера и телефона;
- русский интерфейс при наличии русского среди языков браузера/системы, английский в остальных случаях;
- установка как PWA и офлайн-работа после загрузки;
- автоматическая публикация на GitHub Pages.

## 🕹 Управление

| Действие | Компьютер | Телефон / планшет |
| --- | --- | --- |
| Поставить знак | Клик по клетке | Короткий тап |
| Переместить поле | Перетаскивание | Перетаскивание одним пальцем |
| Масштаб | Колесо мыши | Pinch двумя пальцами |
| Вернуться к последнему ходу | `К ходу` | Скрыто в текущем компактном интерфейсе |
| Отменить ход против AI | `Отменить` | `Отменить` |
| Новая партия | `Новая игра` | `Новая игра` |

Координаты игрового состояния не зависят от положения камеры: перемещение и масштабирование никогда не изменяют реальные клетки партии.

## 🌐 Web и PWA

Официальная версия опубликована по адресу:

**https://stanleyll0yd.github.io/infinite-five/**

Сайт можно установить как PWA через браузер. После загрузки основные файлы кэшируются Service Worker, поэтому игра может запускаться без подключения к сети.

Нет аккаунта, backend, аналитики, рекламы или трекинга. Текущая партия, настройки и локальная статистика хранятся только в `localStorage` браузера.

## 🧱 Технологии

| Категория | Технология |
| --- | --- |
| Язык | TypeScript 5.9 |
| Отрисовка | HTML5 Canvas |
| Сборка | Vite 7 |
| PWA | vite-plugin-pwa / Workbox |
| Тесты | Vitest |
| Хранение | localStorage |
| Хостинг | GitHub Pages |
| CI/CD | GitHub Actions |

Игровая логика отделена от Canvas-отрисовки и браузерного UI, чтобы правила, AI и проверку победы можно было тестировать независимо и позже использовать при упаковке проекта для Android.

## 🗂 Архитектура

```text
src/
├── game/
│   ├── ai.ts              AI и уровни сложности
│   ├── board.ts           состояние бесконечного поля
│   ├── types.ts           игровые типы
│   └── win.ts             проверка победной линии
├── ui/
│   └── canvas-board.ts    отрисовка и управление Canvas
├── i18n.ts                русский / английский интерфейс
├── main.ts                состояние приложения и сценарии игры
└── styles.css             визуальный слой
```

Подробная продуктовая спецификация находится в [`docs/PRODUCT.md`](docs/PRODUCT.md).

## 🛠 Разработка

Требования:

- Node.js 22 или другая версия, поддерживаемая текущим Vite;
- npm.

```bash
git clone https://github.com/StanleyLl0yd/infinite-five.git
cd infinite-five
npm ci
npm run dev
```

Основная локальная проверка:

```bash
npm audit --audit-level=high
npm test
npm run build
```

Закоммиченный `package-lock.json` обеспечивает воспроизводимое разрешение зависимостей. Production build включает TypeScript-проверку перед сборкой Vite.

## ✅ Проверки качества

Push и pull request автоматически проходят GitHub Actions:

- воспроизводимая установка зависимостей через `npm ci`;
- блокирующий npm audit для high и critical уязвимостей;
- unit-тесты Vitest;
- TypeScript-проверка и production build;
- CodeQL с набором запросов `security-extended`;
- Semgrep с правилами безопасности и поиска секретов;
- Gitleaks с проверкой полной истории Git.

Отдельный усиленный workflow повторно проверяет сборку и публикует GitHub Pages после изменений в `main`.

## 🔐 Безопасность

Защита репозитория построена на принципе минимальных привилегий и защите цепочки поставки:

- включены GitHub Secret Scanning и Push Protection;
- Dependabot отслеживает npm-зависимости и GitHub Actions;
- `GITHUB_TOKEN` по умолчанию имеет только права чтения, а workflow запрашивают только необходимые разрешения;
- сторонние GitHub Actions закреплены полными commit SHA;
- CI, CodeQL, Semgrep и Gitleaks должны быть обязательными проверками для `main`;
- ruleset запрещает force-push и удаление защищённой основной ветки.

Уязвимости нужно сообщать только приватно, не через публичный issue. Порядок описан в [`SECURITY.md`](SECURITY.md).

## 🌍 Языки

- **Русский** — если русский присутствует среди языков браузера или определённой системной locale;
- **English** — fallback для всех остальных случаев.

Выбранный язык применяется к правилам, режимам, сложности, кнопкам, статусам партии и окну результата.

## 🗺 Дальнейшее развитие

Ближайший фокус — качество уже существующей игры:

- мобильная эргономика и доступность;
- производительность на длинных партиях;
- доработка уровней сложности AI;
- дополнительное тестирование PWA и офлайн-режима;
- подготовка к полноценному web-релизу;
- позже — опциональная Android-упаковка через Capacitor.

Онлайн-мультиплеер может появиться позже, но не должен менять базовые правила Infinite Five.

## 📄 Лицензия

Copyright © 2026 **Stanley Lloyd**. Все права защищены.

Репозиторий опубликован для просмотра исходного кода. Публичная доступность **не даёт разрешения** копировать, изменять, адаптировать, переводить, распространять, публиковать, размещать зеркала, создавать производные работы, включать код в другие продукты или иным образом использовать содержимое репозитория.

Разрешено пользоваться только официально опубликованной версией Infinite Five как конечному пользователю. Любое другое использование требует предварительного письменного разрешения правообладателя. Полный текст — в [`LICENSE`](LICENSE).

## 👨‍💻 Автор

**Stanley Lloyd** · [@StanleyLl0yd](https://github.com/StanleyLl0yd)

---

<div align="center">

**X · O · X · O · 5 В РЯД · ∞**

</div>
