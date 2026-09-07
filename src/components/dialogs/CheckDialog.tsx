import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Unplug } from 'lucide-react';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import { analyze } from '../../lib/nodes';
import { checkSchema } from '../../lib/validate';
import { worldToScreen } from '../../lib/viewport';
import { Dialog } from './Dialog';

/** Проверка схемы: висящие выводы, дубли обозначений, несвязанные фрагменты. */
export function CheckDialog() {
  const setDialog = useUi((s) => s.setDialog);
  const setSelection = useUi((s) => s.setSelection);
  const viewport = useUi((s) => s.viewport);
  const setViewport = useUi((s) => s.setViewport);
  const viewSize = useUi((s) => s.viewSize);
  const doc = useDoc((s) => s.doc);

  const { conn, issues } = useMemo(() => {
    const c = analyze(doc);
    return { conn: c, issues: checkSchema(doc, c) };
  }, [doc]);

  const focus = (ids: string[], point?: { x: number; y: number }) => {
    if (ids.length > 0) setSelection({ elements: ids });
    if (point) {
      const screen = worldToScreen(viewport, point);
      setViewport({
        ...viewport,
        x: viewport.x + (viewSize.width / 2 - screen.x),
        y: viewport.y + (viewSize.height / 2 - screen.y),
      });
    }
  };

  return (
    <Dialog title="Проверка схемы" onClose={() => setDialog(null)} width={560}>
      <p className="mb-3" style={{ color: 'var(--ui-muted)' }}>
        Электрических узлов: {conn.nodeCount} · узлов с тремя и более ветвями: {conn.branchNodeCount} ·
        связных фрагментов: {conn.fragments}
      </p>
      {issues.length === 0 ? (
        <p className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: 'var(--ui-accent)' }} />
          Замечаний нет.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {issues.map((issue, i) => (
            <li key={i}>
              <button
                className="tbtn w-full justify-start text-left"
                style={{ height: 'auto', padding: '6px 8px' }}
                onClick={() => focus(issue.elementIds, issue.points[0])}
              >
                {issue.kind === 'dangling' ? (
                  <Unplug size={16} style={{ color: 'var(--ui-danger)', flex: '0 0 auto' }} />
                ) : (
                  <AlertTriangle size={16} style={{ color: 'var(--ui-danger)', flex: '0 0 auto' }} />
                )}
                <span>{issue.message}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
