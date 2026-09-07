import { memo } from 'react';
import type { Point, Stroke } from '../../types/schema';

interface Props {
  stroke: Stroke;
  selected: boolean;
}

/** Сглаженная кривая по точкам: середины отрезков соединяются квадратичными сегментами. */
export function strokePath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.01 0`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Штрих карандаша поверх схемы. */
export const StrokeView = memo(function StrokeView({ stroke, selected }: Props) {
  const d = strokePath(stroke.points);
  return (
    <g data-kind="stroke" data-id={stroke.id} className={selected ? 'sch is-selected' : 'sch'}>
      <path
        className="no-hit"
        d={d}
        fill="none"
        stroke={selected ? undefined : stroke.color}
        strokeWidth={stroke.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="hit" d={d} fill="none" strokeWidth={Math.max(14, stroke.width + 8)} />
    </g>
  );
});
