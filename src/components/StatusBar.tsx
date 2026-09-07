import { useDeferredValue, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { analyze } from '../lib/nodes';

const HINTS: Record<string, string> = {
  select: 'Клик — выделить · Shift+клик — добавить · R — поворот · F — зеркало · Del — удалить',
  hand: 'Перетаскивание — панорамирование · пробел работает в любом инструменте',
  wire: 'Клик — начать или излом · Tab — сменить колено · Shift — 45° · Enter — завершить',
  text: 'Клик по полотну — поставить подпись (узлы a, b, c, …)',
  draw: 'Рисуйте от руки · цвет и толщина — в панели справа · Del — стереть выделенное',
};

const TOOL_NAMES: Record<string, string> = {
  select: 'выделение',
  hand: 'рука',
  wire: 'провод',
  text: 'текст',
  draw: 'карандаш',
};

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="soft-row flex items-center gap-1.5 px-2.5" style={{ height: 24 }}>
      {children}
    </span>
  );
}

export function StatusBar() {
  const doc = useDoc((s) => s.doc);
  const cursor = useUi((s) => s.cursor);
  const tool = useUi((s) => s.tool);
  const placing = useUi((s) => s.placingType);
  const settings = useUi((s) => s.settings);

  const deferred = useDeferredValue(doc);
  const conn = useMemo(() => analyze(deferred), [deferred]);

  const gx = Math.round(cursor.x / doc.grid);
  const gy = Math.round(cursor.y / doc.grid);

  return (
    <footer
      className="no-print card flex items-center gap-2 px-2"
      style={{ height: 36, flex: '0 0 auto', color: 'var(--ui-muted)', fontSize: 11.5 }}
    >
      <Chip>
        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 74, display: 'inline-block' }}>
          X {gx} · Y {gy}
        </span>
      </Chip>
      <Chip>
        Элементов <b style={{ color: 'var(--ui-ink)' }}>{doc.elements.length}</b>
      </Chip>
      <Chip>
        Проводов <b style={{ color: 'var(--ui-ink)' }}>{doc.wires.length}</b>
      </Chip>
      <Chip>
        Узлов <b style={{ color: 'var(--ui-ink)' }}>{conn.nodeCount}</b> · ветвей ≥3{' '}
        <b style={{ color: 'var(--ui-ink)' }}>{conn.branchNodeCount}</b>
      </Chip>
      <Chip>
        <span style={{ color: 'var(--ui-accent)', fontWeight: 700 }}>
          {placing ? 'размещение' : TOOL_NAMES[tool]}
        </span>
        {settings.snap ? ' · привязка' : ''}
        {settings.showGrid ? ' · сетка' : ''}
      </Chip>
      <span className="truncate">{placing ? 'Клик — поставить элемент · R — поворот · F — зеркало · Esc — отмена' : HINTS[tool]}</span>
    </footer>
  );
}
