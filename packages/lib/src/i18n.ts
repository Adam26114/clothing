import en from './locales/en.json' with { type: 'json' };

type Locale = 'en';

type LocaleMessages = Record<string, unknown>;

type PlaceholderValue = string | number;

type PlaceholderParams = Record<string, PlaceholderValue | undefined>;

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

export function t(key: string, locale: Locale = 'en', params?: PlaceholderParams): string {
  const value = getValue(locales[locale], key) ?? key;
  return applyTemplate(value, params);
}

function applyTemplate(template: string, params: PlaceholderParams | undefined): string {
  if (params === undefined) {
    return template;
  }
  let result = '';
  let i = 0;
  while (i < template.length) {
    const char = template.charAt(i);
    if (char !== '{') {
      result += char;
      i += 1;
      continue;
    }
    const close = findMatchingBrace(template, i);
    if (close === -1) {
      result += char;
      i += 1;
      continue;
    }
    const inner = template.slice(i + 1, close);
    result += renderMessage(inner.trim(), params);
    i = close + 1;
  }
  return result;
}

function findMatchingBrace(s: string, start: number): number {
  let depth = 0;
  for (let i = start; i < s.length; i += 1) {
    const char = s.charAt(i);
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function renderMessage(inner: string, params: PlaceholderParams): string {
  const topComma = findTopLevelComma(inner);
  if (topComma > 0) {
    const name = inner.slice(0, topComma).trim();
    const rest = inner.slice(topComma + 1).trim();
    const restComma = findTopLevelComma(rest);
    if (restComma > 0) {
      const type = rest.slice(0, restComma).trim();
      const body = rest.slice(restComma + 1).trim();
      if (type === 'plural') {
        return renderPlural(name, body, params);
      }
    }
  }
  const value = params[inner];
  return value === undefined ? `{${inner}}` : String(value);
}

function findTopLevelComma(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const char = s.charAt(i);
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      return i;
    }
  }
  return -1;
}

function renderPlural(name: string, body: string, params: PlaceholderParams): string {
  const value = Number(params[name]);
  const branches = parsePluralBranches(body);

  for (const branch of branches) {
    if (branch.exactValue !== undefined && value === branch.exactValue) {
      return applyTemplate(branch.message.replace(/#/g, String(value)), params);
    }
  }

  const category = englishPluralCategory(value);
  for (const branch of branches) {
    if (branch.category === category) {
      return applyTemplate(branch.message.replace(/#/g, String(value)), params);
    }
  }

  for (const branch of branches) {
    if (branch.category === 'other') {
      return applyTemplate(branch.message.replace(/#/g, String(value)), params);
    }
  }

  return '';
}

interface PluralBranch {
  category: string;
  exactValue?: number;
  message: string;
}

function parsePluralBranches(body: string): PluralBranch[] {
  const branches: PluralBranch[] = [];
  let i = 0;
  while (i < body.length) {
    while (i < body.length && isWhitespace(body.charAt(i))) {
      i += 1;
    }
    if (i >= body.length) {
      break;
    }
    const start = i;
    while (i < body.length && (isWordChar(body.charAt(i)) || body.charAt(i) === '=')) {
      i += 1;
    }
    const raw = body.slice(start, i);
    let exactValue: number | undefined;
    let category = raw;
    if (raw.startsWith('=') && raw.length > 1) {
      const parsed = Number(raw.slice(1));
      if (Number.isFinite(parsed)) {
        exactValue = parsed;
        category = 'other';
      }
    }
    while (i < body.length && isWhitespace(body.charAt(i))) {
      i += 1;
    }
    if (body.charAt(i) !== '{') {
      break;
    }
    const close = findMatchingBrace(body, i);
    if (close === -1) {
      break;
    }
    const message = body.slice(i + 1, close);
    branches.push({ category, exactValue, message });
    i = close + 1;
  }
  return branches;
}

function englishPluralCategory(n: number): 'one' | 'other' {
  if (!Number.isFinite(n)) {
    return 'other';
  }
  return n === 1 ? 'one' : 'other';
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function isWordChar(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char);
}
