import type { Element, Point, PortRef, Rect, Wire } from '../../types/schema';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import { elementBBox, rectsIntersect, snap, snapPoint } from '../../lib/geometry';
import { constrain45, elbow, moveSegment, simplify } from '../../lib/ortho';
import { findPortNear } from '../../lib/nodes';
import { makeId } from '../../lib/ids';
import { hasSymbol } from '../../symbols/registry';
import { parseSchema } from '../../lib/fileIO';

export const PORT_RADIUS = 10;

export type Interaction =
  | { mode: 'none' }
  | { mode: 'pan'; startX: number; startY: number; vx: number; vy: number }
  | { mode: 'drag'; start: Point }
  | { mode: 'marquee'; start: Point; additive: boolean }
  | { mode: 'segment'; wireId: string; index: number; start: Point }
  | { mode: 'label'; elementId: string; start: Point; base: Point };

export interface WireTarget {
  point: Point;
  port: PortRef | null;
}

export function snapWorld(p: Point): Point {
  const { settings } = useUi.getState();
  const { grid } = useDoc.getState().doc;
  return snapPoint(p, grid, settings.snap);
}

/** Цель клика провода: вывод элемента, если он рядом, иначе узел сетки. */
export function wireTarget(world: Point): WireTarget {
  const { viewport } = useUi.getState();
  const near = findPortNear(useDoc.getState().doc, world, PORT_RADIUS / viewport.zoom);
  if (near) return { point: near.point, port: { elementId: near.elementId, portIndex: near.portIndex } };
  return { point: snapWorld(world), port: null };
}

/**
 * Сегмент от последней точки к цели.
 * Shift даёт прямую линию (шаг 45°, а на выводе — точно в вывод),
 * иначе — ортогональное колено или свободный угол по настройке.
 */
export function segmentTo(last: Point, target: Point, onPort: boolean, shift: boolean): Point[] {
  const ui = useUi.getState();
  if (shift) return [last, onPort ? target : constrain45(last, target)];
  if (ui.settings.freeAngleWire) return [last, target];
  return elbow(last, target, ui.wireDraft?.firstHorizontal ?? true);
}

export function finishWire(points: Point[], port: PortRef | null): void {
  const ui = useUi.getState();
  const draft = ui.wireDraft;
  const pts = simplify(points);
  if (pts.length >= 2) {
    const wire: Wire = { id: makeId('w'), points: pts, from: draft?.fromPort ?? undefined, to: port ?? undefined };
    useDoc.getState().addWire(wire);
  }
  ui.setWireDraft(null);
}

/** Клик инструментом «Провод»: начало, излом или завершение. */
export function wireClick(world: Point, shift: boolean): void {
  const ui = useUi.getState();
  const { point, port } = wireTarget(world);
  const draft = ui.wireDraft;
  if (!draft) {
    ui.setWireDraft({ points: [point], fromPort: port, firstHorizontal: true, cursor: point });
    return;
  }
  const last = draft.points[draft.points.length - 1];
  const seg = segmentTo(last, point, Boolean(port), shift);
  const points = [...draft.points, ...seg.slice(1)];
  const samePlace = Math.abs(last.x - point.x) < 0.5 && Math.abs(last.y - point.y) < 0.5;
  if (port || samePlace) finishWire(points, port);
  else ui.setWireDraft({ ...draft, points: simplify(points) });
}

export function placeElementAt(world: Point): void {
  const ui = useUi.getState();
  const type = ui.placingType;
  if (!type) return;
  const p = snapWorld(world);
  const doc = useDoc.getState();
  const el = doc.createElement(type, p.x, p.y, ui.placingRotation, ui.placingMirrored);
  doc.addElement(el);
  ui.setSelection({ elements: [el.id] });
}

export function createLabelAt(world: Point): void {
  const ui = useUi.getState();
  const p = snapWorld(world);
  const id = makeId('t');
  useDoc.getState().addLabel({ id, x: p.x, y: p.y, text: '', fontSize: 16, italic: true });
  ui.setSelection({ labels: [id] });
  ui.setEditing({ kind: 'label', id });
  ui.setTool('select');
}

