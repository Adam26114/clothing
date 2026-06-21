export function formatMMK(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} Ks`;
}
