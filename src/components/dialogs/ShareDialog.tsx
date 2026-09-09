import { useMemo, useState } from 'react';
import { Check, Copy, Link2, TriangleAlert } from 'lucide-react';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import { buildShareUrl, MAX_URL_LENGTH } from '../../lib/share';
import { cmdSaveJson } from '../../lib/commands';
import { Dialog } from './Dialog';

/** Ссылка со схемой: документ сжат и лежит в хеше адреса, на сервер не уходит. */
export function ShareDialog() {
  const doc = useDoc((s) => s.doc);
  const setDialog = useUi((s) => s.setDialog);
  const showToast = useUi((s) => s.showToast);
  const [viewOnly, setViewOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => buildShareUrl(doc, viewOnly), [doc, viewOnly]);

  const copy = () => {
    if (!navigator.clipboard?.writeText) {
      showToast('Буфер обмена недоступен');
      return;
    }
    void navigator.clipboard.writeText(link.url).then(
      () => {
        setCopied(true);
        showToast('Ссылка скопирована');
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => showToast('Буфер обмена недоступен'),
    );
  };

  return (
    <Dialog
      title="Ссылка на схему"
      description="Схема упакована в саму ссылку: она не загружается на сервер и открывается у любого, кто перейдёт по адресу."
      icon={Link2}
      onClose={() => setDialog(null)}
      width={520}
      footer={
        <>
          <button className="tbtn" onClick={() => setDialog(null)}>
            Закрыть
          </button>
          <button className="tbtn tbtn-primary" onClick={copy} disabled={link.tooLong}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            Скопировать ссылку
          </button>
        </>
      }
    >
      <label className="mb-3 flex items-center gap-2">
        <input type="checkbox" checked={viewOnly} onChange={(e) => setViewOnly(e.target.checked)} />
        <span>Только просмотр — без палитры и панелей</span>
      </label>

      <textarea
        className="field scroll-thin mb-2"
        style={{ height: 96, resize: 'none', lineHeight: '17px', wordBreak: 'break-all' }}
        readOnly
        value={link.url}
        aria-label="Ссылка на схему"
        onFocus={(e) => e.currentTarget.select()}
      />

      {link.tooLong ? (
        <div className="flex items-start gap-2" style={{ color: 'var(--ui-danger)' }}>
          <TriangleAlert size={16} style={{ flex: '0 0 auto', marginTop: 1 }} />
          <span>
            Схема слишком большая для ссылки: {link.length} символов при пределе {MAX_URL_LENGTH}.
            Такой адрес обрежется в мессенджере — отправьте файлом.
            <button className="tbtn ml-2" onClick={() => cmdSaveJson()}>
              Сохранить .json
            </button>
          </span>
        </div>
      ) : (
        <p style={{ color: 'var(--ui-muted)' }}>
          Длина ссылки: {link.length} символов из {MAX_URL_LENGTH} возможных.
        </p>
      )}
    </Dialog>
  );
}
