import type { Point } from '../types/schema';
import { samePoint } from './geometry';

/** Ортогональная маршрутизация «колено» между двумя точками. */
export function elbow(a: Point, b: Point, firstHorizontal: boolean): Point[] {
  if (samePoint(a, b)) return [a];
  if (a.x === b.x || a.y === b.y) return [a, b];
  const corner = firstHorizontal ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  return [a, corner, b];
}

/** Свободный угол: Shift фиксирует шаг 45°. */
export function constrain45(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax >= ay * 2.414) return { x: b.x, y: a.y };
  if (ay >= ax * 2.414) return { x: a.x, y: b.y };
  // Диагональ 45°: равные катеты, длина берётся по большей проекции —
  // так точка остаётся на узле сетки.
  const d = Math.max(ax, ay);
  return { x: a.x + Math.sign(dx) * d, y: a.y + Math.sign(dy) * d };
}

/** Удаляет дубли и спрямляет коллинеарные точки ломаной. */
export function simplify(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || !samePoint(last, p)) out.push({ x: p.x, y: p.y });
  }
  if (out.length < 3) return out;
  const res: Point[] = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = res[res.length - 1];
    const b = out[i];
    const c = out[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) > 0.001) res.push(b);
  }
  res.push(out[out.length - 1]);
  return res;
}

/**
 * Двигает сегмент ломаной перпендикулярно ему самому, сохраняя ортогональность.
 * Если сегмент крайний, а конец закреплён на выводе, добавляется новая точка излома.
 */
export function moveSegment(
  points: Point[],
  index: number,
  dx: number,
  dy: number,
  pinStart: boolean,
  pinEnd: boolean,
): Point[] {
  if (index < 0 || index >= points.length - 1) return points;
  const a = points[index];
  const b = points[index + 1];
  const horizontal = Math.abs(a.y - b.y) < 0.5;
  const vertical = Math.abs(a.x - b.x) < 0.5;
  const shift = (p: Point): Point => {
    if (horizontal) return { x: p.x, y: p.y + dy };
    if (vertical) return { x: p.x + dx, y: p.y };
    return { x: p.x + dx, y: p.y + dy };
  };
  const out = points.map((p, i) => (i === index || i === index + 1 ? shift(p) : { ...p }));
  if (index === 0 && pinStart) out.unshift({ ...points[0] });
  if (index === points.length - 2 && pinEnd) out.push({ ...points[points.length - 1] });
  return simplify(out);
}

/**
 * Сдвигает конец ломаной, стараясь сохранить ортогональность:
 * соседняя точка подтягивается по той же оси, а «колено» достраивается,
 * если провод состоит всего из двух точек.
 */
export function moveEndpoint(points: Point[], index: 0 | -1, dx: number, dy: number): Point[] {
  const pts = points.map((p) => ({ ...p }));
  if (pts.length === 0) return pts;
  const i = index === 0 ? 0 : pts.length - 1;
  const j = index === 0 ? 1 : pts.length - 2;
  const end = pts[i];
  const next = pts[j];
  end.x += dx;
  end.y += dy;
  if (!next) return pts;
  const wasHorizontal = Math.abs(next.y - (end.y - dy)) < 0.5;
  const wasVertical = Math.abs(next.x - (end.x - dx)) < 0.5;
  if (pts.length === 2) {
    if (wasHorizontal && dy !== 0 && end.x !== next.x) {
      const corner = { x: next.x, y: end.y };
      return index === 0 ? [end, corner, next] : [next, corner, end];
    }
    if (wasVertical && dx !== 0 && end.y !== next.y) {
      const corner = { x: end.x, y: next.y };
      return index === 0 ? [end, corner, next] : [next, corner, end];
    }
    if (wasHorizontal) next.y = end.y;
    else if (wasVertical) next.x = end.x;
    return pts;
  }
  if (wasHorizontal) next.y = end.y;
  else if (wasVertical) next.x = end.x;
  else {
    next.x += dx;
    next.y += dy;
  }
  return pts;
}
