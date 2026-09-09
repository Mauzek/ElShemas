import { memo, useMemo } from 'react';
import type { PointerEvent } from 'react';
import type { AnalysisSettings, Element, SchemaFile } from '../../types/schema';
import type { BranchResult, DcResult } from '../../lib/solver/types';
import type { Connectivity } from '../../lib/nodes';
import { elementBBox } from '../../lib/geometry';
import { formatSi } from '../../lib/units';
import { useDoc } from '../../store/useDoc';
import { useResults } from '../../store/useResults';
import { arrowPath, branchPlacement, clearanceFor, currentWidth, potentialColor } from './resultsGeometry';

interface Props {
  doc: SchemaFile;
  conn: Connectivity;
}

/** Подписи результатов у одной ветви: ток со стрелкой, напряжение, мощность. */
const BranchView = memo(function BranchView({
  branch,
  element,
  analysis,
}: {
  branch: BranchResult;
  element: Element | undefined;
  analysis: AnalysisSettings;
}) {
  const { cx, cy, dx, dy, nx, ny } = branchPlacement(branch.pa, branch.pb);
  const digits = analysis.digits;
  const hasCurrent = Number.isFinite(branch.current);
  const flip = !analysis.signedCurrents && hasCurrent && branch.current < 0;
  const shown = analysis.signedCurrents ? branch.current : Math.abs(branch.current);

  const lines: { text: string; className: string }[] = [];
  if (analysis.showCurrents && hasCurrent) {
    lines.push({ text: `I = ${formatSi(shown, 'А', digits)}`, className: 'res-current' });
  }
  if (analysis.showVoltages && Number.isFinite(branch.voltage)) {
    const value = analysis.signedCurrents ? branch.voltage : Math.abs(branch.voltage);
    lines.push({ text: `U = ${formatSi(value, 'В', digits)}`, className: 'res-voltage' });
  }
  if (analysis.showPowers && Number.isFinite(branch.power)) {
    lines.push({
      text: `P = ${formatSi(Math.abs(branch.power), 'Вт', digits)}`,
      // Источник отдаёт энергию, приёмник потребляет — цвет подписи это показывает.
      className: branch.power < 0 ? 'res-generated' : 'res-consumed',
    });
  }
  if (lines.length === 0) return null;

  const showArrow = analysis.showCurrents && hasCurrent && Math.abs(branch.current) > 1e-12;
  const sign = flip ? -1 : 1;
  const hasValueLabel = Boolean(element?.showValue && element.value.trim());
  const box = element ? elementBBox(element) : { w: 24, h: 24 };
  const base = clearanceFor(box, nx, ny, hasValueLabel) + 10;
  // У вертикальной ветви подписи идут столбиком сбоку от стрелки, у горизонтальной — под ней.
  const sideways = Math.abs(nx) > 0.5;
  const textOffset = base + (showArrow ? 14 : 2);
  const anchor: 'start' | 'end' | 'middle' = sideways ? (nx > 0 ? 'start' : 'end') : 'middle';
  const textX = sideways ? cx + nx * (base + 12) : cx;
  const textY = (i: number) =>
    sideways
      ? cy - ((lines.length - 1) * 13) / 2 + i * 13 + 4
      : cy + ny * textOffset + i * 13 + 4;

  // Полярность напряжения: «+» у вывода с большим потенциалом.
  const polarity =
    analysis.showVoltages && Number.isFinite(branch.voltage) && Math.abs(branch.voltage) > 1e-12
      ? { plus: branch.voltage > 0 ? branch.pa : branch.pb, minus: branch.voltage > 0 ? branch.pb : branch.pa }
      : null;

  return (
    <g>
      {showArrow && (
        <path
          className="res-arrow"
          d={arrowPath(cx + nx * base, cy + ny * base, dx * sign, dy * sign)}
          fill="none"
        />
      )}
      {polarity && (
        <>
          <text className="res-text res-voltage" x={polarity.plus.x + nx * 11} y={polarity.plus.y + ny * 11 + 4} textAnchor="middle">
            +
          </text>
          <text className="res-text res-voltage" x={polarity.minus.x + nx * 11} y={polarity.minus.y + ny * 11 + 4} textAnchor="middle">
            −
          </text>
        </>
      )}
      {lines.map((line, i) => (
        <text key={line.className} className={`res-text ${line.className}`} x={textX} y={textY(i)} textAnchor={anchor}>
          {line.text}
        </text>
      ))}
    </g>
  );
});

