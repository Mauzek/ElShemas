import type { Point, SchemaFile } from '../types/schema';
import { analyze, type Connectivity } from './nodes';

export type IssueKind = 'dangling' | 'duplicate' | 'fragment';

export interface Issue {
  kind: IssueKind;
  message: string;
  /** Точки на схеме, к которым относится замечание. */
  points: Point[];
  elementIds: string[];
}

export function checkSchema(doc: SchemaFile, conn?: Connectivity): Issue[] {
  const c = conn ?? analyze(doc);
  const issues: Issue[] = [];

  for (const port of c.dangling) {
    const el = doc.elements.find((e) => e.id === port.elementId);
    issues.push({
      kind: 'dangling',
      message: `Висящий вывод: ${el?.label || el?.type || 'элемент'} (вывод ${port.portIndex + 1})`,
      points: [port.point],
      elementIds: [port.elementId],
    });
  }

  const byLabel = new Map<string, string[]>();
  for (const el of doc.elements) {
    const label = el.label.trim();
    if (!label) continue;
    const list = byLabel.get(label);
    if (list) list.push(el.id);
    else byLabel.set(label, [el.id]);
  }
  for (const [label, ids] of byLabel) {
    if (ids.length < 2) continue;
    issues.push({
      kind: 'duplicate',
      message: `Обозначение «${label}» повторяется ${ids.length} раз`,
      points: ids
        .map((id) => doc.elements.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => Boolean(e))
        .map((e) => ({ x: e.x, y: e.y })),
      elementIds: ids,
    });
  }

  if (c.fragments > 1) {
    issues.push({
      kind: 'fragment',
      message: `Схема состоит из ${c.fragments} несвязанных фрагментов`,
      points: [],
      elementIds: [],
    });
  }

  return issues;
}
