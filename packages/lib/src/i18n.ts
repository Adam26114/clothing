import en from './locales/en.json' with { type: 'json' };

type Locale = 'en';

type LocaleMessages = Record<string, unknown>;

const locales: Record<Locale, LocaleMessages> = {
  en,
};

function getValue(obj: LocaleMessages, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function t(key: string, locale: Locale = 'en'): string {
  return getValue(locales[locale], key) ?? key;
}
