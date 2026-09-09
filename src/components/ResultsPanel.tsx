import { AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import { useDoc } from '../store/useDoc';
import { useUi } from '../store/useUi';
import { useResults } from '../store/useResults';
import { formatNumber, formatSi } from '../lib/units';
import type { Problem } from '../lib/solver/types';
import { Row } from './Row';

const TOGGLES: { key: 'showCurrents' | 'showVoltages' | 'showPowers' | 'showPotentials'; label: string }[] = [
  { key: 'showCurrents', label: 'Токи' },
  { key: 'showVoltages', label: 'Напряжения' },
  { key: 'showPowers', label: 'Мощности' },
  { key: 'showPotentials', label: 'Потенциалы узлов' },
];

function ProblemIcon({ severity }: { severity: Problem['severity'] }) {
  if (severity === 'error') return <AlertTriangle size={14} style={{ color: 'var(--ui-danger)', flex: '0 0 auto' }} />;
  if (severity === 'warning') return <AlertTriangle size={14} style={{ color: 'var(--res-voltage)', flex: '0 0 auto' }} />;
  return <Info size={14} style={{ color: 'var(--ui-muted)', flex: '0 0 auto' }} />;
}

/** Панель расчёта: что показывать на схеме, баланс мощностей и замечания. */
export function ResultsPanel() {
  const analysis = useDoc((s) => s.doc.analysis);
  const setAnalysis = useDoc((s) => s.setAnalysis);
  const enabled = analysis.enabled;
  const setSelection = useUi((s) => s.setSelection);
  const result = useResults((s) => s.result);
  const shown = useResults((s) => s.shown);

  const errors = result?.problems.filter((p) => p.severity === 'error') ?? [];
  const others = result?.problems.filter((p) => p.severity !== 'error') ?? [];
  const balance = shown?.balance;

  return (
    <>
      <label className="soft-row mb-2 flex items-center justify-between gap-2 p-2">
        <span className="flex items-center gap-2">
          <Zap size={15} style={{ color: 'var(--ui-accent)' }} />
          <b>Считать схему</b>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setAnalysis({ enabled: e.target.checked })}
          aria-label="Показывать результаты расчёта"
        />
      </label>

      {enabled && (
        <>
          <div className="mb-2 grid grid-cols-2 gap-x-2">
            {TOGGLES.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5" style={{ lineHeight: '20px' }}>
                <input
                  type="checkbox"
                  checked={analysis[key]}
                  onChange={(e) => setAnalysis({ [key]: e.target.checked })}
                />
                <span style={{ color: 'var(--ui-muted)' }}>{label}</span>
              </label>
            ))}
            <label className="flex items-center gap-1.5" style={{ lineHeight: '20px' }}>
              <input
                type="checkbox"
                checked={analysis.thickByCurrent}
                onChange={(e) => setAnalysis({ thickByCurrent: e.target.checked })}
              />
              <span style={{ color: 'var(--ui-muted)' }}>Толщина по току</span>
            </label>
            <label className="flex items-center gap-1.5" style={{ lineHeight: '20px' }}>
              <input
                type="checkbox"
                checked={analysis.signedCurrents}
                onChange={(e) => setAnalysis({ signedCurrents: e.target.checked })}
              />
              <span style={{ color: 'var(--ui-muted)' }}>Показывать знак</span>
            </label>
          </div>

          <Row label="Цифр">
            <input
              className="field"
              type="number"
              min={2}
              max={8}
              value={analysis.digits}
              onChange={(e) => setAnalysis({ digits: Math.min(8, Math.max(2, Number(e.target.value) || 4)) })}
              aria-label="Число значащих цифр"
            />
          </Row>

          {balance && shown && shown.branchCount > 0 && (
            <div className="res-balance mb-2">
              <p className="section-title" style={{ marginBottom: 2 }}>
                Баланс мощностей
              </p>
              <span className="res-card-row">
                <span style={{ color: 'var(--ui-muted)' }}>Источники</span>
                <b>{formatSi(balance.generated, 'Вт', analysis.digits)}</b>
              </span>
              <span className="res-card-row">
                <span style={{ color: 'var(--ui-muted)' }}>Приёмники</span>
                <b>{formatSi(balance.consumed, 'Вт', analysis.digits)}</b>
              </span>
              <span className="res-card-row">
                <span style={{ color: 'var(--ui-muted)' }}>Невязка</span>
                <b style={{ color: Math.abs(balance.relative) < 0.01 ? 'var(--res-generated)' : 'var(--ui-danger)' }}>
                  {formatSi(balance.mismatch, 'Вт', 2)} · {formatNumber(balance.relative, 2)} %
                </b>
              </span>
              <span className="res-card-row" style={{ color: 'var(--ui-muted)' }}>
                <span>Узлов · ветвей</span>
                <span>
                  {shown.nodeCount} · {shown.branchCount}
                </span>
              </span>
            </div>
          )}

          {result && errors.length === 0 && others.length === 0 && shown && shown.branchCount > 0 && (
            <p className="flex items-center gap-2" style={{ color: 'var(--ui-muted)' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--res-generated)' }} />
              Схема рассчитана, замечаний нет.
            </p>
          )}

          {[...errors, ...others].length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="section-title">Замечания расчёта</p>
              {[...errors, ...others].map((problem, i) => (
                <button
                  key={i}
                  className="res-problem tbtn"
                  style={{ height: 'auto' }}
                  onClick={() => problem.elementIds.length > 0 && setSelection({ elements: problem.elementIds })}
                  disabled={problem.elementIds.length === 0}
                >
                  <ProblemIcon severity={problem.severity} />
                  <span>{problem.message}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
