import { useEffect, useMemo, useState } from 'react';
import { useDoc } from '../../store/useDoc';
import { selectionCount, useUi } from '../../store/useUi';
import { buildSvg, svgToDataUrl, svgToPng, type BuiltSvg } from '../../lib/exportImage';
import { downloadBlob, downloadText, safeFileName } from '../../lib/fileIO';
import { Dialog } from './Dialog';

type Format = 'png' | 'svg';

export function ExportDialog() {
  const setDialog = useUi((s) => s.setDialog);
  const selection = useUi((s) => s.selection);
  const showToast = useUi((s) => s.showToast);
  const doc = useDoc((s) => s.doc);

  const hasSelection = selectionCount(selection) > 0;
  const [format, setFormat] = useState<Format>('png');
  const [scale, setScale] = useState(2);
  const [background, setBackground] = useState<'white' | 'transparent'>('white');
  const [padding, setPadding] = useState(24);
  const [onlySelected, setOnlySelected] = useState(false);
  const [built, setBuilt] = useState<BuiltSvg | null>(null);

  const isEmpty = doc.elements.length === 0 && doc.wires.length === 0 && doc.labels.length === 0;

  useEffect(() => {
    if (isEmpty) {
      setBuilt(null);
      return;
    }
    setBuilt(buildSvg({ onlySelected: onlySelected && hasSelection, selection, padding, background }));
  }, [isEmpty, onlySelected, hasSelection, selection, padding, background]);

  const preview = useMemo(() => (built ? svgToDataUrl(built) : ''), [built]);
  const outW = built ? Math.round(built.width * (format === 'png' ? scale : 1)) : 0;
  const outH = built ? Math.round(built.height * (format === 'png' ? scale : 1)) : 0;

  const download = async () => {
    if (!built) return;
    const name = safeFileName(doc.title);
    if (format === 'svg') {
      downloadText(`${name}.svg`, built.markup, 'image/svg+xml');
      showToast('SVG сохранён');
    } else {
      try {
        const blob = await svgToPng(built, scale);
        downloadBlob(`${name}.png`, blob);
        showToast('PNG сохранён');
      } catch {
        showToast('Не удалось создать PNG');
      }
    }
    setDialog(null);
  };

  return (
    <Dialog
      title="Экспорт изображения"
      onClose={() => setDialog(null)}
      width={560}
      footer={
        <>
          <button className="tbtn" onClick={() => setDialog(null)}>
            Отмена
          </button>
          <button className="tbtn active" onClick={() => void download()} disabled={!built}>
            Скачать {format.toUpperCase()}
          </button>
        </>
      }
    >
      {isEmpty ? (
        <p style={{ color: 'var(--ui-muted)' }}>Схема пуста — экспортировать нечего.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: '190px 1fr' }}>
          <div>
            <p className="section-title mb-1">Формат</p>
            <div className="mb-3 flex gap-1">
              <button className={`tbtn ${format === 'png' ? 'active' : ''}`} onClick={() => setFormat('png')}>
                PNG
              </button>
              <button className={`tbtn ${format === 'svg' ? 'active' : ''}`} onClick={() => setFormat('svg')}>
                SVG
              </button>
            </div>

            {format === 'png' && (
              <>
                <p className="section-title mb-1">Масштаб</p>
                <div className="mb-3 flex gap-1">
                  {[1, 2, 4].map((s) => (
                    <button key={s} className={`tbtn ${scale === s ? 'active' : ''}`} onClick={() => setScale(s)}>
                      {s}×
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="section-title mb-1">Фон</p>
            <div className="mb-3 flex gap-1">
              <button
                className={`tbtn ${background === 'white' ? 'active' : ''}`}
                onClick={() => setBackground('white')}
              >
                Белый
              </button>
              <button
                className={`tbtn ${background === 'transparent' ? 'active' : ''}`}
                onClick={() => setBackground('transparent')}
              >
                Прозрачный
              </button>
            </div>

            <label className="mb-3 flex items-center gap-2">
              <span style={{ color: 'var(--ui-muted)' }}>Поля</span>
              <input
                className="field"
                style={{ width: 70 }}
                type="number"
                min={0}
                max={200}
                value={padding}
                onChange={(e) => setPadding(Math.max(0, Number(e.target.value) || 0))}
              />
              <span style={{ color: 'var(--ui-muted)' }}>px</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlySelected}
                disabled={!hasSelection}
                onChange={(e) => setOnlySelected(e.target.checked)}
              />
              <span style={{ color: hasSelection ? 'inherit' : 'var(--ui-muted)' }}>Только выделенное</span>
            </label>
          </div>

          <div>
            <p className="section-title mb-1">Предпросмотр</p>
            <div
              className="flex items-center justify-center rounded border"
              style={{
                borderColor: 'var(--ui-line)',
                height: 220,
                background: background === 'white' ? '#fff' : 'var(--ui-panel)',
              }}
            >
              {preview ? (
                <img src={preview} alt="Предпросмотр схемы" style={{ maxWidth: '100%', maxHeight: 208 }} />
              ) : (
                <span style={{ color: 'var(--ui-muted)' }}>Нет содержимого</span>
              )}
            </div>
            <p className="mt-2" style={{ color: 'var(--ui-muted)' }}>
              Итоговый размер: {outW} × {outH} px. Сетка в экспорт не попадает.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
