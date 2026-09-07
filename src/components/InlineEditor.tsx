import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { worldToScreen } from '../lib/viewport';
import { normalizePrimes } from '../lib/designator';

/** Инлайновое редактирование подписи прямо на полотне: Tab переключает на значение. */
export function InlineEditor() {
  const editing = useUi((s) => s.editing);
  const setEditing = useUi((s) => s.setEditing);
  const viewport = useUi((s) => s.viewport);
  const doc = useDoc((s) => s.doc);
  const patchElements = useDoc((s) => s.patchElements);
  const patchLabels = useDoc((s) => s.patchLabels);
  const removeSelection = useDoc((s) => s.removeSelection);

  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const cancelled = useRef(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  const element = editing?.kind === 'element' ? doc.elements.find((e) => e.id === editing.id) : undefined;
  const free = editing?.kind === 'label' ? doc.labels.find((l) => l.id === editing.id) : undefined;
  const currentId = editing ? editing.id : null;

  // Значения полей готовятся прямо во время рендера, чтобы к моменту
  // установки фокуса в поле уже был текст и он корректно выделялся.
  if (currentId !== openedFor) {
    setOpenedFor(currentId);
    setLabel(element?.label ?? free?.text ?? '');
    setValue(element?.value ?? '');
    cancelled.current = false;
  }

  useEffect(() => {
    if (!currentId) return;
    const field =
      editing?.kind === 'element' && editing.field === 'value' ? valueRef.current : labelRef.current;
    field?.focus();
    field?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  if (!editing) return null;
  if (!element && !free) return null;

  const anchor = element
    ? { x: element.x, y: element.y }
    : { x: (free as NonNullable<typeof free>).x, y: (free as NonNullable<typeof free>).y };
  const pos = worldToScreen(viewport, anchor);

  const close = (commit: boolean) => {
    if (commit && !cancelled.current) {
      if (element) {
        patchElements([element.id], { label: normalizePrimes(label), value });
      } else if (free) {
        const text = normalizePrimes(label).trim();
        if (text) patchLabels([free.id], { text });
        else removeSelection({ elements: [], wires: [], labels: [free.id], strokes: [] });
      }
    } else if (free && !free.text.trim()) {
      removeSelection({ elements: [], wires: [], labels: [free.id], strokes: [] });
    }
    setEditing(null);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelled.current = true;
      close(false);
    }
    e.stopPropagation();
  };

  return (
    <div
      className="absolute z-20 flex items-center gap-1 p-1.5"
      style={{
        left: Math.round(pos.x - 60),
        top: Math.round(pos.y - 58),
        background: 'var(--ui-surface)',
        border: '1px solid var(--ui-line)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-md)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        ref={labelRef}
        autoFocus
        className="field"
        style={{ width: element ? 68 : 150 }}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (e.relatedTarget !== valueRef.current) close(true);
        }}
        aria-label={element ? 'Обозначение' : 'Текст подписи'}
      />
      {element && (
        <input
          ref={valueRef}
          className="field"
          style={{ width: 80 }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (e.relatedTarget !== labelRef.current) close(true);
          }}
          aria-label="Значение"
        />
      )}
    </div>
  );
}
