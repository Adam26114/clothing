export function formatMMK(amount: number): string {
  const rounded = Math.round(amount / 100) * 100;
  return `${rounded < 0 ? '-' : ''}${Math.abs(rounded).toLocaleString('en-US')} Ks`;
}
