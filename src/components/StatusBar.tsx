import { useDeferredValue, useMemo } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { analyze } from '../lib/nodes';

const HINTS: Record<string, string> = {
  select: 'Клик — выделить · Shift+клик — добавить · R — поворот · F — зеркало · Del — удалить',
  hand: 'Перетаскивание — панорамирование · пробел работает в любом инструменте',
  wire: 'Клик — начать/излом · Tab — сменить колено · Enter — завершить · Esc — отменить',
  text: 'Клик по полотну — поставить подпись (узлы a, b, c, …)',
};

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
      className="no-print panel divider-t flex items-center gap-3 px-3"
      style={{ height: 26, flex: '0 0 auto', color: 'var(--ui-muted)', fontSize: 11.5 }}
    >
      <span style={{ minWidth: 108 }}>
        X: {gx} · Y: {gy}
      </span>
      <span className="h-3 w-px" style={{ background: 'var(--ui-line)' }} />
      <span>Элементов: {doc.elements.length}</span>
      <span>Проводов: {doc.wires.length}</span>
      <span>
        Узлов: {conn.nodeCount} (ветвей ≥3: {conn.branchNodeCount})
      </span>
      <span className="h-3 w-px" style={{ background: 'var(--ui-line)' }} />
      <span>
        Инструмент: {placing ? 'размещение' : tool === 'select' ? 'выделение' : tool === 'hand' ? 'рука' : tool === 'wire' ? 'провод' : 'текст'}
      </span>
      <span>Привязка: {settings.snap ? 'вкл' : 'выкл'}</span>
      <span className="h-3 w-px" style={{ background: 'var(--ui-line)' }} />
      <span className="truncate">{placing ? 'Клик — поставить элемент · R — поворот · F — зеркало · Esc — отмена' : HINTS[tool]}</span>
    </footer>
  );
}
