import { Lead, Upright } from '../primitives';
import type { ShapeProps } from '../types';

const R = 16;

function Meter({ letter, element }: { letter: string } & ShapeProps) {
  return (
    <>
      <Lead x1={-40} y1={0} x2={-R} y2={0} />
      <Lead x1={R} y1={0} x2={40} y2={0} />
      <circle className="sch-solid" cx={0} cy={0} r={R} />
      <Upright element={element}>
        <text className="sch-text sch-meter" x={0} y={0} textAnchor="middle" dominantBaseline="central">
          {letter}
        </text>
      </Upright>
    </>
  );
}

export function Ammeter({ element }: ShapeProps) {
  return <Meter letter="A" element={element} />;
}

export function Voltmeter({ element }: ShapeProps) {
  return <Meter letter="V" element={element} />;
}

export function Wattmeter({ element }: ShapeProps) {
  return <Meter letter="W" element={element} />;
}
