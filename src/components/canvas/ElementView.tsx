import { memo } from 'react';
import type { Element } from '../../types/schema';
import { getSymbol } from '../../symbols/registry';

interface Props {
  element: Element;
  selected: boolean;
}

export function elementTransform(el: Pick<Element, 'x' | 'y' | 'rotation' | 'mirrored'>): string {
  return `translate(${el.x} ${el.y}) rotate(${el.rotation}) scale(${el.mirrored ? -1 : 1} 1)`;
}

/** Один элемент схемы. Мемоизирован: перетаскивание соседей его не перерисовывает. */
export const ElementView = memo(function ElementView({ element, selected }: Props) {
  const def = getSymbol(element.type);
  const b = def.bbox;
  return (
    <g
      data-kind="element"
      data-id={element.id}
      className={selected ? 'sch is-selected' : 'sch'}
      style={element.color && !selected ? { color: element.color } : undefined}
      transform={elementTransform(element)}
    >
      <g className="no-hit">
        <def.Shape element={element} />
      </g>
      <rect className="hit" x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 8} />
    </g>
  );
});
