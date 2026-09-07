import type { SchemaFile } from '../types/schema';
import { parseDesignator } from './designator';

/** Следующее свободное обозначение для префикса: R1, R2, … отдельно для E, J, C, L. */
export function nextLabel(doc: SchemaFile, prefix: string): string {
  if (!prefix) return '';
  let max = 0;
  for (const el of doc.elements) {
    const { base, sub } = parseDesignator(el.label);
    if (base.replace(/[′″]/g, '') !== prefix) continue;
    const n = Number.parseInt(sub.replace(/\D/g, ''), 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}${max + 1}`;
}
