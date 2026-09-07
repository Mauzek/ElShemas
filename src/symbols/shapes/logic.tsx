import { Lead, Upright } from '../primitives';
import type { ShapeProps } from '../types';

/**
 * Логический элемент по ГОСТ 2.743: прямоугольник с функциональной меткой,
 * инверсия выхода — кружок на выводе.
 */
function Gate({
  mark,
  inverted,
  single,
  element,
}: { mark: string; inverted: boolean; single?: boolean } & ShapeProps) {
  return (
    <>
      {single ? (
        <Lead x1={-40} y1={0} x2={-20} y2={0} />
      ) : (
        <>
          <Lead x1={-40} y1={-20} x2={-20} y2={-20} />
          <Lead x1={-40} y1={20} x2={-20} y2={20} />
        </>
      )}
      <rect className="sch-solid" x={-20} y={-32} width={40} height={64} />
      <Lead x1={inverted ? 27 : 20} y1={0} x2={40} y2={0} />
      {inverted && <circle className="sch-solid" cx={23.5} cy={0} r={3.5} />}
      <Upright element={element}>
        <text className="sch-text sch-meter" x={0} y={-19} textAnchor="middle" dominantBaseline="central">
          {mark}
        </text>
      </Upright>
    </>
  );
}

export function LogicAnd({ element }: ShapeProps) {
  return <Gate mark="&" inverted={false} element={element} />;
}

export function LogicOr({ element }: ShapeProps) {
  return <Gate mark="1" inverted={false} element={element} />;
}

export function LogicNot({ element }: ShapeProps) {
  return <Gate mark="1" inverted single element={element} />;
}

export function LogicNand({ element }: ShapeProps) {
  return <Gate mark="&" inverted element={element} />;
}

export function LogicNor({ element }: ShapeProps) {
  return <Gate mark="1" inverted element={element} />;
}

export function LogicXor({ element }: ShapeProps) {
  return <Gate mark="=1" inverted={false} element={element} />;
}