/** Призрак элемента, следующий за курсором в режиме размещения. */
export function ghostElement(world: Point): Element | null {
  const ui = useUi.getState();
  if (!ui.placingType) return null;
  const p = snapWorld(world);
  return {
    id: 'ghost',
    type: ui.placingType,
    x: p.x,
    y: p.y,
    rotation: ui.placingRotation,
    mirrored: ui.placingMirrored,
    label: '',
    value: '',
    unit: '',
    showValue: false,
  };
}

/** Перенос выделенного: привязка считается по якорю первого элемента. */
export function applyDrag(start: Point, world: Point): void {
  const doc = useDoc.getState();
  const ui = useUi.getState();
  const base = doc.txBaseline;
  if (!base) return;
  const snapOn = ui.settings.snap;
  const sel = ui.selection;
  let dx = world.x - start.x;
  let dy = world.y - start.y;
  if (snapOn) {
    const anchor = base.elements.find((el) => el.id === sel.elements[0]);
    if (anchor) {
      dx = snap(anchor.x + dx, base.grid, true) - anchor.x;
      dy = snap(anchor.y + dy, base.grid, true) - anchor.y;
    } else {
      dx = Math.round(dx / base.grid) * base.grid;
      dy = Math.round(dy / base.grid) * base.grid;
    }
  } else {
    dx = Math.round(dx);
    dy = Math.round(dy);
  }
  doc.txTranslate(sel, dx, dy);
}

export function applySegmentDrag(wireId: string, index: number, start: Point, world: Point): void {
  const doc = useDoc.getState();
  const base = doc.txBaseline;
  if (!base) return;
  const wire = base.wires.find((w) => w.id === wireId);
  const a = wire?.points[index];
  if (!wire || !a) return;
  const snapOn = useUi.getState().settings.snap;
  const dx = snapOn ? snap(a.x + (world.x - start.x), base.grid, true) - a.x : Math.round(world.x - start.x);
  const dy = snapOn ? snap(a.y + (world.y - start.y), base.grid, true) - a.y : Math.round(world.y - start.y);
  const points = moveSegment(wire.points, index, dx, dy, Boolean(wire.from), Boolean(wire.to));
  doc.txApply((b) => ({ ...b, wires: b.wires.map((w) => (w.id === wireId ? { ...w, points } : w)) }));
}

export function applyLabelDrag(elementId: string, base: Point, start: Point, world: Point): void {
  const doc = useDoc.getState();
  if (!doc.txBaseline) return;
  const dx = Math.round(world.x - start.x);
  const dy = Math.round(world.y - start.y);
  doc.txApply((b) => ({
    ...b,
    elements: b.elements.map((el) =>
      el.id === elementId ? { ...el, labelOffset: { x: base.x + dx, y: base.y + dy } } : el,
    ),
  }));
}

export function selectInMarquee(rect: Rect, additive: boolean): void {
  const ui = useUi.getState();
  const doc = useDoc.getState().doc;
  const inside = (x: number, y: number) =>
    x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  const elements = doc.elements.filter((el) => rectsIntersect(rect, elementBBox(el))).map((el) => el.id);
  const wires = doc.wires.filter((w) => w.points.some((p) => inside(p.x, p.y))).map((w) => w.id);
  const labels = doc.labels.filter((l) => inside(l.x, l.y) || inside(l.x, l.y - l.fontSize)).map((l) => l.id);
  if (additive) ui.addToSelection({ elements, wires, labels });
  else ui.setSelection({ elements, wires, labels });
}

/** Перетаскивание на полотно: файл схемы или символ из палитры. */
export function handleDrop(file: File | undefined, symbolType: string, world: Point): void {
  const ui = useUi.getState();
  const doc = useDoc.getState();
  if (file) {
    void file.text().then((text) => {
      const result = parseSchema(text);
      if (!result.ok) {
        ui.showToast(result.error);
        return;
      }
      ui.setPendingImport({ doc: result.doc, warnings: result.warnings, fileName: file.name });
    });
    return;
  }
  if (!symbolType || !hasSymbol(symbolType)) return;
  const p = snapWorld(world);
  const el = doc.createElement(symbolType, p.x, p.y, 0, false);
  doc.addElement(el);
  ui.setSelection({ elements: [el.id] });
}
