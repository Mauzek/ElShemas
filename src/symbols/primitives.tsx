/** Общие геометрические константы и мелкие SVG-примитивы для УГО. */

export const HALF = 40; // расстояние от якоря до вывода двухполюсника
export const BODY = 40; // длина корпуса
export const BODY_H = 16; // высота корпуса резистора

interface LeadProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function Lead({ x1, y1, x2, y2 }: LeadProps) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} />;
}

/** Выводы двухполюсника слева и справа от корпуса шириной `body`. */
export function Leads({ body = BODY, half = HALF }: { body?: number; half?: number }) {
  return (
    <>
      <Lead x1={-half} y1={0} x2={-body / 2} y2={0} />
      <Lead x1={body / 2} y1={0} x2={half} y2={0} />
    </>
  );
}

/** Треугольный наконечник стрелки, направленный вдоль оси X. */
export function ArrowHead({
  x,
  y = 0,
  dir = 1,
  size = 8,
}: {
  x: number;
  y?: number;
  dir?: 1 | -1;
  size?: number;
}) {
  const w = size;
  const h = size * 0.55;
  return (
    <path className="sch-ink" d={`M ${x} ${y} L ${x - dir * w} ${y - h} L ${x - dir * w} ${y + h} Z`} />
  );
}

/** Наконечник произвольного направления (для диагональных стрелок и дуг). */
export function ArrowHeadAt({
  x,
  y,
  angle,
  size = 8,
}: {
  x: number;
  y: number;
  angle: number;
  size: number;
}) {
  const h = size * 0.55;
  return (
    <path
      className="sch-ink"
      transform={`translate(${x} ${y}) rotate(${(angle * 180) / Math.PI})`}
      d={`M 0 0 L ${-size} ${-h} L ${-size} ${h} Z`}
    />
  );
}

/** Точка соединения / начало обмотки. */
export function Dot({ x, y, r = 3.5 }: { x: number; y: number; r?: number }) {
  return <circle className="sch-ink" cx={x} cy={y} r={r} />;
}

/** Дуги катушки индуктивности вдоль оси X. */
export function CoilArcs({
  x1,
  x2,
  y = 0,
  count = 4,
  up = true,
}: {
  x1: number;
  x2: number;
  y?: number;
  count?: number;
  up?: boolean;
}) {
  const step = (x2 - x1) / count;
  const r = step / 2;
  const sweep = up ? 1 : 0;
  let d = `M ${x1} ${y}`;
  for (let i = 0; i < count; i++) {
    d += ` A ${r} ${r} 0 0 ${sweep} ${x1 + step * (i + 1)} ${y}`;
  }
  return <path d={d} />;
}

/** Дуги катушки вдоль оси Y (для трансформатора). */
export function CoilArcsV({
  y1,
  y2,
  x = 0,
  count = 4,
  left = true,
}: {
  y1: number;
  y2: number;
  x?: number;
  count?: number;
  left?: boolean;
}) {
  const step = (y2 - y1) / count;
  const r = step / 2;
  const sweep = left ? 0 : 1;
  let d = `M ${x} ${y1}`;
  for (let i = 0; i < count; i++) {
    d += ` A ${r} ${r} 0 0 ${sweep} ${x} ${y1 + step * (i + 1)}`;
  }
  return <path d={d} />;
}

export const polarityDir = (polarity: 'forward' | 'reverse' | undefined): 1 | -1 =>
  polarity === 'reverse' ? -1 : 1;

/**
 * Компенсирует поворот и зеркало элемента, чтобы вложенный текст
 * (буква прибора, знаки полярности) всегда читался горизонтально.
 */
export function Upright({
  element,
  children,
}: {
  element: { rotation: number; mirrored: boolean };
  children: React.ReactNode;
}) {
  const m = element.mirrored ? -1 : 1;
  return <g transform={`scale(${m},1) rotate(${-element.rotation})`}>{children}</g>;
}
