import { useUi } from '../../store/useUi';
import { ArrowHeadAt, CoilArcs, Dot, Lead, Leads } from '../primitives';

export function Resistor() {
  return (
    <>
      <Leads />
      <rect className="sch-solid" x={-20} y={-8} width={40} height={16} />
    </>
  );
}

export function ResistorVar() {
  return (
    <>
      <Leads />
      <rect className="sch-solid" x={-20} y={-8} width={40} height={16} />
      <line x1={-24} y1={16} x2={20} y2={-14} />
      <ArrowHeadAt x={24} y={-16.7} angle={Math.atan2(-30, 44)} size={9} />
    </>
  );
}

export function ResistorTrim() {
  return (
    <>
      <Leads />
      <rect className="sch-solid" x={-20} y={-8} width={40} height={16} />
      <line x1={-24} y1={16} x2={20} y2={-14} />
      <line x1={10} y1={-18} x2={26} y2={-8} />
    </>
  );
}

export function Capacitor() {
  return (
    <>
      <Lead x1={-40} y1={0} x2={-5} y2={0} />
      <Lead x1={5} y1={0} x2={40} y2={0} />
      <line x1={-5} y1={-14} x2={-5} y2={14} />
      <line x1={5} y1={-14} x2={5} y2={14} />
    </>
  );
}

export function CapacitorPol() {
  return (
    <>
      <Lead x1={-40} y1={0} x2={-6} y2={0} />
      <Lead x1={7} y1={0} x2={40} y2={0} />
      <line x1={-6} y1={-14} x2={-6} y2={14} />
      <path d="M 13 -14 A 22 22 0 0 0 13 14" />
      <line x1={-18} y1={-14} x2={-18} y2={-6} />
      <line x1={-22} y1={-10} x2={-14} y2={-10} />
    </>
  );
}

export function Inductor() {
  const style = useUi((s) => s.settings.inductorStyle);
  if (style === 'arcs') {
    return (
      <>
        <Lead x1={-40} y1={0} x2={-20} y2={0} />
        <Lead x1={20} y1={0} x2={40} y2={0} />
        <CoilArcs x1={-20} x2={20} count={4} up />
      </>
    );
  }
  return (
    <>
      <Leads />
      <rect className="sch-solid" x={-20} y={-6} width={40} height={12} />
      <line x1={-20} y1={6} x2={20} y2={6} />
    </>
  );
}

/** Две индуктивно связанные катушки: точки начала обмоток и штриховая линия связи. */
export function MutualInductance() {
  const style = useUi((s) => s.settings.inductorStyle);
  const coil = (y: number, up: boolean) =>
    style === 'arcs' ? (
      <CoilArcs x1={-20} x2={20} y={y} count={4} up={up} />
    ) : (
      <rect className="sch-solid" x={-20} y={y - 6} width={40} height={12} />
    );
  return (
    <>
      <Lead x1={-60} y1={-20} x2={-20} y2={-20} />
      <Lead x1={20} y1={-20} x2={60} y2={-20} />
      <Lead x1={-60} y1={20} x2={-20} y2={20} />
      <Lead x1={20} y1={20} x2={60} y2={20} />
      {coil(-20, true)}
      {coil(20, false)}
      <line className="sch-dash" x1={-24} y1={0} x2={24} y2={0} />
      <Dot x={-26} y={-28} r={3} />
      <Dot x={-26} y={28} r={3} />
    </>
  );
}
