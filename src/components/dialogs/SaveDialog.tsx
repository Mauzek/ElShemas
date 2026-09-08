import { useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import { downloadText, safeFileName, serializeSchema } from '../../lib/fileIO';
import { Dialog } from './Dialog';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

/** Подтверждение выгрузки схемы в файл с возможностью задать имя. */
export function SaveDialog() {
  const setDialog = useUi((s) => s.setDialog);
  const showToast = useUi((s) => s.showToast);
  const doc = useDoc((s) => s.doc);
  const [name, setName] = useState(() => safeFileName(doc.title));
  const inputRef = useRef<HTMLInputElement>(null);

  const json = useMemo(() => serializeSchema(doc), [doc]);
  const size = useMemo(() => new Blob([json]).size, [json]);
  const fileName = `${safeFileName(name) || 'schema'}.json`;

  const save = () => {
    downloadText(fileName, json, 'application/json');
    showToast(`Файл ${fileName} сохранён`);
    setDialog(null);
  };

  return (
    <Dialog
      title="Сохранить схему в файл"
      description="Файл можно открыть в редакторе позже или передать другому человеку."
      icon={Download}
      onClose={() => setDialog(null)}
      width={460}
      footer={
        <>
          <button className="tbtn" onClick={() => setDialog(null)}>
            Отмена
          </button>
          <button className="tbtn tbtn-primary" onClick={save}>
            <Download size={16} />
            Скачать
          </button>
        </>
      }
    >
      <label className="mb-3 block">
        <span className="section-title mb-1 block">Имя файла</span>
        <span className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="field"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              e.stopPropagation();
            }}
            aria-label="Имя файла"
          />
          <span style={{ color: 'var(--ui-muted)', flex: '0 0 auto' }}>.json</span>
        </span>
      </label>

      <div className="soft-row grid grid-cols-4 gap-1 p-2 text-center">
        {[
          ['Элементы', doc.elements.length],
          ['Провода', doc.wires.length],
          ['Подписи', doc.labels.length],
          ['Штрихи', doc.strokes.length],
        ].map(([caption, value]) => (
          <span key={String(caption)}>
            <b style={{ fontSize: 15 }}>{value}</b>
            <br />
            <span style={{ color: 'var(--ui-muted)', fontSize: 11 }}>{caption}</span>
          </span>
        ))}
      </div>
      <p className="mt-2" style={{ color: 'var(--ui-muted)' }}>
        Размер файла — {formatSize(size)}.
      </p>
    </Dialog>
  );
}
