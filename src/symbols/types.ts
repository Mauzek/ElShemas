import type { FC } from 'react';
import type { Element, ElementType, Point, Rect } from '../types/schema';

export type SymbolCategory =
  | 'passive'
  | 'sources'
  | 'meters'
  | 'switching'
  | 'semiconductors'
  | 'logic'
  | 'blocks'
  | 'annotations';

export interface ShapeProps {
  element: Element;
}

export interface SymbolDef {
  type: ElementType;
  /** Название в палитре. */
  title: string;
  category: SymbolCategory;
  /** Дополнительные слова для поиска. */
  keywords: string;
  /** Точки подключения в локальных координатах. */
  ports: Point[];
  /** Габарит фигуры в локальных координатах (без подписи). */
  bbox: Rect;
  /** Буквенный префикс для автонумерации; пустая строка — элемент без обозначения. */
  prefix: string;
  defaultValue: string;
  defaultUnit: string;
  showValue: boolean;
  hasPolarity: boolean;
  Shape: FC<ShapeProps>;
}

/** Цвет категории: помогает различать разделы палитры с одного взгляда. */
export const CATEGORY_COLORS: Record<SymbolCategory, string> = {
  passive: '#3b82f6',
  sources: '#ef4444',
  meters: '#10b981',
  switching: '#f59e0b',
  semiconductors: '#8b5cf6',
  logic: '#06b6d4',
  blocks: '#ec4899',
  annotations: '#64748b',
};

export const CATEGORY_TITLES: Record<SymbolCategory, string> = {
  passive: 'Пассивные',
  sources: 'Источники',
  meters: 'Измерительные',
  switching: 'Коммутация',
  semiconductors: 'Полупроводники',
  logic: 'Логические',
  blocks: 'Блоки',
  annotations: 'Аннотации',
};
