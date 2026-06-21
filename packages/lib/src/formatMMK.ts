function roundToNearestHundred(amount: number): number {
  if (amount >= 0) {
    return Math.round(amount / 100) * 100;
  }
  return -Math.round(-amount / 100) * 100;
}

export function formatMMK(amount: number): string {
  const rounded = roundToNearestHundred(amount);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return `${sign}${abs.toLocaleString('en-US')} Ks`;
}
