/**
 * Таблица переменных схемы: «R» → «100», «Rn» → «2*R».
 * Значения разрешаются рекурсивно, циклические ссылки обнаруживаются.
 */

import { evaluateExpr, referencedNames, type Vars } from './expr';
import { parseNumber } from './units';

export interface VariablesResult {
  /** Успешно вычисленные переменные. */
  values: Vars;
  /** Имя → сообщение об ошибке. */
  errors: Record<string, string>;
}

export function resolveVariables(table: Record<string, string>): VariablesResult {
  const values: Vars = {};
  const errors: Record<string, string> = {};
  const state = new Map<string, 'pending' | 'done' | 'failed'>();

  const resolve = (name: string, trail: string[]): void => {
    const status = state.get(name);
    if (status === 'done' || status === 'failed') return;
    if (status === 'pending') {
      const cycle = [...trail.slice(trail.indexOf(name)), name].join(' → ');
      errors[name] = `Циклическая ссылка: ${cycle}`;
      state.set(name, 'failed');
      return;
    }

    const source = (table[name] ?? '').trim();
    if (!source) {
      errors[name] = 'Значение не задано';
      state.set(name, 'failed');
      return;
    }

    state.set(name, 'pending');

    const plain = parseNumber(source);
    if (plain !== null) {
      values[name] = plain;
      state.set(name, 'done');
      return;
    }

    for (const ref of referencedNames(source)) {
      if (!(ref in table)) continue;
      resolve(ref, [...trail, name]);
    }
    // Ссылка на переменную, которую не удалось вычислить, делает ошибочной и эту.
    if (state.get(name) === 'failed') return;

    const result = evaluateExpr(source, values);
    if (result.ok) {
      values[name] = result.value;
      state.set(name, 'done');
    } else {
      errors[name] = result.error;
      state.set(name, 'failed');
    }
  };

  for (const name of Object.keys(table)) resolve(name, []);
  return { values, errors };
}

/** Допустимо ли имя переменной. */
export function isValidVariableName(name: string): boolean {
  return /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_′″']*$/.test(name.trim());
}
