import { ArrowHead, ArrowHeadAt, Lead, Leads, Upright } from '../primitives';
import type { ShapeProps } from '../types';

/** Четырёхполюсник с выводами 1–1′ и 2–2′. */
export function Quadripole({ element }: ShapeProps) {
  return (
    <>
      <Lead x1={-60} y1={-20} x2={-40} y2={-20} />
      <Lead x1={-60} y1={20} x2={-40} y2={20} />
      <Lead x1={60} y1={-20} x2={40} y2={-20} />
      <Lead x1={60} y1={20} x2={40} y2={20} />
      <rect className="sch-solid" x={-40} y={-40} width={80} height={80} />
      <Upright element={element}>
        <text className="sch-text sch-meter" x={0} y={0} textAnchor="middle" dominantBaseline="central">
          П
        </text>
      </Upright>
    </>
  );
}

/** Нелинейный резистор: прямоугольник с косой чертой. */
export function ResistorNonlinear() {
  return (
    <>
      <Leads />
      <rect className="sch-solid" x={-20} y={-10} width={40} height={20} />
      <line x1={-14} y1={14} x2={14} y2={-14} />
    </>
  );
}

/** Плавкий предохранитель. */
export function Fuse() {
  return (
    <>
      <Leads />
      <rect className="sch-solid" x={-20} y={-8} width={40} height={16} />
      <line x1={-20} y1={0} x2={20} y2={0} />
    </>
  );
}

/** Трёхфазный источник: обмотки, соединённые звездой. */
export function SourceThreePhase({ element }: ShapeProps) {
  const arm = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `M 0 0 L ${(16 * Math.cos(rad)).toFixed(2)} ${(16 * Math.sin(rad)).toFixed(2)}`;
  };
  return (
    <>
      <circle className="sch-solid" cx={0} cy={0} r={26} />
      <path d={arm(-90)} />
      <path d={arm(30)} />
      <path d={arm(150)} />
      <Lead x1={26} y1={-40} x2={60} y2={-40} />
      <Lead x1={26} y1={0} x2={60} y2={0} />
      <Lead x1={26} y1={40} x2={60} y2={40} />
      <path d="M 18 -18 L 26 -30 L 26 -40" />
      <path d="M 26 0 L 18 0" />
      <path d="M 18 18 L 26 30 L 26 40" />
      <Lead x1={-26} y1={0} x2={-60} y2={0} />
      <Upright element={element}>
        <text className="sch-text" x={0} y={-38} textAnchor="middle" fontSize={12} fontStyle="italic">
          3~
        </text>
      </Upright>
    </>
  );
}

/** Вектор для векторной диаграммы: поворачивается на любой угол, кратный 45°. */
export function VectorArrow() {
  return (
    <>
      <line x1={0} y1={0} x2={52} y2={0} />
      <ArrowHead x={60} dir={1} size={10} />
    </>
  );
}

/** Оси комплексной плоскости для векторных диаграмм. */
export function ComplexAxes({ element }: ShapeProps) {
  return (
    <>
      <line x1={-10} y1={0} x2={92} y2={0} />
      <ArrowHead x={100} dir={1} size={9} />
      <line x1={0} y1={10} x2={0} y2={-92} />
      <ArrowHeadAt x={0} y={-100} angle={-Math.PI / 2} size={9} />
      <Upright element={element}>
        <text className="sch-text" x={96} y={18} textAnchor="middle" fontSize={14} fontStyle="italic">
          +1
        </text>
        <text className="sch-text" x={16} y={-96} textAnchor="middle" fontSize={14} fontStyle="italic">
          +j
        </text>
      </Upright>
    </>
  );
}
