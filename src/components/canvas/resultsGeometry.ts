import type { Point } from '../../types/schema';

export interface Placement {
  /** Центр ветви. */
  cx: number;
  cy: number;
  /** Единичный вектор вдоль ветви: от вывода 0 к выводу 1. */
  dx: number;
  dy: number;
  /** Единичная нормаль: сторона, на которую выносятся подписи результатов. */
  nx: number;
  ny: number;
}

/**
 * Геометрия подписи результата. Подписи выносятся по нормали к оси элемента
 * и всегда на противоположную от обозначения сторону, чтобы не наезжать на «R1».
 */
export function branchPlacement(pa: Point, pb: Point): Placement {
  const vx = pb.x - pa.x;
  const vy = pb.y - pa.y;
  const len = Math.hypot(vx, vy) || 1;
  const dx = vx / len;
  const dy = vy / len;
  let nx = -dy;
  let ny = dx;
  // Обозначение элемента стоит сверху (у вертикальных — слева), поэтому результаты
  // уводим вниз и вправо: две подписи не садятся друг на друга.
  if (ny < -1e-9 || (Math.abs(ny) <= 1e-9 && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }
  return { cx: (pa.x + pb.x) / 2, cy: (pa.y + pb.y) / 2, dx, dy, nx, ny };
}

/** Насколько подписи результата отступают от оси ветви, чтобы не наехать на номинал. */
export function clearanceFor(box: { w: number; h: number }, nx: number, ny: number, hasValueLabel: boolean): number {
  const halfExtent = (Math.abs(box.w * nx) + Math.abs(box.h * ny)) / 2;
  return halfExtent + (hasValueLabel ? 24 : 8);
}

/** Стрелка тока: отрезок с наконечником, направленный вдоль (dx, dy). */
export function arrowPath(cx: number, cy: number, dx: number, dy: number, length = 26): string {
  const half = length / 2;
  const x1 = cx - dx * half;
  const y1 = cy - dy * half;
  const x2 = cx + dx * half;
  const y2 = cy + dy * half;
  const head = 6;
  const px = -dy;
  const py = dx;
  return [
    `M ${x1} ${y1} L ${x2} ${y2}`,
    `M ${x2 - dx * head + px * head * 0.55} ${y2 - dy * head + py * head * 0.55}`,
    `L ${x2} ${y2}`,
    `L ${x2 - dx * head - px * head * 0.55} ${y2 - dy * head - py * head * 0.55}`,
  ].join(' ');
}

/** Цвет узла на карте потенциалов: от синего (минимум) к красному (максимум). */
export function potentialColor(value: number, min: number, max: number): string {
  const span = max - min;
  const t = span > 1e-12 ? (value - min) / span : 0.5;
  const hue = 220 - 220 * t;
  return `hsl(${hue.toFixed(0)} 75% 48%)`;
}

/** Толщина провода по величине тока: ограничена, чтобы схема не превращалась в кляксу. */
export function currentWidth(abs: number, max: number): number {
  if (!(max > 0) || !Number.isFinite(abs)) return 2;
  const t = Math.sqrt(Math.min(1, abs / max));
  return 1.5 + t * 6.5;
}
