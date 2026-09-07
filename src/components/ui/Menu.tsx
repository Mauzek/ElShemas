import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { usePopup, type PopupAlign, type PopupPlacement } from './usePopup';

export interface MenuItem {
  icon?: LucideIcon;
  label: string;
  /** Горячая клавиша или пояснение справа. */
  hint?: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface Props {
  sections: MenuSection[];
  children: ReactNode;
  className?: string;
  tip?: string;
  ariaLabel: string;
  align?: PopupAlign;
  placement?: PopupPlacement;
  width?: number;
}

const ITEM = 32;
const TITLE = 24;

/** Меню-кебаб с разделами: файловые операции, действия карточки схемы и т. п. */
export function Menu({
  sections,
  children,
  className = 'tbtn',
  tip,
  ariaLabel,
  align = 'start',
  placement = 'auto',
  width = 236,
}: Props) {
  const height =
    sections.reduce((acc, s) => acc + s.items.length * ITEM + (s.title ? TITLE : 0), 0) + sections.length * 6 + 10;
  const { open, setOpen, box, anchorRef, popupRef } = usePopup({ height, placement, align, width });

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`${className} ${open ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-tip={tip ?? ariaLabel}
      >
        {children}
      </button>

      {open &&
        box &&
        createPortal(
          <div
            ref={popupRef}
            className="menu-popup"
            role="menu"
            aria-label={ariaLabel}
            style={{ left: box.left, top: box.top, width: box.width }}
          >
            {sections.map((section, si) => (
              <div key={section.title ?? si} className={si > 0 ? 'menu-section divider-t' : 'menu-section'}>
                {section.title && <p className="section-title menu-title">{section.title}</p>}
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={`menu-item ${item.danger ? 'danger' : ''}`}
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                  >
                    {item.icon && <item.icon size={15} className="menu-icon" />}
                    <span className="truncate">{item.label}</span>
                    {item.hint && <span className="menu-hint">{item.hint}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
