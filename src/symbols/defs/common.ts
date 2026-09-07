import type { Point, Rect } from '../../types/schema';
import type { SymbolDef } from '../types';

/** Выводы двухполюсника: 40 px от якоря, поэтому всегда попадают в узел сетки. */
export const twoPort: Point[] = [
  { x: -40, y: 0 },
  { x: 40, y: 0 },
];

/** Габарит символов с круглым корпусом: источники и приборы. */
export const wideBox: Rect = { x: -40, y: -12, w: 80, h: 24 };

/** Помогает TypeScript вывести тип каждого описания как SymbolDef. */
export function def(d: SymbolDef): SymbolDef {
  return d;
}
