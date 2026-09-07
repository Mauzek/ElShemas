import { memo } from 'react';
import type { Viewport } from '../../store/useUi';

interface Props {
  grid: number;
  viewport: Viewport;
  width: number;
  height: number;
}

/** Точечная сетка. В экспорт не попадает: слой лежит вне #schema-layer. */
export const Grid = memo(function Grid({ grid, viewport, width, height }: Props) {
  const step = grid * viewport.zoom;
  const factor = step < 8 ? Math.ceil(8 / step) : 1;
  const size = step * factor;
  const offsetX = ((viewport.x % size) + size) % size;
  const offsetY = ((viewport.y % size) + size) % size;
  const r = size >= 26 ? 1.3 : 1;
  return (
    <g className="no-hit" aria-hidden="true">
      <defs>
        <pattern
          id="grid-dots"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <circle cx={0} cy={0} r={r} fill="var(--grid-dot)" />
          <circle cx={size} cy={0} r={r} fill="var(--grid-dot)" />
          <circle cx={0} cy={size} r={r} fill="var(--grid-dot)" />
          <circle cx={size} cy={size} r={r} fill="var(--grid-dot)" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill="url(#grid-dots)" />
    </g>
  );
});
