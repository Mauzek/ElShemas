import { useEffect, useState } from 'react';

interface Props {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Поле ввода, которое пишет в документ по Enter или потере фокуса,
 * чтобы каждое нажатие клавиши не создавало отдельный шаг истории.
 */
export function TextField({ value, onCommit, placeholder, ariaLabel }: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <input
      className="field"
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          setDraft(value);
          e.currentTarget.blur();
        }
        e.stopPropagation();
      }}
    />
  );
}
