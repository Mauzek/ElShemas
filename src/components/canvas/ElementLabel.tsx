import { memo } from 'react';
import type { Element } from '../../types/schema';
import { elementBBox } from '../../lib/geometry';
import { parseDesignator } from '../../lib/designator';
import { getSymbol } from '../../symbols/registry';

interface Props {
  element: Element;
  selected: boolean;
}

/** Подпись элемента: обозначение с индексом и значение с единицей. */
export const ElementLabel = memo(function ElementLabel({ element, selected }: Props) {
  const label = element.label.trim();
  const valueText = element.showValue
    ? [element.value.trim(), element.unit.trim()].filter(Boolean).join(' ')
    : '';
  if (!label && !valueText) return null;

  const off = element.labelOffset ?? { x: 0, y: 0 };
  const { base, sub } = parseDesignator(label);
  const diagonal = element.rotation % 90 !== 0;

  let anchor: 'middle' | 'end' = 'middle';
  let lx: number;
  let ly: number;
  let vx: number;
  let vy: number;

  if (diagonal) {
    // У диагональных элементов подпись ставится по нормали к оси символа,
    // иначе габаритный прямоугольник уводит её слишком далеко.
    const rad = (element.rotation * Math.PI) / 180;
    const nx = Math.sin(rad);
    const ny = -Math.cos(rad);
    const d = getSymbol(element.type).bbox.h / 2 + 16;
    lx = element.x + nx * d + off.x;
    ly = element.y + ny * d + 5 + off.y;
    vx = element.x - nx * d + off.x;
    vy = element.y - ny * d + 5 + off.y;
  } else {
    const box = elementBBox(element);
    const vertical = box.h > box.w;
    anchor = vertical ? 'end' : 'middle';
    lx = (vertical ? box.x - 10 : box.x + box.w / 2) + off.x;
    ly = (vertical ? box.y + box.h / 2 - 2 : box.y - 8) + off.y;
    vx = lx;
    vy = vertical ? ly + 17 : box.y + box.h + 17 + off.y;
  }

  return (
    <g
      data-kind="element"
      data-id={element.id}
      data-role="label"
      className={selected ? 'sch is-selected' : 'sch'}
      style={{ ...(element.color && !selected ? { color: element.color } : {}), cursor: 'move' }}
    >
      {label && (
        <text className="sch-text sch-label" x={lx} y={ly} textAnchor={anchor}>
          <tspan>{base}</tspan>
          {sub && (
            <tspan dy={4} fontSize="0.72em">
              {sub}
            </tspan>
          )}
        </text>
      )}
      {valueText && (
        <text className="sch-text sch-value" x={vx} y={vy} textAnchor={anchor}>
          {valueText}
        </text>
      )}
    </g>
  );
});
