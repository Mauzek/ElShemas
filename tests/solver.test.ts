import { describe, expect, it } from 'vitest';
import type { Element, ElementType, Point, SchemaFile, Wire } from '../src/types/schema';
import { defaultAnalysis, emptySchema } from '../src/types/schema';
import { solveDc } from '../src/lib/solver/dc';

let counter = 0;

/** Двухполюсник без поворота: выводы в (x−40, y) и (x+40, y). */
function part(type: ElementType, label: string, x: number, y: number, value = '', unit = ''): Element {
  counter += 1;
  return {
    id: `el-${counter}`,
    type,
    x,
    y,
    rotation: 0,
    mirrored: false,
    label,
    value,
    unit,
    showValue: true,
  };
}

const left = (el: Element): Point => ({ x: el.x - 40, y: el.y });
const right = (el: Element): Point => ({ x: el.x + 40, y: el.y });

function link(a: Point, b: Point): Wire {
  counter += 1;
  return { id: `w-${counter}`, points: [a, b] };
}

function schema(elements: Element[], wires: Wire[], extra: Partial<SchemaFile> = {}): SchemaFile {
  return { ...emptySchema('Тест'), analysis: defaultAnalysis(), elements, wires, ...extra };
}

const byLabel = (result: ReturnType<typeof solveDc>, label: string) => {
  const branch = result.branches.find((b) => b.label === label);
  if (!branch) throw new Error(`Ветвь «${label}» не найдена`);
  return branch;
};

