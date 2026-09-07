import { Dot, Lead } from '../primitives';

export function SwitchOpen() {
  return (
    <>
      <Lead x1={-40} y1={0} x2={-14} y2={0} />
      <Lead x1={14} y1={0} x2={40} y2={0} />
      <Dot x={-14} y={0} r={2.5} />
      <Dot x={14} y={0} r={2.5} />
      <line x1={-14} y1={0} x2={12} y2={-16} />
    </>
  );
}

export function SwitchClosed() {
  return (
    <>
      <Lead x1={-40} y1={0} x2={-14} y2={0} />
      <Lead x1={14} y1={0} x2={40} y2={0} />
      <Dot x={-14} y={0} r={2.5} />
      <Dot x={14} y={0} r={2.5} />
      <line x1={-14} y1={0} x2={14} y2={0} />
      <line x1={14} y1={0} x2={18} y2={-8} />
    </>
  );
}
