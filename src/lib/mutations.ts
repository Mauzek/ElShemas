import type { Element, Rotation, SchemaFile, TextLabel, Wire } from '../types/schema';
import type { Selection } from '../store/useUi';
import { elementBBox, rotateBy } from './geometry';
import { moveEndpoint, simplify } from './ortho';
import { makeId } from './ids';

/** Перенос выделенного вместе с привязанными проводами. */
export function translateItems(doc: SchemaFile, sel: Selection, dx: number, dy: number): SchemaFile {
  if (dx === 0 && dy === 0) return doc;
  const movedElements = new Set(sel.elements);
  const movedWires = new Set(sel.wires);
  const movedLabels = new Set(sel.labels);

  const elements = doc.elements.map((el) =>
    movedElements.has(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el,
  );

  const wires = doc.wires.map((w) => {
    if (movedWires.has(w.id)) {
      return { ...w, points: w.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    }
    const fromMoved = w.from ? movedElements.has(w.from.elementId) : false;
    const toMoved = w.to ? movedElements.has(w.to.elementId) : false;
    if (!fromMoved && !toMoved) return w;
    if (fromMoved && toMoved) {
      return { ...w, points: w.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    }
    let points = w.points;
    if (fromMoved) points = moveEndpoint(points, 0, dx, dy);
    if (toMoved) points = moveEndpoint(points, -1, dx, dy);
    return { ...w, points: simplify(points) };
  });

  const labels = doc.labels.map((l) =>
    movedLabels.has(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l,
  );

  return { ...doc, elements, wires, labels };
}

/** Удаление выделенного. Привязки к удалённым элементам сбрасываются, провода остаются. */
export function deleteItems(doc: SchemaFile, sel: Selection): SchemaFile {
  const deadElements = new Set(sel.elements);
  const deadWires = new Set(sel.wires);
  const deadLabels = new Set(sel.labels);
  const elements = doc.elements.filter((el) => !deadElements.has(el.id));
  const wires = doc.wires
    .filter((w) => !deadWires.has(w.id))
    .map((w) => {
      const from = w.from && deadElements.has(w.from.elementId) ? undefined : w.from;
      const to = w.to && deadElements.has(w.to.elementId) ? undefined : w.to;
      return from === w.from && to === w.to ? w : { ...w, from, to };
    });
  const labels = doc.labels.filter((l) => !deadLabels.has(l.id));
  return { ...doc, elements, wires, labels };
}

export interface Fragment {
  elements: Element[];
  wires: Wire[];
  labels: TextLabel[];
}

export function extractFragment(doc: SchemaFile, sel: Selection): Fragment {
  const elementIds = new Set(sel.elements);
  const wireIds = new Set(sel.wires);
  const labelIds = new Set(sel.labels);
  return {
    elements: doc.elements.filter((e) => elementIds.has(e.id)).map((e) => ({ ...e })),
    wires: doc.wires.filter((w) => wireIds.has(w.id)).map((w) => ({ ...w, points: w.points.map((p) => ({ ...p })) })),
    labels: doc.labels.filter((l) => labelIds.has(l.id)).map((l) => ({ ...l })),
  };
}

/** Копия фрагмента с новыми идентификаторами и смещением. */
export function cloneFragment(fragment: Fragment, dx: number, dy: number): Fragment {
  const map = new Map<string, string>();
  const elements = fragment.elements.map((el) => {
    const id = makeId('el');
    map.set(el.id, id);
    return { ...el, id, x: el.x + dx, y: el.y + dy };
  });
  const wires = fragment.wires.map((w) => {
    const from = w.from && map.has(w.from.elementId)
      ? { ...w.from, elementId: map.get(w.from.elementId) as string }
      : undefined;
    const to = w.to && map.has(w.to.elementId)
      ? { ...w.to, elementId: map.get(w.to.elementId) as string }
      : undefined;
    return {
      ...w,
      id: makeId('w'),
      points: w.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      from,
      to,
    };
  });
  const labels = fragment.labels.map((l) => ({ ...l, id: makeId('t'), x: l.x + dx, y: l.y + dy }));
  return { elements, wires, labels };
}

/** Поворот элементов вокруг собственных якорей. */
export function rotateElements(doc: SchemaFile, ids: string[], delta: number): SchemaFile {
  const set = new Set(ids);
  return {
    ...doc,
    elements: doc.elements.map((el) =>
      set.has(el.id) ? { ...el, rotation: rotateBy(el.rotation, delta) as Rotation } : el,
    ),
  };
}

export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

export function alignElements(doc: SchemaFile, ids: string[], mode: AlignMode): SchemaFile {
  const targets = doc.elements.filter((el) => ids.includes(el.id));
  if (targets.length < 2) return doc;
  const boxes = new Map(targets.map((el) => [el.id, elementBBox(el)]));
  const lefts = targets.map((el) => (boxes.get(el.id) as { x: number }).x);
  const rights = targets.map((el) => {
    const b = boxes.get(el.id) as { x: number; w: number };
    return b.x + b.w;
  });
  const tops = targets.map((el) => (boxes.get(el.id) as { y: number }).y);
  const bottoms = targets.map((el) => {
    const b = boxes.get(el.id) as { y: number; h: number };
    return b.y + b.h;
  });
  const minX = Math.min(...lefts);
  const maxX = Math.max(...rights);
  const minY = Math.min(...tops);
  const maxY = Math.max(...bottoms);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const shift = (el: Element): { dx: number; dy: number } => {
    const b = boxes.get(el.id);
    if (!b) return { dx: 0, dy: 0 };
    switch (mode) {
      case 'left':
        return { dx: minX - b.x, dy: 0 };
      case 'right':
        return { dx: maxX - (b.x + b.w), dy: 0 };
      case 'hcenter':
        return { dx: cx - (b.x + b.w / 2), dy: 0 };
      case 'top':
        return { dx: 0, dy: minY - b.y };
      case 'bottom':
        return { dx: 0, dy: maxY - (b.y + b.h) };
      case 'vcenter':
      default:
        return { dx: 0, dy: cy - (b.y + b.h / 2) };
    }
  };

  let next = doc;
  for (const el of targets) {
    const { dx, dy } = shift(el);
    if (dx === 0 && dy === 0) continue;
    next = translateItems(next, { elements: [el.id], wires: [], labels: [] }, Math.round(dx), Math.round(dy));
  }
  return next;
}

export type DistributeMode = 'horizontal' | 'vertical';

export function distributeElements(doc: SchemaFile, ids: string[], mode: DistributeMode): SchemaFile {
  const targets = doc.elements.filter((el) => ids.includes(el.id));
  if (targets.length < 3) return doc;
  const axis = mode === 'horizontal' ? 'x' : 'y';
  const sorted = [...targets].sort((a, b) => a[axis] - b[axis]);
  const first = sorted[0][axis];
  const last = sorted[sorted.length - 1][axis];
  const step = (last - first) / (sorted.length - 1);
  let next = doc;
  sorted.forEach((el, i) => {
    const target = Math.round(first + step * i);
    const delta = target - el[axis];
    if (delta === 0) return;
    const sel: Selection = { elements: [el.id], wires: [], labels: [] };
    next = translateItems(next, sel, mode === 'horizontal' ? delta : 0, mode === 'vertical' ? delta : 0);
  });
  return next;
}
