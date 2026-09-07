import type { ReactNode } from 'react';
import { FlipHorizontal2, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { ROTATIONS, type Rotation } from '../types/schema';
import { useDoc } from '../store/useDoc';
import { selectionCount, useUi } from '../store/useUi';
import { getSymbol } from '../symbols/registry';
import { normalizePrimes } from '../lib/designator';
import { cmdDelete } from '../lib/commands';
import { AlignControls } from './AlignControls';
import { Dropdown } from './Dropdown';
import { ColorField } from './ColorField';
import { TextField } from './TextField';
import { PenSettings } from './PenSettings';
import { RenderSettings } from './RenderSettings';
import { Row } from './Row';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-3">
      {title && <p className="section-title mb-2">{title}</p>}
      {children}
    </section>
  );
}

export function Inspector() {
  const doc = useDoc((s) => s.doc);
  const selection = useUi((s) => s.selection);
  const tool = useUi((s) => s.tool);
  const patchElements = useDoc((s) => s.patchElements);
  const patchWires = useDoc((s) => s.patchWires);
  const patchLabels = useDoc((s) => s.patchLabels);
  const rotateSelection = useDoc((s) => s.rotateSelection);
  const mirrorSelection = useDoc((s) => s.mirrorSelection);

  const elements = doc.elements.filter((e) => selection.elements.includes(e.id));
  const wires = doc.wires.filter((w) => selection.wires.includes(w.id));
  const labels = doc.labels.filter((l) => selection.labels.includes(l.id));
  const strokes = doc.strokes.filter((s) => selection.strokes.includes(s.id));
  const total = selectionCount(selection);
  const first = elements[0];
  const ids = elements.map((e) => e.id);
  const anyPolarity = elements.some((e) => getSymbol(e.type).hasPolarity);
  const common = <T,>(values: T[]): T | '' => {
    if (values.length === 0) return '';
    return values.every((v) => v === values[0]) ? values[0] : '';
  };

  return (
    <aside
      className="no-print card scroll-thin flex h-full flex-col overflow-y-auto"
      style={{ width: 252, flex: '0 0 auto' }}
      aria-label="Свойства"
    >
      <div className="flex items-center gap-2 px-3 pb-1 pt-3">
        <span className="section-title">
          {total === 0 ? 'Схема' : total === 1 ? 'Свойства' : `Выделено: ${total}`}
        </span>
      </div>

      <div className="px-3 pb-3">
        {total === 0 && (
          <>
            <div className="soft-row mb-3 grid grid-cols-3 gap-1 p-2 text-center">
              {[
                ['Элементы', doc.elements.length],
                ['Провода', doc.wires.length],
                ['Штрихи', doc.strokes.length],
              ].map(([caption, value]) => (
                <span key={String(caption)}>
                  <b style={{ fontSize: 16 }}>{value}</b>
                  <br />
                  <span style={{ color: 'var(--ui-muted)', fontSize: 11 }}>{caption}</span>
                </span>
              ))}
            </div>
            {tool === 'draw' && (
              <Section title="Карандаш">
                <PenSettings />
              </Section>
            )}
            <Section title="Отрисовка">
              <RenderSettings />
            </Section>
            <p style={{ color: 'var(--ui-muted)', lineHeight: '17px' }}>
              Выберите элемент, чтобы изменить его свойства, или возьмите инструмент{' '}
              <Pencil size={12} style={{ display: 'inline', verticalAlign: -1 }} /> и рисуйте поверх схемы.
            </p>
          </>
        )}

        {elements.length > 0 && (
          <Section title={elements.length === 1 ? '' : `Элементы: ${elements.length}`}>
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
                <span style={{ color: 'var(--ui-muted)' }}>показывать на схеме</span>
              </span>
            </Row>
            <Row label="Поворот">
              <span className="flex items-center gap-1">
                <Dropdown
                  value={String(common(elements.map((e) => e.rotation)))}
                  onChange={(v) => v && patchElements(ids, { rotation: Number(v) as Rotation })}
                  ariaLabel="Поворот"
                  options={[
                    ...(common(elements.map((e) => e.rotation)) === '' ? [{ value: '', label: '—' }] : []),
                    ...ROTATIONS.map((r) => ({ value: String(r), label: `${r}°` })),
                  ]}
                />
                <button
                  className="tbtn"
                  onClick={() => rotateSelection(ids, 90)}
                  data-tip="Повернуть на 90° (R), Shift+R — на 45°"
                >
                  <RotateCw size={16} />
                </button>
                <button className="tbtn" onClick={() => mirrorSelection(ids)} data-tip="Зеркало (F)">
                  <FlipHorizontal2 size={16} />
                </button>
              </span>
            </Row>
            {anyPolarity && (
              <Row label="Направление">
                <Dropdown
                  value={String(common(elements.map((e) => e.polarity ?? 'forward')))}
                  onChange={(v) => patchElements(ids, { polarity: v === 'reverse' ? 'reverse' : 'forward' })}
                  ariaLabel="Направление"
                  options={[
                    { value: 'forward', label: 'Прямое' },
                    { value: 'reverse', label: 'Обратное' },
                  ]}
                />
              </Row>
            )}
            <Row label="Цвет">
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
          </Section>
        )}

        {wires.length > 0 && (
          <Section title={`Провода: ${wires.length}`}>
            <Row label="Цвет">
              <ColorField
                value={common(wires.map((w) => w.color ?? '')) || ''}
                onChange={(color) => patchWires(wires.map((w) => w.id), { color: color || undefined })}
              />
            </Row>
          </Section>
        )}

        {labels.length > 0 && (
          <Section title={`Подписи: ${labels.length}`}>
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
          </Section>
        )}

        {strokes.length > 0 && (
          <Section title={`Рисунок: ${strokes.length}`}>
            <p className="mb-2" style={{ color: 'var(--ui-muted)' }}>
              Штрихи карандаша. Новые рисуются с текущими настройками ниже.
            </p>
            <PenSettings />
          </Section>
        )}

        {total > 0 && (
          <button className="tbtn tbtn-danger w-full" onClick={cmdDelete}>
            <Trash2 size={16} />
            Удалить выделенное
          </button>
        )}
      </div>
    </aside>
  );
}
