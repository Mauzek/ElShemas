import { memo } from 'react';
import type { Element } from '../types/schema';
import type { SymbolDef } from '../symbols/types';

interface Props {
  def: SymbolDef;
  width?: number;
  height?: number;
}

function dummy(def: SymbolDef): Element {
  return {
    id: `preview-${def.type}`,
    type: def.type,
    x: 0,
    y: 0,
    rotation: 0,
    mirrored: false,
    label: '',
    value: '',
    unit: '',
    showValue: false,
    ...(def.hasPolarity ? { polarity: 'forward' as const } : {}),
  };
}

/** Миниатюра УГО для палитры. */
export const SymbolPreview = memo(function SymbolPreview({ def, width = 56, height = 34 }: Props) {
  const pad = 8;
  const b = def.bbox;
  const vb = `${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}`;
  return (
    <svg className="sch no-hit" width={width} height={height} viewBox={vb} aria-hidden="true">
      <def.Shape element={dummy(def)} />
    </svg>
  );
});
