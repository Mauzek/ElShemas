import { Copy, Download, FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { SchemaFile } from '../../types/schema';
import type { StoredMeta } from '../../lib/storage';
import { Menu } from '../ui/Menu';
import { SchemaThumb } from './SchemaThumb';

interface Props {
  meta: StoredMeta;
  doc: SchemaFile;
  isCurrent: boolean;
  renaming: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onOpen: () => void;
  onStartRename: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function formatDate(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? `сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Карточка сохранённой схемы: миниатюра, название и меню действий. */
export function SchemaCard({
  meta,
  doc,
  isCurrent,
  renaming,
  draft,
  onDraft,
  onCommitRename,
  onCancelRename,
  onOpen,
  onStartRename,
  onDuplicate,
  onDownload,
  onDelete,
}: Props) {
  return (
    <div className={`schema-card ${isCurrent ? 'current' : ''}`}>
      <button
        type="button"
        className="schema-card-thumb"
        onClick={onOpen}
        aria-label={`Открыть схему ${meta.title}`}
        data-tip="Открыть схему"
      >
        <SchemaThumb doc={doc} width={230} height={124} />
        {isCurrent && <span className="schema-badge">открыта</span>}
      </button>

      <div className="flex items-start gap-1 p-2 pt-1.5">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              className="field"
              autoFocus
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') onCancelRename();
                e.stopPropagation();
              }}
              aria-label="Название схемы"
            />
          ) : (
            <p className="truncate" style={{ fontWeight: 700 }} title={meta.title}>
              {meta.title}
            </p>
          )}
          <p style={{ color: 'var(--ui-muted)', fontSize: 11.5 }}>
            {formatDate(meta.updatedAt)} · {meta.elements} эл. · {meta.wires} пров.
          </p>
        </div>

        <Menu
          ariaLabel={`Действия со схемой ${meta.title}`}
          tip="Действия"
          align="end"
          width={220}
          sections={[
            {
              items: [
                { icon: FolderOpen, label: 'Открыть', onSelect: onOpen },
                { icon: Pencil, label: 'Переименовать', onSelect: onStartRename },
                { icon: Copy, label: 'Дублировать', onSelect: onDuplicate },
                { icon: Download, label: 'Скачать .json', onSelect: onDownload },
              ],
            },
            {
              items: [
                {
                  icon: Trash2,
                  label: 'Удалить',
                  danger: true,
                  disabled: isCurrent,
                  hint: isCurrent ? 'открыта' : undefined,
                  onSelect: onDelete,
                },
              ],
            },
          ]}
        >
          <MoreVertical size={16} />
        </Menu>
      </div>
    </div>
  );
}
