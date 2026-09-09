import { describe, expect, it } from 'vitest';
import { parseNumber, parseValue, formatSi, splitUnit } from '../src/lib/units';
import { evaluateExpr } from '../src/lib/expr';
import { resolveVariables } from '../src/lib/variables';

describe('разбор величин', () => {
  it('понимает инженерные приставки', () => {
    expect(parseNumber('2.2k')).toBeCloseTo(2200, 9);
    expect(parseNumber('2,2к')).toBeCloseTo(2200, 9);
    expect(parseNumber('4м7')).toBeCloseTo(0.0047, 12);
    expect(parseNumber('1,5')).toBeCloseTo(1.5, 12);
    expect(parseNumber('100')).toBe(100);
    expect(parseNumber('abc')).toBeNull();
  });

  it('различает мега и милли по регистру', () => {
    expect(parseNumber('1M')).toBeCloseTo(1e6, 6);
    expect(parseNumber('1m')).toBeCloseTo(1e-3, 12);
    expect(parseNumber('1М')).toBeCloseTo(1e6, 6);
    expect(parseNumber('1м')).toBeCloseTo(1e-3, 12);
  });

  it('разбирает единицу на приставку и основу', () => {
    expect(splitUnit('кОм')).toEqual({ factor: 1e3, base: 'Ом' });
    expect(splitUnit('мкФ')).toEqual({ factor: 1e-6, base: 'Ф' });
    expect(splitUnit('мГн')).toEqual({ factor: 1e-3, base: 'Гн' });
    expect(splitUnit('Ом')).toEqual({ factor: 1, base: 'Ом' });
    expect(splitUnit('В')).toEqual({ factor: 1, base: 'В' });
  });

  it('приводит значение к СИ', () => {
    expect(parseValue('2.2', 'кОм')).toEqual({ ok: true, si: 2200 });
    const farads = parseValue('10', 'мкФ');
    expect(farads.ok && Math.abs(farads.si - 1e-5) < 1e-18).toBe(true);
    expect(parseValue('', 'Ом').ok).toBe(false);
  });

  it('форматирует с приставкой', () => {
    expect(formatSi(0.0025, 'А')).toBe('2,5 мА');
    expect(formatSi(15000, 'Ом')).toBe('15 кОм');
    expect(formatSi(12, 'В')).toBe('12 В');
    expect(formatSi(0, 'В')).toBe('0 В');
  });
});

describe('выражения и переменные', () => {
  it('считает арифметику и функции', () => {
    expect(evaluateExpr('2+3*4')).toEqual({ ok: true, value: 14 });
    expect(evaluateExpr('(2+3)*4')).toEqual({ ok: true, value: 20 });
    expect(evaluateExpr('2^3^2')).toEqual({ ok: true, value: 512 });
    expect(evaluateExpr('-2^2')).toEqual({ ok: true, value: -4 });
    const root = evaluateExpr('sqrt(2)*100');
    expect(root.ok && Math.abs(root.value - 141.4213562) < 1e-6).toBe(true);
  });

  it('подставляет переменные', () => {
    expect(evaluateExpr('2*R', { R: 50 })).toEqual({ ok: true, value: 100 });
    expect(evaluateExpr('2*R').ok).toBe(false);
  });

  it('разрешает таблицу переменных и находит цикл', () => {
    const good = resolveVariables({ R: '100', Rn: '2*R', Rk: 'Rn/4' });
    expect(good.values).toEqual({ R: 100, Rn: 200, Rk: 50 });
    expect(good.errors).toEqual({});

    const bad = resolveVariables({ A: 'B', B: 'A' });
    expect(Object.keys(bad.errors).length).toBeGreaterThan(0);
  });
});