/** Карта потенциалов: цвет узла и значение φ. Клик назначает узел опорным. */
function Potentials({ result, analysis }: { result: DcResult; analysis: AnalysisSettings }) {
  const setAnalysis = useDoc((s) => s.setAnalysis);
  const values = [...result.potentials.values()].filter(Number.isFinite);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <g style={{ pointerEvents: 'auto' }}>
      {[...result.potentials].map(([node, value]) => {
        const point = result.nodePoints.get(node);
        if (!point) return null;
        const isReference = result.references.includes(node);
        const pick = (e: PointerEvent<SVGGElement>) => {
          e.stopPropagation();
          setAnalysis({ reference: point });
        };
        return (
          <g
            key={node}
            onPointerDown={pick}
            style={{ cursor: 'pointer' }}
            data-tip={isReference ? 'Опорный узел: φ = 0' : 'Сделать опорным узлом (φ = 0)'}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={isReference ? 6 : 5}
              fill={potentialColor(value, min, max)}
              stroke={isReference ? 'var(--ui-ink)' : 'none'}
              strokeWidth={isReference ? 2 : 0}
              opacity={0.85}
            />
            <text className="res-text res-potential" x={point.x + 9} y={point.y - 9}>
              φ = {formatSi(value, 'В', analysis.digits)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Толщина провода по току. Ток провода определён только там, где узел
 * соединяет ровно две ветви: в разветвлении он делится и одного числа уже нет.
 */
function CurrentWidths({ doc, conn, result }: Props & { result: DcResult }) {
  const widths = useMemo(() => {
    const degree = new Map<string, number>();
    const currentOf = new Map<string, number>();
    for (const b of result.branches) {
      if (!Number.isFinite(b.current)) continue;
      for (const node of [b.a, b.b]) {
        degree.set(node, (degree.get(node) ?? 0) + 1);
        currentOf.set(node, Math.abs(b.current));
      }
    }
    let max = 0;
    for (const [node, count] of degree) {
      if (count === 2) max = Math.max(max, currentOf.get(node) ?? 0);
    }
    const out = new Map<string, number>();
    if (max <= 0) return out;
    for (const wire of doc.wires) {
      const node = conn.nodeOf(wire.points[0]);
      if (degree.get(node) !== 2) continue;
      out.set(wire.id, currentWidth(currentOf.get(node) ?? 0, max));
    }
    return out;
  }, [doc.wires, conn, result]);

  if (widths.size === 0) return null;
  return (
    <g className="no-hit">
      {doc.wires.map((wire) => {
        const width = widths.get(wire.id);
        if (!width) return null;
        const d = wire.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return <path key={wire.id} className="res-flow" d={d} strokeWidth={width} fill="none" />;
      })}
    </g>
  );
}

/** Слой результатов расчёта поверх схемы. Входит в экспорт вместе с ней. */
export function ResultsLayer({ doc, conn }: Props) {
  const enabled = doc.analysis.enabled;
  const shown = useResults((s) => s.shown);
  const stale = useResults((s) => s.stale);
  const failed = useResults((s) => s.result !== null && !s.result.ok);

  const elements = useMemo(() => new Map(doc.elements.map((el) => [el.id, el])), [doc.elements]);

  if (!enabled || !shown) return null;
  const analysis = doc.analysis;
  const anything = analysis.showCurrents || analysis.showVoltages || analysis.showPowers;

  return (
    <g data-layer="results" className="no-hit" opacity={stale || failed ? 0.4 : 1}>
      {analysis.thickByCurrent && <CurrentWidths doc={doc} conn={conn} result={shown} />}
      {anything &&
        shown.branches.map((branch) => (
          <BranchView
            key={branch.elementId}
            branch={branch}
            element={elements.get(branch.elementId)}
            analysis={analysis}
          />
        ))}
      {analysis.showPotentials && <Potentials result={shown} analysis={analysis} />}
    </g>
  );
}
