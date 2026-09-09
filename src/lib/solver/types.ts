import type { ElementType, Point } from '../../types/schema';
import type { DeviceSpec } from './model';

export type ProblemKind = 'value' | 'unsupported' | 'singular' | 'floating' | 'shortCircuit' | 'info';

/** Замечание расчёта: почему не посчиталось или на что обратить внимание. */
export interface Problem {
  kind: ProblemKind;
  severity: 'error' | 'warning' | 'info';
  message: string;
  elementIds: string[];
  points: Point[];
}

export interface CircuitBranch {
  elementId: string;
  type: ElementType;
  label: string;
  spec: DeviceSpec;
  /** Узел вывода 0 и узел вывода 1. Положительное направление тока — от a к b. */
  a: string;
  b: string;
  /** Значение в СИ: сопротивление, ЭДС или ток источника. */
  value: number;
  /** Точки выводов в мировых координатах. */
  pa: Point;
  pb: Point;
}

export interface CircuitGraph {
  branches: CircuitBranch[];
  /** Узел → представительная точка на схеме (для подписи потенциала). */
  nodePoints: Map<string, Point>;
  /** Узлы, отмеченные элементом «земля». */
  groundNodes: Set<string>;
  /** Узел, назначенный опорным вручную. */
  pinnedNode: string | null;
  problems: Problem[];
}

export interface BranchResult {
  elementId: string;
  label: string;
  type: ElementType;
  /** Ток от вывода 0 к выводу 1, А. */
  current: number;
  /** Напряжение: потенциал вывода 0 минус потенциал вывода 1, В. */
  voltage: number;
  /** Мощность, Вт. Положительная — потребляемая, отрицательная — отдаваемая. */
  power: number;
  /** Сопротивление ветви, Ом; null — у источников и перемычек. */
  resistance: number | null;
  pa: Point;
  pb: Point;
  a: string;
  b: string;
}

export interface PowerBalance {
  /** Мощность, отдаваемая источниками, Вт. */
  generated: number;
  /** Мощность, потребляемая приёмниками, Вт. */
  consumed: number;
  /** Невязка баланса, Вт. */
  mismatch: number;
  /** Относительная невязка, %. */
  relative: number;
}

export interface DcResult {
  ok: boolean;
  branches: BranchResult[];
  /** Потенциалы узлов, В. */
  potentials: Map<string, number>;
  nodePoints: Map<string, Point>;
  /** Опорные узлы (по одному на связный фрагмент). */
  references: string[];
  balance: PowerBalance;
  problems: Problem[];
  /** Число узлов и ветвей, попавших в расчёт. */
  nodeCount: number;
  branchCount: number;
}

export const EMPTY_BALANCE: PowerBalance = { generated: 0, consumed: 0, mismatch: 0, relative: 0 };

export function emptyResult(problems: Problem[] = []): DcResult {
  return {
    ok: false,
    branches: [],
    potentials: new Map(),
    nodePoints: new Map(),
    references: [],
    balance: EMPTY_BALANCE,
    problems,
    nodeCount: 0,
    branchCount: 0,
  };
}
