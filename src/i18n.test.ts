import { describe, expect, it } from 'vitest';
import { resolveLocale, translations } from './i18n';

describe('resolveLocale', () => {
  it('uses Russian when any browser or system locale is Russian', () => {
    expect(resolveLocale('ru-RU')).toBe('ru');
    expect(resolveLocale('ru')).toBe('ru');
    expect(resolveLocale('en-US', 'ru-RU')).toBe('ru');
    expect(resolveLocale('en-US', null, 'RU-ru')).toBe('ru');
  });

  it('uses English when no locale is Russian', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('de-DE', 'en-US')).toBe('en');
    expect(resolveLocale('uk-UA')).toBe('en');
    expect(resolveLocale(undefined, '')).toBe('en');
  });

  it('keeps translation keys synchronized', () => {
    expect(Object.keys(translations.ru).sort()).toEqual(Object.keys(translations.en).sort());
  });
});
