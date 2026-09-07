import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  /** Куда раскрывать список; 'auto' выбирает сторону по месту на экране. */
  placement?: 'auto' | 'top' | 'bottom';
  width?: number;
  ariaLabel?: string;
  title?: string;
}

const ITEM_HEIGHT = 30;

/**
 * Выпадающий список вместо нативного select: единый вид в обеих темах,
 * меню рендерится в портал, поэтому не обрезается прокруткой панелей.
 */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  placement = 'auto',
  width,
  ariaLabel,
  title,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuHeight = options.length * ITEM_HEIGHT + 10;
    const spaceBelow = window.innerHeight - rect.bottom;
    const up = placement === 'top' || (placement === 'auto' && spaceBelow < menuHeight + 16);
    const menuWidth = Math.max(rect.width, 132);
    setBox({
      left: Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8),
      top: up ? rect.top - menuHeight - 6 : rect.bottom + 6,
      width: menuWidth,
    });
  }, [open, options.length, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const close = () => setOpen(false);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', close);
    window.addEventListener('wheel', close, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('wheel', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="field dropdown-trigger"
        style={width ? { width } : undefined}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-tip={title ?? ariaLabel}
      >
        <span className="truncate">{current?.label ?? '—'}</span>
        <ChevronDown size={14} style={{ flex: '0 0 auto', color: 'var(--ui-muted)' }} />
      </button>

      {open &&
        box &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu"
            role="listbox"
            aria-label={ariaLabel}
            style={{ left: box.left, top: box.top, width: box.width }}
          >
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`dropdown-item ${option.value === value ? 'active' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.hint && <span className="dropdown-hint">{option.hint}</span>}
                {option.value === value && <Check size={14} style={{ flex: '0 0 auto' }} />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
