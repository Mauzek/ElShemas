/**
 * Модифицированный метод узловых потенциалов.
 *
 * Неизвестные: потенциалы узлов (кроме опорных) и токи ветвей с нулевым
 * сопротивлением — идеальных источников ЭДС, перемычек, замкнутых ключей
 * и амперметров. Такая формулировка обрабатывает идеальные источники
 * напряжения без преобразований к источникам тока.
 */

import { REAL, solveLinear, zeroMatrix, zeroVector } from './linalg';
import { PotentialDsu, SimpleDsu } from './dsu';
import type { CircuitBranch, CircuitGraph, Problem } from './types';

export interface MnaSolution {
  /** Потенциалы узлов, В. Опорные узлы имеют потенциал 0. */
  potentials: Map<string, number>;
  /** Ток через ветвь с нулевым сопротивлением: от вывода 0 к выводу 1. */
  branchCurrents: Map<string, number>;
  /** По одному опорному узлу на каждый связный фрагмент. */
  references: string[];
  /** Ветви, ток которых определён неоднозначно (параллельные перемычки). */
  indeterminate: string[];
}

export type MnaOutcome = { ok: true; solution: MnaSolution } | { ok: false; problems: Problem[] };

/** Ветви с собственной переменной тока: сопротивление у них нулевое. */
const isIdeal = (b: CircuitBranch) => b.spec.kind === 'vsource' || b.spec.kind === 'short';
/** Ветви, проводящие ток. Разрыв (вольтметр, разомкнутый ключ, конденсатор) не проводит. */
const isConducting = (b: CircuitBranch) => isIdeal(b) || b.spec.kind === 'resistor';

export function solveMna(graph: CircuitGraph): MnaOutcome {
  const conducting = graph.branches.filter(isConducting);
  const sources = graph.branches.filter((b) => b.spec.kind === 'isource');
  const problems: Problem[] = [];

  // 1. Связные фрагменты по проводящим ветвям.
  const components = new SimpleDsu();
  for (const b of conducting) components.union(b.a, b.b);

  const nodes = new Set<string>();
  for (const b of conducting) {
    nodes.add(b.a);
    nodes.add(b.b);
  }

  // Источник тока, включённый в разрыв, оставляет ток без пути возврата.
  for (const b of sources) {
    if (!nodes.has(b.a) || !nodes.has(b.b) || components.find(b.a) !== components.find(b.b)) {
      problems.push({
        kind: 'singular',
        severity: 'error',
        message: `${b.label}: источник тока включён в разрыв — току некуда течь`,
        elementIds: [b.elementId],
        points: [b.pa, b.pb],
      });
    }
  }
  if (problems.length > 0) return { ok: false, problems };

  if (nodes.size === 0) {
    return { ok: true, solution: { potentials: new Map(), branchCurrents: new Map(), references: [], indeterminate: [] } };
  }

  // 2. Опорный узел каждого фрагмента: назначенный вручную, затем «земля»,
  //    затем узел с наибольшим числом ветвей.
  const degree = new Map<string, number>();
  for (const b of conducting) {
    degree.set(b.a, (degree.get(b.a) ?? 0) + 1);
    degree.set(b.b, (degree.get(b.b) ?? 0) + 1);
  }
  const rankOf = (node: string) =>
    node === graph.pinnedNode ? 1e9 : graph.groundNodes.has(node) ? 1e6 : (degree.get(node) ?? 0);
  const references = new Map<string, string>();
  for (const node of nodes) {
    const root = components.find(node);
    const current = references.get(root);
    if (!current || rankOf(node) > rankOf(current)) references.set(root, node);
  }
  const referenceSet = new Set(references.values());

  // 3. Контуры из идеальных источников и перемычек.
  const potentials = new PotentialDsu();
  const redundant = new Set<string>();
  const indeterminate: string[] = [];
  for (const b of graph.branches) {
    if (!isIdeal(b)) continue;
    const check = potentials.union(b.a, b.b, b.value);
    if (check === 'joined') continue;
    if (check === 'conflict') {
      problems.push({
        kind: 'singular',
        severity: 'error',
        message: `${b.label}: контур из идеальных источников ЭДС и перемычек — сумма ЭДС в контуре не равна нулю`,
        elementIds: [b.elementId],
        points: [b.pa, b.pb],
      });
      continue;
    }
    // Контур непротиворечив: потенциалы определены, а ток делится произвольно.
    redundant.add(b.elementId);
    indeterminate.push(b.elementId);
  }
  if (problems.length > 0) return { ok: false, problems };

  // 4. Нумерация неизвестных.
  const nodeIndex = new Map<string, number>();
  let size = 0;
  for (const node of nodes) if (!referenceSet.has(node)) nodeIndex.set(node, size++);
  const branchIndex = new Map<string, number>();
  for (const b of graph.branches) if (isIdeal(b)) branchIndex.set(b.elementId, size++);

  const A = zeroMatrix(REAL, size, size);
  const z = zeroVector(REAL, size);

  const addNode = (row: number | undefined, col: number | undefined, value: number) => {
    if (row === undefined || col === undefined) return;
    A[row][col] += value;
  };

  // 5. Уравнения первого закона Кирхгофа.
  for (const b of graph.branches) {
    const ia = nodeIndex.get(b.a);
    const ib = nodeIndex.get(b.b);
    if (b.spec.kind === 'resistor') {
      const g = 1 / b.value;
      addNode(ia, ia, g);
      addNode(ia, ib, -g);
      addNode(ib, ib, g);
      addNode(ib, ia, -g);
    } else if (isIdeal(b)) {
      const k = branchIndex.get(b.elementId) as number;
      addNode(ia, k, 1);
      addNode(ib, k, -1);
    } else if (b.spec.kind === 'isource') {
      if (ia !== undefined) z[ia] -= b.value;
      if (ib !== undefined) z[ib] += b.value;
    }
  }

  // 6. Уравнения ветвей с нулевым сопротивлением.
  for (const b of graph.branches) {
    if (!isIdeal(b)) continue;
    const k = branchIndex.get(b.elementId) as number;
    if (redundant.has(b.elementId)) {
      // Ток в замкнутом контуре перемычек делится произвольно:
      // берём частное решение, при котором эта ветвь тока не несёт.
      A[k][k] = 1;
      z[k] = 0;
      continue;
    }
    const ia = nodeIndex.get(b.a);
    const ib = nodeIndex.get(b.b);
    addNode(k, ib, 1);
    addNode(k, ia, -1);
    z[k] = b.value;
  }

  const outcome = solveLinear(REAL, A, z);
  if (!outcome.ok) {
    return {
      ok: false,
      problems: [
        {
          kind: 'singular',
          severity: 'error',
          message:
            'Система уравнений вырождена: схема не имеет однозначного решения. ' +
            'Проверьте контуры из идеальных источников ЭДС и узлы, соединённые только источниками тока.',
          elementIds: [],
          points: [],
        },
      ],
    };
  }

  const nodePotentials = new Map<string, number>();
  for (const node of referenceSet) nodePotentials.set(node, 0);
  for (const [node, index] of nodeIndex) nodePotentials.set(node, outcome.x[index]);

  const branchCurrents = new Map<string, number>();
  for (const [elementId, index] of branchIndex) branchCurrents.set(elementId, outcome.x[index]);

  return {
    ok: true,
    solution: {
      potentials: nodePotentials,
      branchCurrents,
      references: [...referenceSet],
      indeterminate,
    },
  };
}
