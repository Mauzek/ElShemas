import type { SymbolDef } from '../types';
import { Ammeter, Voltmeter, Wattmeter } from '../shapes/meters';
import { def, twoPort, wideBox } from './common';

/** Измерительные приборы. */
export const METERS_SYMBOLS: SymbolDef[] = [
  def({
    type: 'ammeter',
    title: 'Амперметр',
    category: 'meters',
    keywords: 'A ток измерение',
    ports: twoPort,
    bbox: wideBox,
    prefix: 'PA',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: false,
    Shape: Ammeter,
  }),
  def({
    type: 'voltmeter',
    title: 'Вольтметр',
    category: 'meters',
    keywords: 'V напряжение измерение',
    ports: twoPort,
    bbox: wideBox,
    prefix: 'PV',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: false,
    Shape: Voltmeter,
  }),
  def({
    type: 'wattmeter',
    title: 'Ваттметр',
    category: 'meters',
    keywords: 'W мощность измерение',
    ports: twoPort,
    bbox: wideBox,
    prefix: 'PW',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: false,
    Shape: Wattmeter,
  }),
];
