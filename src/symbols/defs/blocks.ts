import type { SymbolDef } from '../types';
import { Opamp, Transformer } from '../shapes/misc';
import { Quadripole } from '../shapes/blocks';
import { def } from './common';

/** Функциональные блоки: усилитель, трансформатор, четырёхполюсник. */
export const BLOCKS_SYMBOLS: SymbolDef[] = [
  def({
    type: 'opamp',
    title: 'Операционный усилитель',
    category: 'blocks',
    keywords: 'ОУ opamp усилитель DA',
    ports: [
      { x: -40, y: -20 },
      { x: -40, y: 20 },
      { x: 40, y: 0 },
    ],
    bbox: { x: -40, y: -34, w: 80, h: 68 },
    prefix: 'DA',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: false,
    Shape: Opamp,
  }),
  def({
    type: 'transformer',
    title: 'Трансформатор',
    category: 'blocks',
    keywords: 'transformer обмотки TV',
    ports: [
      { x: -40, y: -40 },
      { x: -40, y: 40 },
      { x: 40, y: -40 },
      { x: 40, y: 40 },
    ],
    bbox: { x: -40, y: -44, w: 80, h: 88 },
    prefix: 'TV',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: false,
    Shape: Transformer,
  }),
  def({
    type: 'quadripole',
    title: 'Четырёхполюсник',
    category: 'blocks',
    keywords: 'четырёхполюсник 1 1′ 2 2′ A-параметры',
    ports: [
      { x: -60, y: -20 },
      { x: -60, y: 20 },
      { x: 60, y: -20 },
      { x: 60, y: 20 },
    ],
    bbox: { x: -60, y: -40, w: 120, h: 80 },
    prefix: '',
    defaultValue: '',
    defaultUnit: '',
    showValue: false,
    hasPolarity: false,
    Shape: Quadripole,
  }),
];
