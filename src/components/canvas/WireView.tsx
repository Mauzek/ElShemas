import { memo } from 'react';
import type { Point, Wire } from '../../types/schema';
import type { Hop } from '../../lib/crossings';

interface Props {
  wire: Wire;
  selected: boolean;
  hops: Hop[];
}

const HOP_R = 5;

export function wirePath(points: Point[], hops: Hop[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const own = hops.filter((h) => h.segment === i);
    if (own.length > 0) {
      const dir = b.x > a.x ? 1 : -1;
      const sorted = own
        .map((h) => h.at)
        .filter((x) => Math.abs(x - a.x) > HOP_R && Math.abs(x - b.x) > HOP_R)
        .sort((p, q) => (dir > 0 ? p - q : q - p));
      for (const x of sorted) {
        d += ` L ${x - HOP_R * dir} ${a.y}`;
        d += ` A ${HOP_R} ${HOP_R} 0 0 ${dir > 0 ? 1 : 0} ${x + HOP_R * dir} ${a.y}`;
      }
    }
    d += ` L ${b.x} ${b.y}`;
  }
  return d;
}

export const WireView = memo(function WireView({ wire, selected, hops }: Props) {
  const d = wirePath(wire.points, hops);
  return (
    <g
      data-kind="wire"
      data-id={wire.id}
      className={selected ? 'sch is-selected' : 'sch'}
      style={wire.color && !selected ? { color: wire.color } : undefined}
    >
      <path className="no-hit" d={d} fill="none" />
      {wire.points.slice(0, -1).map((p, i) => (
        <line
          key={i}
          className="hit"
          data-seg={i}
          x1={p.x}
          y1={p.y}
          x2={wire.points[i + 1].x}
          y2={wire.points[i + 1].y}
          strokeWidth={12}
        />
      ))}
    </g>
  );
});
