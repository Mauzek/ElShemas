import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface TipState {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

const DELAY = 140;
const GAP = 8;

/**
 * Единый быстрый тултип для всего интерфейса.
 * Перехватывает нативный `title` (браузер показывает его почти через секунду),
 * переносит текст в `data-tip` и рисует собственную подсказку.
 */
export function Tooltips() {
  const [tip, setTip] = useState<TipState | null>(null);

  // У кнопок с одной иконкой подсказка — единственное название,
  // поэтому она же становится доступным именем для скринридера.
  useEffect(() => {
    let frame = 0;
    const labelAll = () => {
      for (const node of document.querySelectorAll<HTMLElement>('[data-tip]')) {
        const text = node.getAttribute('data-tip');
        if (!text || node.getAttribute('aria-label') || node.textContent?.trim()) continue;
        node.setAttribute('aria-label', text);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(labelAll);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    const textOf = (el: HTMLElement): string | null => el.getAttribute('data-tip');

    const show = (el: HTMLElement, text: string) => {
      const rect = el.getBoundingClientRect();
      const below = rect.top < 60;
      setTip({
        text,
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(below ? rect.bottom + GAP : rect.top - GAP),
        below,
      });
    };

    const hide = () => {
      window.clearTimeout(timer);
      setTip(null);
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement) && !(target instanceof SVGElement)) return;
      const el = (target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null;
      if (!el) {
        hide();
        return;
      }
      const text = textOf(el);
      if (!text) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => show(el, text), DELAY);
    };

    window.addEventListener('pointerover', onOver, true);
    window.addEventListener('pointerdown', hide, true);
    window.addEventListener('keydown', hide, true);
    window.addEventListener('wheel', hide, { passive: true });
    window.addEventListener('blur', hide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerover', onOver, true);
      window.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('keydown', hide, true);
      window.removeEventListener('wheel', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);

  if (!tip) return null;
  return createPortal(
    <div
      className="tooltip no-print"
      role="tooltip"
      style={{
        left: tip.x,
        top: tip.y,
        transform: `translate(-50%, ${tip.below ? '0' : '-100%'})`,
      }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
