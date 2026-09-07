import { memo } from 'react';
import type { TextLabel } from '../../types/schema';
import { parseDesignator } from '../../lib/designator';

interface Props {
  label: TextLabel;
  selected: boolean;
}

/** Свободная подпись: буквенные обозначения узлов a, b, c, d, m, n и любой текст. */
export const FreeLabelView = memo(function FreeLabelView({ label, selected }: Props) {
  const { base, sub } = parseDesignator(label.text);
  return (
    <g
      data-kind="label"
      data-id={label.id}
      className={selected ? 'sch is-selected' : 'sch'}
      style={label.color && !selected ? { color: label.color } : undefined}
    >
      <text
        className="sch-text sch-free"
        x={label.x}
        y={label.y}
        fontSize={label.fontSize}
        fontStyle={label.italic ? 'italic' : 'normal'}
      >
        <tspan>{base}</tspan>
        {sub && (
          <tspan dy={label.fontSize * 0.25} fontSize="0.72em">
            {sub}
          </tspan>
        )}
      </text>
    </g>
  );
});
