import { useUi } from '../../store/useUi';
import { useDoc } from '../../store/useDoc';
import { cloneFragment } from '../../lib/mutations';
import { setCurrentId } from '../../lib/storage';
import { makeId } from '../../lib/ids';
import { cmdFit } from '../../lib/commands';
import { Dialog } from './Dialog';

/** Импорт файла: открыть как новую схему или вставить в текущую. */
export function ImportDialog() {
  const pending = useUi((s) => s.pendingImport);
  const setPendingImport = useUi((s) => s.setPendingImport);
  const setSelection = useUi((s) => s.setSelection);
  const clearSelection = useUi((s) => s.clearSelection);
  const showToast = useUi((s) => s.showToast);
  const setDoc = useDoc((s) => s.setDoc);
  const addFragment = useDoc((s) => s.addFragment);
  const current = useDoc((s) => s.doc);

  if (!pending) return null;

  const openAsNew = () => {
    const id = makeId('doc');
    setDoc(pending.doc, id);
    setCurrentId(id);
    clearSelection();
    setPendingImport(null);
    cmdFit();
    showToast(`Открыта схема «${pending.doc.title}»`);
  };

  const insertIntoCurrent = () => {
    const step = current.grid * 2;
    const copy = cloneFragment(
      {
        elements: pending.doc.elements,
        wires: pending.doc.wires,
        labels: pending.doc.labels,
        strokes: pending.doc.strokes,
      },
      step,
      step,
    );
    addFragment(copy);
    setSelection({
      elements: copy.elements.map((e) => e.id),
      wires: copy.wires.map((w) => w.id),
      labels: copy.labels.map((l) => l.id),
      strokes: copy.strokes.map((st) => st.id),
    });
    setPendingImport(null);
    showToast('Схема вставлена в текущую');
  };

  return (
    <Dialog
      title="Импорт схемы"
      onClose={() => setPendingImport(null)}
      width={480}
      footer={
        <>
          <button className="tbtn" onClick={() => setPendingImport(null)}>
            Отмена
          </button>
          <button className="tbtn" onClick={insertIntoCurrent}>
            Вставить в текущую
          </button>
          <button className="tbtn active" onClick={openAsNew}>
            Открыть как новую
          </button>
        </>
      }
    >
      <p className="mb-2">
        Файл <b>{pending.fileName}</b> — схема «{pending.doc.title}»: элементов {pending.doc.elements.length},
        проводов {pending.doc.wires.length}, подписей {pending.doc.labels.length}.
      </p>
      {pending.warnings.length > 0 && (
        <div className="mt-2 rounded border p-2" style={{ borderColor: 'var(--ui-line)' }}>
          <p className="section-title mb-1">Замечания при разборе</p>
          <ul style={{ color: 'var(--ui-muted)' }}>
            {pending.warnings.slice(0, 8).map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}
