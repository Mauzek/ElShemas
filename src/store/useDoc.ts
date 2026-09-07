import { create } from 'zustand';
import type {
  Element,
  ElementType,
  Point,
  Rotation,
  SchemaFile,
  Stroke,
  TextLabel,
  Wire,
} from '../types/schema';
import { emptySchema } from '../types/schema';
import { getSymbol } from '../symbols/registry';
import { makeId } from '../lib/ids';
import { nextLabel } from '../lib/autonumber';
import {
  alignElements,
  cloneFragment,
  deleteItems,
  distributeElements,
  rotateElements,
  translateItems,
  type AlignMode,
  type DistributeMode,
  type Fragment,
} from '../lib/mutations';
import type { Selection } from './useUi';

const HISTORY_LIMIT = 120;

interface DocState {
  doc: SchemaFile;
  docId: string;
  past: SchemaFile[];
  future: SchemaFile[];
  txBaseline: SchemaFile | null;

  setDoc: (doc: SchemaFile, docId?: string) => void;
  setDocId: (id: string) => void;
  setTitle: (title: string) => void;
  setGrid: (grid: number) => void;

  createElement: (type: ElementType, x: number, y: number, rotation: Rotation, mirrored: boolean) => Element;
  addElement: (el: Element) => void;
  addWire: (wire: Wire) => void;
  addLabel: (label: TextLabel) => void;
  addStroke: (stroke: Stroke) => void;
  addFragment: (fragment: Fragment) => Fragment;
  patchElements: (ids: string[], patch: Partial<Element>) => void;
  patchWires: (ids: string[], patch: Partial<Wire>) => void;
  patchLabels: (ids: string[], patch: Partial<TextLabel>) => void;
  setWirePoints: (id: string, points: Point[]) => void;
  removeSelection: (sel: Selection) => void;
  nudge: (sel: Selection, dx: number, dy: number) => void;
  rotateSelection: (ids: string[], delta: number) => void;
  mirrorSelection: (ids: string[]) => void;
  align: (ids: string[], mode: AlignMode) => void;
  distribute: (ids: string[], mode: DistributeMode) => void;

  beginTx: () => void;
  txTranslate: (sel: Selection, dx: number, dy: number) => void;
  txApply: (fn: (base: SchemaFile) => SchemaFile) => void;
  endTx: () => void;
  cancelTx: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useDoc = create<DocState>((set, get) => {
  /** Изменение с записью в историю. */
  const commit = (fn: (doc: SchemaFile) => SchemaFile) =>
    set((s) => {
      const next = fn(s.doc);
      if (next === s.doc) return {};
      return {
        doc: next,
        past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
        future: [],
      };
    });

  return {
    doc: emptySchema(),
    docId: makeId('doc'),
    past: [],
    future: [],
    txBaseline: null,

    setDoc: (doc, docId) =>
      set({ doc, docId: docId ?? get().docId, past: [], future: [], txBaseline: null }),
    setDocId: (docId) => set({ docId }),
    setTitle: (title) => commit((doc) => ({ ...doc, title })),
    setGrid: (grid) => commit((doc) => ({ ...doc, grid })),

    createElement: (type, x, y, rotation, mirrored) => {
      const def = getSymbol(type);
      return {
        id: makeId('el'),
        type,
        x,
        y,
        rotation,
        mirrored,
        label: nextLabel(get().doc, def.prefix),
        value: def.defaultValue,
        unit: def.defaultUnit,
        showValue: def.showValue,
        ...(def.hasPolarity ? { polarity: 'forward' as const } : {}),
      };
    },

    addElement: (el) => commit((doc) => ({ ...doc, elements: [...doc.elements, el] })),
    addWire: (wire) => commit((doc) => ({ ...doc, wires: [...doc.wires, wire] })),
    addLabel: (label) => commit((doc) => ({ ...doc, labels: [...doc.labels, label] })),
    addStroke: (stroke) => commit((doc) => ({ ...doc, strokes: [...doc.strokes, stroke] })),
    addFragment: (fragment) => {
      commit((doc) => ({
        ...doc,
        elements: [...doc.elements, ...fragment.elements],
        wires: [...doc.wires, ...fragment.wires],
        labels: [...doc.labels, ...fragment.labels],
        strokes: [...doc.strokes, ...fragment.strokes],
      }));
      return fragment;
    },

    patchElements: (ids, patch) =>
      commit((doc) => ({
        ...doc,
        elements: doc.elements.map((el) => (ids.includes(el.id) ? { ...el, ...patch } : el)),
      })),
    patchWires: (ids, patch) =>
      commit((doc) => ({
        ...doc,
        wires: doc.wires.map((w) => (ids.includes(w.id) ? { ...w, ...patch } : w)),
      })),
    patchLabels: (ids, patch) =>
      commit((doc) => ({
        ...doc,
        labels: doc.labels.map((l) => (ids.includes(l.id) ? { ...l, ...patch } : l)),
      })),
    setWirePoints: (id, points) =>
      commit((doc) => ({
        ...doc,
        wires: doc.wires.map((w) => (w.id === id ? { ...w, points } : w)),
      })),

    removeSelection: (sel) => commit((doc) => deleteItems(doc, sel)),
    nudge: (sel, dx, dy) => commit((doc) => translateItems(doc, sel, dx, dy)),
    rotateSelection: (ids, delta) => commit((doc) => rotateElements(doc, ids, delta)),
    mirrorSelection: (ids) =>
      commit((doc) => ({
        ...doc,
        elements: doc.elements.map((el) =>
          ids.includes(el.id) ? { ...el, mirrored: !el.mirrored } : el,
        ),
      })),
    align: (ids, mode) => commit((doc) => alignElements(doc, ids, mode)),
    distribute: (ids, mode) => commit((doc) => distributeElements(doc, ids, mode)),

    beginTx: () => set({ txBaseline: get().doc }),
    txTranslate: (sel, dx, dy) => {
      const base = get().txBaseline;
      if (!base) return;
      set({ doc: translateItems(base, sel, dx, dy) });
    },
    txApply: (fn) => {
      const base = get().txBaseline;
      if (!base) return;
      set({ doc: fn(base) });
    },
    endTx: () =>
      set((s) => {
        const base = s.txBaseline;
        if (!base) return {};
        if (base === s.doc) return { txBaseline: null };
        return { txBaseline: null, past: [...s.past, base].slice(-HISTORY_LIMIT), future: [] };
      }),
    cancelTx: () =>
      set((s) => (s.txBaseline ? { doc: s.txBaseline, txBaseline: null } : { txBaseline: null })),

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1];
        if (!prev) return {};
        return { doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future].slice(0, HISTORY_LIMIT) };
      }),
    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return {};
        return { doc: next, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: s.future.slice(1) };
      }),
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});

export const cloneForPaste = cloneFragment;
