import type { FC } from 'react';
import type { Element, ElementType, Point, Rect } from '../types/schema';

export type SymbolCategory = 'passive' | 'sources' | 'meters' | 'switching' | 'annotations';

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

export const CATEGORY_TITLES: Record<SymbolCategory, string> = {
  passive: 'Пассивные',
  sources: 'Источники',
  meters: 'Измерительные',
  switching: 'Коммутация',
  annotations: 'Аннотации',
};
