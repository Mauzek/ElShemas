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

export function fitViewport(view: { width: number; height: number }, content: Rect | null, padding = 60): Viewport {
  if (!content) return { x: view.width / 2, y: view.height / 2, zoom: 1 };
  const box = content;
  const zoom = clampZoom(
    Math.min((view.width - padding * 2) / Math.max(box.w, 1), (view.height - padding * 2) / Math.max(box.h, 1)),
  );
  return {
    zoom,
    x: view.width / 2 - (box.x + box.w / 2) * zoom,
    y: view.height / 2 - (box.y + box.h / 2) * zoom,
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
