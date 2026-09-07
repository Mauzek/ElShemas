import { useMemo, useState } from 'react';
import { Copy, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import type { SchemaFile } from '../../types/schema';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import {
  deleteSchema,
  listSchemas,
  loadSchema,
  renameSchema,
  saveSchema,
  setCurrentId,
  type StoredMeta,
} from '../../lib/storage';
import { makeId } from '../../lib/ids';
import { cmdFit } from '../../lib/commands';
import { Dialog } from './Dialog';
import { SchemaThumb } from './SchemaThumb';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export function SchemaManager() {
  const setDialog = useUi((s) => s.setDialog);
  const clearSelection = useUi((s) => s.clearSelection);
  const showToast = useUi((s) => s.showToast);
  const doc = useDoc((s) => s.doc);
  const docId = useDoc((s) => s.docId);
  const setDoc = useDoc((s) => s.setDoc);

  const [version, setVersion] = useState(0);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const items = useMemo(() => {
    void version;
    // Текущая схема тоже должна быть в списке, даже если автосохранение ещё не сработало.
    saveSchema(docId, doc);
    return listSchemas()
      .map((meta) => ({ meta, doc: loadSchema(meta.id) }))
      .filter((x): x is { meta: StoredMeta; doc: SchemaFile } => x.doc !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, docId]);

  const refresh = () => setVersion((v) => v + 1);

  const open = (id: string, target: SchemaFile) => {
    saveSchema(docId, doc);
    setDoc(target, id);
    setCurrentId(id);
    clearSelection();
    setDialog(null);
    cmdFit();
    showToast(`Открыта схема «${target.title}»`);
  };

  const duplicate = (source: SchemaFile) => {
    const id = makeId('doc');
    saveSchema(id, { ...source, title: `${source.title} (копия)` });
    refresh();
  };

  const remove = (id: string, title: string) => {
    if (!window.confirm(`Удалить схему «${title}»? Действие необратимо.`)) return;
    deleteSchema(id);
    refresh();
  };

  return (
    <Dialog title="Мои схемы" onClose={() => setDialog(null)} width={620}>
      {items.length === 0 && <p style={{ color: 'var(--ui-muted)' }}>Сохранённых схем пока нет.</p>}
      <ul className="flex flex-col gap-2">
        {items.map(({ meta, doc: stored }) => (
          <li
            key={meta.id}
            className="flex items-center gap-3 rounded border p-2"
            style={{
              borderColor: meta.id === docId ? 'var(--ui-accent)' : 'var(--ui-line)',
            }}
          >
            <SchemaThumb doc={stored} />
            <div className="min-w-0 flex-1">
              {renaming === meta.id ? (
                <input
                  className="field"
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    renameSchema(meta.id, draft.trim() || meta.title);
                    if (meta.id === docId) setDoc({ ...doc, title: draft.trim() || meta.title }, docId);
                    setRenaming(null);
                    refresh();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') {
                      setRenaming(null);
                    }
                    e.stopPropagation();
                  }}
                />
              ) : (
                <p className="truncate" style={{ fontWeight: 500 }}>
                  {meta.title}
                  {meta.id === docId && (
                    <span style={{ color: 'var(--ui-accent)', fontWeight: 400 }}> · открыта</span>
                  )}
                </p>
              )}
              <p style={{ color: 'var(--ui-muted)', fontSize: 11.5 }}>
                {formatDate(meta.updatedAt)} · элементов: {meta.elements} · проводов: {meta.wires}
              </p>
            </div>
            <div className="flex gap-1">
              <button className="tbtn" onClick={() => open(meta.id, stored)} data-tip="Открыть">
                <FolderOpen size={16} />
              </button>
              <button
                className="tbtn"
                onClick={() => {
                  setRenaming(meta.id);
                  setDraft(meta.title);
                }}
                data-tip="Переименовать"
              >
                <Pencil size={16} />
              </button>
              <button className="tbtn" onClick={() => duplicate(stored)} data-tip="Дублировать">
                <Copy size={16} />
              </button>
              <button
                className="tbtn"
                onClick={() => remove(meta.id, meta.title)}
                data-tip="Удалить"
                style={{ color: 'var(--ui-danger)' }}
                disabled={meta.id === docId}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
