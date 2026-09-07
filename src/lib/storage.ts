import type { SchemaFile } from '../types/schema';
import { parseSchema } from './fileIO';

const INDEX_KEY = 'elshemas.index';
const DOC_PREFIX = 'elshemas.doc.';
const CURRENT_KEY = 'elshemas.current';

export interface StoredMeta {
  id: string;
  title: string;
  updatedAt: number;
  elements: number;
  wires: number;
}

function readIndex(): StoredMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredMeta[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(list: StoredMeta[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  } catch {
    /* хранилище недоступно */
  }
}

export function listSchemas(): StoredMeta[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveSchema(id: string, doc: SchemaFile): void {
  try {
    localStorage.setItem(DOC_PREFIX + id, JSON.stringify(doc));
  } catch {
    return;
  }
  const list = readIndex().filter((m) => m.id !== id);
  list.push({
    id,
    title: doc.title,
    updatedAt: Date.now(),
    elements: doc.elements.length,
    wires: doc.wires.length,
  });
  writeIndex(list);
}

export function loadSchema(id: string): SchemaFile | null {
  try {
    const raw = localStorage.getItem(DOC_PREFIX + id);
    if (!raw) return null;
    const result = parseSchema(raw);
    return result.ok ? result.doc : null;
  } catch {
    return null;
  }
}

export function deleteSchema(id: string): void {
  try {
    localStorage.removeItem(DOC_PREFIX + id);
  } catch {
    /* игнорируем */
  }
  writeIndex(readIndex().filter((m) => m.id !== id));
}

export function renameSchema(id: string, title: string): void {
  const doc = loadSchema(id);
  if (doc) saveSchema(id, { ...doc, title });
  else writeIndex(readIndex().map((m) => (m.id === id ? { ...m, title } : m)));
}

export function getCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

export function setCurrentId(id: string): void {
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch {
    /* игнорируем */
  }
}
