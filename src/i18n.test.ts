import { describe, expect, it } from 'vitest';
import { resolveLocale } from './i18n';

describe('resolveLocale', () => {
  it('uses Russian for Russian system locales', () => {
    expect(resolveLocale('ru-RU')).toBe('ru');
    expect(resolveLocale('ru')).toBe('ru');
  });

  it('uses English for every other locale', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('de-DE')).toBe('en');
    expect(resolveLocale('uk-UA')).toBe('en');
  });
});