describe('расчёт цепи постоянного тока', () => {
  it('делитель напряжения', () => {
    const e = part('sourceEmf', 'E1', 0, 0, '12', 'В');
    const r1 = part('resistor', 'R1', 200, 0, '100', 'Ом');
    const r2 = part('resistor', 'R2', 400, 0, '200', 'Ом');
    const doc = schema(
      [e, r1, r2],
      [
        link(right(e), left(r1)),
        link(right(r1), left(r2)),
        link(right(r2), { x: 500, y: 200 }),
        link({ x: 500, y: 200 }, { x: -40, y: 200 }),
        link({ x: -40, y: 200 }, left(e)),
      ],
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(true);
    expect(byLabel(result, 'R1').current).toBeCloseTo(0.04, 9);
    // Напряжение ветви — потенциал вывода 0 минус потенциал вывода 1,
    // поэтому у сопротивления оно положительно при положительном токе.
    expect(byLabel(result, 'R1').voltage).toBeCloseTo(4, 9);
    expect(byLabel(result, 'R2').voltage).toBeCloseTo(8, 9);
    expect(byLabel(result, 'R2').power).toBeCloseTo(0.32, 9);
    expect(byLabel(result, 'E1').power).toBeCloseTo(-0.48, 9);
    expect(result.balance.generated).toBeCloseTo(0.48, 9);
    expect(result.balance.mismatch).toBeCloseTo(0, 9);
  });

  it('уравновешенный мост: ток в диагонали равен нулю', () => {
    const e = part('sourceEmf', 'E1', 0, -300, '10', 'В');
    const r1 = part('resistor', 'R1', 200, -150, '100', 'Ом');
    const r2 = part('resistor', 'R2', 200, 150, '200', 'Ом');
    const r3 = part('resistor', 'R3', 600, -150, '300', 'Ом');
    const r4 = part('resistor', 'R4', 600, 150, '600', 'Ом');
    const r5 = part('resistor', 'R5', 400, 0, '470', 'Ом');

    const A = { x: 0, y: 0 };
    const B = { x: 350, y: -300 };
    const C = { x: 350, y: 300 };
    const D = { x: 800, y: 0 };

    const doc = schema(
      [e, r1, r2, r3, r4, r5],
      [
        link(right(e), A),
        link(A, left(r1)),
        link(A, left(r2)),
        link(right(r1), B),
        link(B, left(r3)),
        link(right(r2), C),
        link(C, left(r4)),
        link(right(r3), D),
        link(right(r4), D),
        link(B, left(r5)),
        link(right(r5), C),
        link(D, { x: 800, y: 500 }),
        link({ x: 800, y: 500 }, { x: -40, y: 500 }),
        link({ x: -40, y: 500 }, left(e)),
      ],
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(true);
    expect(Math.abs(byLabel(result, 'R5').current)).toBeLessThan(1e-12);
    expect(result.balance.mismatch).toBeCloseTo(0, 9);
  });

  it('источник тока на двух параллельных сопротивлениях', () => {
    const j = part('sourceCurrent', 'J1', 0, 0, '1', 'А');
    const r1 = part('resistor', 'R1', 300, -200, '100', 'Ом');
    const r2 = part('resistor', 'R2', 300, 200, '100', 'Ом');
    const top = { x: 150, y: 0 };
    const bottom = { x: 500, y: 0 };

    const doc = schema(
      [j, r1, r2],
      [
        link(right(j), top),
        link(top, left(r1)),
        link(top, left(r2)),
        link(right(r1), bottom),
        link(right(r2), bottom),
        link(bottom, { x: 500, y: 400 }),
        link({ x: 500, y: 400 }, { x: -40, y: 400 }),
        link({ x: -40, y: 400 }, left(j)),
      ],
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(true);
    expect(byLabel(result, 'R1').current).toBeCloseTo(0.5, 9);
    expect(byLabel(result, 'R2').current).toBeCloseTo(0.5, 9);
    expect(Math.abs(byLabel(result, 'R1').voltage)).toBeCloseTo(50, 9);
    expect(result.balance.mismatch).toBeCloseTo(0, 9);
  });

  it('эквивалентный генератор: напряжение холостого хода', () => {
    // E = 12 В, внутреннее R1 = 100 Ом, делитель на R2 = 300 Ом.
    // Напряжение на разомкнутых зажимах равно 12 · 300 / 400 = 9 В.
    const e = part('sourceEmf', 'E1', 0, 0, '12', 'В');
    const r1 = part('resistor', 'R1', 200, 0, '100', 'Ом');
    const r2 = part('resistor', 'R2', 400, 0, '300', 'Ом');
    const pv = part('voltmeter', 'PV1', 400, -200);

    const doc = schema(
      [e, r1, r2, pv],
      [
        link(right(e), left(r1)),
        link(right(r1), left(r2)),
        link(right(r1), left(pv)),
        link(right(pv), { x: 600, y: -200 }),
        link({ x: 600, y: -200 }, { x: 600, y: 200 }),
        link(right(r2), { x: 600, y: 200 }),
        link({ x: 600, y: 200 }, { x: -40, y: 200 }),
        link({ x: -40, y: 200 }, left(e)),
      ],
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(true);
    expect(byLabel(result, 'PV1').current).toBeCloseTo(0, 12);
    expect(Math.abs(byLabel(result, 'PV1').voltage)).toBeCloseTo(9, 9);
  });

  it('амперметр показывает ток ветви, разомкнутый ключ обрывает её', () => {
    const e = part('sourceEmf', 'E1', 0, 0, '10', 'В');
    const pa = part('ammeter', 'PA1', 200, 0);
    const r1 = part('resistor', 'R1', 400, 0, '50', 'Ом');
    const wires = [
      link(right(e), left(pa)),
      link(right(pa), left(r1)),
      link(right(r1), { x: 500, y: 200 }),
      link({ x: 500, y: 200 }, { x: -40, y: 200 }),
      link({ x: -40, y: 200 }, left(e)),
    ];

    const closed = solveDc(schema([e, pa, r1], wires));
    expect(closed.ok).toBe(true);
    expect(byLabel(closed, 'PA1').current).toBeCloseTo(0.2, 9);

    const sw = part('switchOpen', 'S1', 700, 200);
    const broken = solveDc(
      schema(
        [e, pa, r1, sw],
        [
          link(right(e), left(pa)),
          link(right(pa), left(r1)),
          link(right(r1), left(sw)),
          link(right(sw), { x: 900, y: 400 }),
          link({ x: 900, y: 400 }, { x: -40, y: 400 }),
          link({ x: -40, y: 400 }, left(e)),
        ],
      ),
    );
    expect(byLabel(broken, 'R1').current).toBeCloseTo(0, 12);
  });

  it('значения из переменных и выражений', () => {
    const e = part('sourceEmf', 'E1', 0, 0, 'U', 'В');
    const r1 = part('resistor', 'R1', 200, 0, 'R', 'Ом');
    const r2 = part('resistor', 'R2', 400, 0, '3*R', 'Ом');
    const doc = schema(
      [e, r1, r2],
      [
        link(right(e), left(r1)),
        link(right(r1), left(r2)),
        link(right(r2), { x: 500, y: 200 }),
        link({ x: 500, y: 200 }, { x: -40, y: 200 }),
        link({ x: -40, y: 200 }, left(e)),
      ],
      { variables: { R: '100', U: '20' } },
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(true);
    expect(byLabel(result, 'R1').current).toBeCloseTo(0.05, 9);
    expect(byLabel(result, 'R1').resistance).toBeCloseTo(100, 9);
    expect(byLabel(result, 'R2').resistance).toBeCloseTo(300, 9);
  });

  it('два разных источника ЭДС параллельно дают понятную ошибку', () => {
    const e1 = part('sourceEmf', 'E1', 0, 0, '12', 'В');
    const e2 = part('sourceEmf', 'E2', 0, 200, '5', 'В');
    const doc = schema(
      [e1, e2],
      [
        link(right(e1), right(e2)),
        link(left(e1), left(e2)),
      ],
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => p.kind === 'singular')).toBe(true);
  });

  it('несвязанные фрагменты считаются по отдельности', () => {
    const e1 = part('sourceEmf', 'E1', 0, 0, '10', 'В');
    const r1 = part('resistor', 'R1', 200, 0, '100', 'Ом');
    const e2 = part('sourceEmf', 'E2', 0, 600, '20', 'В');
    const r2 = part('resistor', 'R2', 200, 600, '100', 'Ом');

    const doc = schema(
      [e1, r1, e2, r2],
      [
        link(right(e1), left(r1)),
        link(right(r1), { x: 300, y: 200 }),
        link({ x: 300, y: 200 }, { x: -40, y: 200 }),
        link({ x: -40, y: 200 }, left(e1)),
        link(right(e2), left(r2)),
        link(right(r2), { x: 300, y: 800 }),
        link({ x: 300, y: 800 }, { x: -40, y: 800 }),
        link({ x: -40, y: 800 }, left(e2)),
      ],
    );

    const result = solveDc(doc);
    expect(result.ok).toBe(true);
    expect(result.references.length).toBe(2);
    expect(byLabel(result, 'R1').current).toBeCloseTo(0.1, 9);
    expect(byLabel(result, 'R2').current).toBeCloseTo(0.2, 9);
  });

  it('элемент без значения попадает в замечания', () => {
    const e = part('sourceEmf', 'E1', 0, 0, '', 'В');
    const r1 = part('resistor', 'R1', 200, 0, '100', 'Ом');
    const doc = schema([e, r1], [link(right(e), left(r1))]);
    const result = solveDc(doc);
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => p.kind === 'value')).toBe(true);
  });
});
