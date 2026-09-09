import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDoc } from '../store/useDoc';
import { branchOf, useResults } from '../store/useResults';
import { formatSi } from '../lib/units';
import type { BranchResult } from '../lib/solver/types';

interface Hover {
  x: number;
  y: number;
  branch: BranchResult;
}

const CARD_WIDTH = 168;

/** Карточка с подробностями ветви при наведении на элемент в режиме расчёта. */
export function ResultsTip() {
  const enabled = useDoc((s) => s.doc.analysis.enabled);
  const digits = useDoc((s) => s.doc.analysis.digits);
  const shown = useResults((s) => s.shown);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    if (!enabled || !shown) {
      setHover(null);
      return;
    }
    const onMove = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest('[data-kind="element"][data-id]') : null;
      const id = target?.getAttribute('data-id');
      const branch = id ? branchOf(shown, id) : null;
      if (!branch) {
        setHover(null);
        return;
      }
      setHover({ x: e.clientX, y: e.clientY, branch });
    };
    const onLeave = () => setHover(null);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('pointerdown', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointerdown', onLeave);
    };
  }, [enabled, shown]);

  if (!hover) return null;

  const { branch } = hover;
  const rows: [string, string][] = [];
  if (branch.resistance !== null) rows.push(['R', formatSi(branch.resistance, 'Ом', digits)]);
  if (Number.isFinite(branch.current)) rows.push(['I', formatSi(branch.current, 'А', digits)]);
  if (Number.isFinite(branch.voltage)) rows.push(['U', formatSi(branch.voltage, 'В', digits)]);
  if (Number.isFinite(branch.power)) {
    rows.push([branch.power < 0 ? 'P отдаёт' : 'P', formatSi(Math.abs(branch.power), 'Вт', digits)]);
  }

  const left = Math.min(hover.x + 16, window.innerWidth - CARD_WIDTH - 8);
  const top = Math.min(hover.y + 18, window.innerHeight - 24 - rows.length * 17 - 20);

  return createPortal(
    <div className="res-card" style={{ left, top, width: CARD_WIDTH }} role="status">
      <b>{branch.label}</b>
      {rows.map(([name, value]) => (
        <span className="res-card-row" key={name}>
          <span style={{ color: 'var(--ui-muted)' }}>{name}</span>
          <b>{value}</b>
        </span>
      ))}
    </div>,
    document.body,
  );
}
