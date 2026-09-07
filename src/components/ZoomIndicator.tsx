import { Maximize2, Minus, Plus } from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { clampZoom, fitViewport, zoomAt } from '../lib/viewport';
import { docBounds } from '../lib/geometry';

interface Props {
  viewSize: { width: number; height: number };
}

/** Индикатор масштаба в углу полотна. */
export function ZoomIndicator({ viewSize }: Props) {
  const viewport = useUi((s) => s.viewport);
  const setViewport = useUi((s) => s.setViewport);
  const doc = useDoc((s) => s.doc);

  const step = (factor: number) =>
    setViewport(zoomAt(viewport, factor, viewSize.width / 2, viewSize.height / 2));

  const fit = () => setViewport(fitViewport(viewSize, docBounds(doc)));

  return (
    <div
      className="no-print absolute bottom-3 right-3 flex items-center gap-1 rounded border px-1 py-1"
      style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)' }}
    >
      <button className="tbtn" onClick={() => step(1 / 1.25)} title="Уменьшить" aria-label="Уменьшить">
        <Minus size={16} />
      </button>
      <button
        className="tbtn"
        style={{ minWidth: 52 }}
        onClick={() => setViewport({ ...viewport, zoom: clampZoom(1) })}
        title="Масштаб 100% (Ctrl+0)"
      >
        {Math.round(viewport.zoom * 100)}%
      </button>
      <button className="tbtn" onClick={() => step(1.25)} title="Увеличить" aria-label="Увеличить">
        <Plus size={16} />
      </button>
      <button className="tbtn" onClick={fit} title="Вписать в экран (Ctrl+1)" aria-label="Вписать в экран">
        <Maximize2 size={16} />
      </button>
    </div>
  );
}
