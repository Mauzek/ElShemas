/**
 * Решение системы линейных уравнений методом LU-разложения
 * с частичным выбором главного элемента.
 *
 * Поле вынесено в интерфейс: тот же код решает систему в вещественных
 * числах (постоянный ток) и в комплексных (переменный ток).
 */

export interface Field<T> {
  zero: T;
  one: T;
  add(a: T, b: T): T;
  sub(a: T, b: T): T;
  mul(a: T, b: T): T;
  div(a: T, b: T): T;
  neg(a: T): T;
  /** Модуль — нужен для выбора главного элемента. */
  abs(a: T): number;
}

export const REAL: Field<number> = {
  zero: 0,
  one: 1,
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b,
  neg: (a) => -a,
  abs: (a) => Math.abs(a),
};

export function zeroMatrix<T>(field: Field<T>, rows: number, cols: number): T[][] {
  return Array.from({ length: rows }, () => new Array<T>(cols).fill(field.zero));
}

export function zeroVector<T>(field: Field<T>, size: number): T[] {
  return new Array<T>(size).fill(field.zero);
}

export type SolveOutcome<T> = { ok: true; x: T[] } | { ok: false; singularRow: number };

/**
 * Решает A · x = b. Матрица A изменяется на месте.
 * Если система вырождена, возвращается номер строки, на которой это выяснилось,
 * — по нему вызывающий код объясняет пользователю, что не так со схемой.
 */
export function solveLinear<T>(field: Field<T>, A: T[][], b: T[]): SolveOutcome<T> {
  const n = b.length;
  if (n === 0) return { ok: true, x: [] };
  const x = [...b];

  // Порог вырожденности масштабируем по величине коэффициентов:
  // схема на мегаомах и схема на миллиомах должны обрабатываться одинаково.
  let scale = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) scale = Math.max(scale, field.abs(A[i][j]));
  const eps = Math.max(scale, 1) * 1e-12;

  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = field.abs(A[col][col]);
    for (let row = col + 1; row < n; row++) {
      const candidate = field.abs(A[row][col]);
      if (candidate > best) {
        best = candidate;
        pivot = row;
      }
    }
    if (best <= eps) return { ok: false, singularRow: col };

    if (pivot !== col) {
      const tmpRow = A[col];
      A[col] = A[pivot];
      A[pivot] = tmpRow;
      const tmpVal = x[col];
      x[col] = x[pivot];
      x[pivot] = tmpVal;
    }

    for (let row = col + 1; row < n; row++) {
      const factor = field.div(A[row][col], A[col][col]);
      if (field.abs(factor) === 0) continue;
      for (let k = col; k < n; k++) A[row][k] = field.sub(A[row][k], field.mul(factor, A[col][k]));
      x[row] = field.sub(x[row], field.mul(factor, x[col]));
    }
  }

  for (let row = n - 1; row >= 0; row--) {
    let sum = x[row];
    for (let k = row + 1; k < n; k++) sum = field.sub(sum, field.mul(A[row][k], x[k]));
    x[row] = field.div(sum, A[row][row]);
  }

  return { ok: true, x };
}
