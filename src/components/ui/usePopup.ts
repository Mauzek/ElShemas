import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PopupPlacement = 'auto' | 'top' | 'bottom';
export type PopupAlign = 'start' | 'center' | 'end';

export interface PopupBox {
  left: number;
  top: number;
  width: number;
}

interface Options {
  /** Ожидаемая высота содержимого — по ней выбирается сторона раскрытия. */
  height: number;
  placement?: PopupPlacement;
  align?: PopupAlign;
  /** Ширина меню; по умолчанию не уже кнопки. */
  width?: number;
  minWidth?: number;
}

/**
 * Позиционирование всплывающего слоя относительно кнопки.
 * Слой рисуется в портале с `position: fixed`, поэтому не обрезается
 * прокруткой панелей и не зависит от их overflow.
 */
export function usePopup<T extends HTMLElement = HTMLButtonElement>(options: Options) {
  const { height, placement = 'auto', align = 'start', width, minWidth = 132 } = options;
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PopupBox | null>(null);
  const anchorRef = useRef<T>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const up = placement === 'top' || (placement === 'auto' && spaceBelow < height + 16);
    const menuWidth = Math.max(width ?? rect.width, minWidth);
    const rawLeft =
      align === 'end' ? rect.right - menuWidth : align === 'center' ? rect.left + rect.width / 2 - menuWidth / 2 : rect.left;
    setBox({
      left: Math.min(Math.max(8, rawLeft), Math.max(8, window.innerWidth - menuWidth - 8)),
      top: up ? Math.max(8, rect.top - height - 6) : rect.bottom + 6,
      width: menuWidth,
    });
  }, [open, height, placement, align, width, minWidth]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        anchorRef.current?.focus();
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

  return { open, setOpen, box, anchorRef, popupRef };
}
