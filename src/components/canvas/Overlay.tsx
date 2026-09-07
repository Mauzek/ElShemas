import type { Element, Point, Rect } from '../../types/schema';
import type { WireDraft } from '../../store/useUi';
import { getSymbol } from '../../symbols/registry';
import { elementTransform } from './ElementView';

interface Props {
  boxes: Rect[];
  marquee: Rect | null;
  ports: Point[];
  hoverPort: Point | null;
  draft: WireDraft | null;
  draftPreview: Point[];
  ghost: Element | null;
  zoom: number;
}

const accent = 'var(--ui-accent)';

/** Служебный слой: рамки выделения, порты, предпросмотр провода и призрак элемента. */
export function Overlay({ boxes, marquee, ports, hoverPort, draft, draftPreview, ghost, zoom }: Props) {
  const px = (v: number) => v / zoom;
  return (
    <g className="no-hit" data-role="overlay">
      {boxes.map((b, i) => (
        <rect
          key={i}
          x={b.x - px(4)}
          y={b.y - px(4)}
          width={b.w + px(8)}
          height={b.h + px(8)}
          fill="none"
          stroke={accent}
          strokeWidth={px(1)}
          strokeDasharray={`${px(4)} ${px(3)}`}
        />
      ))}

      {ports.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={px(3)} fill="none" stroke={accent} strokeWidth={px(1)} opacity={0.55} />
      ))}

      {hoverPort && (
        <circle cx={hoverPort.x} cy={hoverPort.y} r={px(5.5)} fill="none" stroke={accent} strokeWidth={px(1.75)} />
      )}

      {draft && draft.points.length > 0 && (
        <>
          <polyline
            points={draft.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={accent}
            strokeWidth={px(1.8)}
          />
          {draftPreview.length > 1 && (
            <polyline
              points={draftPreview.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={accent}
              strokeWidth={px(1.8)}
              strokeDasharray={`${px(5)} ${px(4)}`}
            />
          )}
          <circle cx={draft.points[0].x} cy={draft.points[0].y} r={px(3)} fill={accent} />
        </>
      )}

      {ghost && (
        <g className="sch" opacity={0.5} style={{ color: accent }} transform={elementTransform(ghost)}>
          <GhostShape element={ghost} />
        </g>
      )}

      {marquee && (
        <rect
          x={marquee.x}
          y={marquee.y}
          width={marquee.w}
          height={marquee.h}
          fill={accent}
          fillOpacity={0.06}
          stroke={accent}
          strokeWidth={px(1)}
          strokeDasharray={`${px(4)} ${px(3)}`}
        />
      )}
    </g>
  );
}

function GhostShape({ element }: { element: Element }) {
  const def = getSymbol(element.type);
  return <def.Shape element={element} />;
}
