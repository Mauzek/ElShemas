import type { Element, Point, Rotation, SchemaFile, TextLabel, Wire } from '../types/schema';
import { ROTATIONS, SCHEMA_VERSION } from '../types/schema';
import { hasSymbol } from '../symbols/registry';
import { makeId } from './ids';

export type ParseResult =
  | { ok: true; doc: SchemaFile; warnings: string[] }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback);

function toRotation(v: unknown): Rotation {
  const n = num(v, 0);
  const r = (((Math.round(n / 45) * 45) % 360) + 360) % 360;
  return (ROTATIONS as number[]).includes(r) ? (r as Rotation) : 0;
}

function toPoint(v: unknown): Point | null {
  if (!isObj(v)) return null;
  if (typeof v.x !== 'number' || typeof v.y !== 'number') return null;
  if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  return { x: v.x, y: v.y };
}

/** Разбор и санация файла схемы. Некорректные записи отбрасываются, а не роняют приложение. */
export function parseSchema(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Файл не является корректным JSON.' };
  }
  if (!isObj(raw)) return { ok: false, error: 'Ожидался объект схемы.' };
  const version = raw.version;
  if (version !== SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        typeof version === 'number'
          ? `Несовместимая версия файла: ${version}. Поддерживается версия ${SCHEMA_VERSION}.`
          : 'В файле нет поля version — это не схема данного редактора.',
    };
  }

  const warnings: string[] = [];
  const seen = new Set<string>();
  const uniqueId = (prefix: string, candidate: unknown): string => {
    const id = str(candidate) || makeId(prefix);
    if (seen.has(id)) {
      const fresh = makeId(prefix);
      seen.add(fresh);
      return fresh;
    }
    seen.add(id);
    return id;
  };

  const elements: Element[] = [];
  for (const item of Array.isArray(raw.elements) ? raw.elements : []) {
    if (!isObj(item)) continue;
    const type = str(item.type);
    if (!hasSymbol(type)) {
      warnings.push(`Неизвестный тип элемента «${type || '?'}» пропущен.`);
      continue;
    }
    const polarity = item.polarity === 'reverse' ? 'reverse' : item.polarity === 'forward' ? 'forward' : undefined;
    const offset = toPoint(item.labelOffset);
    elements.push({
      id: uniqueId('el', item.id),
      type,
      x: num(item.x, 0),
      y: num(item.y, 0),
      rotation: toRotation(item.rotation),
      mirrored: bool(item.mirrored),
      label: str(item.label),
      value: str(item.value),
      unit: str(item.unit),
      showValue: bool(item.showValue, true),
      ...(polarity ? { polarity } : {}),
      ...(offset ? { labelOffset: offset } : {}),
      ...(typeof item.color === 'string' ? { color: item.color } : {}),
    });
  }
  const elementIds = new Set(elements.map((e) => e.id));

  const wires: Wire[] = [];
  for (const item of Array.isArray(raw.wires) ? raw.wires : []) {
    if (!isObj(item)) continue;
    const points = (Array.isArray(item.points) ? item.points : [])
      .map(toPoint)
      .filter((p): p is Point => p !== null);
    if (points.length < 2) {
      warnings.push('Провод с недостаточным числом точек пропущен.');
      continue;
    }
    const ref = (v: unknown) => {
      if (!isObj(v)) return undefined;
      const elementId = str(v.elementId);
      const portIndex = num(v.portIndex, -1);
      if (!elementIds.has(elementId) || portIndex < 0) return undefined;
      return { elementId, portIndex };
    };
    wires.push({
      id: uniqueId('w', item.id),
      points,
      from: ref(item.from),
      to: ref(item.to),
      ...(typeof item.color === 'string' ? { color: item.color } : {}),
    });
  }

  const labels: TextLabel[] = [];
  for (const item of Array.isArray(raw.labels) ? raw.labels : []) {
    if (!isObj(item)) continue;
    labels.push({
      id: uniqueId('t', item.id),
      x: num(item.x, 0),
      y: num(item.y, 0),
      text: str(item.text),
      fontSize: num(item.fontSize, 16),
      italic: bool(item.italic, true),
      ...(typeof item.color === 'string' ? { color: item.color } : {}),
    });
  }

  const grid = [10, 20, 40].includes(num(raw.grid, 20)) ? num(raw.grid, 20) : 20;

  return {
    ok: true,
    warnings,
    doc: {
      version: SCHEMA_VERSION,
      title: str(raw.title, 'Схема без названия') || 'Схема без названия',
      grid,
      elements,
      wires,
      labels,
    },
  };
}

export function serializeSchema(doc: SchemaFile): string {
  return JSON.stringify(doc, null, 2);
}

export function safeFileName(title: string): string {
  const clean = title.trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
  return clean || 'schema';
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename: string, text: string, mime: string): void {
  downloadBlob(filename, new Blob([text], { type: `${mime};charset=utf-8` }));
}
