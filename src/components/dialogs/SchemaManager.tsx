import { useMemo, useRef, useState } from 'react';
import { FilePlus2, FolderOpen, Library, Search, Upload } from 'lucide-react';
import type { SchemaFile } from '../../types/schema';
import { emptySchema } from '../../types/schema';
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
import { cmdOpenFile, downloadSchema, startViewport } from '../../lib/commands';
import { makeId } from '../../lib/ids';
import { Dialog } from './Dialog';
import { SchemaCard } from './SchemaCard';
import { Dropdown } from '../Dropdown';

type SortMode = 'updated' | 'title' | 'size';

interface Entry {
  meta: StoredMeta;
  doc: SchemaFile;
}

export function SchemaManager() {
  const setDialog = useUi((s) => s.setDialog);
  const clearSelection = useUi((s) => s.clearSelection);
  const showToast = useUi((s) => s.showToast);
  const askConfirm = useUi((s) => s.askConfirm);
  const setViewport = useUi((s) => s.setViewport);
  const doc = useDoc((s) => s.doc);
  const docId = useDoc((s) => s.docId);
  const setDoc = useDoc((s) => s.setDoc);

  const fileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('updated');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const entries = useMemo<Entry[]>(() => {
    void version;
    // Текущая схема тоже должна быть в списке, даже если автосохранение ещё не сработало.
    saveSchema(docId, doc);
    return listSchemas()
      .map((meta) => ({ meta, doc: loadSchema(meta.id) }))
      .filter((x): x is Entry => x.doc !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, docId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? entries.filter((e) => e.meta.title.toLowerCase().includes(q)) : entries;
    const sorted = [...filtered];
    if (sort === 'title') sorted.sort((a, b) => a.meta.title.localeCompare(b.meta.title, 'ru'));
    else if (sort === 'size') sorted.sort((a, b) => b.meta.elements + b.meta.wires - (a.meta.elements + a.meta.wires));
    else sorted.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);
    return sorted;
  }, [entries, query, sort]);

  const refresh = () => setVersion((v) => v + 1);

  const open = (id: string, target: SchemaFile) => {
    saveSchema(docId, doc);
    setDoc(target, id);
    setCurrentId(id);
    clearSelection();
    setViewport(startViewport());
    setDialog(null);
    showToast(`Открыта схема «${target.title}»`);
  };

  const createNew = () => {
    saveSchema(docId, doc);
    const id = makeId('doc');
    const fresh = emptySchema(`Схема ${entries.length + 1}`);
    setDoc(fresh, id);
    setCurrentId(id);
    clearSelection();
    setDialog(null);
    showToast('Создана новая схема');
  };

  const duplicate = (source: SchemaFile) => {
    saveSchema(makeId('doc'), { ...source, title: `${source.title} (копия)` });
    refresh();
    showToast('Копия создана');
  };

  const remove = (meta: StoredMeta) =>
    askConfirm({
      title: 'Удалить схему?',
      message: `Схема «${meta.title}» будет удалена без возможности восстановления. Если она нужна, сначала скачайте её файлом.`,
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: () => {
        deleteSchema(meta.id);
        refresh();
        showToast('Схема удалена');
      },
    });

  const commitRename = (meta: StoredMeta) => {
    const title = draft.trim() || meta.title;
    renameSchema(meta.id, title);
    if (meta.id === docId) setDoc({ ...doc, title }, docId);
    setRenaming(null);
    refresh();
  };

  return (
    <Dialog
      title="Мои схемы"
      description="Всё сохраняется в браузере автоматически. Откройте нужную схему или создайте новую."
      icon={Library}
      onClose={() => setDialog(null)}
      width={800}
      flush
      footer={
        <>
          <button className="tbtn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} />
            Импорт файла
          </button>
          <button className="tbtn tbtn-primary" onClick={createNew}>
            <FilePlus2 size={16} />
            Новая схема
          </button>
        </>
      }
    >
      <div className="schema-toolbar">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ui-muted)' }}
          />
          <input
            className="field"
            style={{ paddingLeft: 28 }}
            placeholder="Поиск по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск схемы"
          />
        </div>
        <Dropdown
          value={sort}
          onChange={setSort}
          width={168}
          ariaLabel="Сортировка"
          options={[
            { value: 'updated', label: 'Сначала недавние' },
            { value: 'title', label: 'По названию' },
            { value: 'size', label: 'По размеру схемы' },
          ]}
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            cmdOpenFile(file);
            setDialog(null);
          }
          e.target.value = '';
        }}
      />

      {visible.length === 0 ? (
        <div className="schema-empty">
          <FolderOpen size={28} style={{ color: 'var(--ui-muted)' }} />
          <p style={{ fontWeight: 700 }}>{query ? 'Ничего не найдено' : 'Сохранённых схем пока нет'}</p>
          <p style={{ color: 'var(--ui-muted)' }}>
            {query
              ? 'Измените запрос или создайте новую схему.'
              : 'Начните чертить — схема сохранится автоматически и появится здесь.'}
          </p>
        </div>
      ) : (
        <div className="schema-grid">
          {visible.map(({ meta, doc: stored }) => (
            <SchemaCard
              key={meta.id}
              meta={meta}
              doc={stored}
              isCurrent={meta.id === docId}
              renaming={renaming === meta.id}
              draft={draft}
              onDraft={setDraft}
              onCommitRename={() => commitRename(meta)}
              onCancelRename={() => setRenaming(null)}
              onOpen={() => open(meta.id, stored)}
              onStartRename={() => {
                setRenaming(meta.id);
                setDraft(meta.title);
              }}
              onDuplicate={() => duplicate(stored)}
              onDownload={() => downloadSchema(stored)}
              onDelete={() => remove(meta)}
            />
          ))}
        </div>
      )}
    </Dialog>
  );
}
