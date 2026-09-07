import type { ElementType } from '../types/schema';
import type { SymbolCategory, SymbolDef } from './types';
import { PASSIVE_SYMBOLS } from './defs/passive';
import { SOURCES_SYMBOLS } from './defs/sources';
import { METERS_SYMBOLS } from './defs/meters';
import { SWITCHING_SYMBOLS } from './defs/switching';
import { SEMICONDUCTORS_SYMBOLS } from './defs/semiconductors';
import { LOGIC_SYMBOLS } from './defs/logic';
import { BLOCKS_SYMBOLS } from './defs/blocks';
import { ANNOTATIONS_SYMBOLS } from './defs/annotations';

/** Полная библиотека УГО в порядке отображения в палитре. */
export const SYMBOLS: SymbolDef[] = [
  ...PASSIVE_SYMBOLS,
  ...SOURCES_SYMBOLS,
  ...METERS_SYMBOLS,
  ...SWITCHING_SYMBOLS,
  ...SEMICONDUCTORS_SYMBOLS,
  ...LOGIC_SYMBOLS,
  ...BLOCKS_SYMBOLS,
  ...ANNOTATIONS_SYMBOLS,
];

const BY_TYPE = new Map<ElementType, SymbolDef>(SYMBOLS.map((s) => [s.type, s]));

export function getSymbol(type: ElementType): SymbolDef {
  return BY_TYPE.get(type) ?? SYMBOLS[0];
}

export function hasSymbol(type: string): type is ElementType {
  return BY_TYPE.has(type as ElementType);
}

export const CATEGORY_ORDER: SymbolCategory[] = [
  'passive',
  'sources',
  'meters',
  'switching',
  'semiconductors',
  'logic',
  'blocks',
  'annotations',
];
