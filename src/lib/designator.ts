/**
 * Разбор обозначения вида `R1`, `E2`, `R'4`, `R''6`, `I1`.
 * Основа рендерится курсивом, хвост — нижним индексом.
 */
export interface Designator {
  base: string;
  sub: string;
}

const PRIME = '′'; // ′
const DPRIME = '″'; // ″

export function normalizePrimes(text: string): string {
  return text.replace(/'{2}/g, DPRIME).replace(/'/g, PRIME).replace(/"/g, DPRIME);
}

export function parseDesignator(label: string): Designator {
  const text = normalizePrimes(label.trim());
  const m = /^(.*?)([0-9]+[a-zA-Zа-яА-Я′″]*)$/.exec(text);
  if (!m || m[1] === '') return { base: text, sub: '' };
  return { base: m[1], sub: m[2] };
}
