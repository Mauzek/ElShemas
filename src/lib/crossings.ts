import type { Point, Wire } from '../types/schema';

export interface Hop {
  segment: number;
  at: number;
}

interface Seg {
  wireId: string;
  index: number;
  a: Point;
  b: Point;
}

const EPS = 0.5;

/**
 * Пересечения без соединения: горизонтальный провод «перепрыгивает» вертикальный.
 * Точки, где провода действительно соединяются (там стоит жирная точка), пропускаются.
 */
export function computeHops(wires: Wire[], junctionKeys: Set<string>): Map<string, Hop[]> {
  const horizontal: Seg[] = [];
  const vertical: Seg[] = [];
  for (const w of wires) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const a = w.points[i];
      const b = w.points[i + 1];
      if (Math.abs(a.y - b.y) < EPS && Math.abs(a.x - b.x) >= EPS) horizontal.push({ wireId: w.id, index: i, a, b });
      else if (Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) >= EPS) vertical.push({ wireId: w.id, index: i, a, b });
    }
  }

  const result = new Map<string, Hop[]>();
  for (const h of horizontal) {
    const minX = Math.min(h.a.x, h.b.x);
    const maxX = Math.max(h.a.x, h.b.x);
    for (const v of vertical) {
      if (v.wireId === h.wireId) continue;
      const x = v.a.x;
      const y = h.a.y;
      if (x <= minX + EPS || x >= maxX - EPS) continue;
      const minY = Math.min(v.a.y, v.b.y);
      const maxY = Math.max(v.a.y, v.b.y);
      if (y <= minY + EPS || y >= maxY - EPS) continue;
      if (junctionKeys.has(`${Math.round(x)}:${Math.round(y)}`)) continue;
      const list = result.get(h.wireId);
      const hop: Hop = { segment: h.index, at: x };
      if (list) list.push(hop);
      else result.set(h.wireId, [hop]);
    }
  }
  return result;
}
