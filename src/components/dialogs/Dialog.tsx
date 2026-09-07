import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Dialog({ title, onClose, children, footer, width = 520 }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="dialog-backdrop no-print" onPointerDown={onClose}>
      <div
        className="dialog"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="divider-b flex items-center justify-between px-3" style={{ height: 40 }}>
          <h2 style={{ fontWeight: 500 }}>{title}</h2>
          <button className="tbtn" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-3">{children}</div>
        {footer && <div className="divider-t flex items-center justify-end gap-2 p-3">{footer}</div>}
      </div>
    </div>
  );
}
