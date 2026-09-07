import { emptySchema } from '../types/schema';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { cloneFragment, extractFragment } from './mutations';
import { downloadText, parseSchema, safeFileName, serializeSchema } from './fileIO';
import { docBounds } from './geometry';
import { simplify } from './ortho';
import { fitViewport } from './viewport';
import { makeId } from './ids';
import { selectionCount } from '../store/useUi';

export function cmdNew(): void {
  useDoc.getState().setDoc(emptySchema(), makeId('doc'));
  const ui = useUi.getState();
  ui.clearSelection();
  ui.setViewport({ x: 120, y: 100, zoom: 1 });
  ui.showToast('Создана новая схема');
}

export function cmdSaveJson(): void {
  const doc = useDoc.getState().doc;
  downloadText(`${safeFileName(doc.title)}.json`, serializeSchema(doc), 'application/json');
  useUi.getState().showToast('Файл схемы сохранён');
}

export function cmdOpenFile(file: File): void {
  void file.text().then((text) => {
    const result = parseSchema(text);
    if (!result.ok) {
      useUi.getState().showToast(result.error);
      return;
    }
    useUi.getState().setPendingImport({ doc: result.doc, warnings: result.warnings, fileName: file.name });
  });
}

export function cmdCopy(): void {
  const ui = useUi.getState();
  if (selectionCount(ui.selection) === 0) return;
  ui.setClipboard(extractFragment(useDoc.getState().doc, ui.selection));
  ui.showToast('Скопировано');
}

export function cmdPaste(): void {
  const ui = useUi.getState();
  const doc = useDoc.getState();
  const fragment = ui.clipboard;
  if (!fragment) return;
  const step = doc.doc.grid * 2;
  const copy = cloneFragment(fragment, step, step);
  doc.addFragment(copy);
  ui.setSelection({
    elements: copy.elements.map((e) => e.id),
    wires: copy.wires.map((w) => w.id),
    labels: copy.labels.map((l) => l.id),
  });
  ui.setClipboard(cloneFragment(fragment, step, step));
}

export function cmdDuplicate(): void {
  const ui = useUi.getState();
  const doc = useDoc.getState();
  if (selectionCount(ui.selection) === 0) return;
  const fragment = extractFragment(doc.doc, ui.selection);
  const step = doc.doc.grid * 2;
  const copy = cloneFragment(fragment, step, step);
  doc.addFragment(copy);
  ui.setSelection({
    elements: copy.elements.map((e) => e.id),
    wires: copy.wires.map((w) => w.id),
    labels: copy.labels.map((l) => l.id),
  });
}

export function cmdDelete(): void {
  const ui = useUi.getState();
  if (selectionCount(ui.selection) === 0) return;
  useDoc.getState().removeSelection(ui.selection);
  ui.clearSelection();
}

export function cmdSelectAll(): void {
  const doc = useDoc.getState().doc;
  useUi.getState().setSelection({
    elements: doc.elements.map((e) => e.id),
    wires: doc.wires.map((w) => w.id),
    labels: doc.labels.map((l) => l.id),
  });
}

export function cmdRotate(delta: number): void {
  const ui = useUi.getState();
  if (ui.placingType) {
    ui.rotatePlacing(delta);
    return;
  }
  if (ui.selection.elements.length === 0) return;
  useDoc.getState().rotateSelection(ui.selection.elements, delta);
}

export function cmdMirror(): void {
  const ui = useUi.getState();
  if (ui.placingType) {
    ui.mirrorPlacing();
    return;
  }
  if (ui.selection.elements.length === 0) return;
  useDoc.getState().mirrorSelection(ui.selection.elements);
}

export function cmdFit(): void {
  const ui = useUi.getState();
  ui.setViewport(fitViewport(ui.viewSize, docBounds(useDoc.getState().doc)));
}

export function cmdZoomReset(): void {
  const ui = useUi.getState();
  ui.setViewport({ ...ui.viewport, zoom: 1 });
}

export function cmdPrint(): void {
  window.print();
}

/** Завершить рисуемый провод (Enter). */
export function cmdFinishWire(): void {
  const ui = useUi.getState();
  const draft = ui.wireDraft;
  if (!draft) return;
  const points = simplify(draft.points);
  if (points.length >= 2) {
    useDoc.getState().addWire({ id: makeId('w'), points, from: draft.fromPort ?? undefined });
  }
  ui.setWireDraft(null);
}

/** Esc: сначала отменяем черновик провода, затем размещение, затем выделение. */
export function cmdEscape(): void {
  const ui = useUi.getState();
  if (ui.editing) {
    ui.setEditing(null);
    return;
  }
  if (ui.wireDraft) {
    ui.setWireDraft(null);
    return;
  }
  if (ui.placingType) {
    ui.cancelPlacing();
    return;
  }
  if (ui.dialog) {
    ui.setDialog(null);
    return;
  }
  ui.clearSelection();
}

/** Tab: сменить направление первого сегмента рисуемого провода. */
export function cmdToggleElbow(): void {
  const ui = useUi.getState();
  const draft = ui.wireDraft;
  if (!draft) return;
  ui.setWireDraft({ ...draft, firstHorizontal: !draft.firstHorizontal });
}

export function cmdNudge(dx: number, dy: number): void {
  const ui = useUi.getState();
  if (selectionCount(ui.selection) === 0) return;
  useDoc.getState().nudge(ui.selection, dx, dy);
}

export function cmdToggleTheme(): void {
  const ui = useUi.getState();
  ui.setSettings({ theme: ui.settings.theme === 'dark' ? 'light' : 'dark' });
}
