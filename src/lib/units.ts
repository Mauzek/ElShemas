/**
 * Разбор и форматирование электрических величин.
 * Значение элемента приводится к СИ: Ом, В, А, Гн, Ф, Гц, Вт.
 */

import { evaluateExpr, type Vars } from './expr';

/** Множители приставок. Кириллица и латиница, регистр значим: «М» — мега, «м» — милли. */
const PREFIXES: [string, number][] = [
  ['мк', 1e-6],
  ['Г', 1e9],
  ['G', 1e9],
  ['М', 1e6],
  ['M', 1e6],
  ['к', 1e3],
  ['К', 1e3],
  ['k', 1e3],
  ['K', 1e3],
  ['м', 1e-3],
  ['m', 1e-3],
  ['µ', 1e-6],
  ['μ', 1e-6],
  ['u', 1e-6],
  ['н', 1e-9],
  ['n', 1e-9],
  ['п', 1e-12],
  ['p', 1e-12],
];

/** Основные единицы. Написание пользователя приводится к каноническому. */
const BASE_UNITS: [string, string][] = [
  ['Ом', 'Ом'],
  ['ом', 'Ом'],
  ['Ohm', 'Ом'],
  ['Ω', 'Ом'],
  ['Вт', 'Вт'],
  ['W', 'Вт'],
  ['Гн', 'Гн'],
  ['H', 'Гн'],
  ['Гц', 'Гц'],
  ['Hz', 'Гц'],
  ['В', 'В'],
  ['V', 'В'],
  ['А', 'А'],
  ['A', 'А'],
  ['Ф', 'Ф'],
  ['F', 'Ф'],
];

const byLengthDesc = <T extends [string, ...unknown[]]>(list: T[]): T[] =>
  [...list].sort((a, b) => b[0].length - a[0].length);

const SORTED_PREFIXES = byLengthDesc(PREFIXES);
const SORTED_UNITS = byLengthDesc(BASE_UNITS);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PREFIX_ALT = SORTED_PREFIXES.map(([p]) => escapeRe(p)).join('|');

/** «4м7» — запись, где приставка стоит вместо десятичной точки. */
const RE_EMBEDDED = new RegExp(`^([+-]?\\d+)(${PREFIX_ALT})(\\d+)$`);
const RE_SUFFIX = new RegExp(`^([+-]?\\d+(?:[.,]\\d+)?)(${PREFIX_ALT})?$`);

export interface UnitParts {
  /** Множитель приставки: «кОм» → 1000. */
  factor: number;
  /** Каноническая основная единица: «кОм» → «Ом». Пустая строка — единица не распознана. */
  base: string;
}

/** Разбирает единицу на приставку и основную единицу. */
export function splitUnit(unit: string): UnitParts {
  const text = unit.trim();
  if (!text) return { factor: 1, base: '' };
  for (const [written, canonical] of SORTED_UNITS) {
    if (!text.endsWith(written)) continue;
    const head = text.slice(0, text.length - written.length);
    if (!head) return { factor: 1, base: canonical };
    const prefix = SORTED_PREFIXES.find(([p]) => p === head);
    if (prefix) return { factor: prefix[1], base: canonical };
  }
  return { factor: 1, base: '' };
}

/** Число с инженерной приставкой: «2.2k» → 2200, «4м7» → 0.0047, «1,5» → 1.5. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(/\s+/g, '');
  if (!t) return null;

  const embedded = RE_EMBEDDED.exec(t);
  if (embedded) {
    const factor = SORTED_PREFIXES.find(([p]) => p === embedded[2])?.[1] ?? 1;
    const value = Number(`${embedded[1]}.${embedded[3]}`);
    return Number.isFinite(value) ? value * factor : null;
  }

  const suffixed = RE_SUFFIX.exec(t);
  if (suffixed) {
    const factor = suffixed[2] ? (SORTED_PREFIXES.find(([p]) => p === suffixed[2])?.[1] ?? 1) : 1;
    const value = Number(suffixed[1].replace(',', '.'));
    return Number.isFinite(value) ? value * factor : null;
  }

  return null;
}

export type ValueResult = { ok: true; si: number } | { ok: false; error: string };

/**
 * Значение элемента в единицах СИ.
 * Сначала пробуем обычное число с приставкой, затем — выражение с переменными.
 */
export function parseValue(value: string, unit: string, vars: Vars = {}): ValueResult {
  const text = value.trim();
  if (!text) return { ok: false, error: 'значение не задано' };
  const { factor } = splitUnit(unit);

  const plain = parseNumber(text);
  if (plain !== null) return { ok: true, si: plain * factor };

  const expr = evaluateExpr(text, vars);
  if (expr.ok) return { ok: true, si: expr.value * factor };
  return { ok: false, error: expr.error };
}

/** Приставки для вывода: от гига до пико. */
const OUT_PREFIXES: [number, string][] = [
  [1e9, 'Г'],
  [1e6, 'М'],
  [1e3, 'к'],
  [1, ''],
  [1e-3, 'м'],
  [1e-6, 'мк'],
  [1e-9, 'н'],
  [1e-12, 'п'],
];

/** Число с заданным количеством значащих цифр и запятой в качестве разделителя. */
export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const text = Math.abs(value) >= 1e-4 && Math.abs(value) < 1e6
    ? Number(value.toPrecision(Math.max(1, digits))).toString()
    : value.toExponential(Math.max(0, digits - 1));
  return text.replace('.', ',').replace('e', '·10^');
}

/**
 * Величина с автоматической приставкой: 0.0025 А → «2,5 мА», 15000 Ом → «15 кОм».
 * Без основной единицы возвращает просто число.
 */
export function formatSi(value: number, base: string, digits = 4): string {
  if (!Number.isFinite(value)) return '—';
  if (!base) return formatNumber(value, digits);
  const abs = Math.abs(value);
  if (abs === 0) return `0 ${base}`;
  const chosen = OUT_PREFIXES.find(([factor]) => abs >= factor) ?? OUT_PREFIXES[OUT_PREFIXES.length - 1];
  const [factor, prefix] = chosen;
  return `${formatNumber(value / factor, digits)} ${prefix}${base}`;
}

/** Единица СИ, в которой измеряется значение элемента данного типа. */
export function unitOfQuantity(quantity: 'resistance' | 'voltage' | 'current' | 'power' | 'inductance' | 'capacitance'): string {
  switch (quantity) {
    case 'resistance':
      return 'Ом';
    case 'voltage':
      return 'В';
    case 'current':
      return 'А';
    case 'power':
      return 'Вт';
    case 'inductance':
      return 'Гн';
    case 'capacitance':
      return 'Ф';
  }
}
