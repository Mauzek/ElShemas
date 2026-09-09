/** Модель данных схемы. Формат файла `.json` описан в README. */

export type ElementType =
  | 'resistor'
  | 'resistorVar'
  | 'resistorTrim'
  | 'resistorNonlinear'
  | 'fuse'
  | 'capacitor'
  | 'capacitorPol'
  | 'inductor'
  | 'mutualInductance'
  | 'sourceEmf'
  | 'sourceCurrent'
  | 'sourceVoltage'
  | 'battery'
  | 'sourceAc'
  | 'sourceThreePhase'
  | 'ground'
  | 'junction'
  | 'switchOpen'
  | 'switchClosed'
  | 'ammeter'
  | 'voltmeter'
  | 'wattmeter'
  | 'diode'
  | 'zener'
  | 'led'
  | 'thyristor'
  | 'transistorNpn'
  | 'transistorPnp'
  | 'transistorFet'
  | 'logicAnd'
  | 'logicOr'
  | 'logicNot'
  | 'logicNand'
  | 'logicNor'
  | 'logicXor'
  | 'opamp'
  | 'transformer'
  | 'quadripole'
  | 'terminal'
  | 'currentArrow'
  | 'voltageArrow'
  | 'loopArrow'
  | 'vector'
  | 'axes';

/**
 * Угол поворота, кратный 45°. Базовые значения 0/90/180/270 используются
 * для обычных схем; промежуточные нужны для схем-«ромбов», где ветви идут
 * по диагонали.
 */
export type Rotation = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export const ROTATIONS: Rotation[] = [0, 45, 90, 135, 180, 225, 270, 315];

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PortRef {
  elementId: string;
  portIndex: number;
}

export interface Element {
  id: string;
  type: ElementType;
  /** Координаты якоря, всегда кратны шагу сетки. */
  x: number;
  y: number;
  rotation: Rotation;
  mirrored: boolean;
  /** Обозначение: "R1", "E2", "J3", "R'4". */
  label: string;
  value: string;
  unit: string;
  showValue: boolean;
  /** Для источников и элементов с направлением. */
  polarity?: 'forward' | 'reverse';
  /** Ручной сдвиг подписи относительно автоматического места. */
  labelOffset?: Point;
  /** Индивидуальный цвет линий, иначе цвет темы. */
  color?: string;
}

export interface Wire {
  id: string;
  /** Ломаная. В ортогональном режиме — только вертикальные и горизонтальные сегменты. */
  points: Point[];
  from?: PortRef;
  to?: PortRef;
  color?: string;
}

/** Свободный штрих карандашом: пометки поверх схемы. */
export interface Stroke {
  id: string;
  points: Point[];
  width: number;
  color?: string;
}

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  italic: boolean;
  color?: string;
}

/** Режим и оформление расчёта. Хранится в документе: разные схемы считаются по-разному. */
export interface AnalysisSettings {
  /** Считать схему и показывать результаты. Хранится в документе, поэтому уезжает по ссылке. */
  enabled: boolean;
  mode: 'dc' | 'ac';
  /** Частота в герцах для режима переменного тока. */
  frequency: number;
  showCurrents: boolean;
  showVoltages: boolean;
  showPowers: boolean;
  showPotentials: boolean;
  /** Толщина провода пропорциональна току. */
  thickByCurrent: boolean;
  /** Показывать знак тока вместо разворота стрелки. */
  signedCurrents: boolean;
  /** Число значащих цифр в подписях результатов. */
  digits: number;
  /** Узел, принятый за опорный (φ = 0). Если не задан — выбирается автоматически. */
  reference?: Point;
}

export function defaultAnalysis(): AnalysisSettings {
  return {
    enabled: false,
    mode: 'dc',
    frequency: 50,
    showCurrents: true,
    showVoltages: false,
    showPowers: false,
    showPotentials: false,
    thickByCurrent: false,
    signedCurrents: false,
    digits: 4,
  };
}

export interface SchemaFile {
  version: 2;
  title: string;
  /** Шаг сетки в px. */
  grid: number;
  elements: Element[];
  wires: Wire[];
  labels: TextLabel[];
  /** Рисунок от руки. Поле необязательное: файлы без него открываются как обычно. */
  strokes: Stroke[];
  /** Настройки расчёта. Файлы версии 1 открываются со значениями по умолчанию. */
  analysis: AnalysisSettings;
  /** Переменные схемы: имя → выражение. Используются в значениях элементов. */
  variables: Record<string, string>;
}

export type SelectionKind = 'element' | 'wire' | 'label' | 'stroke';

export interface SelectionItem {
  kind: SelectionKind;
  id: string;
}

export const SCHEMA_VERSION = 2 as const;

/** Версии файлов, которые редактор умеет читать. */
export const SUPPORTED_VERSIONS = [1, 2];

export function emptySchema(title = 'Новая схема'): SchemaFile {
  return {
    version: SCHEMA_VERSION,
    title,
    grid: 20,
    elements: [],
    wires: [],
    labels: [],
    strokes: [],
    analysis: defaultAnalysis(),
    variables: {},
  };
}
