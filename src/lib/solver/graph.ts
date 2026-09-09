/**
 * Построение графа цепи из схемы: узлы, ветви, опорные точки.
 * Топология берётся из анализа связности (`lib/nodes.ts`).
 */

import type { Point, SchemaFile } from '../../types/schema';
import type { Vars } from '../expr';
import { elementPorts } from '../geometry';
import { analyze, type Connectivity } from '../nodes';
import { parseValue } from '../units';
import { dcDevice, quantityUnit } from './model';
import type { CircuitBranch, CircuitGraph, Problem } from './types';

/** Сопротивление, ниже которого ветвь считается перемычкой. */
const SHORT_OHM = 1e-9;

export function buildGraph(doc: SchemaFile, vars: Vars, conn?: Connectivity): CircuitGraph {
  const c = conn ?? analyze(doc);
  const branches: CircuitBranch[] = [];
  const nodePoints = new Map<string, Point>();
  const groundNodes = new Set<string>();
  const problems: Problem[] = [];
  const unsupported = new Map<string, string[]>();

  const rememberNode = (node: string, point: Point) => {
    if (!nodePoints.has(node)) nodePoints.set(node, point);
  };

  let pinnedNode: string | null = null;
  if (doc.analysis.reference) pinnedNode = c.nodeOf(doc.analysis.reference);

  for (const el of doc.elements) {
    const spec = dcDevice(el.type);
    if (spec.kind === 'ignored') continue;

    const ports = elementPorts(el);
    const name = el.label.trim() || 'элемент';

    if (spec.kind === 'node') {
      if (ports.length === 0) continue;
      const node = c.nodeOf(ports[0]);
      rememberNode(node, ports[0]);
      if (el.type === 'ground') groundNodes.add(node);
      continue;
    }

    if (spec.kind === 'unsupported' || ports.length !== 2) {
      const note = spec.note ?? 'многополюсный элемент';
      const list = unsupported.get(note) ?? [];
      list.push(el.id);
      unsupported.set(note, list);
      continue;
    }

    const a = c.nodeOf(ports[0]);
    const b = c.nodeOf(ports[1]);
    rememberNode(a, ports[0]);
    rememberNode(b, ports[1]);

    let value = 0;
    if (spec.kind === 'resistor' || spec.kind === 'vsource' || spec.kind === 'isource') {
      const parsed = parseValue(el.value, el.unit, vars);
      if (!parsed.ok) {
        problems.push({
          kind: 'value',
          severity: 'error',
          message: `${name}: ${parsed.error}`,
          elementIds: [el.id],
          points: [{ x: el.x, y: el.y }],
        });
        continue;
      }
      // Обратная полярность разворачивает стрелку источника, а с ней и знак.
      const dir = el.polarity === 'reverse' ? -1 : 1;
      value = parsed.si * (spec.sign ?? 1) * (spec.kind === 'resistor' ? 1 : dir);
    }

    if (spec.kind === 'resistor') {
      if (value < 0) {
        problems.push({
          kind: 'value',
          severity: 'error',
          message: `${name}: отрицательное сопротивление`,
          elementIds: [el.id],
          points: [{ x: el.x, y: el.y }],
        });
        continue;
      }
      if (value <= SHORT_OHM) {
        problems.push({
          kind: 'shortCircuit',
          severity: 'warning',
          message: `${name}: сопротивление равно нулю — ветвь считается перемычкой`,
          elementIds: [el.id],
          points: [{ x: el.x, y: el.y }],
        });
        branches.push({ elementId: el.id, type: el.type, label: name, spec: { kind: 'short' }, a, b, value: 0, pa: ports[0], pb: ports[1] });
        continue;
      }
    }

    if (a === b && (spec.kind === 'vsource' || spec.kind === 'isource')) {
      problems.push({
        kind: 'singular',
        severity: 'error',
        message: `${name}: выводы источника соединены между собой`,
        elementIds: [el.id],
        points: [{ x: el.x, y: el.y }],
      });
      continue;
    }

    branches.push({
      elementId: el.id,
      type: el.type,
      label: name,
      spec,
      a,
      b,
      value,
      pa: ports[0],
      pb: ports[1],
    });

    if (spec.quantity && !el.unit.trim() && el.value.trim()) {
      // Единица не указана — считаем в основной единице СИ, но предупреждаем.
      problems.push({
        kind: 'info',
        severity: 'info',
        message: `${name}: единица не указана, значение принято в ${quantityUnit(spec.quantity)}`,
        elementIds: [el.id],
        points: [{ x: el.x, y: el.y }],
      });
    }
  }

  for (const [note, ids] of unsupported) {
    problems.push({
      kind: 'unsupported',
      severity: 'warning',
      message: `В расчёте не участвует (${note}): ${ids.length} эл.`,
      elementIds: ids,
      points: [],
    });
  }

  return { branches, nodePoints, groundNodes, pinnedNode, problems };
}
