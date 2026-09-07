import { ArrowHeadAt, Lead, Leads } from '../primitives';
import type { ShapeProps } from '../types';

/** Стабилитрон: катод с отогнутыми концами. */
export function Zener({ element }: ShapeProps) {
  const d = element.polarity === 'reverse' ? -1 : 1;
  return (
    <>
      <Leads body={20} />
      <path className="sch-solid" d={`M ${-10 * d} -11 L ${10 * d} 0 L ${-10 * d} 11 Z`} />
      <path d={`M ${18 * d} -15 L ${10 * d} -11 L ${10 * d} 11 L ${18 * d} 15`} />
    </>
  );
}

/** Светодиод: диод с двумя стрелками излучения. */
export function Led({ element }: ShapeProps) {
  const d = element.polarity === 'reverse' ? -1 : 1;
  return (
    <>
      <Leads body={20} />
      <path className="sch-solid" d={`M ${-10 * d} -11 L ${10 * d} 0 L ${-10 * d} 11 Z`} />
      <line x1={10 * d} y1={-11} x2={10 * d} y2={11} />
      <line x1={-6} y1={-16} x2={4} y2={-26} />
      <ArrowHeadAt x={6} y={-28} angle={-Math.PI / 4} size={7} />
      <line x1={4} y1={-14} x2={14} y2={-24} />
      <ArrowHeadAt x={16} y={-26} angle={-Math.PI / 4} size={7} />
    </>
  );
}

/** Тиристор: диод с управляющим электродом. */
export function Thyristor({ element }: ShapeProps) {
  const d = element.polarity === 'reverse' ? -1 : 1;
  return (
    <>
      <Leads body={20} />
      <path className="sch-solid" d={`M ${-10 * d} -11 L ${10 * d} 0 L ${-10 * d} 11 Z`} />
      <line x1={10 * d} y1={-11} x2={10 * d} y2={11} />
      <line x1={10 * d} y1={8} x2={20 * d} y2={20} />
      <line x1={20 * d} y1={20} x2={20 * d} y2={40} />
    </>
  );
}

const R = 24;

function Bipolar({ npn }: { npn: boolean }) {
  // Эмиттер направлен вниз-вправо; стрелка у n-p-n смотрит от базы.
  const ex = 20;
  const ey = 24;
  const angle = Math.atan2(ey - 8, ex + 12);
  return (
    <>
      <circle className="sch-solid" cx={2} cy={0} r={R} />
      <Lead x1={-40} y1={0} x2={-12} y2={0} />
      <line x1={-12} y1={-16} x2={-12} y2={16} />
      <line x1={-12} y1={-8} x2={ex} y2={-ey} />
      <Lead x1={ex} y1={-ey} x2={ex} y2={-40} />
      <line x1={-12} y1={8} x2={ex} y2={ey} />
      <Lead x1={ex} y1={ey} x2={ex} y2={40} />
      {npn ? (
        <ArrowHeadAt x={ex - 1} y={ey - 1} angle={angle} size={9} />
      ) : (
        <ArrowHeadAt x={-6} y={11} angle={angle + Math.PI} size={9} />
      )}
    </>
  );
}

export function TransistorNpn() {
  return <Bipolar npn />;
}

export function TransistorPnp() {
  return <Bipolar npn={false} />;
}

/** Полевой транзистор с изолированным затвором, n-канал. */
export function TransistorFet() {
  return (
    <>
      <circle className="sch-solid" cx={2} cy={0} r={R} />
      <Lead x1={-40} y1={0} x2={-16} y2={0} />
      <line x1={-16} y1={-16} x2={-16} y2={16} />
      <line x1={-8} y1={-18} x2={-8} y2={-8} />
      <line x1={-8} y1={-5} x2={-8} y2={5} />
      <line x1={-8} y1={8} x2={-8} y2={18} />
      <line x1={-8} y1={-16} x2={20} y2={-16} />
      <Lead x1={20} y1={-16} x2={20} y2={-40} />
      <line x1={-8} y1={16} x2={20} y2={16} />
      <Lead x1={20} y1={16} x2={20} y2={40} />
      <line x1={-8} y1={0} x2={20} y2={0} />
      <line x1={20} y1={0} x2={20} y2={16} />
      <ArrowHeadAt x={-6} y={0} angle={Math.PI} size={9} />
    </>
  );
}
