import { useMemo } from 'react';
import { ClipboardCopy } from 'lucide-react';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import { getSymbol } from '../../symbols/registry';
import { Dialog } from './Dialog';

/** Список элементов схемы с обозначениями и значениями. */
export function BomDialog() {
  const setDialog = useUi((s) => s.setDialog);
  const showToast = useUi((s) => s.showToast);
  const doc = useDoc((s) => s.doc);

  const rows = useMemo(
    () =>
      doc.elements
        .filter((el) => getSymbol(el.type).prefix !== '')
        .map((el) => ({
          label: el.label || '—',
          type: getSymbol(el.type).title,
          value: [el.value, el.unit].filter(Boolean).join(' ') || '—',
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru', { numeric: true })),
    [doc.elements],
  );

  const copy = () => {
    const text = ['Обозначение\tТип\tЗначение', ...rows.map((r) => `${r.label}\t${r.type}\t${r.value}`)].join('\n');
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(
        () => showToast('Таблица скопирована'),
        () => showToast('Буфер обмена недоступен'),
      );
    } else {
      showToast('Буфер обмена недоступен');
    }
  };

  return (
    <Dialog
      title="Список элементов"
      onClose={() => setDialog(null)}
      width={520}
      footer={
        <button className="tbtn" onClick={copy} disabled={rows.length === 0}>
          <ClipboardCopy size={16} />
          Копировать
        </button>
      }
    >
      {rows.length === 0 ? (
        <p style={{ color: 'var(--ui-muted)' }}>В схеме пока нет элементов с обозначениями.</p>
      ) : (
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--ui-muted)' }}>
              <th className="divider-b p-1 text-left">Обозначение</th>
              <th className="divider-b p-1 text-left">Тип</th>
              <th className="divider-b p-1 text-left">Значение</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="divider-b p-1">{r.label}</td>
                <td className="divider-b p-1">{r.type}</td>
                <td className="divider-b p-1">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}
