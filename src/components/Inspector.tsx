import type { ReactNode } from 'react';
import { FlipHorizontal2, RotateCw, Trash2 } from 'lucide-react';
import { ROTATIONS, type Rotation } from '../types/schema';
import { useDoc } from '../store/useDoc';
import { selectionCount, useUi } from '../store/useUi';
import { getSymbol } from '../symbols/registry';
import { normalizePrimes } from '../lib/designator';
import { cmdDelete } from '../lib/commands';
import { AlignControls } from './AlignControls';
import { ColorField } from './ColorField';
import { TextField } from './TextField';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-2 grid items-center gap-2" style={{ gridTemplateColumns: '84px 1fr' }}>
      <span style={{ color: 'var(--ui-muted)' }}>{label}</span>
      {children}
    </label>
  );
}

export function Inspector() {
  const doc = useDoc((s) => s.doc);
  const selection = useUi((s) => s.selection);
  const patchElements = useDoc((s) => s.patchElements);
  const patchWires = useDoc((s) => s.patchWires);
  const patchLabels = useDoc((s) => s.patchLabels);
  const rotateSelection = useDoc((s) => s.rotateSelection);
  const mirrorSelection = useDoc((s) => s.mirrorSelection);
  const settings = useUi((s) => s.settings);
  const setSettings = useUi((s) => s.setSettings);

  const elements = doc.elements.filter((e) => selection.elements.includes(e.id));
  const wires = doc.wires.filter((w) => selection.wires.includes(w.id));
  const labels = doc.labels.filter((l) => selection.labels.includes(l.id));
  const total = selectionCount(selection);
  const first = elements[0];
  const ids = elements.map((e) => e.id);
  const defs = elements.map((e) => getSymbol(e.type));
  const anyPolarity = defs.some((d) => d.hasPolarity);
  const common = <T,>(values: T[]): T | '' => {
    if (values.length === 0) return '';
    return values.every((v) => v === values[0]) ? values[0] : '';
  };

  return (
    <aside
      className="no-print panel divider-l scroll-thin flex h-full flex-col overflow-y-auto"
      style={{ width: 244 }}
      aria-label="Свойства"
    >
      <div className="divider-b flex items-center px-3" style={{ height: 36 }}>
        <span className="section-title">
          {total === 0 ? 'Схема' : total === 1 ? 'Свойства' : `Выделено: ${total}`}
        </span>
      </div>

      <div className="p-3">
        {total === 0 && (
          <>
            <div className="mb-3" style={{ color: 'var(--ui-muted)', lineHeight: '18px' }}>
              <p className="mb-2">Выберите элемент, чтобы изменить его свойства.</p>
              <p className="mb-1">Элементов: {doc.elements.length}</p>
              <p className="mb-1">Проводов: {doc.wires.length}</p>
              <p>Подписей: {doc.labels.length}</p>
            </div>
            <section className="divider-t pt-3">
              <p className="section-title mb-2">Настройки отрисовки</p>
              <Row label="Катушка">
                <select
                  className="field"
                  value={settings.inductorStyle}
                  onChange={(e) => setSettings({ inductorStyle: e.target.value === 'arcs' ? 'arcs' : 'box' })}
                >
                  <option value="box">Прямоугольник</option>
                  <option value="arcs">Дуги</option>
                </select>
              </Row>
              <Row label="Пересечения">
                <select
                  className="field"
                  value={settings.crossingStyle}
                  onChange={(e) => setSettings({ crossingStyle: e.target.value === 'hop' ? 'hop' : 'plain' })}
                >
                  <option value="plain">Просто пересечение</option>
                  <option value="hop">Полукруглая перемычка</option>
                </select>
              </Row>
              <Row label="Провода">
                <select
                  className="field"
                  value={settings.freeAngleWire ? 'free' : 'ortho'}
                  onChange={(e) => setSettings({ freeAngleWire: e.target.value === 'free' })}
                >
                  <option value="ortho">Только ортогональные</option>
                  <option value="free">Свободный угол (Shift — 45°)</option>
                </select>
              </Row>
            </section>
          </>
        )}

        {elements.length > 0 && (
          <section className="mb-3">
            {elements.length === 1 && first && (
              <>
                <Row label="Обозначение">
                  <TextField
                    value={first.label}
                    onCommit={(v) => patchElements(ids, { label: normalizePrimes(v) })}
                    ariaLabel="Обозначение"
                  />
                </Row>
                <Row label="Значение">
                  <TextField value={first.value} onCommit={(v) => patchElements(ids, { value: v })} ariaLabel="Значение" />
                </Row>
              </>
            )}
            <Row label="Единица">
              <TextField
                value={common(elements.map((e) => e.unit)) || ''}
                placeholder={elements.length > 1 ? '—' : ''}
                onCommit={(v) => patchElements(ids, { unit: v })}
                ariaLabel="Единица измерения"
              />
            </Row>
            <Row label="Показывать">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={elements.every((e) => e.showValue)}
                  onChange={(e) => patchElements(ids, { showValue: e.target.checked })}
                />
                <span style={{ color: 'var(--ui-muted)' }}>значение на схеме</span>
              </span>
            </Row>
            <Row label="Поворот">
              <span className="flex items-center gap-1">
                <select
                  className="field"
                  value={String(common(elements.map((e) => e.rotation)))}
                  onChange={(e) => patchElements(ids, { rotation: Number(e.target.value) as Rotation })}
                >
                  <option value="">—</option>
                  {ROTATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}°
                    </option>
                  ))}
                </select>
                <button
                  className="tbtn"
                  onClick={() => rotateSelection(ids, 90)}
                  title="Повернуть на 90° (R), Shift+R — на 45°"
                >
                  <RotateCw size={16} />
                </button>
                <button className="tbtn" onClick={() => mirrorSelection(ids)} title="Зеркало (F)">
                  <FlipHorizontal2 size={16} />
                </button>
              </span>
            </Row>
            {anyPolarity && (
              <Row label="Направление">
                <select
                  className="field"
                  value={String(common(elements.map((e) => e.polarity ?? 'forward')))}
                  onChange={(e) =>
                    patchElements(ids, { polarity: e.target.value === 'reverse' ? 'reverse' : 'forward' })
                  }
                >
                  <option value="forward">Прямое</option>
                  <option value="reverse">Обратное</option>
                </select>
              </Row>
            )}
            <Row label="Цвет линии">
              <ColorField
                value={common(elements.map((e) => e.color ?? '')) || ''}
                onChange={(color) => patchElements(ids, { color: color || undefined })}
              />
            </Row>
            {elements.length > 1 && (
              <div className="mt-3">
                <p className="section-title mb-1">Выравнивание</p>
                <AlignControls ids={ids} />
              </div>
            )}
          </section>
        )}

        {wires.length > 0 && (
          <section className="divider-t mb-3 pt-3">
            <p className="section-title mb-2">Провода: {wires.length}</p>
            <Row label="Цвет линии">
              <ColorField
                value={common(wires.map((w) => w.color ?? '')) || ''}
                onChange={(color) => patchWires(wires.map((w) => w.id), { color: color || undefined })}
              />
            </Row>
          </section>
        )}

        {labels.length > 0 && (
          <section className="divider-t mb-3 pt-3">
            <p className="section-title mb-2">Подписи: {labels.length}</p>
            {labels.length === 1 && (
              <Row label="Текст">
                <TextField
                  value={labels[0].text}
                  onCommit={(v) => patchLabels([labels[0].id], { text: normalizePrimes(v) })}
                  ariaLabel="Текст подписи"
                />
              </Row>
            )}
            <Row label="Размер">
              <input
                className="field"
                type="number"
                min={8}
                max={48}
                value={Number(common(labels.map((l) => l.fontSize))) || 16}
                onChange={(e) =>
                  patchLabels(labels.map((l) => l.id), { fontSize: Math.max(8, Number(e.target.value) || 16) })
                }
              />
            </Row>
            <Row label="Курсив">
              <input
                type="checkbox"
                checked={labels.every((l) => l.italic)}
                onChange={(e) => patchLabels(labels.map((l) => l.id), { italic: e.target.checked })}
              />
            </Row>
            <Row label="Цвет">
              <ColorField
                value={common(labels.map((l) => l.color ?? '')) || ''}
                onChange={(color) => patchLabels(labels.map((l) => l.id), { color: color || undefined })}
              />
            </Row>
          </section>
        )}

        {total > 0 && (
          <button className="tbtn w-full" onClick={cmdDelete} style={{ color: 'var(--ui-danger)' }}>
            <Trash2 size={16} />
            Удалить выделенное
          </button>
        )}
      </div>
    </aside>
  );
}
