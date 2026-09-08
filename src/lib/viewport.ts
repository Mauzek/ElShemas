import type { Point, Rect } from '../types/schema';
import type { Viewport } from '../store/useUi';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

export function screenToWorld(vp: Viewport, clientX: number, clientY: number, rect: DOMRect): Point {
  return {
    x: (clientX - rect.left - vp.x) / vp.zoom,
    y: (clientY - rect.top - vp.y) / vp.zoom,
  };
}

export function worldToScreen(vp: Viewport, p: Point): Point {
  return { x: p.x * vp.zoom + vp.x, y: p.y * vp.zoom + vp.y };
}

/** Масштаб к позиции курсора: точка под курсором остаётся на месте. */
export function zoomAt(vp: Viewport, factor: number, screenX: number, screenY: number): Viewport {
  const zoom = clampZoom(vp.zoom * factor);
  const wx = (screenX - vp.x) / vp.zoom;
  const wy = (screenY - vp.y) / vp.zoom;
  return { zoom, x: screenX - wx * zoom, y: screenY - wy * zoom };
}

export interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const NO_INSETS: Insets = { left: 0, right: 0, top: 0, bottom: 0 };

/**
 * Вписывает содержимое в свободную часть полотна.
 * `insets` — области, перекрытые плавающими панелями: центр считается по ним,
 * иначе схема уезжала бы под палитру и панель свойств.
 */
export function fitViewport(
  view: { width: number; height: number },
  content: Rect | null,
  padding = 60,
  insets: Insets = NO_INSETS,
): Viewport {
  const freeLeft = insets.left;
  const freeTop = insets.top;
  const freeWidth = Math.max(120, view.width - insets.left - insets.right);
  const freeHeight = Math.max(120, view.height - insets.top - insets.bottom);
  const centerX = freeLeft + freeWidth / 2;
  const centerY = freeTop + freeHeight / 2;
  if (!content) return { x: centerX, y: centerY, zoom: 1 };
  const box = content;
  // Мелкую схему не раздуваем во весь экран: потолок вписывания — 200 %.
  const zoom = clampZoom(
    Math.min(
      2,
      (freeWidth - padding * 2) / Math.max(box.w, 1),
      (freeHeight - padding * 2) / Math.max(box.h, 1),
    ),
  );
  return {
    zoom,
    x: centerX - (box.x + box.w / 2) * zoom,
    y: centerY - (box.y + box.h / 2) * zoom,
  };
}

/** Видимая область полотна в мировых координатах. */
export function visibleRect(vp: Viewport, width: number, height: number): Rect {
  return {
    x: -vp.x / vp.zoom,
    y: -vp.y / vp.zoom,
    w: width / vp.zoom,
    h: height / vp.zoom,
  };
}
