/**
 * Расчёт цепи постоянного тока: от схемы до токов, напряжений и баланса мощностей.
 * Ядро не зависит от React и покрыто тестами (`tests/solver.test.ts`).
 */

import type { SchemaFile } from '../../types/schema';
import type { Connectivity } from '../nodes';
import { resolveVariables } from '../variables';
import { buildGraph } from './graph';
import { solveMna } from './mna';
import { emptyResult, type BranchResult, type DcResult, type PowerBalance, type Problem } from './types';

export function solveDc(doc: SchemaFile, conn?: Connectivity): DcResult {
  const problems: Problem[] = [];

  const vars = resolveVariables(doc.variables ?? {});
  for (const [name, error] of Object.entries(vars.errors)) {
    problems.push({
      kind: 'value',
      severity: 'error',
      message: `Переменная «${name}»: ${error}`,
      elementIds: [],
      points: [],
    });
  }

  const graph = buildGraph(doc, vars.values, conn);
  problems.push(...graph.problems);

  if (graph.branches.length === 0) {
    const result = emptyResult(problems);
    result.ok = problems.every((p) => p.severity !== 'error');
    return result;
  }

  const outcome = solveMna(graph);
  if (!outcome.ok) {
    const result = emptyResult([...problems, ...outcome.problems]);
    result.nodePoints = graph.nodePoints;
    return result;
  }

  const { potentials, branchCurrents, references, indeterminate } = outcome.solution;
  const branches: BranchResult[] = [];

  for (const b of graph.branches) {
    const va = potentials.get(b.a);
    const vb = potentials.get(b.b);
    const voltage = va === undefined || vb === undefined ? Number.NaN : va - vb;

    let current: number;
    let resistance: number | null;
    switch (b.spec.kind) {
      case 'resistor':
        current = Number.isNaN(voltage) ? Number.NaN : voltage / b.value;
        resistance = b.value;
        break;
      case 'isource':
        current = b.value;
        resistance = null;
        break;
      case 'vsource':
      case 'short':
        current = branchCurrents.get(b.elementId) ?? Number.NaN;
        resistance = b.spec.kind === 'short' ? 0 : null;
        break;
      default:
        current = 0;
        resistance = null;
        break;
    }

    branches.push({
      elementId: b.elementId,
      label: b.label,
      type: b.type,
      current,
      voltage,
      power: voltage * current,
      resistance,
      pa: b.pa,
      pb: b.pb,
      a: b.a,
      b: b.b,
    });
  }

  if (indeterminate.length > 0) {
    problems.push({
      kind: 'info',
      severity: 'warning',
      message: 'Параллельные перемычки: ток между ними делится неоднозначно, показан один из вариантов',
      elementIds: indeterminate,
      points: [],
    });
  }

  if (references.length > 1) {
    problems.push({
      kind: 'floating',
      severity: 'info',
      message: `Схема состоит из ${references.length} несвязанных фрагментов — расчёт выполнен по фрагментам`,
      elementIds: [],
      points: [],
    });
  }

  return {
    ok: problems.every((p) => p.severity !== 'error'),
    branches,
    potentials,
    nodePoints: graph.nodePoints,
    references,
    balance: powerBalance(branches),
    problems,
    nodeCount: potentials.size,
    branchCount: branches.length,
  };
}

/** Баланс мощностей: источники отдают, приёмники потребляют, невязка должна быть нулевой. */
export function powerBalance(branches: BranchResult[]): PowerBalance {
  let generated = 0;
  let consumed = 0;
  for (const b of branches) {
    if (!Number.isFinite(b.power)) continue;
    if (b.power < 0) generated -= b.power;
    else consumed += b.power;
  }
  const scale = Math.max(generated, consumed);
  // Невязка порядка машинной точности — это ноль, а не «−5,6·10⁻⁵ пВт».
  const raw = generated - consumed;
  const mismatch = Math.abs(raw) <= scale * 1e-9 ? 0 : raw;
  return { generated, consumed, mismatch, relative: scale > 0 ? (mismatch / scale) * 100 : 0 };
}
