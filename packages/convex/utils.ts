export function matchesSearch(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase().trim());
}

export function pickDefined<T extends Record<string, unknown>>(
  source: T,
  keys: ReadonlyArray<keyof T>
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}
