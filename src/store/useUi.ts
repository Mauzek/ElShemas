import { create } from 'zustand';
import type { ElementType, Point, PortRef, Rotation, SchemaFile } from '../types/schema';
import type { Fragment } from '../lib/mutations';

export type Tool = 'select' | 'hand' | 'wire' | 'text' | 'draw';
export type DialogName = 'export' | 'manager' | 'bom' | 'shortcuts' | 'check' | 'import' | 'save' | null;

/** Запрос подтверждения перед необратимым или заметным действием. */
export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

/** Область полотна, перекрытая плавающими панелями. */
export interface ViewInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PendingImport {
  doc: SchemaFile;
  warnings: string[];
  fileName: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Selection {
  elements: string[];
  wires: string[];
  labels: string[];
  strokes: string[];
}

export interface Settings {
  snap: boolean;
  showGrid: boolean;
  theme: 'light' | 'dark';
  inductorStyle: 'box' | 'arcs';
  crossingStyle: 'plain' | 'hop';
  freeAngleWire: boolean;
  /** Карандаш: цвет и толщина штриха. */
  penColor: string;
  penWidth: number;
}

export type EditTarget =
  | { kind: 'element'; id: string; field: 'label' | 'value' }
  | { kind: 'label'; id: string }
  | null;

export interface WireDraft {
  points: Point[];
  fromPort: PortRef | null;
  firstHorizontal: boolean;
  cursor: Point | null;
}

interface UiState {
  tool: Tool;
  placingType: ElementType | null;
  placingRotation: Rotation;
  placingMirrored: boolean;
  ghost: Point | null;
  viewport: Viewport;
  selection: Selection;
  settings: Settings;
  hoverPort: (PortRef & { point: Point }) | null;
  wireDraft: WireDraft | null;
  dialog: DialogName;
  cursor: Point;
  editing: EditTarget;
  clipboard: Fragment | null;
  pendingImport: PendingImport | null;
  confirm: ConfirmRequest | null;
  viewInsets: ViewInsets;
  spacePan: boolean;
  viewSize: { width: number; height: number };
  toast: string | null;

  setTool: (tool: Tool) => void;
  startPlacing: (type: ElementType) => void;
  cancelPlacing: () => void;
  setGhost: (p: Point | null) => void;
  rotatePlacing: (delta: number) => void;
  mirrorPlacing: () => void;
  setViewport: (v: Viewport) => void;
  panBy: (dx: number, dy: number) => void;
  setSelection: (s: Partial<Selection>) => void;
  addToSelection: (s: Partial<Selection>) => void;
  toggleSelection: (kind: keyof Selection, id: string) => void;
  clearSelection: () => void;
  isSelected: (kind: keyof Selection, id: string) => boolean;
  setSettings: (s: Partial<Settings>) => void;
  setHoverPort: (p: (PortRef & { point: Point }) | null) => void;
  setWireDraft: (d: WireDraft | null) => void;
  setDialog: (d: DialogName) => void;
  setCursor: (p: Point) => void;
  setEditing: (e: EditTarget) => void;
  setClipboard: (f: Fragment | null) => void;
  setPendingImport: (v: PendingImport | null) => void;
  askConfirm: (request: ConfirmRequest) => void;
  closeConfirm: () => void;
  setViewInsets: (insets: Partial<ViewInsets>) => void;
  setSpacePan: (v: boolean) => void;
  setViewSize: (s: { width: number; height: number }) => void;
  showToast: (message: string | null) => void;
}

const SETTINGS_KEY = 'elshemas.settings';

function loadSettings(): Settings {
  const fallback: Settings = {
    snap: true,
    showGrid: true,
    theme: 'light',
    inductorStyle: 'box',
    crossingStyle: 'plain',
    freeAngleWire: false,
    penColor: '#e11d48',
    penWidth: 3,
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* приватный режим браузера — настройки просто не сохранятся */
  }
}

const emptySelection: Selection = { elements: [], wires: [], labels: [], strokes: [] };

let toastTimer: number | undefined;

export const useUi = create<UiState>((set, get) => ({
  tool: 'select',
  placingType: null,
  placingRotation: 0,
  placingMirrored: false,
  ghost: null,
  viewport: { x: 300, y: 150, zoom: 1 },
  selection: emptySelection,
  settings: loadSettings(),
  hoverPort: null,
  wireDraft: null,
  dialog: null,
  cursor: { x: 0, y: 0 },
  editing: null,
  clipboard: null,
  pendingImport: null,
  confirm: null,
  viewInsets: { left: 16, right: 16, top: 16, bottom: 16 },
  spacePan: false,
  viewSize: { width: 1200, height: 800 },
  toast: null,

  setTool: (tool) => set({ tool, placingType: null, wireDraft: null, ghost: null }),
  startPlacing: (type) =>
    set({ placingType: type, tool: 'select', wireDraft: null, placingRotation: 0, placingMirrored: false }),
  cancelPlacing: () => set({ placingType: null, ghost: null }),
  setGhost: (p) => set({ ghost: p }),
  rotatePlacing: (delta) =>
    set((s) => ({
      placingRotation: ((Math.round((((s.placingRotation + delta) % 360) + 360) % 360 / 45) * 45) % 360) as Rotation,
    })),
  mirrorPlacing: () => set((s) => ({ placingMirrored: !s.placingMirrored })),

  setViewport: (viewport) => set({ viewport }),
  panBy: (dx, dy) =>
    set((s) => ({ viewport: { ...s.viewport, x: s.viewport.x + dx, y: s.viewport.y + dy } })),

  setSelection: (sel) => set({ selection: { ...emptySelection, ...sel } }),
  addToSelection: (sel) =>
    set((s) => ({
      selection: {
        elements: Array.from(new Set([...s.selection.elements, ...(sel.elements ?? [])])),
        wires: Array.from(new Set([...s.selection.wires, ...(sel.wires ?? [])])),
        labels: Array.from(new Set([...s.selection.labels, ...(sel.labels ?? [])])),
        strokes: Array.from(new Set([...s.selection.strokes, ...(sel.strokes ?? [])])),
      },
    })),
  toggleSelection: (kind, id) =>
    set((s) => {
      const list = s.selection[kind];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { selection: { ...s.selection, [kind]: next } };
    }),
  clearSelection: () => set({ selection: emptySelection }),
  isSelected: (kind, id) => get().selection[kind].includes(id),

  setSettings: (partial) =>
    set((s) => {
      const settings = { ...s.settings, ...partial };
      saveSettings(settings);
      return { settings };
    }),

  setHoverPort: (hoverPort) => set({ hoverPort }),
  setWireDraft: (wireDraft) => set({ wireDraft }),
  setDialog: (dialog) => set({ dialog }),
  setCursor: (cursor) => set({ cursor }),
  setEditing: (editing) => set({ editing }),
  setClipboard: (clipboard) => set({ clipboard }),
  setPendingImport: (pendingImport) => set({ pendingImport, dialog: pendingImport ? 'import' : null }),
  askConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
  setViewInsets: (insets) => set((s) => ({ viewInsets: { ...s.viewInsets, ...insets } })),
  setSpacePan: (spacePan) => set({ spacePan }),
  setViewSize: (viewSize) => set({ viewSize }),
  showToast: (toast) => {
    window.clearTimeout(toastTimer);
    set({ toast });
    if (toast) toastTimer = window.setTimeout(() => set({ toast: null }), 2600);
  },
}));

export function selectionCount(s: Selection): number {
  return s.elements.length + s.wires.length + s.labels.length + s.strokes.length;
}
