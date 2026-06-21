import en from './locales/en.json' with { type: 'json' };

type Locale = 'en';

type LocaleMessages = Record<string, unknown>;

type PlaceholderParams = Record<string, string | number>;

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

function applyParams(template: string, params: PlaceholderParams | undefined): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function t(key: string, locale: Locale = 'en', params?: PlaceholderParams): string {
  const value = getValue(locales[locale], key) ?? key;
  return applyParams(value, params);
}
