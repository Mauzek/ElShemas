import { memo } from 'react';
import type { Point } from '../../types/schema';

/** Автоматические точки соединения на Т-образных стыках. */
export const Junctions = memo(function Junctions({ points }: { points: Point[] }) {
  if (points.length === 0) return null;
  return (
    <g className="sch no-hit" data-role="junctions">
      {points.map((p) => (
        <circle key={`${p.x}:${p.y}`} className="sch-ink" cx={p.x} cy={p.y} r={3} />
      ))}
    </g>
  );
});
