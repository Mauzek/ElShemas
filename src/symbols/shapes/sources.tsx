import { ArrowHead, Lead, polarityDir } from '../primitives';
import type { ShapeProps } from '../types';

const R = 16;

function Body() {
  return (
    <>
      <Lead x1={-40} y1={0} x2={-R} y2={0} />
      <Lead x1={R} y1={0} x2={40} y2={0} />
      <circle className="sch-solid" cx={0} cy={0} r={R} />
    </>
  );
}

/** Источник ЭДС: окружность со стрелкой вдоль ветви. */
export function SourceEmf({ element }: ShapeProps) {
  const d = polarityDir(element.polarity);
  return (
    <>
      <Body />
      <line x1={-10 * d} y1={0} x2={5 * d} y2={0} />
      <ArrowHead x={11 * d} dir={d} size={7} />
    </>
  );
}

/** Источник тока: окружность с двойной шевронной стрелкой. */
export function SourceCurrent({ element }: ShapeProps) {
  const d = polarityDir(element.polarity);
  return (
    <>
      <Body />
      <path d={`M ${-8 * d} -7 L ${1 * d} 0 L ${-8 * d} 7`} />
      <path d={`M ${1 * d} -7 L ${10 * d} 0 L ${1 * d} 7`} />
    </>
  );
}

/** Идеальный источник напряжения: окружность со знаками полярности. */
export function SourceVoltage({ element }: ShapeProps) {
  const d = polarityDir(element.polarity);
  return (
    <>
      <Body />
      <line x1={-9 * d} y1={-5} x2={-9 * d} y2={5} />
      <line x1={-14 * d} y1={0} x2={-4 * d} y2={0} />
      <line x1={5 * d} y1={0} x2={13 * d} y2={0} />
    </>
  );
}

/** Гальванический элемент: длинная и короткая черта. */
export function Battery({ element }: ShapeProps) {
  const d = polarityDir(element.polarity);
  return (
    <>
      <Lead x1={-40} y1={0} x2={-4} y2={0} />
      <Lead x1={4} y1={0} x2={40} y2={0} />
      <line x1={-4 * d} y1={-14} x2={-4 * d} y2={14} />
      <line x1={4 * d} y1={-7} x2={4 * d} y2={7} />
    </>
  );
}

/** Источник синусоидального напряжения. */
export function SourceAc() {
  return (
    <>
      <Body />
      <path d="M -10 0 A 5 5 0 0 1 0 0 A 5 5 0 0 0 10 0" />
    </>
  );
}
