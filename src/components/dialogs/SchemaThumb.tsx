import type { SchemaFile } from '../../types/schema';
import { docBounds } from '../../lib/geometry';
import { ElementView } from '../canvas/ElementView';
import { ElementLabel } from '../canvas/ElementLabel';
import { WireView } from '../canvas/WireView';
import { FreeLabelView } from '../canvas/FreeLabelView';

const NO_HOPS = [] as never[];

/** Миниатюра сохранённой схемы для менеджера. */
export function SchemaThumb({ doc, width = 108, height = 68 }: { doc: SchemaFile; width?: number; height?: number }) {
  const box = docBounds(doc);
  if (!box) {
    return (
      <div
        className="flex items-center justify-center rounded border"
        style={{ width, height, borderColor: 'var(--ui-line)', color: 'var(--ui-muted)', fontSize: 11 }}
      >
        пусто
      </div>
    );
  }
  const pad = 12;
  return (
    <svg
      className="rounded border"
      style={{ borderColor: 'var(--ui-line)', background: 'var(--canvas-bg)' }}
      width={width}
      height={height}
      viewBox={`${box.x - pad} ${box.y - pad} ${box.w + pad * 2} ${box.h + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g className="no-hit">
        {doc.wires.map((w) => (
          <WireView key={w.id} wire={w} selected={false} hops={NO_HOPS} />
        ))}
        {doc.elements.map((el) => (
          <ElementView key={el.id} element={el} selected={false} />
        ))}
        {doc.elements.map((el) => (
          <ElementLabel key={`l-${el.id}`} element={el} selected={false} />
        ))}
        {doc.labels.map((l) => (
          <FreeLabelView key={l.id} label={l} selected={false} />
        ))}
      </g>
    </svg>
  );
}
