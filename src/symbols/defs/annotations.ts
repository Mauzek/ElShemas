import type { SymbolDef } from '../types';
import { CurrentArrow, LoopArrow, VoltageArrow } from '../shapes/misc';
import { def } from './common';

/** Аннотации для расчётных схем. */
export const ANNOTATIONS_SYMBOLS: SymbolDef[] = [
  def({
    type: 'currentArrow',
    title: 'Стрелка тока',
    category: 'annotations',
    keywords: 'I направление ток стрелка',
    ports: [],
    bbox: { x: -24, y: -8, w: 48, h: 16 },
    prefix: 'I',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: true,
    Shape: CurrentArrow,
  }),
  def({
    type: 'voltageArrow',
    title: 'Стрелка напряжения',
    category: 'annotations',
    keywords: 'U напряжение стрелка',
    ports: [],
    bbox: { x: -30, y: -10, w: 60, h: 20 },
    prefix: 'U',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: true,
    Shape: VoltageArrow,
  }),
  def({
    type: 'loopArrow',
    title: 'Обход контура',
    category: 'annotations',
    keywords: 'контур обход направление',
    ports: [],
    bbox: { x: -24, y: -24, w: 48, h: 48 },
    prefix: '',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: true,
    Shape: LoopArrow,
  }),
];
