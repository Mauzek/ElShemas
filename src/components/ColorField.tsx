import { X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Цвет линии: пустое значение — цвет темы. */
export function ColorField({ value, onChange }: Props) {
  return (
    <span className="flex items-center gap-1">
      <input
        type="color"
        className="field"
        style={{ width: 44, padding: 2 }}
        value={value || '#111827'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Цвет линии"
      />
      <span className="flex-1 truncate" style={{ color: 'var(--ui-muted)' }}>
        {value || 'по теме'}
      </span>
      {value && (
        <button className="tbtn" onClick={() => onChange('')} title="Вернуть цвет темы" aria-label="Сбросить цвет">
          <X size={14} />
        </button>
      )}
    </span>
  );
}
