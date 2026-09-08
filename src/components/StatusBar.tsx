import { useDeferredValue, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { analyze } from '../lib/nodes';

const TOOL_NAMES: Record<string, string> = {
  select: 'выделение',
  hand: 'рука',
  wire: 'провод',
  text: 'текст',
  draw: 'карандаш',
};

function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`soft-row flex items-center gap-1 whitespace-nowrap px-2.5 ${className}`} style={{ height: 24 }}>
      {children}
    </span>
  );
}

/** Плавающая строка состояния в левом нижнем углу полотна. */
export function StatusBar() {
  const doc = useDoc((s) => s.doc);
  const cursor = useUi((s) => s.cursor);
  const tool = useUi((s) => s.tool);
  const placing = useUi((s) => s.placingType);

  const deferred = useDeferredValue(doc);
  const conn = useMemo(() => analyze(deferred), [deferred]);

  const gx = Math.round(cursor.x / doc.grid);
  const gy = Math.round(cursor.y / doc.grid);

  return (
    <footer className="status-bar no-print" aria-label="Состояние схемы">
      <Chip>
        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 68, display: 'inline-block' }}>
          X {gx} · Y {gy}
        </span>
      </Chip>
      <Chip>
        Элементов <b style={{ color: 'var(--ui-ink)' }}>{doc.elements.length}</b>
      </Chip>
      <Chip className="status-hide-lg">
        Проводов <b style={{ color: 'var(--ui-ink)' }}>{doc.wires.length}</b>
      </Chip>
      <Chip data-tip="Электрических узлов · из них с тремя и более ветвями">
        Узлов <b style={{ color: 'var(--ui-ink)' }}>{conn.nodeCount}</b>
        <span className="status-hide-md">
          {' · ≥3 '}
          <b style={{ color: 'var(--ui-ink)' }}>{conn.branchNodeCount}</b>
        </span>
      </Chip>
      <Chip className="status-hide-lg">
        <span style={{ color: 'var(--ui-accent)', fontWeight: 700 }}>
          {placing ? 'размещение' : TOOL_NAMES[tool]}
        </span>
      </Chip>
      <a
        className="truncate px-1"
        style={{ fontWeight: 700, color: 'var(--ui-muted)' }}
        href="https://github.com/Mauzek"
        target="_blank"
        rel="noopener noreferrer"
        data-tip="Разработчик: Иллий Артём, гр. 12002508"
      >
        Иллий Артём · 12002508
      </a>
    </footer>
  );
}
