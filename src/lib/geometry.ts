import type { Element, Point, Rect, Rotation } from '../types/schema';
import { getSymbol } from '../symbols/registry';

export type { Rect };

/** Локальные координаты символа → мировые, с учётом зеркала и поворота. */
export function localToWorld(el: Pick<Element, 'x' | 'y' | 'rotation' | 'mirrored'>, p: Point): Point {
  let x = el.mirrored ? -p.x : p.x;
  let y = p.y;
  switch (el.rotation) {
    case 90: {
      const nx = -y;
      y = x;
      x = nx;
      break;
    }
    case 180:
      x = -x;
      y = -y;
      break;
    case 270: {
      const nx = y;
      y = -x;
      x = nx;
      break;
    }
    case 0:
      break;
    default: {
      // Диагональные углы 45/135/225/315.
      const rad = (el.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const nx = x * cos - y * sin;
      y = x * sin + y * cos;
      x = nx;
      break;
    }
  }
  return { x: el.x + x, y: el.y + y };
}

export function elementPorts(el: Element): Point[] {
  return getSymbol(el.type).ports.map((p) => localToWorld(el, p));
}

export function elementPort(el: Element, index: number): Point | null {
  const ports = getSymbol(el.type).ports;
  const p = ports[index];
  return p ? localToWorld(el, p) : null;
}

/** Габаритный прямоугольник элемента в мировых координатах. */
export function elementBBox(el: Element): Rect {
  const b = getSymbol(el.type).bbox;
  const corners: Point[] = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x, y: b.y + b.h },
    { x: b.x + b.w, y: b.y + b.h },
  ].map((c) => localToWorld(el, c));
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

export function unionRect(a: Rect | null, b: Rect | null): Rect | null {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

export function pointsRect(points: Point[]): Rect | null {
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Габарит всего содержимого схемы (без сетки). */
export function docBounds(doc: {
  elements: Element[];
  wires: { points: Point[] }[];
  labels: { x: number; y: number }[];
  strokes?: { points: Point[] }[];
}): Rect | null {
  let box: Rect | null = null;
  for (const el of doc.elements) box = unionRect(box, elementBBox(el));
  for (const w of doc.wires) box = unionRect(box, pointsRect(w.points));
  for (const l of doc.labels) box = unionRect(box, { x: l.x - 10, y: l.y - 16, w: 60, h: 24 });
  for (const s of doc.strokes ?? []) box = unionRect(box, pointsRect(s.points));
  return box;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
}

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

export function snap(value: number, grid: number, enabled: boolean): number {
  return enabled ? Math.round(value / grid) * grid : Math.round(value);
}

export function snapPoint(p: Point, grid: number, enabled: boolean): Point {
  return { x: snap(p.x, grid, enabled), y: snap(p.y, grid, enabled) };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function samePoint(a: Point, b: Point, eps = 0.5): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

export function key(p: Point): string {
  return `${Math.round(p.x)}:${Math.round(p.y)}`;
}

/** Расстояние от точки до отрезка. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Лежит ли точка строго внутри отрезка (не считая концов). */
export function pointOnSegmentInterior(p: Point, a: Point, b: Point, eps = 0.5): boolean {
  if (samePoint(p, a, eps) || samePoint(p, b, eps)) return false;
  if (distToSegment(p, a, b) > eps) return false;
  const minX = Math.min(a.x, b.x) - eps;
  const maxX = Math.max(a.x, b.x) + eps;
  const minY = Math.min(a.y, b.y) - eps;
  const maxY = Math.max(a.y, b.y) + eps;
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

/** Поворот с приведением к ближайшему углу, кратному 45°. */
export function rotateBy(rotation: Rotation, delta: number): Rotation {
  const raw = (((rotation + delta) % 360) + 360) % 360;
  return (Math.round(raw / 45) * 45) % 360 as Rotation;
}
