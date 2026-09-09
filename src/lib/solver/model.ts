/**
 * Электрическая модель элемента для расчёта цепи постоянного тока.
 * Здесь собрано всё, что «знает физику»: чем является символ на схеме
 * с точки зрения уравнений цепи.
 */

import type { ElementType } from '../../types/schema';

export type DeviceKind =
  /** Сопротивление. */
  | 'resistor'
  /** Идеальный источник ЭДС. */
  | 'vsource'
  /** Идеальный источник тока. */
  | 'isource'
  /** Идеальная перемычка: R = 0. */
  | 'short'
  /** Разрыв: ток равен нулю, напряжение измеримо. */
  | 'open'
  /** Только узел схемы, ветвью не является. */
  | 'node'
  /** В расчёте не участвует (аннотации). */
  | 'ignored'
  /** Элемент нелинейный или многополюсный — расчёт его не поддерживает. */
  | 'unsupported';

export type Quantity = 'resistance' | 'voltage' | 'current' | 'inductance' | 'capacitance';

export interface DeviceSpec {
  kind: DeviceKind;
  /** Что означает значение элемента. */
  quantity?: Quantity;
  /**
   * Знак относительно направления «вывод 0 → вывод 1».
   * Для ЭДС: +1, если стрелка указывает от вывода 0 к выводу 1 (правый вывод «+»).
   */
  sign?: 1 | -1;
  /** Прибор: какую величину показывает. */
  meter?: 'current' | 'voltage' | 'power';
  /** Пояснение, почему элемент исключён из расчёта. */
  note?: string;
}

const RESISTOR: DeviceSpec = { kind: 'resistor', quantity: 'resistance' };

/**
 * Модель элемента в цепи постоянного тока.
 * Конденсатор — разрыв, катушка — перемычка: установившийся режим.
 */
export function dcDevice(type: ElementType): DeviceSpec {
  switch (type) {
    case 'resistor':
    case 'resistorVar':
    case 'resistorTrim':
    case 'resistorNonlinear':
      return RESISTOR;

    case 'capacitor':
    case 'capacitorPol':
      return { kind: 'open', quantity: 'capacitance' };

    case 'inductor':
      return { kind: 'short', quantity: 'inductance' };

    // Стрелка ЭДС направлена к выводу «+»: при прямой полярности это правый вывод.
    case 'sourceEmf':
      return { kind: 'vsource', quantity: 'voltage', sign: 1 };
    // У источника напряжения и гальванического элемента «+» слева.
    case 'sourceVoltage':
    case 'battery':
      return { kind: 'vsource', quantity: 'voltage', sign: -1 };

    case 'sourceCurrent':
      return { kind: 'isource', quantity: 'current', sign: 1 };

    case 'sourceAc':
    case 'sourceThreePhase':
      return {
        kind: 'unsupported',
        note: 'источник переменного тока не участвует в расчёте цепи постоянного тока',
      };

    case 'fuse':
    case 'switchClosed':
      return { kind: 'short' };
    case 'switchOpen':
      return { kind: 'open' };

    case 'ammeter':
      return { kind: 'short', meter: 'current' };
    case 'voltmeter':
      return { kind: 'open', meter: 'voltage' };
    case 'wattmeter':
      return { kind: 'short', meter: 'power' };

    case 'ground':
    case 'junction':
    case 'terminal':
      return { kind: 'node' };

    case 'currentArrow':
    case 'voltageArrow':
    case 'loopArrow':
    case 'vector':
    case 'axes':
      return { kind: 'ignored' };

    case 'diode':
    case 'zener':
    case 'led':
      return { kind: 'unsupported', note: 'нелинейный элемент' };

    case 'thyristor':
    case 'transistorNpn':
    case 'transistorPnp':
    case 'transistorFet':
    case 'opamp':
    case 'transformer':
    case 'quadripole':
    case 'mutualInductance':
    case 'logicAnd':
    case 'logicOr':
    case 'logicNot':
    case 'logicNand':
    case 'logicNor':
    case 'logicXor':
      return { kind: 'unsupported', note: 'многополюсный или активный элемент' };

    default:
      return { kind: 'unsupported', note: 'нет модели для расчёта' };
  }
}

/** Единица измерения значения элемента в СИ. */
export function quantityUnit(quantity: Quantity | undefined): string {
  switch (quantity) {
    case 'resistance':
      return 'Ом';
    case 'voltage':
      return 'В';
    case 'current':
      return 'А';
    case 'inductance':
      return 'Гн';
    case 'capacitance':
      return 'Ф';
    default:
      return '';
  }
}
