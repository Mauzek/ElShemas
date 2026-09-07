import { ArrowHead, CoilArcsV, Dot, Lead, Leads, Upright } from '../primitives';
import type { ShapeProps } from '../types';

/** Земля / общая точка. */
export function Ground() {
  return (
    <>
      <Lead x1={0} y1={0} x2={0} y2={10} />
      <line x1={-13} y1={10} x2={13} y2={10} />
      <line x1={-8} y1={16} x2={8} y2={16} />
      <line x1={-3} y1={22} x2={3} y2={22} />
    </>
  );
}

/** Ручной узел — жирная точка соединения. */
export function Junction() {
  return <Dot x={0} y={0} r={3.5} />;
}

/** Клемма двухполюсника (зажим 1, 1′). */
export function Terminal() {
  return <circle className="sch-solid" cx={0} cy={0} r={4.5} />;
}

export function Diode({ element }: ShapeProps) {
  const d = element.polarity === 'reverse' ? -1 : 1;
  return (
    <>
      <Leads body={20} />
      <path className="sch-solid" d={`M ${-10 * d} -11 L ${10 * d} 0 L ${-10 * d} 11 Z`} />
      <line x1={10 * d} y1={-11} x2={10 * d} y2={11} />
    </>
  );
}

/** Идеальный операционный усилитель. */
export function Opamp({ element }: ShapeProps) {
  return (
    <>
      <Lead x1={-40} y1={-20} x2={-20} y2={-20} />
      <Lead x1={-40} y1={20} x2={-20} y2={20} />
      <Lead x1={24} y1={0} x2={40} y2={0} />
      <path className="sch-solid" d="M -20 -32 L -20 32 L 24 0 Z" />
      <Upright element={element}>
        <text className="sch-text sch-meter" x={-8} y={-20} textAnchor="middle" dominantBaseline="central">
          −
        </text>
        <text className="sch-text sch-meter" x={-8} y={20} textAnchor="middle" dominantBaseline="central">
          +
        </text>
      </Upright>
    </>
  );
}

/** Двухобмоточный трансформатор с ферромагнитным сердечником. */
export function Transformer() {
  return (
    <>
      <Lead x1={-40} y1={-40} x2={-14} y2={-40} />
      <Lead x1={-14} y1={-40} x2={-14} y2={-30} />
      <Lead x1={-40} y1={40} x2={-14} y2={40} />
      <Lead x1={-14} y1={40} x2={-14} y2={30} />
      <Lead x1={40} y1={-40} x2={14} y2={-40} />
      <Lead x1={14} y1={-40} x2={14} y2={-30} />
      <Lead x1={40} y1={40} x2={14} y2={40} />
      <Lead x1={14} y1={40} x2={14} y2={30} />
      <CoilArcsV y1={-30} y2={30} x={-14} count={4} left />
      <CoilArcsV y1={-30} y2={30} x={14} count={4} left={false} />
      <line x1={-4} y1={-34} x2={-4} y2={34} />
      <line x1={4} y1={-34} x2={4} y2={34} />
      <Dot x={-24} y={-36} r={3} />
      <Dot x={24} y={-36} r={3} />
    </>
  );
}

/** Стрелка тока — аннотация вдоль ветви. */
export function CurrentArrow({ element }: ShapeProps) {
  const d = element.polarity === 'reverse' ? -1 : 1;
  return (
    <>
      <line x1={-22 * d} y1={0} x2={14 * d} y2={0} />
      <ArrowHead x={22 * d} dir={d} size={9} />
    </>
  );
}

/** Стрелка напряжения между двумя точками ветви. */
export function VoltageArrow({ element }: ShapeProps) {
  const d = element.polarity === 'reverse' ? -1 : 1;
  return (
    <>
      <line x1={-28 * d} y1={-8} x2={-28 * d} y2={8} />
      <line x1={28 * d} y1={-8} x2={28 * d} y2={8} />
      <line x1={-28 * d} y1={0} x2={20 * d} y2={0} />
      <ArrowHead x={28 * d} dir={d} size={9} />
    </>
  );
}

/** Направление обхода контура — дуга со стрелкой. */
export function LoopArrow({ element }: ShapeProps) {
  const reverse = element.polarity === 'reverse';
  const r = 22;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const at = (deg: number) => `${(r * Math.cos(rad(deg))).toFixed(2)} ${(r * Math.sin(rad(deg))).toFixed(2)}`;
  // Дуга 320° из двух сегментов по 160°, чтобы центр гарантированно был в якоре.
  const sweep = reverse ? 0 : 1;
  const step = reverse ? -160 : 160;
  const start = reverse ? 70 : 110;
  const d = `M ${at(start)} A ${r} ${r} 0 0 ${sweep} ${at(start + step)} A ${r} ${r} 0 0 ${sweep} ${at(
    start + step * 2,
  )}`;
  const endDeg = start + step * 2;
  const tangent = reverse ? endDeg - 90 : endDeg + 90;
  return (
    <>
      <path d={d} />
      <path
        className="sch-ink"
        transform={`translate(${at(endDeg)}) rotate(${tangent})`}
        d="M 0 0 L -9 -5 L -9 5 Z"
      />
    </>
  );
}
