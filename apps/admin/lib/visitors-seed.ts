export type VisitorsRange = '7d' | '30d' | '3mo';

export interface VisitorsPoint {
  date: string;
  desktop: number;
  mobile: number;
}

const DAYS_BY_RANGE: Record<VisitorsRange, number> = {
  '7d': 7,
  '30d': 30,
  '3mo': 90,
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDateOffset(offset: number, range: VisitorsRange): number {
  let h = 2166136261;
  const str = `${range}:${offset}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rangeInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getVisitorsSeries(range: VisitorsRange): VisitorsPoint[] {
  const days = DAYS_BY_RANGE[range];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const points: VisitorsPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const rng = mulberry32(seedFromDateOffset(offset, range));
    points.push({
      date: isoDate(d),
      desktop: rangeInt(rng, 80, 450),
      mobile: rangeInt(rng, 40, 280),
    });
  }

  return points;
}
