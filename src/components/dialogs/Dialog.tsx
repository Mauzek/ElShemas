import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  /** Поясняющая строка под заголовком. */
  description?: string;
  icon?: LucideIcon;
  /** Оттенок значка: акцентный по умолчанию. */
  tone?: 'accent' | 'danger';
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  /** Убирает внутренние отступы у содержимого — для списков во всю ширину. */
  flush?: boolean;
}

/** Модальное окно: затемнение, шапка со значком, прокручиваемое тело и футер. */
export function Dialog({
  title,
  description,
  icon: Icon,
  tone = 'accent',
  onClose,
  children,
  footer,
  width = 520,
  flush = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      // Фокус не должен уходить за пределы модального окна.
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="dialog-backdrop no-print" onPointerDown={onClose}>
      <div
        ref={ref}
        className="dialog"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          {Icon && (
            <span className={`dialog-icon ${tone}`} aria-hidden="true">
              <Icon size={18} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="dialog-title">{title}</h2>
            {description && <p className="dialog-desc">{description}</p>}
          </div>
          <button className="tbtn" onClick={onClose} aria-label="Закрыть" data-tip="Закрыть (Esc)">
            <X size={16} />
          </button>
        </div>
        <div className={`scroll-thin dialog-body ${flush ? 'flush' : ''}`}>{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}
